// Declare the global HavokPhysics type
declare const HavokPhysics: any;

import { 
    Scene, 
    Vector3,
    Quaternion,
    Mesh,
    MeshBuilder,
    StandardMaterial,
    Color3,
    Ray,
    AbstractMesh,
    ActionManager,
    ExecuteCodeAction,
    Observable,
    Camera,
    ArcRotateCamera
} from "@babylonjs/core";

export class CharacterController {
    private scene: Scene;
    private characterMesh: Mesh;
    private physicsController: any; // Use 'any' to avoid type errors for now
    private inputMap: { [key: string]: boolean } = {};
    private interactionDistance: number = 3;
    private lastInteractionTime: number = 0;
    private interactionCooldown: number = 500; // 500ms cooldown
    
    // Character state
    private state: string = "IN_AIR";
    private wantJump: boolean = false;
    private inputDirection: Vector3 = new Vector3(0, 0, 0);
    private characterOrientation: Quaternion = Quaternion.Identity();
    private characterGravity: Vector3 = new Vector3(0, -9.81, 0);
    
    // Movement settings
    private inAirSpeed: number = 5.0;
    private onGroundSpeed: number = 6.0;
    private jumpHeight: number = 1.0;
    
    constructor(scene: Scene) {
        this.scene = scene;
        
        // Create character mesh and physics controller
        this.initializeCharacter();
        this.setupInputs();
        this.setupUpdateLoop();
        
        console.log("Character controller initialized");
    }
    
    private initializeCharacter(): void {
        try {
            // Character dimensions
            const height = 1.6;
            const radius = 0.4;
            
            // Create visual representation
            this.characterMesh = MeshBuilder.CreateCapsule(
                "characterCapsule",
                { height: height, radius: radius },
                this.scene
            );
            
            // Create materials
            const bodyMaterial = new StandardMaterial("characterMaterial", this.scene);
            bodyMaterial.diffuseColor = new Color3(0.3, 0.6, 0.9); // Blue
            bodyMaterial.specularColor = new Color3(0.3, 0.3, 0.3);
            this.characterMesh.material = bodyMaterial;
            
            // Set initial position
            const startPosition = new Vector3(0, height/1.5, -16);
            
            // Create physics character controller using direct import
            this.physicsController = new HavokPhysics.PhysicsCharacterController(
                startPosition,
                { capsuleHeight: height, capsuleRadius: radius },
                this.scene
            );
            
            // Position the mesh
            this.characterMesh.position = startPosition.clone();
            this.characterMesh.rotation = new Vector3(0, Math.PI, 0); // Facing forward
            
            console.log("Character physics controller created successfully");
        } catch (error) {
            console.error("Error initializing character:", error);
            
            // Create a fallback simple box if creation fails
            this.characterMesh = MeshBuilder.CreateBox("characterFallback", { size: 1 }, this.scene);
            const fallbackMaterial = new StandardMaterial("fallbackMaterial", this.scene);
            fallbackMaterial.diffuseColor = new Color3(1, 0, 0); // Red to indicate fallback
            this.characterMesh.material = fallbackMaterial;
            this.characterMesh.position = new Vector3(0, 0.5, -16);
            
            // Create fallback physics controller
            try {
                this.physicsController = new HavokPhysics.PhysicsCharacterController(
                    this.characterMesh.position.clone(),
                    { capsuleHeight: 1, capsuleRadius: 0.5 },
                    this.scene
                );
            } catch (fallbackError) {
                console.error("Failed to create fallback physics controller:", fallbackError);
            }
        }
    }
    
    private setupInputs(): void {
        // Setup action manager for key events
        if (!this.scene.actionManager) {
            this.scene.actionManager = new ActionManager(this.scene);
        }
        
        // Track key down
        this.scene.actionManager.registerAction(
            new ExecuteCodeAction(
                ActionManager.OnKeyDownTrigger,
                (evt) => {
                    switch (evt.sourceEvent.key) {
                        case 'w':
                        case 'ArrowUp':
                            this.inputDirection.z = 1;
                            break;
                        case 's':
                        case 'ArrowDown':
                            this.inputDirection.z = -1;
                            break;
                        case 'a':
                        case 'ArrowLeft':
                            this.inputDirection.x = -1;
                            break;
                        case 'd':
                        case 'ArrowRight':
                            this.inputDirection.x = 1;
                            break;
                        case ' ':
                            this.wantJump = true;
                            break;
                        case 'e':
                            this.inputMap['e'] = true;
                            break;
                        default:
                            this.inputMap[evt.sourceEvent.key] = true;
                            break;
                    }
                }
            )
        );
        
        // Track key up
        this.scene.actionManager.registerAction(
            new ExecuteCodeAction(
                ActionManager.OnKeyUpTrigger,
                (evt) => {
                    switch (evt.sourceEvent.key) {
                        case 'w':
                        case 's':
                        case 'ArrowUp':
                        case 'ArrowDown':
                            this.inputDirection.z = 0;
                            break;
                        case 'a':
                        case 'd':
                        case 'ArrowLeft':
                        case 'ArrowRight':
                            this.inputDirection.x = 0;
                            break;
                        case ' ':
                            this.wantJump = false;
                            break;
                        case 'e':
                            this.inputMap['e'] = false;
                            break;
                        default:
                            this.inputMap[evt.sourceEvent.key] = false;
                            break;
                    }
                }
            )
        );
        
        console.log("Input handling set up");
    }
    
    private setupUpdateLoop(): void {
        // Visual update - move the mesh to match physics position
        this.scene.onBeforeRenderObservable.add(() => {
            // Update mesh position to match physics controller
            if (this.physicsController) {
                this.characterMesh.position.copyFrom(this.physicsController.getPosition());
            }
            
            // Check for interactions
            this.checkInteractions();
        });
        
        // Physics update
        this.scene.onAfterPhysicsObservable.add(() => {
            if (!this.physicsController || this.scene.deltaTime === undefined || this.scene.deltaTime === 0) {
                return;
            }
            
            // Convert from milliseconds to seconds
            const dt = this.scene.deltaTime / 1000.0;
            
            // Check if character is supported by ground
            const down = new Vector3(0, -1, 0);
            const support = this.physicsController.checkSupport(dt, down);
            
            // Update character state
            this.updateState(support);
            
            // Calculate desired velocity based on input and state
            // Use camera direction for input
            if (this.scene.activeCamera) {
                // Get camera yaw (alpha for ArcRotateCamera) and apply to character orientation
                // Ensure camera is ArcRotateCamera before accessing alpha
                let cameraAlpha = 0;
                if (this.scene.activeCamera.getClassName() === "ArcRotateCamera") {
                    // Cast to ArcRotateCamera to access alpha safely
                    cameraAlpha = (this.scene.activeCamera as ArcRotateCamera).alpha;
                }

                Quaternion.FromEulerAnglesToRef(
                    0,
                    cameraAlpha, // Use camera alpha for Y rotation
                    0,
                    this.characterOrientation
                );
                
                // Calculate velocity based on state
                const desiredVelocity = this.calculateDesiredVelocity(
                    dt, 
                    support, 
                    this.characterOrientation, 
                    this.physicsController.getVelocity()
                );
                
                // Apply velocity to character
                this.physicsController.setVelocity(desiredVelocity);
                
                // Update physics controller
                this.physicsController.integrate(dt, support, this.characterGravity);
            }
        });
    }
    
    private updateState(support: { supportedState: any }): void {
        let nextState = this.state;
        
        if (this.state === "IN_AIR") {
            if (support.supportedState === HavokPhysics.CharacterSupportedState.SUPPORTED) {
                nextState = "ON_GROUND";
            }
        } else if (this.state === "ON_GROUND") {
            if (support.supportedState !== HavokPhysics.CharacterSupportedState.SUPPORTED) {
                nextState = "IN_AIR";
            } else if (this.wantJump) {
                nextState = "START_JUMP";
            }
        } else if (this.state === "START_JUMP") {
            nextState = "IN_AIR";
        }
        
        if (nextState !== this.state) {
            // Log state changes for debugging
            console.log(`Character state changed from ${this.state} to ${nextState}`);
            this.state = nextState;
        }
    }
    
    private calculateDesiredVelocity(
        deltaTime: number, 
        supportInfo: { supportedState: any; averageSurfaceNormal?: Vector3; averageSurfaceVelocity?: Vector3 },
        characterOrientation: Quaternion, 
        currentVelocity: Vector3
    ): Vector3 {
        // Up direction (opposite of gravity)
        const upWorld = this.characterGravity.normalizeToNew().scale(-1);
        
        // Forward direction in world space (based on character orientation)
        const forwardLocalSpace = new Vector3(0, 0, 1);
        const forwardWorld = forwardLocalSpace.applyRotationQuaternion(characterOrientation);
        
        if (this.state === "IN_AIR") {
            // In air movement
            const desiredVelocity = this.inputDirection.scale(this.inAirSpeed)
                .applyRotationQuaternion(characterOrientation);
            
            // Ensure supportInfo has the needed properties before accessing
            const surfaceNormal = supportInfo.averageSurfaceNormal ?? upWorld; // Fallback if undefined
            const surfaceVelocity = supportInfo.averageSurfaceVelocity ?? Vector3.ZeroReadOnly; // Fallback if undefined

            const outputVelocity = this.physicsController.calculateMovement(
                deltaTime,
                forwardWorld,
                surfaceNormal,
                currentVelocity,
                surfaceVelocity,
                desiredVelocity,
                upWorld
            );
            
            // Restore original vertical component
            outputVelocity.addInPlace(upWorld.scale(-outputVelocity.dot(upWorld)));
            outputVelocity.addInPlace(upWorld.scale(currentVelocity.dot(upWorld)));
            
            // Add gravity
            outputVelocity.addInPlace(this.characterGravity.scale(deltaTime));
            
            return outputVelocity;
            
        } else if (this.state === "ON_GROUND") {
            // Ground movement
            const desiredVelocity = this.inputDirection.scale(this.onGroundSpeed)
                .applyRotationQuaternion(characterOrientation);
            
            // Ensure supportInfo has the needed properties before accessing
            const surfaceNormal = supportInfo.averageSurfaceNormal ?? upWorld; // Fallback if undefined
            const surfaceVelocity = supportInfo.averageSurfaceVelocity ?? Vector3.ZeroReadOnly; // Fallback if undefined

            const outputVelocity = this.physicsController.calculateMovement(
                deltaTime,
                forwardWorld,
                surfaceNormal,
                currentVelocity,
                surfaceVelocity,
                desiredVelocity,
                upWorld
            );
            
            // Handle slopes
            outputVelocity.subtractInPlace(surfaceVelocity);
            const inv1k = 1e-3;
            
            if (outputVelocity.dot(upWorld) > inv1k) {
                const velLen = outputVelocity.length();
                outputVelocity.normalizeFromLength(velLen);
                
                // Get the desired length in the horizontal direction
                const horizLen = velLen / surfaceNormal.dot(upWorld);
                
                // Re-project the velocity onto the horizontal plane
                const c = surfaceNormal.cross(outputVelocity);
                const newDir = c.cross(upWorld);
                newDir.normalize();
                newDir.scaleInPlace(horizLen);
                
                outputVelocity.copyFrom(newDir);
            }
            
            outputVelocity.addInPlace(surfaceVelocity);
            return outputVelocity;
            
        } else if (this.state === "START_JUMP") {
            // Calculate jump velocity
            const jumpVelocity = Math.sqrt(2 * this.characterGravity.length() * this.jumpHeight);
            const curRelVel = currentVelocity.dot(upWorld);
            
            return currentVelocity.add(upWorld.scale(jumpVelocity - curRelVel));
        }
        
        return Vector3.Zero();
    }
    
    private checkInteractions(): void {
        // Check if E key is pressed for interaction
        if (!this.inputMap["e"]) return;
        
        // Implement cooldown to prevent multiple interactions
        const currentTime = Date.now();
        if (currentTime - this.lastInteractionTime < this.interactionCooldown) return;
        
        // Create ray from character position in the direction they're facing
        const ray = new Ray(
            this.characterMesh.position,
            this.characterMesh.forward,
            this.interactionDistance
        );

        // Debug ray visualization
        // Ray.CreateAndShow(this.characterMesh.position, this.characterMesh.position.add(this.characterMesh.forward.scale(this.interactionDistance)), this.scene, new Color3(1, 0, 0));

        // Check for intersections
        const hit = this.scene.pickWithRay(ray);
        
        if (hit && hit.hit && hit.pickedMesh) {
            const hitMesh = hit.pickedMesh;
            console.log("Interaction ray hit mesh:", hitMesh.name);
            
            // Check for altar interaction
            if (hitMesh.name.includes("altar")) {
                this.onAltarInteraction();
                this.lastInteractionTime = currentTime;
            }
            
            // Check for grid/cell interaction
            if (hitMesh.name.startsWith("cell_")) {
                this.onGridInteraction(hitMesh);
                this.lastInteractionTime = currentTime;
            }
        }
    }

    private onAltarInteraction(): void {
        console.log("Altar interaction triggered");
        // Emit event for altar interaction
        if (this.scene.onAltarInteractionObservable) {
            this.scene.onAltarInteractionObservable.notifyObservers(this.characterMesh.position);
        }
    }

    private onGridInteraction(cell: AbstractMesh): void {
        console.log("Grid interaction triggered on:", cell.name);
        if (cell instanceof Mesh && this.scene.onGridInteractionObservable) {
            // Emit event for grid interaction
            this.scene.onGridInteractionObservable.notifyObservers({
                position: cell.position,
                mesh: cell
            });
        }
    }
    
    // Get character position for camera to follow
    public getPosition(): Vector3 {
        return this.physicsController ? 
            this.physicsController.getPosition() : 
            this.characterMesh.position;
    }
    
    // Get character forward direction
    public getForward(): Vector3 {
        return this.characterMesh.forward;
    }
    
    // Set character position
    public setPosition(position: Vector3): void {
        if (this.physicsController) {
            this.physicsController.moveWithCollisions(position);
        }
        this.characterMesh.position = position.clone();
    }
    
    // Get character mesh for rendering
    public getMesh(): Mesh {
        return this.characterMesh;
    }

    // Dispose of resources
    public dispose(): void {
        this.characterMesh.dispose();
        // PhysicsCharacterController doesn't have a dispose method in BabylonJS,
        // but it will be cleaned up when the scene is disposed
    }
}
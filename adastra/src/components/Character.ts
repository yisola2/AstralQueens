import {
    Scene,
    SceneLoader,
    Vector3,
    TransformNode,
    AnimationGroup,
    AbstractMesh,
    MeshBuilder,
    StandardMaterial,
    Color3,
    PhysicsCharacterController,
    CharacterShapeOptions,
    CharacterSurfaceInfo
} from "@babylonjs/core";

export class Character {
    private scene: Scene;
    private characterMesh: AbstractMesh | null = null;
    private characterRoot: TransformNode;
    
    // Replace PhysicsAggregate with PhysicsCharacterController
    private characterController: PhysicsCharacterController | null = null;
    private characterCollider: AbstractMesh;
    
    private animations: {
        idle?: AnimationGroup;
        walk?: AnimationGroup;
    } = {};
    private currentAnimation?: AnimationGroup;
    private moveDirection: Vector3 = Vector3.Zero();
    private desiredVelocity: Vector3 = Vector3.Zero();
    private moveSpeed: number = 5.0;
    private isMoving: boolean = false;
    private inputMap: { [key: string]: boolean } = {};

    constructor(scene: Scene) {
        this.scene = scene;
        
        // Create root node for character
        this.characterRoot = new TransformNode("characterRoot", this.scene);
        
        // Position at a safe starting position
        this.characterRoot.position = new Vector3(0, 2, 0);
        
        // Create physics collider first
        this.characterCollider = this.createCollider();
        
        // Then create character controller
        this.createCharacterController();
        
        // Then load visual model
        this.loadCharacterModel();
        
        // Set up keyboard controls
        this.setupInput();
        
        console.log("Character initialized with PhysicsCharacterController");
    }
    
    private createCollider(): AbstractMesh {
        // Create invisible capsule for physics
        const collider = MeshBuilder.CreateCapsule(
            "characterCollider", 
            { 
                height: 1.8,    // Total height of capsule
                radius: 0.4     // Radius of capsule
            }, 
            this.scene
        );
        
        // Make it visible for debugging
        collider.visibility = 0.2;
        
        // Make material translucent red for debugging
        const material = new StandardMaterial("colliderMat", this.scene);
        material.diffuseColor = new Color3(1, 0, 0);
        material.alpha = 0.2;
        collider.material = material;
        
        // Attach to character root
        collider.parent = this.characterRoot;
        
        // Adjust position to align feet with ground
        collider.position.y = 0.9;
        
        return collider;
    }
    

    private async loadCharacterModel() {
        try {
            const result = await SceneLoader.ImportMeshAsync(
                "",
                "/models/",
                "Aj.glb",
                this.scene
            );

            // Setup character mesh
            this.characterMesh = result.meshes[0];
            
            // Set character mesh as child of root node
            this.characterMesh.parent = this.characterRoot;
            
            // Adjust position to align with collider
            this.characterMesh.position.y = -0.9;
            
            // Store animations
            this.animations = {
                idle: result.animationGroups.find(a => a.name.toLowerCase().includes("idle")),
                walk: result.animationGroups.find(a => a.name.toLowerCase().includes("walk"))
            };

            // Start idle animation
            this.playAnimation("idle");
            
            console.log("Character model loaded successfully");

        } catch (error) {
            console.error("Failed to load character model:", error);
        }
    }

    private setupInput() {
        this.scene.onKeyboardObservable.add((kbInfo) => {
            const key = kbInfo.event.key.toLowerCase();
            
            if (kbInfo.type === 1) { // KEY_DOWN
                this.inputMap[key] = true;
                
                // Reset position if needed (emergency recovery)
                if (key === "r") {
                    this.resetPosition();
                }
            } else if (kbInfo.type === 2) { // KEY_UP
                this.inputMap[key] = false;
            }

            this.updateMoveDirection();
        });
    }
    
    private updateMoveDirection() {
        // Calculate move direction based on input
        this.moveDirection.setAll(0);
        
        // Support both WASD and ZQSD
        if (this.inputMap["w"] || this.inputMap["z"]) this.moveDirection.z = 1;
        if (this.inputMap["s"]) this.moveDirection.z = -1;
        if (this.inputMap["a"] || this.inputMap["q"]) this.moveDirection.x = -1;
        if (this.inputMap["d"]) this.moveDirection.x = 1;

        if (!this.moveDirection.equals(Vector3.Zero())) {
            this.moveDirection.normalize();
            
            // Calculate desired velocity
            this.desiredVelocity = new Vector3(
                this.moveDirection.x * this.moveSpeed,
                0,
                this.moveDirection.z * this.moveSpeed
            );
        } else {
            this.desiredVelocity = Vector3.Zero();
        }

        this.isMoving = !this.moveDirection.equals(Vector3.Zero());
        this.playAnimation(this.isMoving ? "walk" : "idle");
        
        // Log movement state for debugging
        if (this.isMoving) {
            console.log(`Moving: direction (${this.moveDirection.x.toFixed(2)}, ${this.moveDirection.z.toFixed(2)})`);
        }
    }
    
    private resetPosition() {
        if (this.characterController) {
            // Reset to a safe position above ground
            this.characterRoot.position = new Vector3(0, 5, 0);
            
            // Set velocity to zero
            this.characterController.setVelocity(Vector3.Zero());
            
            console.log("Character position reset");
        }
    }

    // Changes to make in update() method:

public update() {
    if (!this.characterController) return;

    // Auto-reset if fallen too far
    if (this.characterRoot.position.y < -10) {
        console.log("Character fell through world, resetting position");
        this.resetPosition();
        return;
    }

    try {
        // Get the delta time in seconds
        const deltaTime = this.scene.getEngine().getDeltaTime() / 1000.0;
        
        // Check if character is grounded and get surface info
        const gravity = new Vector3(0, -9.81, 0);
        const surfaceInfo = this.characterController.checkSupport(deltaTime, gravity);
        
        // Calculate desired movement direction based on input and character's facing direction
        // This makes the character move relative to its facing direction rather than world axes
        if (this.isMoving) {
            // Get the character's forward direction
            const characterRotation = this.characterRoot.rotation.y;
            const forwardWorld = new Vector3(
                Math.sin(characterRotation),
                0,
                Math.cos(characterRotation)
            );
            
            // Get current velocity
            const currentVelocity = this.characterController.getVelocity();
            
            // Surface velocity (usually zero for static surfaces)
            const surfaceVelocity = Vector3.Zero();
            
            // Up direction
            const upWorld = new Vector3(0, 1, 0);
            
            // Calculate new velocity from current state and desired velocity
            const newVelocity = this.characterController.calculateMovement(
                deltaTime,
                forwardWorld,
                upWorld, // Use upWorld instead of surface normal
                currentVelocity,
                surfaceVelocity,
                this.desiredVelocity,
                upWorld
            );
            
            // Apply the calculated velocity
            this.characterController.setVelocity(newVelocity);
            
            // Rotate character to face movement direction
            if (!this.moveDirection.equals(Vector3.Zero())) {
                const targetRotation = Math.atan2(this.moveDirection.x, this.moveDirection.z);
                const currentRotation = this.characterRoot.rotation.y;
                const rotationDiff = targetRotation - currentRotation;
                
                // Smooth rotation
                this.characterRoot.rotation.y += rotationDiff * 0.2;
            }
        } else {
            // Apply zero velocity when not moving
            this.characterController.setVelocity(Vector3.Zero());
        }
        
        // Update physics - integrate the character controller
        this.characterController.integrate(deltaTime, surfaceInfo, gravity);
        
        // Sync character root position with physics
        const controllerPosition = this.characterController.getPosition();
        this.characterRoot.position.copyFrom(controllerPosition);
        
    } catch (error) {
        console.error("Error updating character:", error);
    }
}

// Changes to make in createCharacterController method:

private createCharacterController() {
    try {
        // Create controller at character root position
        this.characterController = new PhysicsCharacterController(
            this.characterRoot.position,
            {
                type: 1, // Capsule shape
                height: 1.8,
                radius: 0.4
            } as CharacterShapeOptions,
            this.scene
        );
        
        if (this.characterController) {
            // Configure character controller parameters
            this.characterController.maxCharacterSpeedForSolver = 10;  // Max speed
            this.characterController.acceleration = 0.8;               // Higher acceleration for responsiveness
            this.characterController.maxAcceleration = 20;             // High max acceleration
            this.characterController.characterStrength = 1000;         // High strength to push obstacles
            this.characterController.staticFriction = 0.2;             // Lower friction for smoother movement
            this.characterController.dynamicFriction = 0.2;            // Lower friction for smoother movement
            
            // Additional parameters for better movement
            this.characterController.keepDistance = 0.05;              // Minimum distance to make contact
            this.characterController.keepContactTolerance = 0.05;      // Maximum distance to keep contact
            this.characterController.maxSlopeCosine = 0.5;             // Can climb 60 degree slopes
            
            console.log("Character controller created successfully");
        }
    } catch (error) {
        console.error("Failed to create character controller:", error);
    }
}

    private playAnimation(animName: "idle" | "walk") {
        const anim = this.animations[animName];
        if (anim && this.currentAnimation !== anim) {
            if (this.currentAnimation) {
                this.currentAnimation.stop();
            }
            anim.play(true);
            this.currentAnimation = anim;
        }
    }

    public getPosition(): Vector3 {
        return this.characterRoot.position;
    }

    public getRootNode(): TransformNode {
        return this.characterRoot;
    }

    public getMesh(): AbstractMesh | null {
        return this.characterMesh;
    }
}
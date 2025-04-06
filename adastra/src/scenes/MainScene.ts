import { 
    Scene, 
    Vector3, 
    MeshBuilder, 
    StandardMaterial, 
    Color3,
    TransformNode,
    HemisphericLight,
    DirectionalLight,
    ShadowGenerator,
    Mesh,
    Color4,
    PhysicsAggregate,
    PhysicsShapeType,
    ActionManager,
    ExecuteCodeAction
} from "@babylonjs/core";
import { PuzzleGrid } from "../components/PuzzleGrid";

// Define physics parameters interface
interface PhysicsParams {
    mass: number;
    friction: number;
    restitution: number;
}

export class MainScene {
    private scene: Scene;
    private environmentNode: TransformNode;
    private shadowGenerator!: ShadowGenerator;
    private puzzleGrid!: PuzzleGrid;
    private altar!: Mesh;
    private interactionRadius: number = 18;

    constructor(scene: Scene) {
        this.scene = scene;
        this.scene.clearColor = new Color4(0.1, 0.1, 0.2, 1);
        this.environmentNode = new TransformNode("environment", this.scene);
        this.setupLights();
        this.createEnvironment();
        this.setupInput();
    }

    private setupLights(): void {
        // Main directional light (sun)
        const sunLight = new DirectionalLight("sunLight", new Vector3(0, -1, 1), this.scene);
        sunLight.intensity = 0.8;
        sunLight.position = new Vector3(0, 20, 0);

        // Ambient light
        const ambientLight = new HemisphericLight("ambientLight", new Vector3(0, 1, 0), this.scene);
        ambientLight.intensity = 0.3;

        // Setup shadows
        this.shadowGenerator = new ShadowGenerator(1024, sunLight);
        this.shadowGenerator.useBlurExponentialShadowMap = true;
        this.shadowGenerator.blurKernel = 32;
    }

    private createEnvironment(): void {
        // Create a solid ground beneath everything to catch falling objects
        this.createSafetyGround();
        
        // Create Hub area
        this.createPlatform("hub", 10, 10, new Vector3(0, 0, 0), new Color3(0.2, 0.2, 0.3));
        
        // Create Pathway
        this.createPlatform("pathway", 3, 8, new Vector3(0, 0, 9), new Color3(0.3, 0.3, 0.4));
        
        // Create Platform 1 (where the altar will be)
        this.createPlatform("platform", 8, 8, new Vector3(0, 0, 17), new Color3(0.4, 0.4, 0.5));

        // Create altar on the platform
        this.createAltar(new Vector3(0, 0.75, 17));

        // Add decorative elements
        this.addDecorativeElements();
    }

    private createSafetyGround(): void {
        // Create a large invisible ground plane to catch anything that falls
        const safetyGround = MeshBuilder.CreateGround(
            "safetyGround", 
            { width: 100, height: 100 }, 
            this.scene
        );
        
        // Position it below all platforms
        safetyGround.position = new Vector3(0, -5, 0);
        
        // Make it invisible
        safetyGround.visibility = 0;
        
        // Create physics for it
        const groundPhysics: PhysicsParams = {
            mass: 0,          // Static - doesn't move
            friction: 1.0,    // High friction
            restitution: 0    // No bounce at all
        };
        
        // Add physics with thicker box shape for better collision
        new PhysicsAggregate(
            safetyGround,
            PhysicsShapeType.BOX,
            groundPhysics,
            this.scene
        );
    }

    private createPlatform(name: string, width: number, height: number, position: Vector3, color: Color3): Mesh {
        // Create two meshes: 
        // 1. A visible thin platform for visuals
        // 2. A thicker invisible box for better collision
        
        // Create the visible platform mesh
        const platform = MeshBuilder.CreateBox(
            name, 
            { width: width, height: 0.3, depth: height }, 
            this.scene
        );
        platform.position = position.clone();
        platform.position.y += 0.15; // Center it vertically
        platform.parent = this.environmentNode;

        // Create material
        const material = new StandardMaterial(`${name}Material`, this.scene);
        material.diffuseColor = color;
        material.specularColor = new Color3(0.1, 0.1, 0.1);
        material.emissiveColor = color.scale(0.1);
        platform.material = material;

        // Create a thicker invisible box for collision (extends below visible platform)
        const collisionBox = MeshBuilder.CreateBox(
            `${name}Collider`, 
            { width: width, height: 1, depth: height }, 
            this.scene
        );
        
        // Position it so its top aligns with the visible platform top
        collisionBox.position = position.clone();
        collisionBox.position.y -= 0.35; // Half of (1-0.3) to align top with platform
        
        // Make it invisible
        collisionBox.visibility = 0;
        
        // Set up physics for collision box only
        const physicsParams: PhysicsParams = {
            mass: 0,           // Static - doesn't move
            friction: 1.0,     // High friction
            restitution: 0.0   // No bounce at all
        };
        
        // Create physics aggregate for the collision box
        new PhysicsAggregate(
            collisionBox,
            PhysicsShapeType.BOX,
            physicsParams,
            this.scene
        );

        return platform;
    }

    private createAltar(position: Vector3): void {
        // Main altar body
        this.altar = MeshBuilder.CreateBox("altar", { height: 1.5, width: 1.5, depth: 1.5 }, this.scene);
        this.altar.position = position;
        this.altar.parent = this.environmentNode;

        const altarMaterial = new StandardMaterial("altarMaterial", this.scene);
        altarMaterial.diffuseColor = new Color3(0.8, 0.2, 0.2);
        altarMaterial.specularColor = new Color3(0.2, 0.2, 0.2);
        altarMaterial.emissiveColor = new Color3(0.2, 0.05, 0.05);
        this.altar.material = altarMaterial;

        // Add decorative top
        const altarTop = MeshBuilder.CreateCylinder("altarTop", { height: 0.2, diameter: 1.8 }, this.scene);
        altarTop.position = position.add(new Vector3(0, 0.85, 0));
        altarTop.parent = this.environmentNode;
        altarTop.material = altarMaterial;

        // Add physics to the altar body
        new PhysicsAggregate(
            this.altar,
            PhysicsShapeType.BOX,
            { mass: 0, restitution: 0, friction: 1.0 },
            this.scene
        );

        // Initialize puzzle grid
        this.puzzleGrid = new PuzzleGrid(this.scene);
        
        // Position the grid higher and closer to the altar
        const gridPosition = position.add(new Vector3(0, 0.2, 3));
        this.puzzleGrid.getGridParent().position = gridPosition;
        
        console.log("Altar position:", position);
        console.log("Grid position:", gridPosition);
    }

    private setupInput(): void {
        // Add action manager to scene
        this.scene.actionManager = new ActionManager(this.scene);

        // Add 'E' key press action
        this.scene.actionManager.registerAction(
            new ExecuteCodeAction(
                {
                    trigger: ActionManager.OnKeyDownTrigger,
                    parameter: 'e'
                },
                () => {
                    console.log("E key pressed");
                    this.handleInteraction();
                }
            )
        );
    }

    private handleInteraction(): void {
        // Get character position (you'll need to implement this method in your Character class)
        const characterPos = this.scene.getMeshByName("character")?.position;
        if (!characterPos) {
            console.log("Character position not found");
            return;
        }

        console.log("Character position:", characterPos);
        console.log("Altar position:", this.altar.position);

        // Check if character is near the altar
        const distanceToAltar = Vector3.Distance(characterPos, this.altar.position);
        console.log("Distance to altar:", distanceToAltar);
        console.log("Interaction radius:", this.interactionRadius);

        if (distanceToAltar <= this.interactionRadius) {
            console.log("Character is within interaction radius");
            // Toggle grid activation
            if (this.puzzleGrid.isGridActive()) {
                this.puzzleGrid.deactivate();
                console.log("Grid deactivated");
            } else {
                this.puzzleGrid.activate();
                console.log("Grid activated");
            }
        } else {
            console.log("Character is too far from altar");
        }
    }

    private addDecorativeElements(): void {
        // Add pillars along the pathway
        const createPillar = (position: Vector3) => {
            const pillar = MeshBuilder.CreateCylinder("pillar", { height: 3, diameter: 0.5 }, this.scene);
            pillar.position = position;
            pillar.parent = this.environmentNode;

            const pillarMaterial = new StandardMaterial("pillarMaterial", this.scene);
            pillarMaterial.diffuseColor = new Color3(0.6, 0.6, 0.7);
            pillarMaterial.specularColor = new Color3(0.2, 0.2, 0.2);
            pillar.material = pillarMaterial;

            // Add physics for each pillar
            new PhysicsAggregate(
                pillar,
                PhysicsShapeType.CYLINDER,
                { mass: 0, restitution: 0, friction: 1.0 },
                this.scene
            );

            // Add shadow
            this.shadowGenerator.addShadowCaster(pillar);
        };

        // Add pillars along the pathway
        createPillar(new Vector3(1.5, 1.5, 9));
        createPillar(new Vector3(-1.5, 1.5, 9));
        createPillar(new Vector3(1.5, 1.5, 13));
        createPillar(new Vector3(-1.5, 1.5, 13));

        // Add decorative torches
        const createTorch = (position: Vector3) => {
            const torch = MeshBuilder.CreateCylinder("torch", { height: 0.5, diameter: 0.2 }, this.scene);
            torch.position = position;
            torch.parent = this.environmentNode;

            const torchMaterial = new StandardMaterial("torchMaterial", this.scene);
            torchMaterial.diffuseColor = new Color3(0.8, 0.4, 0.1);
            torchMaterial.emissiveColor = new Color3(0.8, 0.4, 0.1);
            torch.material = torchMaterial;

            // No physics needed for small decorative elements
            
            // Add shadow
            this.shadowGenerator.addShadowCaster(torch);
        };

        // Add torches on the platform
        createTorch(new Vector3(3, 0.25, 15));
        createTorch(new Vector3(-3, 0.25, 15));
        createTorch(new Vector3(3, 0.25, 19));
        createTorch(new Vector3(-3, 0.25, 19));
    }
}
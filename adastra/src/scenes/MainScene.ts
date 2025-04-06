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
    ExecuteCodeAction,
    PointLight
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
        // Main directional light (moonlight)
        const moonLight = new DirectionalLight("moonLight", new Vector3(-1, -2, 1), this.scene);
        moonLight.intensity = 0.6;
        moonLight.diffuse = new Color3(0.8, 0.85, 1.0);  // Slightly blue tint
        moonLight.specular = new Color3(0.8, 0.85, 1.0);
        moonLight.position = new Vector3(20, 40, -20);

        // Ambient light (sky)
        const skyLight = new HemisphericLight("skyLight", new Vector3(0, 1, 0), this.scene);
        skyLight.intensity = 0.2;
        skyLight.groundColor = new Color3(0.1, 0.1, 0.2);  // Blue-ish ground reflection
        skyLight.diffuse = new Color3(0.3, 0.3, 0.4);      // Subtle blue sky color

        // Setup enhanced shadows
        this.shadowGenerator = new ShadowGenerator(2048, moonLight);
        this.shadowGenerator.usePercentageCloserFiltering = true;  // Better quality shadows
        this.shadowGenerator.filteringQuality = ShadowGenerator.QUALITY_HIGH;
        this.shadowGenerator.darkness = 0.4;  // Less dark shadows for better visibility

        // Add point lights near torches for dynamic lighting
        this.createTorchLight(new Vector3(3, 1.5, 15));
        this.createTorchLight(new Vector3(-3, 1.5, 15));
        this.createTorchLight(new Vector3(3, 1.5, 19));
        this.createTorchLight(new Vector3(-3, 1.5, 19));

        // Add a special red glow for the altar
        const altarLight = new PointLight("altarLight", new Vector3(0, 2, 17), this.scene);
        altarLight.intensity = 0.8;
        altarLight.diffuse = new Color3(1.0, 0.3, 0.3);  // Red color
        altarLight.specular = new Color3(1.0, 0.3, 0.3);
        altarLight.range = 8;  // Limited range for localized effect
    }

    private createTorchLight(position: Vector3): void {
        const torchLight = new PointLight("torchLight", position, this.scene);
        torchLight.intensity = 0.6;
        torchLight.diffuse = new Color3(1.0, 0.7, 0.3);  // Warm torch color
        torchLight.specular = new Color3(1.0, 0.7, 0.3);
        torchLight.range = 6;  // Limited range for more realistic torch light
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

        // Store platform dimensions in metadata for reference
        platform.metadata = {
            type: 'platform',
            width: width,
            height: height
        };

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
        
        // Position the grid as an extension of the platform
        // The platform is 8x8, and we want the grid to extend backwards from it
        const platformSize = { width: 8, depth: 8 };
        const platformBackEdge = position.z + platformSize.depth / 2; // Get the back edge of the platform
        
        const gridPosition = new Vector3(
            position.x, // Center X with altar
            position.y, // Same height as platform
            platformBackEdge + (this.puzzleGrid.getTotalDepth() / 2) // Position grid so it connects with platform
        );
        
        this.puzzleGrid.getGridParent().position = gridPosition;
        
        console.log("Platform back edge:", platformBackEdge);
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
            pillarMaterial.emissiveColor = new Color3(0.1, 0.1, 0.15);  // Slight glow
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

        // Add decorative torches with enhanced glow
        const createTorch = (position: Vector3) => {
            const torch = MeshBuilder.CreateCylinder("torch", { height: 0.5, diameter: 0.2 }, this.scene);
            torch.position = position;
            torch.parent = this.environmentNode;

            const torchMaterial = new StandardMaterial("torchMaterial", this.scene);
            torchMaterial.diffuseColor = new Color3(0.8, 0.4, 0.1);
            torchMaterial.emissiveColor = new Color3(0.8, 0.4, 0.1);
            torchMaterial.specularColor = new Color3(1, 0.6, 0.2);
            torch.material = torchMaterial;

            // Add shadow
            this.shadowGenerator.addShadowCaster(torch);

            // Add a glowing flame effect
            const flame = MeshBuilder.CreateSphere("flame", { diameter: 0.3 }, this.scene);
            flame.position = position.add(new Vector3(0, 0.3, 0));
            flame.parent = this.environmentNode;

            const flameMaterial = new StandardMaterial("flameMaterial", this.scene);
            flameMaterial.diffuseColor = new Color3(1, 0.6, 0.2);
            flameMaterial.emissiveColor = new Color3(1, 0.6, 0.2);
            flameMaterial.alpha = 0.7;
            flame.material = flameMaterial;
        };

        // Add torches on the platform
        createTorch(new Vector3(3, 0.25, 15));
        createTorch(new Vector3(-3, 0.25, 15));
        createTorch(new Vector3(3, 0.25, 19));
        createTorch(new Vector3(-3, 0.25, 19));
    }
}
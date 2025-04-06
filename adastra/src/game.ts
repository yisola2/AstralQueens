import { 
    Engine, 
    Scene, 
    UniversalCamera, 
    Vector3, 
    HemisphericLight,
    PhysicsCharacterController,
    CharacterShapeOptions,
    SceneLoader,
    HavokPlugin,
    FollowCamera
} from "@babylonjs/core";
import "@babylonjs/loaders";
import HavokPhysics, { HavokPhysicsWithBindings } from "@babylonjs/havok";
import { MainScene } from "./scenes/MainScene";
import { Character } from "./components/Character";

class Game {
    private canvas: HTMLCanvasElement;
    private engine: Engine;
    private scene: Scene;
    private mainScene!: MainScene;  // Using definite assignment assertion
    private character!: Character;   // Using definite assignment assertion
    private camera!: UniversalCamera;

    constructor() {
        // Get the canvas element and assert its type
        const canvas = document.getElementById("renderCanvas");
        if (!canvas) throw new Error("Canvas element not found");
        this.canvas = canvas as unknown as HTMLCanvasElement;
        
        // Generate the BABYLON 3D engine
        this.engine = new Engine(this.canvas, true);

        // Create the scene
        this.scene = new Scene(this.engine);

        // Initialize physics first
        this.initPhysics().then(() => {
            // Create camera and light
            this.createCamera();
            this.createLight();

            // Create main scene
            this.mainScene = new MainScene(this.scene);

            // Create character
            this.character = new Character(this.scene);

            // Register the game loop
            this.engine.runRenderLoop(() => {
                this.update();
                this.scene.render();
            });
        });

        // Watch for browser/canvas resize events
        window.addEventListener("resize", () => {
            this.engine.resize();
        });
    }

    private async _getHavokInstance(): Promise<HavokPhysicsWithBindings> {
        // Load the WASM file explicitly
        const wasmBinary: Response = await fetch('/lib/HavokPhysics.wasm');
        const wasmBinaryArrayBuffer: ArrayBuffer = await wasmBinary.arrayBuffer();
        const havokInstance: HavokPhysicsWithBindings = await HavokPhysics({
            wasmBinary: wasmBinaryArrayBuffer,
        });

        return havokInstance;
    }

    private async initPhysics() {
        try {
            // Initialize Havok Physics with our custom loader
            const havokInstance = await this._getHavokInstance();
            const havokPlugin = new HavokPlugin(true, havokInstance);
            
            // Enable physics in the scene
            this.scene.enablePhysics(new Vector3(0, -9.81, 0), havokPlugin);
            
            // Log the physics plugin information
            const physicsEngine = this.scene.getPhysicsEngine();
            if (physicsEngine) {
                // Access the plugin directly since we know we're using Havok
                console.log("Physics plugin: Havok");
                console.log("Physics plugin type: HavokPlugin");
            }
            
            console.log("Physics initialized successfully");
        } catch (error) {
            console.error("Failed to initialize physics:", error);
        }
    }

    private createCamera(): void {
        // Create a universal camera
        this.camera = new UniversalCamera(
            "camera",
            new Vector3(0, 2, -10),
            this.scene
        );

        // Camera settings
        this.camera.speed = 0.5;
        this.camera.inertia = 0.5;
        this.camera.angularSensibility = 2000;
        this.camera.checkCollisions = true;
        this.camera.applyGravity = true;
        this.camera.ellipsoid = new Vector3(1, 1, 1);

        // Attach camera to canvas
        this.camera.attachControl(this.canvas, true);
    }

    private createLight(): void {
        // Create a basic light
        new HemisphericLight("light", new Vector3(0, 1, 0), this.scene);
    }

    private update(): void {
        // Update character if it exists
        if (this.character) {
            this.character.update();
            
            // Update camera position to follow character
            const characterPos = this.character.getPosition();
            const targetPos = new Vector3(
                characterPos.x,
                characterPos.y + 2,
                characterPos.z - 10
            );
            
            // Smooth camera movement
            this.camera.position = Vector3.Lerp(
                this.camera.position,
                targetPos,
                0.1
            );
            
            // Make camera look at character
            this.camera.setTarget(characterPos);
        }
    }
}

// Create the game when the window loads
window.addEventListener('DOMContentLoaded', () => {
    new Game();
}); 
import { 
    Engine,
    Scene,
    ArcRotateCamera,
    Vector3,
    HemisphericLight,
    Observable,
    Mesh,
    MeshBuilder,
    StandardMaterial,
    Color3,
    PhysicsImpostor
} from '@babylonjs/core';
import { Grid } from './components/Grid';
import { GameRules } from './components/GameRules';
import { UI } from './components/UI';
import { Environment } from './components/Environment';
import { CharacterController } from './components/CharacterController';
import { setupPhysics } from './components/PhysicsSetup';


// Extend Scene class to include our custom observables
declare module '@babylonjs/core' {
    interface Scene {
        onAltarInteractionObservable: Observable<Vector3>;
        onGridInteractionObservable: Observable<{ position: Vector3; mesh: Mesh }>;
    }
}

class Game {
    private canvas: HTMLCanvasElement;
    private engine: Engine;
    private scene: Scene;
    private camera!: ArcRotateCamera;
    private light!: HemisphericLight;
    private grid!: Grid;
    private gameRules!: GameRules;
    private ui!: UI;
    private environment!: Environment;
    private character!: CharacterController;
    private queenCount: number = 0;
    private isGridActive: boolean = false;
    private debugMode: boolean = true; // Set to true for debug messages

    constructor(canvasId: string, patternIndex: number = 0) {
        // Get the canvas element
        const element = document.getElementById(canvasId);
        if (!element || !(element instanceof HTMLCanvasElement)) {
            throw new Error(`Canvas with id ${canvasId} not found`);
        }
        this.canvas = element;

        // Create the Babylon.js engine
        this.engine = new Engine(this.canvas, true);

        // Create the scene
        this.scene = new Scene(this.engine);
        


        // Initialize the game
        this.initialize(patternIndex).catch(error => {
            console.error("Fatal error during game initialization:", error);
            alert("Failed to initialize game. Please check console for details.");
        });
    }

    private async initialize(patternIndex: number): Promise<void> {
        try {
            this.debugLog("Game initialization started");
            
            // Create observables for interactions first
            this.setupInteractionObservables();
            this.debugLog("Interaction observables set up");
            
            // Add a light
            this.light = new HemisphericLight(
                'light',
                new Vector3(0, 1, 0),
                this.scene
            );
            this.light.intensity = 1.0;
            this.debugLog("Light initialized");
            
            // Initialize Havok physics - WAIT for it to complete
            const physicsInitialized = await setupPhysics(this.scene);
            if (!physicsInitialized) {
                throw new Error("Physics initialization failed - cannot continue");
            }
            this.debugLog("Physics initialized successfully");
            
            // Wait a frame to ensure physics is fully initialized
            await this.waitForNextFrame();
            
            // Create environment
            this.environment = new Environment(this.scene);
            await this.environment.createBasicEnvironment();
            this.debugLog("Environment created");
            
            // Create character controller after physics is ready
            this.character = new CharacterController(this.scene);
            this.debugLog("Character controller initialized");
            
            // Rest of your initialization...
        } catch (error) {
            console.error("Error during initialization:", error);
            throw error;
        }
    }
    
    private waitForNextFrame(): Promise<void> {
        return new Promise<void>(resolve => {
            setTimeout(() => {
                resolve();
            }, 16); // Approximately one frame at 60fps
        });
    }
    
    private createGroundPlane(): void {
        // Create a larger ground plane for the world
        const ground = MeshBuilder.CreateGround(
            "physicsGround", 
            { width: 100, height: 100 }, 
            this.scene
        );
        ground.position.y = 0; // At world origin
        ground.isVisible = false;
        
        // Create material
        const groundMaterial = new StandardMaterial("groundMaterial", this.scene);
        groundMaterial.diffuseColor = new Color3(0.2, 0.2, 0.2);
        groundMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
        ground.material = groundMaterial;
        
        // Add physics impostor with proper arguments
        ground.physicsImpostor = new PhysicsImpostor(
            ground,
            PhysicsImpostor.BoxImpostor,
            { mass: 0, friction: 0.5, restitution: 0.1 },
            this.scene
        );
        
        this.debugLog("Physics ground plane created");
    }
    
    private setupCamera(): void {
        // Create an arc rotate camera
        this.camera = new ArcRotateCamera(
            "characterCamera",
            Math.PI, // Alpha (rotation around Y axis)
            Math.PI / 3, // Beta (rotation around X axis)
            10, // Radius (distance from target)
            this.character.getPosition(), // Target
            this.scene
        );
        
        // Camera settings
        this.camera.lowerRadiusLimit = 5;
        this.camera.upperRadiusLimit = 20;
        this.camera.lowerBetaLimit = 0.1;
        this.camera.upperBetaLimit = Math.PI / 2;
        
        // Attach camera to canvas
        this.camera.attachControl(this.canvas, true);
    }
    
    private updateCamera(): void {
        // Update the camera's target to follow the character
        this.camera.target = this.character.getPosition();
    }

    private setupInteractionObservables(): void {
        // Create observables for interactions
        this.scene.onAltarInteractionObservable = new Observable<Vector3>();
        this.scene.onGridInteractionObservable = new Observable<{ position: Vector3; mesh: Mesh }>();

        // Subscribe to altar interaction
        this.scene.onAltarInteractionObservable.add((position: Vector3) => {
            this.handleAltarInteraction(position);
        });

        // Subscribe to grid interaction
        this.scene.onGridInteractionObservable.add((interaction: { position: Vector3; mesh: Mesh }) => {
            this.handleGridInteraction(interaction);
        });
    }

    private handleAltarInteraction(position: Vector3): void {
        this.debugLog("Altar interaction received");
        if (!this.isGridActive) {
            // Activate grid
            this.grid.setVisibility(true);
            this.isGridActive = true;
            this.ui.showMessage("Grid activated! Walk onto it and press 'E' to place queens.", false);
            
            // Highlight valid moves
            if (this.isGridActive) {
                const validMoves = this.gameRules.getValidMoves();
                this.grid.highlightValidMoves(validMoves);
            }
        } else {
            // Deactivate grid
            this.grid.setVisibility(false);
            this.isGridActive = false;
            this.ui.showMessage("Grid deactivated.", false);
        }
    }

    private handleGridInteraction(interaction: { position: Vector3; mesh: Mesh }): void {
        if (!this.isGridActive) {
            this.ui.showMessage("Activate the grid at the altar first!", true);
            return;
        }

        this.debugLog(`Grid interaction received on mesh: ${interaction.mesh.name}`);
        const meshName = interaction.mesh.name;
        if (meshName.startsWith('cell_')) {
            const parts = meshName.split('_');
            if (parts.length >= 3) {
                const row = parseInt(parts[1]);
                const col = parseInt(parts[2]);
                this.debugLog(`Processing grid interaction at cell [${row},${col}]`);
                
                const cell = this.grid.getCell(row, col);
                
                if (cell) {
                    if (cell.isEmpty) {
                        const validation = this.gameRules.validatePlacement(row, col);
                        if (validation.isValid) {
                            this.grid.placeQueen(row, col);
                            this.queenCount++;
                            this.ui.updateQueenCount(this.queenCount);
                            this.ui.showMessage('Queen placed successfully!', false);
                            this.updateGameState();
                        } else {
                            this.ui.showMessage(validation.reason || 'Invalid placement');
                        }
                    } else {
                        this.grid.removeQueen(row, col);
                        this.queenCount--;
                        this.ui.updateQueenCount(this.queenCount);
                        this.ui.showMessage('Queen removed', false);
                        this.updateGameState();
                    }
                    
                    // Update valid moves highlight
                    if (this.isGridActive) {
                        const validMoves = this.gameRules.getValidMoves();
                        this.grid.highlightValidMoves(validMoves);
                    }
                }
            }
        }
    }

    private updateGameState(): void {
        const winCheck = this.gameRules.checkWinCondition();
        this.ui.updateRegionCount(winCheck.regionsWithQueen, winCheck.totalRegions);
        
        if (winCheck.isWin) {
            this.ui.showWinMessage();
            this.grid.setVisibility(false);
            this.isGridActive = false;
        } else if (winCheck.queensPlaced === winCheck.totalRegions) {
            this.ui.showMessage(winCheck.reason || 'Not quite right...', true);
        }
    }
    
    private debugLog(message: string): void {
        if (this.debugMode) {
            console.log(`[GAME]: ${message}`);

        }
    }
}

// Create the game with the first pattern - ensure DOM is fully loaded
window.addEventListener('DOMContentLoaded', () => {
    new Game('renderCanvas', 0);
});
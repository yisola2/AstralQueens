import { 
    Engine,
    Scene,
    ArcRotateCamera,
    Vector3,
    HemisphericLight,
    PointerEventTypes,
    PickingInfo,
    Color3
} from '@babylonjs/core';
import { Grid } from './components/Grid';
import { GameRules, ValidationResult } from './components/GameRules';
import { UI } from './components/UI';

class Game {
    private canvas: HTMLCanvasElement;
    private engine: Engine;
    private scene: Scene;
    private camera!: ArcRotateCamera;
    private light!: HemisphericLight;
    private grid!: Grid;
    private gameRules!: GameRules;
    private ui!: UI;
    private hoveredCell: { row: number; col: number } | null = null;
    private queenCount: number = 0;

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
        this.initialize(patternIndex);
    }

    private initialize(patternIndex: number): void {
        // Add a camera
        this.camera = new ArcRotateCamera(
            'camera',
            Math.PI / 4, // alpha (rotation around Y axis)
            Math.PI / 3, // beta (rotation around X axis)
            10,         // radius
            Vector3.Zero(),
            this.scene
        );
        this.camera.attachControl(this.canvas, true);
        
        // Set camera limits
        this.camera.lowerRadiusLimit = 5;
        this.camera.upperRadiusLimit = 15;
        this.camera.lowerBetaLimit = 0.1;
        this.camera.upperBetaLimit = Math.PI / 2;

        // Add a light
        this.light = new HemisphericLight(
            'light',
            new Vector3(0, 1, 0),
            this.scene
        );
        this.light.intensity = 0.7;

        // Create the grid with specified pattern
        this.grid = new Grid(this.scene, patternIndex);
        this.grid.create();

        // Initialize game rules
        this.gameRules = new GameRules(this.grid);

        // Initialize UI
        this.ui = new UI();
        this.ui.showMessage(`Pattern: ${this.grid.getPatternName()}`, false);

        // Set up interaction
        this.setupInteraction();

        // Start the render loop
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.engine.resize();
        });
    }

    private setupInteraction(): void {
        this.scene.onPointerObservable.add((pointerInfo) => {
            switch (pointerInfo.type) {
                case PointerEventTypes.POINTERMOVE:
                    this.handlePointerMove(pointerInfo.pickInfo);
                    break;
                case PointerEventTypes.POINTERDOWN:
                    this.handlePointerDown(pointerInfo.pickInfo);
                    break;
            }
        });
    }

    private handlePointerMove(pickInfo: PickingInfo | null): void {
        // Clear previous highlight
        if (this.hoveredCell) {
            this.grid.highlightCell(this.hoveredCell.row, this.hoveredCell.col, false);
            this.hoveredCell = null;
        }

        // Check if we're hovering over a cell
        if (pickInfo?.hit && pickInfo.pickedMesh) {
            const meshName = pickInfo.pickedMesh.name;
            if (meshName.startsWith('cell_')) {
                const [_, row, col] = meshName.split('_').map(Number);
                const cell = this.grid.getCell(row, col);
                if (cell?.isEmpty) {
                    const validation = this.gameRules.validatePlacement(row, col);
                    const highlightColor = validation.isValid ? Color3.Green() : Color3.Red();
                    this.grid.highlightCell(row, col, true, highlightColor);
                    this.hoveredCell = { row, col };
                }
            }
        }
    }

    private handlePointerDown(pickInfo: PickingInfo | null): void {
        if (pickInfo?.hit && pickInfo.pickedMesh) {
            const meshName = pickInfo.pickedMesh.name;
            if (meshName.startsWith('cell_')) {
                const [_, row, col] = meshName.split('_').map(Number);
                const cell = this.grid.getCell(row, col);
                if (cell) {
                    if (cell.isEmpty) {
                        const validation = this.gameRules.validatePlacement(row, col);
                        if (validation.isValid) {
                            this.grid.placeQueen(row, col);
                            this.queenCount++;
                            this.ui.updateQueenCount(this.queenCount);
                            this.ui.showMessage('Queen placed successfully!', false);
                            
                            // Check win condition after placing a queen
                            const winCheck = this.gameRules.checkWinCondition();
                            if (winCheck.isWin) {
                                this.ui.showMessage(winCheck.reason || 'You won!', false);
                                // You could add additional win celebration effects here
                            } else if (winCheck.queensPlaced === winCheck.totalRegions) {
                                // Only show the reason if we've placed enough queens but haven't won
                                this.ui.showMessage(winCheck.reason || 'Not quite right...', true);
                            }
                        } else {
                            this.ui.showMessage(validation.reason || 'Invalid placement');
                        }
                    } else {
                        this.grid.removeQueen(row, col);
                        this.queenCount--;
                        this.ui.updateQueenCount(this.queenCount);
                        this.ui.showMessage('Queen removed', false);
                    }
                }
            }
        }
    }
}

// Create the game with the first pattern
new Game('renderCanvas', 0); 
import {
    Scene,
    MeshBuilder,
    StandardMaterial,
    Color3,
    Vector3,
    TransformNode,
    PhysicsAggregate,
    PhysicsShapeType
} from "@babylonjs/core";

interface GridCell {
    isEmpty: boolean;
    regionId: number;
    platformMesh: any;
}

export class PuzzleGrid {
    private scene: Scene;
    private gridSize: number = 7;
    private cellSize: number = 1.14; // Adjusted to match platform width (8 units / 7 cells)
    private gridParent: TransformNode;
    private gridState: GridCell[][];
    private isActive: boolean = false;

    // Define the regions using a 2D array - Rotated to match the camera view
    private readonly regionLayout: number[][] = [
        [2, 2, 2, 2, 3, 3, 3], // Row 0 (bottom)
        [2, 2, 2, 2, 3, 3, 3], // Row 1
        [1, 1, 2, 2, 4, 5, 5], // Row 2
        [1, 1, 1, 1, 1, 5, 5], // Row 3
        [1, 1, 1, 1, 1, 5, 5], // Row 4
        [0, 0, 0, 1, 0, 0, 0], // Row 5
        [0, 0, 0, 1, 0, 0, 0]  // Row 6 (top)
    ];

    constructor(scene: Scene) {
        this.scene = scene;
        this.gridParent = new TransformNode("puzzleGrid", scene);
        this.gridParent.setEnabled(false); // Initially disabled
        this.gridState = this.initializeGridState();
        this.createGrid();
    }

    private initializeGridState(): GridCell[][] {
        const grid: GridCell[][] = [];
        for (let row = 0; row < this.gridSize; row++) {
            grid[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                grid[row][col] = {
                    isEmpty: true,
                    regionId: this.regionLayout[row][col],
                    platformMesh: null
                };
            }
        }
        return grid;
    }

    private createGrid(): void {
        const regionColors = [
            new Color3(1, 1, 0.2),    // Yellow (0)
            new Color3(0.4, 0.8, 1),  // Light Blue (1)
            new Color3(0.8, 0.8, 1),  // Light Purple (2)
            new Color3(1, 0.5, 0.8),  // Pink (3)
            new Color3(0.4, 1, 0.4),  // Green (4)
            new Color3(0.6, 0.4, 1)   // Dark Purple (5)
        ];

        // Calculate total grid size
        const totalWidth = this.getTotalWidth();
        const totalDepth = this.getTotalDepth();

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const regionId = this.gridState[row][col].regionId;
                const platform = MeshBuilder.CreateBox(
                    `platform_${row}_${col}`,
                    { 
                        width: this.cellSize * 0.98,  // Slight gap between cells
                        height: 0.1,                  // Thin platforms
                        depth: this.cellSize * 0.98   // Slight gap between cells
                    },
                    this.scene
                );

                // Position each cell with the grid centered at origin
                platform.position = new Vector3(
                    (col - (this.gridSize - 1) / 2) * this.cellSize,
                    0,
                    ((this.gridSize - 1) / 2 - row) * this.cellSize
                );

                // Create and apply material with enhanced visibility
                const material = new StandardMaterial(`platformMaterial_${row}_${col}`, this.scene);
                material.diffuseColor = regionColors[regionId];
                material.specularColor = new Color3(0.2, 0.2, 0.2);
                material.emissiveColor = regionColors[regionId].scale(0.3);
                material.ambientColor = regionColors[regionId];
                platform.material = material;

                // Add physics for walkability
                new PhysicsAggregate(
                    platform,
                    PhysicsShapeType.BOX,
                    { mass: 0, restitution: 0, friction: 1.0 },
                    this.scene
                );

                // Store reference and parent
                this.gridState[row][col].platformMesh = platform;
                platform.parent = this.gridParent;

                // Add metadata for interaction
                platform.metadata = {
                    type: 'platform',
                    row: row,
                    col: col,
                    regionId: regionId
                };
            }
        }

        console.log("Grid created with dimensions:", {
            totalWidth,
            totalDepth,
            cellSize: this.cellSize,
            cellCount: this.gridSize
        });
    }

    public activate(): void {
        this.gridParent.setEnabled(true);
        this.isActive = true;
    }

    public deactivate(): void {
        this.gridParent.setEnabled(false);
        this.isActive = false;
    }

    public isGridActive(): boolean {
        return this.isActive;
    }

    public getGridState(): GridCell[][] {
        return this.gridState;
    }

    public getGridParent(): TransformNode {
        return this.gridParent;
    }

    public getTotalDepth(): number {
        return this.gridSize * this.cellSize;
    }

    public getTotalWidth(): number {
        return this.gridSize * this.cellSize;
    }
} 
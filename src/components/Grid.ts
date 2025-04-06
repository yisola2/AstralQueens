import {
    Scene,
    MeshBuilder,
    StandardMaterial,
    Color3,
    Vector3,
    Mesh
} from '@babylonjs/core';
import { Queen } from './Queen';
import { GRID_PATTERNS, GridPattern } from './GridPatterns';

export interface GridCell {
    mesh: Mesh;
    material: StandardMaterial;
    isEmpty: boolean;
    queen: Queen | null;
    regionColor: Color3;
    regionId: number;
    borders: {
        top: Mesh;
        right: Mesh;
        bottom: Mesh;
        left: Mesh;
    };
}

export class Grid {
    public readonly size: number;
    private scene: Scene;
    private cells: GridCell[][] = [];
    private cellSize: number = 1;
    private platformHeight: number = 0.2;
    private borderThickness: number = 0.05;
    private pattern: GridPattern;
    private gridParent: Mesh;
    private regionColors: Color3[] = [
        new Color3(0.8, 0.6, 0.8),  // Purple (0)
        new Color3(0.7, 0.9, 0.7),  // Light Green (1)
        new Color3(1.0, 0.8, 0.6),  // Orange/Peach (2)
        new Color3(0.6, 0.8, 0.9),  // Light Blue (3)
        new Color3(0.9, 0.9, 0.9),  // Light Gray (4)
        new Color3(1.0, 1.0, 0.6),  // Yellow (5)
        new Color3(0.8, 0.4, 0.4)   // Red (6)
    ];

    constructor(scene: Scene, patternIndex: number = 0) {
        this.scene = scene;
        this.pattern = GRID_PATTERNS[patternIndex % GRID_PATTERNS.length];
        this.size = this.pattern.regions.length;
        
        // Create a parent for all grid elements - this makes it easier to show/hide the entire grid
        this.gridParent = new Mesh("gridParent", this.scene);
        
        // Position the grid slightly above the ground
        this.gridParent.position = new Vector3(0, 0.1, -30);
    }

    public create(): void {
        try {
            console.log("Creating grid with pattern:", this.pattern.name);
            
            // Create cells
            for (let row = 0; row < this.size; row++) {
                this.cells[row] = [];
                for (let col = 0; col < this.size; col++) {
                    const cell = this.createCell(row, col);
                    this.cells[row][col] = cell;
                }
            }
            
            // Create grid base platform for better visibility
            const basePlatform = MeshBuilder.CreateBox(
                "gridBase",
                {
                    width: this.size * this.cellSize + 0.4,
                    height: 0.1,
                    depth: this.size * this.cellSize + 0.4
                },
                this.scene
            );
            
            // Position slightly below the cells
            basePlatform.position = new Vector3(
                0,
                -0.15,
                0
            );
            
            // Create base material
            const baseMaterial = new StandardMaterial("gridBaseMaterial", this.scene);
            baseMaterial.diffuseColor = new Color3(0.3, 0.3, 0.3);
            basePlatform.material = baseMaterial;
            basePlatform.parent = this.gridParent;
            
            console.log(`Grid created with ${this.size}x${this.size} cells`);
        } catch (error) {
            console.error("Error creating grid:", error);
        }
    }

    private createCell(row: number, col: number): GridCell {
        // Create platform
        const platform = MeshBuilder.CreateBox(
            `cell_${row}_${col}`,
            {
                height: this.platformHeight,
                width: this.cellSize,
                depth: this.cellSize
            },
            this.scene
        );

        // Position the platform
        platform.position = new Vector3(
            col * this.cellSize - (this.size * this.cellSize) / 2 + this.cellSize / 2,
            this.platformHeight / 2,
            row * this.cellSize - (this.size * this.cellSize) / 2 + this.cellSize / 2
        );
        
        // Parent to grid parent
        platform.parent = this.gridParent;

        // Get region ID from pattern
        const regionId = this.pattern.regions[row][col];
        
        // Create material with pattern-defined region color
        const material = new StandardMaterial(`cell_material_${row}_${col}`, this.scene);
        const regionColor = this.regionColors[regionId % this.regionColors.length];
        material.diffuseColor = regionColor;
        material.specularColor = new Color3(0.2, 0.2, 0.2);
        platform.material = material;

        // Create border material
        const borderMaterial = new StandardMaterial(`border_material_${row}_${col}`, this.scene);
        borderMaterial.diffuseColor = new Color3(0.2, 0.2, 0.2); // Dark gray color for borders
        borderMaterial.specularColor = new Color3(0.1, 0.1, 0.1);

        // Create borders
        const borders = {
            top: this.createBorder(row, col, 'top', borderMaterial),
            right: this.createBorder(row, col, 'right', borderMaterial),
            bottom: this.createBorder(row, col, 'bottom', borderMaterial),
            left: this.createBorder(row, col, 'left', borderMaterial)
        };

        return {
            mesh: platform,
            material: material,
            isEmpty: true,
            queen: null,
            regionColor: regionColor,
            regionId: regionId,
            borders: borders
        };
    }

    private createBorder(row: number, col: number, side: 'top' | 'right' | 'bottom' | 'left', material: StandardMaterial): Mesh {
        const borderSize = this.borderThickness;
        const cellCenter = new Vector3(
            col * this.cellSize - (this.size * this.cellSize) / 2 + this.cellSize / 2,
            this.platformHeight / 2,
            row * this.cellSize - (this.size * this.cellSize) / 2 + this.cellSize / 2
        );

        let border: Mesh;
        let position: Vector3;

        switch (side) {
            case 'top':
                border = MeshBuilder.CreateBox(
                    `border_top_${row}_${col}`,
                    {
                        height: this.platformHeight + borderSize,
                        width: this.cellSize,
                        depth: borderSize
                    },
                    this.scene
                );
                position = new Vector3(
                    cellCenter.x,
                    cellCenter.y,
                    cellCenter.z + this.cellSize / 2
                );
                break;
            case 'right':
                border = MeshBuilder.CreateBox(
                    `border_right_${row}_${col}`,
                    {
                        height: this.platformHeight + borderSize,
                        width: borderSize,
                        depth: this.cellSize
                    },
                    this.scene
                );
                position = new Vector3(
                    cellCenter.x + this.cellSize / 2,
                    cellCenter.y,
                    cellCenter.z
                );
                break;
            case 'bottom':
                border = MeshBuilder.CreateBox(
                    `border_bottom_${row}_${col}`,
                    {
                        height: this.platformHeight + borderSize,
                        width: this.cellSize,
                        depth: borderSize
                    },
                    this.scene
                );
                position = new Vector3(
                    cellCenter.x,
                    cellCenter.y,
                    cellCenter.z - this.cellSize / 2
                );
                break;
            case 'left':
                border = MeshBuilder.CreateBox(
                    `border_left_${row}_${col}`,
                    {
                        height: this.platformHeight + borderSize,
                        width: borderSize,
                        depth: this.cellSize
                    },
                    this.scene
                );
                position = new Vector3(
                    cellCenter.x - this.cellSize / 2,
                    cellCenter.y,
                    cellCenter.z
                );
                break;
        }

        border.position = position;
        border.material = material;
        border.parent = this.gridParent;
        return border;
    }

    public getCell(row: number, col: number): GridCell | null {
        if (row >= 0 && row < this.size && col >= 0 && col < this.size) {
            return this.cells[row][col];
        }
        return null;
    }

    public highlightCell(row: number, col: number, highlight: boolean, highlightColor?: Color3): void {
        const cell = this.getCell(row, col);
        if (cell) {
            if (highlight) {
                cell.material.emissiveColor = highlightColor || new Color3(0.5, 0.5, 0.5);
            } else {
                cell.material.emissiveColor = new Color3(0, 0, 0);
            }
        }
    }

    public placeQueen(row: number, col: number): boolean {
        const cell = this.getCell(row, col);
        if (cell && cell.isEmpty) {
            const queen = new Queen(this.scene);
            // Position queen on cell and parent to grid for visibility control
            queen.setPosition(cell.mesh.position.clone());
            queen.parent = this.gridParent;
            
            cell.queen = queen;
            cell.isEmpty = false;
            
            // Highlight cell to indicate queen placement
            this.highlightCell(row, col, true, new Color3(0.2, 0.8, 0.2));
            
            return true;
        }
        return false;
    }

    public removeQueen(row: number, col: number): boolean {
        const cell = this.getCell(row, col);
        if (cell && !cell.isEmpty && cell.queen) {
            cell.queen.dispose();
            cell.queen = null;
            cell.isEmpty = true;
            
            // Remove highlight
            this.highlightCell(row, col, false);
            
            return true;
        }
        return false;
    }

    public dispose(): void {
        // Dispose of all queens, meshes, and borders
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                const cell = this.cells[row][col];
                if (cell.queen) {
                    cell.queen.dispose();
                }
                cell.material.dispose();
                
                // Dispose border materials and meshes
                Object.values(cell.borders).forEach(border => {
                    border.material?.dispose();
                    border.dispose();
                });
            }
        }
        
        // Dispose grid parent
        this.gridParent.dispose();
        this.cells = [];
    }

    public getPatternName(): string {
        return this.pattern.name;
    }

    public setVisibility(visible: boolean): void {
        // Show/hide the entire grid by toggling the parent
        this.gridParent.isVisible = visible;
    }
    
    public getPatternIndex(): number {
        return GRID_PATTERNS.findIndex(p => p.name === this.pattern.name);
    }
    
    public highlightValidMoves(validMoves: {row: number, col: number}[]): void {
        // Clear all highlights first
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                this.highlightCell(row, col, false);
            }
        }
        
        // Highlight valid moves
        validMoves.forEach(move => {
            this.highlightCell(move.row, move.col, true, new Color3(0, 0.8, 0));
        });
    }
}
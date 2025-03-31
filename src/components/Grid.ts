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
}

export class Grid {
    public readonly size: number;
    private scene: Scene;
    private cells: GridCell[][] = [];
    private cellSize: number = 1;
    private platformHeight: number = 0.2;
    private pattern: GridPattern;
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
        this.pattern = GRID_PATTERNS[patternIndex];
        this.size = this.pattern.regions.length;
    }

    public create(): void {
        // Create cells
        for (let row = 0; row < this.size; row++) {
            this.cells[row] = [];
            for (let col = 0; col < this.size; col++) {
                const cell = this.createCell(row, col);
                this.cells[row][col] = cell;
            }
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

        // Get region ID from pattern
        const regionId = this.pattern.regions[row][col];
        
        // Create material with pattern-defined region color
        const material = new StandardMaterial(`cell_material_${row}_${col}`, this.scene);
        const regionColor = this.regionColors[regionId];
        material.diffuseColor = regionColor;
        material.specularColor = new Color3(0.2, 0.2, 0.2);
        platform.material = material;

        return {
            mesh: platform,
            material: material,
            isEmpty: true,
            queen: null,
            regionColor: regionColor,
            regionId: regionId
        };
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
            queen.setPosition(cell.mesh.position);
            cell.queen = queen;
            cell.isEmpty = false;
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
            return true;
        }
        return false;
    }

    public dispose(): void {
        // Dispose of all queens and meshes
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                const cell = this.cells[row][col];
                if (cell.queen) {
                    cell.queen.dispose();
                }
                cell.material.dispose();
                cell.mesh.dispose();
            }
        }
        this.cells = [];
    }

    public getPatternName(): string {
        return this.pattern.name;
    }
} 
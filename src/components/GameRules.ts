import { Grid } from './Grid';

export interface ValidationResult {
    isValid: boolean;
    reason?: string;
}

export interface WinCheckResult {
    isWin: boolean;
    reason?: string;
    queensPlaced: number;
    regionsWithQueen: number;
    totalRegions: number;
}

export class GameRules {
    private grid: Grid;

    constructor(grid: Grid) {
        this.grid = grid;
    }

    public validatePlacement(row: number, col: number): ValidationResult {
        // Check if cell is empty
        const cell = this.grid.getCell(row, col);
        if (!cell || !cell.isEmpty) {
            return { isValid: false, reason: 'Cell is not empty' };
        }

        // Check row
        if (this.hasQueenInRow(row)) {
            return { isValid: false, reason: 'Queen already exists in this row' };
        }

        // Check column
        if (this.hasQueenInColumn(col)) {
            return { isValid: false, reason: 'Queen already exists in this column' };
        }

        // Check immediate diagonals
        if (this.hasQueenInImmediateDiagonals(row, col)) {
            return { isValid: false, reason: 'Queen already exists in adjacent diagonal' };
        }

        // Check region
        if (this.hasQueenInRegion(row, col)) {
            return { isValid: false, reason: 'Queen already exists in this region' };
        }

        return { isValid: true };
    }

    public checkWinCondition(): WinCheckResult {
        // Get all unique region IDs
        const regionIds = new Set<number>();
        const regionsWithQueens = new Set<number>();
        let queensPlaced = 0;

        // Check each cell
        for (let row = 0; row < this.grid.size; row++) {
            for (let col = 0; col < this.grid.size; col++) {
                const cell = this.grid.getCell(row, col);
                if (cell) {
                    regionIds.add(cell.regionId);
                    if (!cell.isEmpty) {
                        queensPlaced++;
                        regionsWithQueens.add(cell.regionId);

                        // Verify this queen's placement is legal
                        // Temporarily remove the queen for validation
                        cell.isEmpty = true;
                        const isValid = this.validatePlacement(row, col).isValid;
                        cell.isEmpty = false;

                        if (!isValid) {
                            return {
                                isWin: false,
                                reason: `Illegal queen placement found at row ${row + 1}, column ${col + 1}`,
                                queensPlaced,
                                regionsWithQueen: regionsWithQueens.size,
                                totalRegions: regionIds.size
                            };
                        }
                    }
                }
            }
        }

        // Check if all regions have exactly one queen
        if (regionsWithQueens.size !== regionIds.size) {
            return {
                isWin: false,
                reason: `Not all regions have a queen (${regionsWithQueens.size}/${regionIds.size} regions filled)`,
                queensPlaced,
                regionsWithQueen: regionsWithQueens.size,
                totalRegions: regionIds.size
            };
        }

        return {
            isWin: true,
            reason: 'Congratulations! You\'ve solved the puzzle!',
            queensPlaced,
            regionsWithQueen: regionsWithQueens.size,
            totalRegions: regionIds.size
        };
    }

    private hasQueenInRow(row: number): boolean {
        for (let col = 0; col < this.grid.size; col++) {
            const cell = this.grid.getCell(row, col);
            if (cell && !cell.isEmpty) return true;
        }
        return false;
    }

    private hasQueenInColumn(col: number): boolean {
        for (let row = 0; row < this.grid.size; row++) {
            const cell = this.grid.getCell(row, col);
            if (cell && !cell.isEmpty) return true;
        }
        return false;
    }

    private hasQueenInImmediateDiagonals(row: number, col: number): boolean {
        // Check only immediate diagonal neighbors
        const diagonalOffsets = [
            [-1, -1], // Top-left
            [-1, 1],  // Top-right
            [1, -1],  // Bottom-left
            [1, 1]    // Bottom-right
        ];

        for (const [dr, dc] of diagonalOffsets) {
            const newRow = row + dr;
            const newCol = col + dc;
            const cell = this.grid.getCell(newRow, newCol);
            if (cell && !cell.isEmpty) {
                return true;
            }
        }
        return false;
    }

    private hasQueenInRegion(row: number, col: number): boolean {
        const cell = this.grid.getCell(row, col);
        if (!cell) return false;

        for (let r = 0; r < this.grid.size; r++) {
            for (let c = 0; c < this.grid.size; c++) {
                const otherCell = this.grid.getCell(r, c);
                if (otherCell && !otherCell.isEmpty && 
                    otherCell.regionColor.equals(cell.regionColor)) {
                    return true;
                }
            }
        }
        return false;
    }

    public getValidMoves(): { row: number; col: number }[] {
        const validMoves: { row: number; col: number }[] = [];
        
        for (let row = 0; row < this.grid.size; row++) {
            for (let col = 0; col < this.grid.size; col++) {
                if (this.validatePlacement(row, col).isValid) {
                    validMoves.push({ row, col });
                }
            }
        }
        
        return validMoves;
    }
} 
export interface GridPattern {
    regions: number[][];  // 2D array representing region IDs
    name: string;        // Pattern name/description
}

export const GRID_PATTERNS: GridPattern[] = [
    {
        name: "Example Pattern",
        regions: [
            [0, 0, 2, 2, 2, 2, 3],
            [0, 0, 0, 1, 0, 0, 3],
            [0, 0, 0, 1, 0, 0, 3],
            [0, 4, 4, 1, 0, 0, 3],
            [0, 0, 0, 0, 0, 0, 3],
            [0, 5, 0, 0, 0, 0, 0],
            [5, 5, 5, 6, 6, 6, 6]
        ]
    },
    {
        name: "Classic Pattern",
        regions: [
            [0, 0, 0, 1, 1, 1, 2],
            [0, 0, 0, 3, 0, 0, 2],
            [0, 0, 0, 3, 0, 0, 2],
            [4, 4, 4, 3, 0, 0, 2],
            [0, 0, 0, 0, 0, 0, 2],
            [0, 5, 0, 0, 0, 0, 0],
            [5, 5, 5, 3, 3, 3, 3]
        ]
    },
    {
        name: "Spiral Pattern",
        regions: [
            [0, 0, 0, 0, 0, 0, 0],
            [1, 1, 1, 1, 1, 1, 0],
            [1, 2, 2, 2, 2, 1, 0],
            [1, 2, 3, 3, 2, 1, 0],
            [1, 2, 2, 2, 2, 1, 0],
            [1, 1, 1, 1, 1, 1, 0],
            [4, 4, 4, 4, 4, 4, 4]
        ]
    },
    {
        name: "Checkered Pattern",
        regions: [
            [0, 1, 0, 1, 0, 1, 0],
            [1, 2, 1, 2, 1, 2, 1],
            [0, 1, 0, 1, 0, 1, 0],
            [1, 2, 1, 2, 1, 2, 1],
            [0, 1, 0, 1, 0, 1, 0],
            [1, 2, 1, 2, 1, 2, 1],
            [0, 1, 0, 1, 0, 1, 0]
        ]
    }
]; 
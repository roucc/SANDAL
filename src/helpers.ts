// mul algorithm for axb matrices
export function matMult(a: number[][], b: number[][]): number[][] {
    const result: number[][] = []
    for (let i = 0; i < a.length; i++) {
        result[i] = []
        for (let j = 0; j < b[0].length; j++) {
            let sum = 0
            for (let k = 0; k < a[0].length; k++) {
                sum += a[i][k] * b[k][j]
            }
            result[i][j] = sum
        }
    }
    return result
}

// projection matrix
export const pMat: number[][] = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
]

// rotation matrices:
export const xMat = (a: number): number[][] => [
    [1, 0, 0],
    [0, Math.cos(a), -Math.sin(a)],
    [0, Math.sin(a), Math.cos(a)],
]

export const yMat = (a: number): number[][] => [
    [Math.cos(a), 0, Math.sin(a)],
    [0, 1, 0],
    [-Math.sin(a), 0, Math.cos(a)],
]

export const zMat = (a: number): number[][] => [
    [Math.cos(a), -Math.sin(a), 0],
    [Math.sin(a), Math.cos(a), 0],
    [0, 0, 1],
]

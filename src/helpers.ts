export const drawLine = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string): void => {
    ctx.strokeStyle = color
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
}

export type Vec2 = [number, number]
export type Vec3 = [number, number, number]
export type Mat3x3 = [Vec3, Vec3, Vec3]
export const emptyMat3x3 = (): Mat3x3 => [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
]

export const mat3Mul = (a: Mat3x3, b: Mat3x3): Mat3x3 => ([
    [
        a[0][0] * b[0][0] + a[0][1] * b[1][0] + a[0][2] * b[2][0],
        a[0][0] * b[0][1] + a[0][1] * b[1][1] + a[0][2] * b[2][1],
        a[0][0] * b[0][2] + a[0][1] * b[1][2] + a[0][2] * b[2][2],
    ],
    [
        a[1][0] * b[0][0] + a[1][1] * b[1][0] + a[1][2] * b[2][0],
        a[1][0] * b[0][1] + a[1][1] * b[1][1] + a[1][2] * b[2][1],
        a[1][0] * b[0][2] + a[1][1] * b[1][2] + a[1][2] * b[2][2],
    ],
    [
        a[2][0] * b[0][0] + a[2][1] * b[1][0] + a[2][2] * b[2][0],
        a[2][0] * b[0][1] + a[2][1] * b[1][1] + a[2][2] * b[2][1],
        a[2][0] * b[0][2] + a[2][1] * b[1][2] + a[2][2] * b[2][2],
    ],
])

export function mat3MulVec(m: Mat3x3, v: Vec3): Vec3 {
    return [
        m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
        m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
        m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
    ]
}

// projection matrix
export const pMat: Mat3x3 = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
]

export const xMat = (a: number): Mat3x3 => [
    [1, 0, 0],
    [0, Math.cos(a), -Math.sin(a)],
    [0, Math.sin(a), Math.cos(a)],
]

export const yMat = (a: number): Mat3x3 => [
    [Math.cos(a), 0, Math.sin(a)],
    [0, 1, 0],
    [-Math.sin(a), 0, Math.cos(a)],
]

export const zMat = (a: number): Mat3x3 => [
    [Math.cos(a), -Math.sin(a), 0],
    [Math.sin(a), Math.cos(a), 0],
    [0, 0, 1],
]

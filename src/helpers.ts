import { Camera } from "./classes"

export const drawLine = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string): void => {
    ctx.strokeStyle = color
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
}

export const fillTriangle = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, color: string): void => {
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.lineTo(x3, y3)
    ctx.fill()
    ctx.stroke()
}

export type Vec2 = [number, number]
export type Vec3 = [number, number, number]

export const dot3 = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

export type Vec4 = [number, number, number, number] // x,y,z,w
export type Mat4x4 = [Vec4, Vec4, Vec4, Vec4]

// right handed FPS camera view matrix
// from https://www.3dgep.com/understanding-the-view-matrix/#The_Camera_Transformation
export function createViewFPS(cam: Camera): Mat4x4 {
    const halfPi = Math.PI * 0.5
    const pitch = Math.max(-halfPi, Math.min(halfPi, cam.pitch))

    const cosP = Math.cos(pitch), sinP = Math.sin(pitch)
    const cosY = Math.cos(cam.yaw), sinY = Math.sin(cam.yaw)

    const right: Vec3 = [cosY, 0, -sinY]
    const up: Vec3 = [sinY * sinP, cosP, cosY * sinP]
    const forward: Vec3 = [sinY * cosP, sinP, cosP * cosY] // flip sign to make LH?

    return [
        [right[0], right[1], right[2], -dot3(right, cam.eye)],
        [up[0], up[1], up[2], -dot3(up, cam.eye)],
        [forward[0], forward[1], forward[2], -dot3(forward, cam.eye)],
        [0, 0, 0, 1],
    ]
}

export function createPerspective(cam: Camera, aspect: number): Mat4x4 {
    const f = 1 / Math.tan(cam.fov / 2); // cam.fov in radians (vertical)
    return [
        [f / aspect, 0, 0, 0],
        [0, f, 0, 0],
        [0, 0, -(cam.far + cam.near) / (cam.far - cam.near), -1],
        [0, 0, -(2 * cam.far * cam.near) / (cam.far - cam.near), 0],
    ];
}

export const mat4Mul = (a: Mat4x4, b: Mat4x4): Mat4x4 => ([
    [
        a[0][0] * b[0][0] + a[0][1] * b[1][0] + a[0][2] * b[2][0] + a[0][3] * b[3][0],
        a[0][0] * b[0][1] + a[0][1] * b[1][1] + a[0][2] * b[2][1] + a[0][3] * b[3][1],
        a[0][0] * b[0][2] + a[0][1] * b[1][2] + a[0][2] * b[2][2] + a[0][3] * b[3][2],
        a[0][0] * b[0][3] + a[0][1] * b[1][3] + a[0][2] * b[2][3] + a[0][3] * b[3][3],
    ],
    [
        a[1][0] * b[0][0] + a[1][1] * b[1][0] + a[1][2] * b[2][0] + a[1][3] * b[3][0],
        a[1][0] * b[0][1] + a[1][1] * b[1][1] + a[1][2] * b[2][1] + a[1][3] * b[3][1],
        a[1][0] * b[0][2] + a[1][1] * b[1][2] + a[1][2] * b[2][2] + a[1][3] * b[3][2],
        a[1][0] * b[0][3] + a[1][1] * b[1][3] + a[1][2] * b[2][3] + a[1][3] * b[3][3],
    ],
    [
        a[2][0] * b[0][0] + a[2][1] * b[1][0] + a[2][2] * b[2][0] + a[2][3] * b[3][0],
        a[2][0] * b[0][1] + a[2][1] * b[1][1] + a[2][2] * b[2][1] + a[2][3] * b[3][1],
        a[2][0] * b[0][2] + a[2][1] * b[1][2] + a[2][2] * b[2][2] + a[2][3] * b[3][2],
        a[2][0] * b[0][3] + a[2][1] * b[1][3] + a[2][2] * b[2][3] + a[2][3] * b[3][3],
    ],
    [
        a[3][0] * b[0][0] + a[3][1] * b[1][0] + a[3][2] * b[2][0] + a[3][3] * b[3][0],
        a[3][0] * b[0][1] + a[3][1] * b[1][1] + a[3][2] * b[2][1] + a[3][3] * b[3][1],
        a[3][0] * b[0][2] + a[3][1] * b[1][2] + a[3][2] * b[2][2] + a[3][3] * b[3][2],
        a[3][0] * b[0][3] + a[3][1] * b[1][3] + a[3][2] * b[2][3] + a[3][3] * b[3][3],
    ],
])

export function mat4MulVec(m: Mat4x4, v: Vec4): Vec4 {
    return [
        m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2] + m[0][3] * v[3],
        m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2] + m[1][3] * v[3],
        m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2] + m[2][3] * v[3],
        m[3][0] * v[0] + m[3][1] * v[1] + m[3][2] * v[2] + m[3][3] * v[3],
    ]
}

// identity matrix (orthographic projection)
export const pMat4: Mat4x4 = [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
]

// rotation matrices
export const xMat4 = (a: number): Mat4x4 => [
    [1, 0, 0, 0],
    [0, Math.cos(a), -Math.sin(a), 0],
    [0, Math.sin(a), Math.cos(a), 0],
    [0, 0, 0, 1],
]

export const yMat4 = (a: number): Mat4x4 => [
    [Math.cos(a), 0, Math.sin(a), 0],
    [0, 1, 0, 0],
    [-Math.sin(a), 0, Math.cos(a), 0],
    [0, 0, 0, 1],
]

export const zMat4 = (a: number): Mat4x4 => [
    [Math.cos(a), -Math.sin(a), 0, 0],
    [Math.sin(a), Math.cos(a), 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
]

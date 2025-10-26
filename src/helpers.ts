import { Camera } from "./classes"

export function clipped(p: Vec4) {
    const [x, y, z, u] = p
    const w = u + 100 // epic bodge to stop clipping on screen
    // sometimes makes being in/close to objects weird
    // TODO: implement actual culling techniques
    return (w <= 1e-6) || x < -w || x > w || y < -w || y > w || z < -w || z > w
}

export type RGBA = [number, number, number, number]
export type Color32 = number // packed uint32 RGBA

export function normalize(v: Vec3): Vec3 {
    const len = Math.hypot(v[0], v[1], v[2])
    return len === 0 ? [0, 0, 0] : [v[0] / len, v[1] / len, v[2] / len]
}

export function normalVec3(a: Vec3, b: Vec3, c: Vec3): Vec3 {
    const u: Vec3 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
    const v: Vec3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
    return [
        u[1] * v[2] - u[2] * v[1],
        u[2] * v[0] - u[0] * v[2],
        u[0] * v[1] - u[1] * v[0],
    ]
}

export function averageVec3(a: Vec3, b: Vec3, c: Vec3): Vec3 {
    return [
        (a[0] + b[0] + c[0]) / 3,
        (a[1] + b[1] + c[1]) / 3,
        (a[2] + b[2] + c[2]) / 3,
    ]
}

export const packRGBA = ([r, g, b, a = 255]: RGBA): Color32 =>
    ((a & 0xFF) << 24) | ((b & 0xFF) << 16) | ((g & 0xFF) << 8) | (r & 0xFF)

export function rasterizeTriangle(
    img32: Uint32Array, depth: Float32Array, W: number, H: number,
    a: Vec3, b: Vec3, c: Vec3,
    getColor: ((l0: number, l1: number, l2: number) => number) | number // callback or single colour
) {
    // back-face culling in screen space
    const FRONT_CCW = false // counter clockwise winding
    const edge = (ax: number, ay: number, bx: number, by: number, px: number, py: number) =>
        (px - ax) * (by - ay) - (py - ay) * (bx - ax)
    const area = edge(a[0], a[1], b[0], b[1], c[0], c[1])
    if ((FRONT_CCW && area <= 0) || (!FRONT_CCW && area >= 0)) return

    // triangles screen space bounding box
    const minX = Math.max(0, Math.floor(Math.min(a[0], b[0], c[0])))
    const maxX = Math.min(W - 1, Math.ceil(Math.max(a[0], b[0], c[0])))
    const minY = Math.max(0, Math.floor(Math.min(a[1], b[1], c[1])))
    const maxY = Math.min(H - 1, Math.ceil(Math.max(a[1], b[1], c[1])))

    for (let y = minY; y <= maxY; y++) {
        const py = y + 0.5
        for (let x = minX; x <= maxX; x++) {
            const px = x + 0.5
            const w0 = edge(b[0], b[1], c[0], c[1], px, py)
            const w1 = edge(c[0], c[1], a[0], a[1], px, py)
            const w2 = edge(a[0], a[1], b[0], b[1], px, py)
            if (w0 <= 0 && w1 <= 0 && w2 <= 0) {
                const invA = 1 / -area
                const l0 = w0 * invA, l1 = w1 * invA, l2 = w2 * invA
                const z = l0 * a[2] + l1 * b[2] + l2 * c[2]
                const idx = y * W + x
                if (z < depth[idx]) {
                    depth[idx] = z
                    img32[idx] = typeof getColor === "function"
                        ? getColor(l0, l1, l2) // per pixel shading
                        : getColor // flat shading
                }
            }
        }
    }
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
    const forward: Vec3 = [sinY * cosP, -sinP, cosP * cosY]

    return [
        [right[0], right[1], right[2], -dot3(right, cam.eye)],
        [up[0], up[1], up[2], -dot3(up, cam.eye)],
        [forward[0], forward[1], forward[2], -dot3(forward, cam.eye)],
        [0, 0, 0, 1],
    ]
}

export function createPerspective(cam: Camera, aspect: number): Mat4x4 {
    const f = 1 / Math.tan(cam.fov / 2) // vertical fov
    const n = cam.near, fa = cam.far
    // Column-vector convention (p = M * v), RH, NDC z in [-1,1]
    return [
        [f / aspect, 0, 0, 0],
        [0, f, 0, 0],
        [0, 0, (fa + n) / (n - fa), (2 * fa * n) / (n - fa)],
        [0, 0, -1, 0],
    ]
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

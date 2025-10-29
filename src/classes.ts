import { dot3, clipped, rasterizeTriangle, createViewFPS, normalize, createPerspective, mat4MulVec, xMat4, yMat4, zMat4, mat4Mul, sMat4 } from "./helpers"
import type { Vec3, Vec4, Mat4x4, Color32, RGBA } from "./helpers"
import type { Shader } from "./shaders"

export class Vertex {
    x: number = 0; y: number = 0; z: number = 0
    constructor(x: number, y: number, z: number) {
        this.x = x; this.y = y; this.z = z
    }
}

export class Camera {
    eye: Vec3
    pitch: number
    yaw: number
    fov: number // vertical fov, degrees
    near: number // closest objects get displayed
    far: number // furthest objects get displayed
    constructor(eye: Vec3 = [0, 0, 0], pitch: number = 0, yaw: number = 0, fov: number = 60, near: number = 0.1, far: number = 10000) {
        this.eye = eye
        this.pitch = pitch
        this.yaw = yaw
        this.fov = (fov / 180) * Math.PI // convert to radians
        this.near = near
        this.far = far
    }
}

export class Mesh {
    vertices: Vertex[] = []
    triangles: Vec3[] = []
    rotX = 0; rotY = 0; rotZ = 0
    screen: Float32Array = new Float32Array(0) // onscreen points xy + depth
    clipMask: Uint8Array = new Uint8Array(0) // 1 = clipped, 0 = valid
    viewPos: Float32Array = new Float32Array(0) // xyz in view space
    normals: Vec3[] = [] // model space vertex normals
    viewNorms: Float32Array = new Float32Array(0) // view space vertex normals
    vertI: Float32Array = new Float32Array(0)

    projectToScreen(
        worldPos: Vec4 = [0, 0, 0, 1],
        cam: Camera,
        CW: number, CH: number,
        viewLight: Vec4,
        ambient: number,
        albedo: number,
        scale: number = 1,
    ): void {
        const n = this.vertices.length
        this.screen = new Float32Array(n * 3)
        this.clipMask = new Uint8Array(n)
        this.viewPos = new Float32Array(n * 3)
        this.viewNorms = new Float32Array(n * 3)
        this.vertI = new Float32Array(n)

        const S = sMat4(scale ?? 1)
        const R = mat4Mul(zMat4(this.rotZ), mat4Mul(yMat4(this.rotY), xMat4(this.rotX)))
        const T: Mat4x4 = [
            [1, 0, 0, worldPos[0]],
            [0, 1, 0, worldPos[1]],
            [0, 0, 1, worldPos[2]],
            [0, 0, 0, 1],
        ]

        // model->world coordinates
        const M = mat4Mul(T, mat4Mul(R, S))
        // world->view coordinates
        const V = createViewFPS(cam)
        const MV = mat4Mul(V, M)
        // view->clip coordinates
        const P = createPerspective(cam, CW / CH)
        const MVP = mat4Mul(P, MV)

        // lighting done in view space

        for (let i = 0; i < this.vertices.length; i++) {
            const v = this.vertices[i]

            // model->world->view->clip
            const p = mat4MulVec(MVP, [v.x, v.y, v.z, 1])
            const w = p[3]

            const clip = clipped(p)
            if (clip) {
                this.clipMask[i] = 1
                continue
            }
            this.clipMask[i] = 0

            // clip->normalized device coordinates
            // perspective divide (x,y,z) / w
            const invW = 1 / w
            const ndcX = p[0] * invW
            const ndcY = p[1] * invW
            const ndcZ = p[2] * invW

            // NDC->screen coordinates
            // NDC (−1,1) → pixels
            const sx = (ndcX * 0.5 + 0.5) * CW
            const sy = (-ndcY * 0.5 + 0.5) * CH // flip y, top left origin

            // calculate view space positions
            const vpos = mat4MulVec(MV, [v.x, v.y, v.z, 1])

            const o = i * 3
            this.screen[o + 0] = sx; this.screen[o + 1] = sy; this.screen[o + 2] = ndcZ

            this.viewPos[o + 0] = vpos[0]; this.viewPos[o + 1] = vpos[1]; this.viewPos[o + 2] = vpos[2]

            const n = this.normals[i]
            const vn4 = mat4MulVec(MV, [n[0], n[1], n[2], 0]) // view normal (w=0)
            const vn = normalize([vn4[0], vn4[1], vn4[2]])
            this.viewNorms[o + 0] = vn[0]; this.viewNorms[o + 1] = vn[1]; this.viewNorms[o + 2] = vn[2]

            // static light direction
            const L = normalize([-viewLight[0] + vpos[0], -viewLight[1] + vpos[1], -viewLight[2] + vpos[2]])
            const D = Math.max(0, dot3(vn, L))
            this.vertI[i] = ambient + albedo * D
        }
    }

    drawSolidToImage(
        color: RGBA,
        img32: Uint32Array, depth: Float32Array, W: number, H: number,
        shader: Shader,
    ) {
        for (const t of this.triangles) {
            const i0 = t[0], i1 = t[1], i2 = t[2]
            if (this.clipMask[i0] | this.clipMask[i1] | this.clipMask[i2]) continue // skip if clipped

            const o0 = i0 * 3, o1 = i1 * 3, o2 = i2 * 3;
            const x0 = this.screen[o0], y0 = this.screen[o0 + 1], z0 = this.screen[o0 + 2]
            const x1 = this.screen[o1], y1 = this.screen[o1 + 1], z1 = this.screen[o1 + 2]
            const x2 = this.screen[o2], y2 = this.screen[o2 + 1], z2 = this.screen[o2 + 2]

            // intensities per vertex
            const I0 = this.vertI[i0], I1 = this.vertI[i1], I2 = this.vertI[i2]

            // would be better for rasterizeTriangle to take individually
            const p1: [number, number, number] = [x0, y0, z0];
            const p2: [number, number, number] = [x1, y1, z1];
            const p3: [number, number, number] = [x2, y2, z2];

            // Use pixel or flat shading automatically
            if (shader.shadePixel) {
                const getColor = (b0: number, b1: number, b2: number): Color32 => {
                    return shader.shadePixel!([b0, b1, b2], [I0, I1, I2], color)
                }
                rasterizeTriangle(img32, depth, W, H, p1, p2, p3, getColor)
            } else if (shader.shadeFlat) {
                const flat = (I0 + I1 + I2) / 3
                const color32: Color32 = shader.shadeFlat(flat, color)
                rasterizeTriangle(img32, depth, W, H, p1, p2, p3, color32)
            }

        }
    }

    rotate(x: number, y: number, z: number): void {
        this.rotX += x; this.rotY += y; this.rotZ += z
    }

    buildVertexNormals() {
        this.normals = Array(this.vertices.length).fill(0).map(_ => [0, 0, 0] as Vec3)
        for (const t of this.triangles) {
            const a = this.vertices[t[0]], b = this.vertices[t[1]], c = this.vertices[t[2]]
            const ab: Vec3 = [b.x - a.x, b.y - a.y, b.z - a.z]
            const ac: Vec3 = [c.x - a.x, c.y - a.y, c.z - a.z]

            const n: Vec3 = [
                ab[1] * ac[2] - ab[2] * ac[1],
                ab[2] * ac[0] - ab[0] * ac[2],
                ab[0] * ac[1] - ab[1] * ac[0],
            ]
            for (const i of t) {
                this.normals[i][0] += n[0]
                this.normals[i][1] += n[1]
                this.normals[i][2] += n[2]
            }
        }
        this.normals = this.normals.map(n => normalize(n))
    }
}

export class Box extends Mesh {
    constructor(width = 100, height = 100, depth = 100) {
        super()
        const w = width / 2
        const h = height / 2
        const d = depth / 2

        this.vertices = [
            new Vertex(-w, -h, -d), new Vertex(w, -h, -d),
            new Vertex(w, h, -d), new Vertex(-w, h, -d),
            new Vertex(-w, -h, d), new Vertex(w, -h, d),
            new Vertex(w, h, d), new Vertex(-w, h, d),
        ]

        this.triangles = [
            // back  (-z)
            [1, 3, 0], [1, 2, 3],
            // front (+z)
            [4, 6, 5], [4, 7, 6],
            // left  (-x)
            [0, 7, 4], [0, 3, 7],
            // right (+x)
            [5, 2, 1], [5, 6, 2],
            // top   (+y)
            [3, 6, 7], [3, 2, 6],
            // bot   (-y)
            [0, 5, 1], [0, 4, 5],
        ]

        this.buildVertexNormals()
    }
}

export class Sphere extends Mesh {
    constructor(radius = 150, segments = 20) {
        super()

        for (let i = 0; i <= segments; i++) {
            const theta = i * Math.PI / segments
            for (let j = 0; j < segments; j++) {
                const phi = j * 2 * Math.PI / segments
                const x = radius * Math.sin(theta) * Math.cos(phi)
                const y = radius * Math.sin(theta) * Math.sin(phi)
                const z = radius * Math.cos(theta)
                this.vertices.push(new Vertex(x, y, z))
            }
        }

        const cols = segments
        for (let i = 0; i < segments; i++) {
            for (let j = 0; j < segments; j++) {
                const a = i * cols + j
                const b = i * cols + ((j + 1) % cols)
                const c = (i + 1) * cols + j
                const d = (i + 1) * cols + ((j + 1) % cols)
                this.triangles.push([a, b, d], [a, d, c])
            }
        }

        this.normals = this.vertices.map(v => normalize([-v.x, -v.y, -v.z]))
    }
}

export class Tetrahedron extends Mesh {
    constructor(size = 100) {
        super()
        const s = size / 2

        this.vertices = [
            new Vertex(0, s, 0),
            new Vertex(-s, -s, s),
            new Vertex(s, -s, s),
            new Vertex(0, -s, -s),
        ]

        this.triangles = [
            [0, 2, 1],
            [0, 3, 2],
            [0, 1, 3],
            [1, 2, 3],
        ]

        this.buildVertexNormals()
    }
}

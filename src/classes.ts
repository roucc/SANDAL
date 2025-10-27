import { clipped, rasterizeTriangle, createViewFPS, normalize, createPerspective, mat4MulVec, xMat4, yMat4, zMat4, mat4Mul } from "./helpers"
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
    pixels: Vec3[] = [] // onscreen points xy + depth, later add colour
    viewPos: Vec3[] = [] // xyz in view space
    normals: Vec3[] = [] // model space vertex normals
    viewNorms: Vec3[] = [] // view space vertex normals

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

    projectToScreen(
        worldPos: Vec4 = [0, 0, 0, 1],
        cam: Camera,
        CW: number, CH: number,
    ): void {
        this.pixels = []
        this.viewPos = []
        this.viewNorms = []

        const T: Mat4x4 = [
            [1, 0, 0, worldPos[0]],
            [0, 1, 0, worldPos[1]],
            [0, 0, 1, worldPos[2]],
            [0, 0, 0, 1],
        ]

        // model->world coordinates
        const M = mat4Mul(T, mat4Mul(zMat4(this.rotZ), mat4Mul(yMat4(this.rotY), xMat4(this.rotX))))
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
                this.pixels.push([Infinity, Infinity, Infinity])
                this.viewPos.push([Infinity, Infinity, Infinity])
                this.viewNorms.push([0, 0, 0])
                continue
            }

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

            this.pixels.push([sx, sy, ndcZ]) // store z for depth buffer
            this.viewPos.push([vpos[0], vpos[1], vpos[2]])

            const n = this.normals[i]
            const vn = mat4MulVec(MV, [n[0], n[1], n[2], 0]) // view normal (w=0)
            this.viewNorms.push(normalize([vn[0], vn[1], vn[2]]))
        }
    }

    drawSolidToImage(
        color: RGBA,
        img32: Uint32Array, depth: Float32Array, W: number, H: number,
        viewLight: Vec4,
        ambient: number,
        albedo: number,
        shader: Shader,
    ) {
        for (const t of this.triangles) {
            const n1 = this.viewNorms[t[0]], n2 = this.viewNorms[t[1]], n3 = this.viewNorms[t[2]]
            const p1 = this.pixels[t[0]]; const p2 = this.pixels[t[1]]; const p3 = this.pixels[t[2]]
            // skip if clipped
            if (!Number.isFinite(p1[0]) || !Number.isFinite(p2[0]) || !Number.isFinite(p3[0])) continue

            const v1 = this.viewPos[t[0]]; const v2 = this.viewPos[t[1]]; const v3 = this.viewPos[t[2]]

            // Use pixel or flat shading automatically
            if (shader.shadePixel) {
                if (!n1 || !n2 || !n3) continue
                const getColor = (l0: number, l1: number, l2: number): Color32 => {
                    return shader.shadePixel!(
                        [v1, v2, v3], // vertex view pos
                        [l0, l1, l2], // barycentric weights
                        viewLight,
                        color,
                        ambient,
                        albedo,
                        [n1, n2, n3],
                    )
                }
                rasterizeTriangle(img32, depth, W, H, p1, p2, p3, getColor)
            } else if (shader.shadeFlat) {
                const color32: Color32 = shader.shadeFlat([v1, v2, v3], viewLight, color, ambient, albedo)
                rasterizeTriangle(img32, depth, W, H, p1, p2, p3, color32)
            }

        }
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
    }
}

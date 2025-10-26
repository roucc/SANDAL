import { lambert, clipped, drawTriZToImage, createViewFPS, createPerspective, mat4MulVec, xMat4, yMat4, zMat4, mat4Mul, packRGBA } from "./helpers"
import type { Vec3, Vec4, Mat4x4 } from "./helpers"

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

    rotate(x: number, y: number, z: number): void {
        this.rotX += x; this.rotY += y; this.rotZ += z
    }

    projectToScreen(
        worldPos: Vec4 = [0, 0, 0, 1],
        cam: Camera,
        CW: number, CH: number,
    ): void {
        this.pixels = []
        this.viewPos = []

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

        for (let v of this.vertices) {
            // model->world->view->clip
            const p = mat4MulVec(MVP, [v.x, v.y, v.z, 1])
            const w = p[3]

            const clip = clipped(p)
            if (clip) {
                this.pixels.push([Infinity, Infinity, Infinity])
                this.viewPos.push([Infinity, Infinity, Infinity])
                continue
            }

            // clip->normalized device coordinates
            // perspective divide (x,y,z) / w
            const invW = 1 / w
            const ndcX = p[0] * invW
            const ndcY = p[1] * invW

            // NDC->screen coordinates
            // NDC (−1,1) → pixels
            const sx = (ndcX * 0.5 + 0.5) * CW
            const sy = (-ndcY * 0.5 + 0.5) * CH // flip y, top left origin

            // calculate view space positions
            const vpos = mat4MulVec(MV, [v.x, v.y, v.z, 1])

            this.pixels.push([sx, sy, vpos[2]]) // store z for depth buffer
            this.viewPos.push([vpos[0], vpos[1], vpos[2]])
        }
    }

    drawSolidToImage(
        color: Vec4,
        img32: Uint32Array, depth: Float32Array, W: number, H: number,
        viewLight: Vec4,
        ambient: number,
        albedo: number,
    ) {
        for (const t of this.triangles) {
            const p1 = this.pixels[t[0]]; const p2 = this.pixels[t[1]]; const p3 = this.pixels[t[2]]
            // skip if clipped
            if (!Number.isFinite(p1[0]) || !Number.isFinite(p2[0]) || !Number.isFinite(p3[0])) continue

            // apply shading
            const v1 = this.viewPos[t[0]]; const v2 = this.viewPos[t[1]]; const v3 = this.viewPos[t[2]]

            const colorRGBA = lambert([v1, v2, v3], viewLight, color, ambient, albedo)
            const color32 = packRGBA(...colorRGBA)

            drawTriZToImage(img32, depth, W, H, p1, p2, p3, color32)
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

        // calculate vertex positions
        for (let i = 0; i <= segments; i++) {
            const theta = i * Math.PI / segments
            for (let j = 0; j <= segments; j++) {
                const phi = j * 2 * Math.PI / segments

                const x = radius * Math.sin(theta) * Math.cos(phi)
                const y = radius * Math.sin(theta) * Math.sin(phi)
                const z = radius * Math.cos(theta)
                this.vertices.push(new Vertex(x, y, z))
            }
        }

        // create sphere triangles
        const pointsPerRow = segments + 1
        for (let i = 0; i < segments; i++) {
            for (let j = 0; j < segments; j++) {
                const a = i * pointsPerRow + j
                const b = a + 1
                const c = a + pointsPerRow
                const d = c + 1
                this.triangles.push([a, b, d])
                this.triangles.push([a, d, c])
            }
        }
    }
}

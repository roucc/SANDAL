import { createViewFPS, createPerspective, drawLine, mat4MulVec, xMat4, yMat4, zMat4, mat4Mul } from "./helpers"
import type { Vec2, Vec3, Vec4, Mat4x4 } from "./helpers"

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
    triangles: [number, number, number][] = []
    rotX = 0; rotY = 0; rotZ = 0

    rotate(x: number, y: number, z: number): void {
        this.rotX += x; this.rotY += y; this.rotZ += z
    }

    projectToScreen(
        worldPos: Vec4 = [0, 0, 0, 1],
        cam: Camera,
        CW: number, CH: number,
    ): Vec2[] {
        const proj: Vec2[] = [] // hold onscreen points

        const T: Mat4x4 = [
            [1, 0, 0, worldPos[0]],
            [0, 1, 0, worldPos[1]],
            [0, 0, 1, worldPos[2]],
            [0, 0, 0, 1],
        ];

        // model->world coordinates
        const M = mat4Mul(T, mat4Mul(zMat4(this.rotZ), mat4Mul(yMat4(this.rotY), xMat4(this.rotX))))
        // world->view coordinates
        const V = createViewFPS(cam)
        // view->clip coordinates
        const P = createPerspective(cam, CW / CH)
        const MVP = mat4Mul(P, mat4Mul(V, M))

        for (let v of this.vertices) {
            let p = mat4MulVec(MVP, [v.x, v.y, v.z, 1])

            // clip->normalized device coordinates
            // perspective divide (x,y,z) / w
            const invW = 1 / p[3]
            const ndcX = p[0] * invW
            const ndcY = p[1] * invW
            // const ncdZ = p[2] * invW

            // NDC->screen coordinates
            // NDC (−1,1) → pixels
            const sx = (ndcX * 0.5 + 0.5) * CW
            const sy = (-ndcY * 0.5 + 0.5) * CH // flip y, top left origin

            proj.push([sx, sy]);
        }
        return proj
    }

    drawWireframe(
        ctx: CanvasRenderingContext2D,
        projection: Vec2[],
        color: string,
    ): void {
        for (const t of this.triangles) {
            const p1 = projection[t[0]]
            const p2 = projection[t[1]]
            const p3 = projection[t[2]]
            drawLine(ctx, p1[0], p1[1], p2[0], p2[1], color)
            drawLine(ctx, p2[0], p2[1], p3[0], p3[1], color)
            drawLine(ctx, p3[0], p3[1], p1[0], p1[1], color)
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
            [0, 1, 2], [0, 2, 3],
            [4, 5, 6], [4, 6, 7],
            [0, 1, 5], [0, 5, 4],
            [3, 2, 6], [3, 6, 7],
            [0, 3, 7], [0, 7, 4],
            [1, 2, 6], [1, 6, 5],
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
                this.triangles.push([a, b, c])
            }
        }
    }
}



import { drawLine, mat3MulVec, pMat, xMat, yMat, zMat } from "./helpers"
import type { Vec2, Vec3 } from "./helpers"

export class Vertex {
    x: number = 0; y: number = 0; z: number = 0
    constructor(x: number, y: number, z: number) {
        this.x = x; this.y = y; this.z = z
    }
}

export class Mesh {
    vertices: Vertex[] = []
    triangles: [number, number, number][] = []
    rotX = 0; rotY = 0; rotZ = 0

    rotate(x: number, y: number, z: number): void {
        this.rotX += x; this.rotY += y; this.rotZ += z
    }

    createProjection(
        worldPos: Vec3 = [0, 0, 0],
    ): Vec2[] {
        const proj: Vec2[] = [] // hold onscreen points

        for (let v of this.vertices) {
            let p: Vec3 = [v.x, v.y, v.z]

            // rotate
            p = mat3MulVec(xMat(this.rotX), p)
            p = mat3MulVec(yMat(this.rotY), p)
            p = mat3MulVec(zMat(this.rotZ), p)

            // translate in world space
            p = [p[0] + worldPos[0], p[1] + worldPos[1], p[2] + worldPos[2]]

            // flatten to view space
            const q = mat3MulVec(pMat, p)
            proj.push([q[0], q[1]])
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
    constructor(radius: 150, segments: 20) {
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



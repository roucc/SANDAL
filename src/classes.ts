import { matMult, pMat, xMat, yMat, zMat } from "./helpers"

export class Vertex {
    x: number = 0
    y: number = 0
    z: number = 0

    constructor(x: number, y: number, z: number) {
        this.x = x
        this.y = y
        this.z = z
    }

}

export class Mesh {
    vertices: Vertex[] = []
    triangles: [number, number, number][] = []

    createProjection(
        CW: number,
        CH: number,
        scale: number,
        angle: number,
        worldPos = { x: 0, y: 0, z: 0 },
        screenPos = { x: CW / 2, y: CH / 2 },
    ): number[][] {
        const proj: number[][] = [] // hold all on screen points

        for (let v of this.vertices) {
            let point = [[v.x], [v.y], [v.z]]
            // rotate
            point = matMult(xMat(angle), point)
            point = matMult(yMat(angle), point)
            point = matMult(zMat(angle), point)

            // translate in world space
            point[0][0] += worldPos.x
            point[1][0] += worldPos.y
            point[2][0] += worldPos.z

            // flatten and map to screen
            const p = matMult(pMat, point)
            let x = p[0][0] * scale + screenPos.x
            let y = p[1][0] * scale + screenPos.y

            proj.push([x, y])
        }
        return proj
    }


    drawTriangles(
        projection: number[][],
        drawLine: (x1: number, y1: number, x2: number, y2: number) => void,
    ): void {
        for (let t of this.triangles) {
            // create triangle points from indices
            const p1 = projection[t[0]]
            const p2 = projection[t[1]]
            const p3 = projection[t[2]]

            drawLine(p1[0], p1[1], p2[0], p2[1])
            drawLine(p2[0], p2[1], p3[0], p3[1])
            drawLine(p3[0], p3[1], p1[0], p1[1])
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

        // create sphere triangles (maths)
        const pointsPerRow = segments + 1
        for (let i = 0; i < segments; i++) {
            for (let j = 0; j < segments; j++) {
                const a = i * pointsPerRow + j
                const b = a + 1
                const c = a + pointsPerRow
                const d = c + 1
                // TODO: find the wiki theory page

                // two triangles per quad
                this.triangles.push([a, b, d])
                this.triangles.push([a, d, c])
            }
        }
    }
}



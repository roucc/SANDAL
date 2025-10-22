import { useRef, useEffect } from 'react'


function App() {
    const cvsRef = useRef<HTMLCanvasElement | null>(null)

    useEffect(() => {
        const cvs = cvsRef.current
        if (!cvs) return

        const ctx = cvs.getContext('2d')
        if (!ctx) return

        cvs.width = window.innerWidth
        cvs.height = window.innerHeight

        const CW = cvs.width
        const CH = cvs.height

        // projection matrix
        const pMat: number[][] = [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1],
        ]

        // rotation matrices:
        const xMat = (a: number): number[][] => [
            [1, 0, 0],
            [0, Math.cos(a), -Math.sin(a)],
            [0, Math.sin(a), Math.cos(a)],
        ]

        const yMat = (a: number): number[][] => [
            [Math.cos(a), 0, Math.sin(a)],
            [0, 1, 0],
            [-Math.sin(a), 0, Math.cos(a)],
        ]

        const zMat = (a: number): number[][] => [
            [Math.cos(a), -Math.sin(a), 0],
            [Math.sin(a), Math.cos(a), 0],
            [0, 0, 1],
        ]

        function matMult(a: number[][], b: number[][]): number[][] {
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

        class Vertex {
            x: number = 0
            y: number = 0
            z: number = 0

            constructor(x: number, y: number, z: number) {
                this.x = x
                this.y = y
                this.z = z
            }

        }

        const drawLine = (x1: number, y1: number, x2: number, y2: number) => {
            ctx.strokeStyle = 'white'
            ctx.beginPath()
            ctx.moveTo(x1, y1)
            ctx.lineTo(x2, y2)
            ctx.stroke()
        }


        // cube around origin
        const Cube: Vertex[] = []
        Cube[0] = new Vertex(-50, -50, -50)
        Cube[1] = new Vertex(50, -50, -50)
        Cube[2] = new Vertex(50, 50, -50)
        Cube[3] = new Vertex(-50, 50, -50)
        Cube[4] = new Vertex(-50, -50, 50)
        Cube[5] = new Vertex(50, -50, 50)
        Cube[6] = new Vertex(50, 50, 50)
        Cube[7] = new Vertex(-50, 50, 50)


        // how the triangles join for the Cube
        const CubeTriangles: [number, number, number][] = [
            // indices for triangles in a cube
            [0, 1, 2], [0, 2, 3],
            [4, 5, 6], [4, 6, 7],
            [0, 1, 5], [0, 5, 4],
            [3, 2, 6], [3, 6, 7],
            [0, 3, 7], [0, 7, 4],
            [1, 2, 6], [1, 6, 5],
        ]

        const Sphere: Vertex[] = []
        const SphereTriangles: [number, number, number][] = []
        const radius = 150
        const segments = 20

        // calculate vertex positions
        for (let i = 0; i <= segments; i++) {
            const theta = i * Math.PI / segments
            for (let j = 0; j <= segments; j++) {
                const phi = j * 2 * Math.PI / segments

                const x = radius * Math.sin(theta) * Math.cos(phi)
                const y = radius * Math.sin(theta) * Math.sin(phi)
                const z = radius * Math.cos(theta)
                Sphere.push(new Vertex(x, y, z))
            }
        }

        // create sphere triangles (maths)
        const pointsPerRow = segments + 1
        for (let i = 0; i < segments; i++) {
            for (let j = 0; j < segments; j++) {
                const a = i * pointsPerRow + j
                const b = a + 1
                const c = a + pointsPerRow
                // const d = c+1 // what is this for lol
                // TODO: find the wiki theory page

                SphereTriangles.push([a, b, c])
            }
        }

        function createProjection(object: Vertex[],
            scale: number,
            angle: number,
            worldPos = { x: 0, y: 0, z: 0 },
            screenPos = { x: CW / 2, y: CH / 2 },
        ): number[][] {
            const proj: number[][] = [] // hold all on screen points

            // loop through vertices of Cube
            for (let v of object) {
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

        function drawTriangles(tri: [number, number, number][], projection: number[][]): void {
            for (let t of tri) {
                // create triangle points from indices
                const p1 = projection[t[0]]
                const p2 = projection[t[1]]
                const p3 = projection[t[2]]

                drawLine(p1[0], p1[1], p2[0], p2[1])
                drawLine(p2[0], p2[1], p3[0], p3[1])
                drawLine(p3[0], p3[1], p1[0], p1[1])
            }
        }

        let angle = 0

        const engine = () => {
            ctx.clearRect(0, 0, CW, CH)
            ctx.fillStyle = 'black'
            ctx.fillRect(0, 0, CW, CH)

            angle += 0.05

            let CubeProjection = createProjection(Cube, 2, angle, { x: -150, y: 0, z: 0 })
            drawTriangles(CubeTriangles, CubeProjection)

            let SphereProjection = createProjection(Sphere, 1, -angle, { x: 150, y: 0, z: 0 })
            drawTriangles(SphereTriangles, SphereProjection)

            requestAnimationFrame(engine)
        }

        engine()
    }, [])

    return (
        <>
            <canvas ref={cvsRef} id="c" />
        </>
    )
}

export default App

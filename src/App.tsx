import { useRef, useEffect } from 'react'
import { Box, Sphere } from "./classes"

function App() {
    const cvsRef = useRef<HTMLCanvasElement | null>(null)

    useEffect(() => {
        const cvs = cvsRef.current
        if (!cvs) return

        const ctx = cvs.getContext('2d')
        if (!ctx) return

        let CW = cvs.width
        let CH = cvs.height

        const resize = () => {
            cvs.width = window.innerWidth
            cvs.height = window.innerHeight
            CW = cvs.width
            CH = cvs.height
        }
        resize()
        window.addEventListener("resize", resize)

        const drawLine = (x1: number, y1: number, x2: number, y2: number): void => {
            ctx.strokeStyle = "white"
            ctx.beginPath()
            ctx.moveTo(x1, y1)
            ctx.lineTo(x2, y2)
            ctx.stroke()
        }

        // setup scene
        const cube = new Box(100, 100, 100)
        const rect = new Box(50, 100, 150)
        const sphere = new Sphere(150, 20)

        const engine = () => {
            ctx.clearRect(0, 0, CW, CH)
            ctx.fillStyle = 'black'
            ctx.fillRect(0, 0, CW, CH)

            // rotate
            cube.rotate(0.01, 0.02, 0.05)
            rect.rotate(0.001, 0.001, 0)
            sphere.rotate(0.03, 0, 0)

            const cubeProj = cube.createProjection(CW, CH, 2, undefined, { x: CW / 4, y: CH / 2 })
            cube.drawTriangles(cubeProj, drawLine)

            const rectProj = rect.createProjection(CW, CH, 2, undefined, { x: CW / 2, y: CH / 2 })
            cube.drawTriangles(rectProj, drawLine)

            const sphereProj = sphere.createProjection(CW, CH, 1, undefined, { x: CW / 4 * 3, y: CH / 2 })
            sphere.drawTriangles(sphereProj, drawLine)

            requestAnimationFrame(engine)
        }
        engine()

        return () => {
            window.removeEventListener("resize", resize)
        }
    }, [])

    return (
        <>
            <canvas ref={cvsRef} id="c" />
        </>
    )
}

export default App

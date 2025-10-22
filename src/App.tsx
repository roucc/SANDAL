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
        let angle = 0

        const engine = () => {
            ctx.clearRect(0, 0, CW, CH)
            ctx.fillStyle = 'black'
            ctx.fillRect(0, 0, CW, CH)

            angle += 0.02

            const cubeProj = cube.createProjection(CW, CH, 2, angle, { x: -150, y: 0, z: 0 })
            cube.drawTriangles(cubeProj, drawLine)

            const rectProj = rect.createProjection(CW, CH, 2, 180 + angle, { x: 0, y: 150, z: 0 })
            cube.drawTriangles(rectProj, drawLine)

            const sphereProj = sphere.createProjection(CW, CH, 1, -angle, { x: 150, y: 0, z: 0 })
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

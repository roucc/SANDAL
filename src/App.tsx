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
            sphere.rotate(0.005, 0, 0)

            const cubeProj = cube.createProjection([CW / 4, CH / 2, 0])
            cube.drawWireframe(ctx, cubeProj, "blue")

            const rectProj = rect.createProjection([CW / 2, CH / 2, 0])
            rect.drawWireframe(ctx, rectProj, "red")

            const sphereProj = sphere.createProjection([3 * CW / 4, CH / 2, 0])
            sphere.drawWireframe(ctx, sphereProj, "green")

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

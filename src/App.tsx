import { useRef, useEffect, useState } from 'react'
import { Box, Sphere, Camera } from "./classes"

function App() {
    const cvsRef = useRef<HTMLCanvasElement | null>(null)
    const [camInfo, setCamInfo] = useState({ x: "0", y: "0", z: "0", yaw: "0", pitch: "0" })

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
        const sphere = new Sphere(150, 30)

        // const cam = new Camera([0, 0, 3000], 0, 0)
        const cameras = [
            new Camera([0, 0, 3000], 0, 0),
            new Camera([0, 0, -3000], 0, Math.PI),
        ]

        let camIndex = 0
        let cam = cameras[camIndex]

        setInterval(() => {
            camIndex = (camIndex + 1) % cameras.length
            cam = cameras[camIndex]
        }, 5000)

        const engine = () => {
            ctx.clearRect(0, 0, CW, CH)
            ctx.fillStyle = 'black'
            ctx.fillRect(0, 0, CW, CH)

            // rotate
            cube.rotate(0.01, 0.02, 0.05)
            rect.rotate(0.001, 0.001, 0)
            sphere.rotate(0.005, 0, 0)

            // TODO: plot furthest first
            const cubeProj = cube.projectToScreen([-300, 0, 0, 1], cam, CW, CH);
            const rectProj = rect.projectToScreen([0, 0, 0, 1], cam, CW, CH);
            const sphereProj = sphere.projectToScreen([300, 0, 0, 1], cam, CW, CH);

            cube.drawWireframe(ctx, cubeProj, "blue")
            rect.drawWireframe(ctx, rectProj, "red")
            sphere.drawWireframe(ctx, sphereProj, "green")

            setCamInfo({
                x: cam.eye[0].toFixed(0),
                y: cam.eye[1].toFixed(0),
                z: cam.eye[2].toFixed(0),
                yaw: cam.yaw.toFixed(2),
                pitch: cam.pitch.toFixed(2),
            })

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
            <div style={{
                position: "fixed",
                top: 10,
                left: 10,
                color: "white",
                background: "rgba(0,0,0,0.5)",
                padding: "6px 10px",
                fontFamily: "monospace",
                fontSize: "14px",
                borderRadius: "4px"
            }}>
                x:{camInfo.x} y:{camInfo.y} z:{camInfo.z}<br />
                yaw:{camInfo.yaw} pitch:{camInfo.pitch}
            </div>
        </>
    )
}

export default App

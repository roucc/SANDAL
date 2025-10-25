import { useRef, useEffect, useState } from 'react'
import { Box, Sphere, Camera } from "./classes"
import { attachKeyboardControls } from './controls'
import { packRGBA } from './helpers'

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

        let depth = new Float32Array(CW * CH)
        let img = ctx.createImageData(CW, CH)
        let img32 = new Uint32Array(img.data.buffer)

        const allocBuffers = () => {
            depth = new Float32Array(CW * CH)
            img = ctx.createImageData(CW, CH)
            img32 = new Uint32Array(img.data.buffer)
        }

        const clearBuffers = () => {
            depth.fill(Infinity)
            img32.fill(0xFF000000)
        }

        const resize = () => {
            cvs.width = window.innerWidth
            cvs.height = window.innerHeight
            CW = cvs.width
            CH = cvs.height
            allocBuffers()
        }
        resize()
        window.addEventListener("resize", resize)

        // setup scene
        const cube = new Box(100, 100, 100)
        const rect = new Box(50, 100, 150)
        const sphere = new Sphere(150, 30)

        const cam = new Camera([0, 0, 750], 0, 0)

        let controller = attachKeyboardControls(cam)
        let last = performance.now()
        const engine = () => {
            clearBuffers()

            const now = performance.now()
            const dt = (now - last) / 1000
            last = now
            controller.update(dt)

            // rotate
            cube.rotate(0.01, 0.02, 0.05)
            rect.rotate(0.001, 0.001, 0)
            sphere.rotate(0.005, 0, 0)

            const cubeProj = cube.projectToScreen([-300, 0, 0, 1], cam, CW, CH)
            const rectProj = rect.projectToScreen([0, 0, 0, 1], cam, CW, CH)
            const sphereProj = sphere.projectToScreen([300, 0, 0, 1], cam, CW, CH)

            const blue = packRGBA(0, 0, 255)
            const red = packRGBA(255, 0, 0)
            const green = packRGBA(0, 255, 0)

            cube.drawSolidZToImage(cubeProj, blue, img32, depth, CW, CH)
            rect.drawSolidZToImage(rectProj, red, img32, depth, CW, CH)
            sphere.drawSolidZToImage(sphereProj, green, img32, depth, CW, CH)

            // draw everything in one call (GPU!)
            ctx.putImageData(img, 0, 0)
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
            controller.dispose()
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

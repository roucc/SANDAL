import { useRef, useEffect, useState } from 'react'
import { Sphere, Camera } from "./classes"
import { attachKeyboardControls } from './controls'
import { createViewFPS, mat4MulVec } from './helpers'
import type { Vec4, Mat4x4, RGBA } from './helpers'
import { GouraudShader } from './shaders'

function App() {
    const cvsRef = useRef<HTMLCanvasElement | null>(null)
    const [camInfo, setCamInfo] = useState({ x: "0", y: "0", z: "0", yaw: "0", pitch: "0" })

    useEffect(() => {
        const cvs = cvsRef.current
        if (!cvs) return

        const ctx = cvs.getContext('2d', {
            alpha: false,
            willReadFrequently: true,
        } as CanvasRenderingContext2DSettings)
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
        const sphere = new Sphere(150, 100)
        const cam = new Camera([0, 0, 750], 0, 0)

        // lighting
        const light: Vec4 = [300, 300, 300, 1]
        const AMBIENT = 0.1
        const ALBEDO = 0.6
        const gouraudShader = new GouraudShader()

        let controller = attachKeyboardControls(cam)
        let last = performance.now()
        const engine = () => {
            clearBuffers()

            const now = performance.now()
            const dt = (now - last) / 1000
            last = now
            controller.update(dt)

            const V: Mat4x4 = createViewFPS(cam)
            const viewLight: Vec4 = mat4MulVec(V, light)

            sphere.projectToScreen([0, 0, 0, 1], cam, CW, CH, viewLight, AMBIENT, ALBEDO)
            const teal: RGBA = [0, 255, 255, 255]
            sphere.drawSolidToImage(teal, img32, depth, CW, CH, gouraudShader)

            // draw everything in one call
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

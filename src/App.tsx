import { useRef, useEffect, useState } from 'react'
import { Box, Sphere, Camera } from "./classes"
import { attachKeyboardControls } from './controls'
import { createViewFPS, mat4MulVec } from './helpers'
import type { Vec4, Mat4x4, RGBA } from './helpers'
import { LambertShader, GouraudShader } from './shaders'

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
        const sphere = new Sphere(150, 50)
        const sphere2 = new Sphere(25, 20)
        const cam = new Camera([0, 0, 750], 0, 0)

        // build normals
        cube.buildVertexNormals()
        rect.buildVertexNormals()
        sphere.buildVertexNormals()
        sphere2.buildVertexNormals()

        // lighting
        const light: Vec4 = [0, 400, 0, 1]
        const AMBIENT = 0.1
        const ALBEDO = 0.4
        const lambertShader = new LambertShader()
        const gouraudShader = new GouraudShader()

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

            cube.projectToScreen([-300, 0, 0, 1], cam, CW, CH)
            rect.projectToScreen([0, 0, 0, 1], cam, CW, CH)
            sphere.projectToScreen([300, 0, 0, 1], cam, CW, CH)
            sphere2.projectToScreen([100, 0, 0, 1], cam, CW, CH)

            const red: RGBA = [255, 0, 0, 255]
            const green: RGBA = [0, 255, 0, 255]
            const blue: RGBA = [0, 0, 255, 255]
            const magenta: RGBA = [255, 0, 255, 255]

            const V: Mat4x4 = createViewFPS(cam)
            const viewLight: Vec4 = mat4MulVec(V, light)

            cube.drawSolidToImage(blue, img32, depth, CW, CH, viewLight, AMBIENT, ALBEDO, gouraudShader)
            rect.drawSolidToImage(red, img32, depth, CW, CH, viewLight, AMBIENT, ALBEDO, gouraudShader)
            // achieve similar results with high poly lambert / small low poly gouraud
            sphere.drawSolidToImage(green, img32, depth, CW, CH, viewLight, AMBIENT, ALBEDO, lambertShader)
            sphere2.drawSolidToImage(magenta, img32, depth, CW, CH, viewLight, AMBIENT, ALBEDO, gouraudShader)

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

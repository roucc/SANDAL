import { useRef, useEffect, useState } from "react"
import { Camera } from "./classes"
import { attachKeyboardControls } from "./controls"
import { Renderer } from "./renderer"
import { loadScene } from "./loader"
import type { SceneDef } from "./loader"
import { loadOBJURL } from "./parse"

const sandal = await loadOBJURL("../models/sandal.obj")

const sceneDef: SceneDef = {
    camera: { eye: [0, 0, 750], yaw: 0, pitch: 0, fov: 60, near: 0.1, far: 10000 },
    light: { type: "point", pos: [300, 300, 300, 1] },
    objects: [
        {
            type: "mesh", mesh: sandal,
            transform: { pos: [250, 0, 0], rot: [0.03, 0, 0], scale: 15 },
            material: { color: [255, 255, 255, 255], shader: "gouraud", ambient: 0.2, albedo: 0.6, rainbow: false }

        },
        {
            type: "sphere", params: { radius: 150, segments: 30 },
            transform: { pos: [250, 0, 0], rot: [0, 0, 0] },
            material: { color: [0, 255, 255, 255], shader: "gouraud", ambient: 0.1, albedo: 0.6 }
        },
        {
            type: "box",
            transform: { pos: [-200, 0, 0], rot: [0.02, 0.02, 0.02] },
            material: { color: [0, 0, 255, 255], shader: "gouraud", ambient: 0.2, albedo: 0.6 }
        },
        {
            type: "sphere", params: { radius: 100, segments: 30 },
            transform: { pos: [-400, 0, 0], rot: [0, 0, 0] },
            material: { color: [255, 0, 200, 255], shader: "lambert", ambient: 0.2, albedo: 0.6 }
        },
        {
            type: "tetra",
            transform: { pos: [500, 0, 0], rot: [0, 0, 0] },
            material: { color: [255, 0, 0, 255], shader: "gouraud", ambient: 0.2, albedo: 0.6 }
        },
    ]
}

function App() {
    const cvsRef = useRef<HTMLCanvasElement | null>(null)
    const [camInfo, setCamInfo] = useState({ x: "0", y: "0", z: "0", yaw: "0", pitch: "0" })

    useEffect(() => {
        const cvs = cvsRef.current
        if (!cvs) return

        const renderer = new Renderer(cvs)
        const scene = loadScene(sceneDef)

        const cam = new Camera(
            scene.camera.eye,
            scene.camera.pitch,
            scene.camera.yaw,
            scene.camera.fov,
            scene.camera.near,
            scene.camera.far
        )

        let controller = attachKeyboardControls(cam)

        let last = performance.now()

        const loop = () => {
            const now = performance.now()
            const dt = (now - last) / 1000
            last = now

            controller.update(dt)
            renderer.drawScene(scene, cam)

            setCamInfo({
                x: cam.eye[0].toFixed(0),
                y: cam.eye[1].toFixed(0),
                z: cam.eye[2].toFixed(0),
                yaw: cam.yaw.toFixed(2),
                pitch: cam.pitch.toFixed(2),
            })

            requestAnimationFrame(loop)
        }
        loop()

        return () => {
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
                x:{camInfo.x} y:{camInfo.y} z:{camInfo.z}
                <br />
                yaw:{camInfo.yaw} pitch:{camInfo.pitch}
            </div>
        </>
    )
}

export default App

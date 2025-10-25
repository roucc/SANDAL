import { createViewFPS } from "./helpers"
import type { Mat4x4 } from "./helpers"
import type { Camera } from "./classes"

export function attachKeyboardControls(cam: Camera) {
    const keys = new Set<string>()

    const moveSpeed = 400 // units/s
    const yawSpeed = 0.9 // rad/s
    const pitchSpeed = 0.9 // rad/s (inverted)
    const pitchLimit = Math.PI / 2 - 1e-3

    const onKeyDown = (e: KeyboardEvent) => {
        const k = e.key.toLowerCase()
        if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault()
        keys.add(k)
    }
    const onKeyUp = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase())

    window.addEventListener("keydown", onKeyDown, { passive: false })
    window.addEventListener("keyup", onKeyUp)

    const wrapYaw = () => {
        if (cam.yaw > Math.PI) cam.yaw -= 2 * Math.PI
        if (cam.yaw < -Math.PI) cam.yaw += 2 * Math.PI
    }

    function update(dt: number) {
        // rotation (ArrowUp/Down inverted)
        if (keys.has("arrowleft")) cam.yaw += yawSpeed * dt
        if (keys.has("arrowright")) cam.yaw -= yawSpeed * dt
        if (keys.has("arrowup")) cam.pitch += pitchSpeed * dt // inverted
        if (keys.has("arrowdown")) cam.pitch -= pitchSpeed * dt // inverted

        if (cam.pitch > pitchLimit) cam.pitch = pitchLimit
        if (cam.pitch < -pitchLimit) cam.pitch = -pitchLimit
        wrapYaw()

        // movement axes from the actual view matrix (keeps signs consistent)
        const V = createViewFPS(cam) as Mat4x4 // world->view
        const rightX = V[0][0], rightZ = V[0][2]         // camera right in world
        const fwdX = -V[2][0], fwdZ = -V[2][2]       // camera forward in world

        // constrain to ground plane (ignore Y)
        let mx = 0, mz = 0
        if (keys.has("w")) { mx += fwdX; mz += fwdZ }
        if (keys.has("s")) { mx -= fwdX; mz -= fwdZ }
        if (keys.has("a")) { mx -= rightX; mz -= rightZ }
        if (keys.has("d")) { mx += rightX; mz += rightZ }

        const len = Math.hypot(mx, mz) || 1; mx /= len; mz /= len
        cam.eye[0] += mx * moveSpeed * dt
        cam.eye[2] += mz * moveSpeed * dt
    }

    function dispose() {
        window.removeEventListener("keydown", onKeyDown)
        window.removeEventListener("keyup", onKeyUp)
        keys.clear()
    }

    return { update, dispose }
}

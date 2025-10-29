import { createViewFPS, mat4MulVec, hslToRgb } from "./helpers"
import type { Vec4 } from "./helpers"
import { Camera } from "./classes"
import type { Scene } from "./scene"
import { GouraudShader, LambertShader } from "./shaders"

let hue = 0

export class Renderer {
    cvs: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    W = 0; H = 0
    depth = new Float32Array(0)
    img!: ImageData
    img32!: Uint32Array

    constructor(cvs: HTMLCanvasElement) {
        this.cvs = cvs
        const ctx = cvs.getContext("2d", { alpha: false, willReadFrequently: true })!
        this.ctx = ctx
        this.resize()
        addEventListener("resize", () => this.resize())
    }

    resize() {
        this.cvs.width = innerWidth
        this.cvs.height = innerHeight
        this.W = this.cvs.width; this.H = this.cvs.height
        this.depth = new Float32Array(this.W * this.H)
        this.img = this.ctx.createImageData(this.W, this.H)
        this.img32 = new Uint32Array(this.img.data.buffer)
    }

    clear() {
        this.depth.fill(Infinity)
        this.img32.fill(0xFF000000)
    }

    drawScene(scene: Scene, cam: Camera) {
        this.clear()

        const V = createViewFPS(cam)
        const lightView: Vec4 = mat4MulVec(V, scene.light.pos)

        for (const e of scene.entities) {
            const pos = e.transform.pos
            e.mesh.rotX += e.transform.rot[0]
            e.mesh.rotY += e.transform.rot[1]
            e.mesh.rotZ += e.transform.rot[2]
            const s = e.transform.scale ?? 1

            // choose shader
            const shader = e.material.shader === "lambert" ? new LambertShader() : new GouraudShader()

            if (e.material.rainbow) {
                hue = (hue + 2) % 360
                const [r, g, b] = hslToRgb(hue / 360, 1, 0.5)
                e.material.color = [r, g, b, 255]
            }

            // project + shade
            e.mesh.projectToScreen([pos[0], pos[1], pos[2], 1], cam, this.W, this.H, lightView,
                e.material.ambient!, e.material.albedo!, s)

            e.mesh.drawSolidToImage(e.material.color, this.img32, this.depth, this.W, this.H, shader)
        }

        this.ctx.putImageData(this.img, 0, 0)
    }
}

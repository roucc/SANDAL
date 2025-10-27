import { packRGBA } from "./helpers"
import type { Color32, RGBA } from "./helpers"

export interface Shader {
    shadePixel?(
        bary: [number, number, number], // barycentric weights
        I: [number, number, number], // intensity
        color: RGBA,
    ): Color32

    shadeFlat?(
        If: number, // intensity (flat)
        color: RGBA,
    ): Color32
}

export class GouraudShader implements Shader {
    shadePixel(bary: [number, number, number], I: [number, number, number], color: RGBA): number {
        // gouraud shader
        const i = bary[0] * I[0] + bary[1] * I[1] + bary[2] * I[2]
        const s = Math.max(0, Math.min(1, i))
        const r = Math.min(255, Math.max(0, color[0] * s)) | 0
        const g = Math.min(255, Math.max(0, color[1] * s)) | 0
        const b = Math.min(255, Math.max(0, color[2] * s)) | 0
        const a = color[3] | 0
        return packRGBA([r, g, b, a])
    }
}

export class LambertShader implements Shader {
    shadeFlat(If: number, color: RGBA): number {
        // uses average of 3 vertex intensities instead of calculating it from centroid
        const s = Math.max(0, Math.min(1, If))
        return packRGBA([
            Math.min(255, color[0] * s) | 0,
            Math.min(255, color[1] * s) | 0,
            Math.min(255, color[2] * s) | 0,
            color[3] | 0
        ])
    }
}

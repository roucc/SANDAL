import { averageVec3, normalVec3, normalize, dot3, packRGBA } from "./helpers"
import type { Vec3, Vec4, Color32, RGBA } from "./helpers"

export interface Shader {
    shadePixel?(
        viewPos: [Vec3, Vec3, Vec3],
        bary: [number, number, number], // barycentric weights
        viewLight: Vec4,
        baseColor: RGBA,
        ambient: number,
        albedo: number
    ): Color32

    shadeFlat?(
        viewPos: Vec3[],
        viewLight: Vec4,
        baseColor: RGBA,
        ambient: number,
        albedo: number
    ): Color32
}


export function lambert(
    viewPos: Vec3[],
    viewLight: Vec4,
    color: RGBA,
    ambient: number, // ambient light
    albedo: number, // surface reflectiveness
): RGBA {
    const centroid = averageVec3(viewPos[0], viewPos[1], viewPos[2])
    const N = normalVec3(viewPos[0], viewPos[1], viewPos[2])
    const L: Vec3 = [
        viewLight[0] - centroid[0],
        viewLight[1] - centroid[1],
        viewLight[2] - centroid[2],
    ]

    // normalize to get dot [0,1]
    const Nn = normalize(N)
    const Ln = normalize(L)
    const dot = Math.max(0, dot3(Nn, Ln))

    return [
        color[0] * (ambient + albedo * dot),
        color[1] * (ambient + albedo * dot),
        color[2] * (ambient + albedo * dot),
        color[3]
    ]
}

export class LambertShader implements Shader {
    shadeFlat(viewPos: Vec3[], viewLight: Vec4, color: RGBA, ambient: number, albedo: number): number {
        const c = lambert(viewPos, viewLight, color, ambient, albedo)
        return packRGBA(c)
    }
}

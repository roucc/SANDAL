import { averageVec3, normalVec3, normalize, dot3, packRGBA } from "./helpers"
import type { Vec3, Vec4, Color32, RGBA } from "./helpers"

export interface Shader {
    shadePixel?(
        viewPos: [Vec3, Vec3, Vec3],
        bary: [number, number, number], // barycentric weights
        viewLight: Vec4,
        baseColor: RGBA,
        ambient: number,
        albedo: number,
        viewNorms: [Vec3, Vec3, Vec3],
    ): Color32

    shadeFlat?(
        viewPos: Vec3[],
        viewLight: Vec4,
        baseColor: RGBA,
        ambient: number,
        albedo: number
    ): Color32
}

export class GouraudShader implements Shader {
    shadePixel(viewPos: Vec3[], bary: [number, number, number], viewLight: Vec4, color: RGBA, ambient: number, albedo: number, viewNorms: Vec3[]): number {
        const c = gouraud(viewPos, bary, viewLight, color, ambient, albedo, viewNorms)
        return packRGBA(c)
    }
}

function gouraud(
    viewPos: Vec3[],
    bary: [number, number, number],
    viewLight: Vec4,
    color: RGBA,
    ambient: number,
    albedo: number,
    viewNorms: Vec3[],
): RGBA {
    // calculate each each vertex diffuse
    const L0 = normalize([
        -viewLight[0] + viewPos[0][0],
        -viewLight[1] + viewPos[0][1],
        -viewLight[2] + viewPos[0][2],
    ])
    const D0 = Math.max(0, dot3(viewNorms[0], L0));

    const L1 = normalize([
        -viewLight[0] + viewPos[1][0],
        -viewLight[1] + viewPos[1][1],
        -viewLight[2] + viewPos[1][2],
    ])
    const D1 = Math.max(0, dot3(viewNorms[1], L1));

    const L2 = normalize([
        -viewLight[0] + viewPos[2][0],
        -viewLight[1] + viewPos[2][1],
        -viewLight[2] + viewPos[2][2],
    ])
    const D2 = Math.max(0, dot3(viewNorms[2], L2));


    // apply weighting to each diffuse
    const d = bary[0] * D0 + bary[1] * D1 + bary[2] * D2

    const I = Math.min(1, Math.max(0, ambient + albedo * d))

    return [
        color[0] * I,
        color[1] * I,
        color[2] * I,
        color[3],
    ]
}

export class LambertShader implements Shader {
    shadeFlat(viewPos: Vec3[], viewLight: Vec4, color: RGBA, ambient: number, albedo: number): number {
        const c = lambert(viewPos, viewLight, color, ambient, albedo)
        return packRGBA(c)
    }
}

function lambert(
    viewPos: Vec3[],
    viewLight: Vec4,
    color: RGBA,
    ambient: number,
    albedo: number,
): RGBA {
    const centroid = averageVec3(viewPos[0], viewPos[1], viewPos[2])
    const N = normalize(normalVec3(viewPos[0], viewPos[1], viewPos[2]))
    const L: Vec3 = normalize([
        viewLight[0] - centroid[0],
        viewLight[1] - centroid[1],
        viewLight[2] - centroid[2],
    ])

    // diffuse between [0,1]
    const d = Math.max(0, dot3(N, L))

    // intensity
    const I = Math.min(1, Math.max(0, ambient + albedo * d))

    return [
        color[0] * I,
        color[1] * I,
        color[2] * I,
        color[3]
    ]
}

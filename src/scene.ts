import type { Vec4, Vec3, RGBA } from "./helpers"
import type { Mesh } from "./classes"

export type Transform = {
    pos: Vec3,
    rot: Vec3, // radians
}

export type Material = {
    color: RGBA,
    shader: "gouraud" | "lambert",
    ambient?: number,
    albedo?: number,
}

export type Light = {
    type: "point",
    pos: Vec4, // [x,y,z,1]
}

export type Entity = {
    id: string,
    mesh: Mesh,
    transform: Transform,
    material: Material,
}

export type Scene = {
    camera: {
        eye: Vec3,
        yaw: number,
        pitch: number,
        fov?: number,
        near?: number,
        far?: number,
    },
    light: Light,
    entities: Entity[],
}

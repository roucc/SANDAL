import { Sphere, Box, Tetrahedron } from "./classes"
import type { Scene, Entity, Transform, Material } from "./scene"

export type SceneDef = {
    camera: Scene["camera"],
    light: Scene["light"],
    objects: Array<{
        id?: string,
        type: "sphere" | "box" | "tetra",
        params?: any,
        transform?: Partial<Transform>,
        material?: Partial<Material>,
    }>
}

export function loadScene(def: SceneDef): Scene {
    const entities: Entity[] = def.objects.map((o, i) => {
        const mesh =
            o.type === "sphere" ? new Sphere(o.params?.radius ?? 150, o.params?.segments ?? 24)
                : o.type === "box" ? new Box(o.params?.w ?? 100, o.params?.h ?? 100, o.params?.d ?? 100)
                    : new Tetrahedron(o.params?.size ?? 120)

        const transform: Transform = {
            pos: o.transform?.pos ?? [0, 0, 0],
            rot: o.transform?.rot ?? [0, 0, 0],
        }

        const material: Material = {
            color: o.material?.color ?? [0, 255, 255, 255],
            shader: o.material?.shader ?? "gouraud",
            ambient: o.material?.ambient ?? 0.1,
            albedo: o.material?.albedo ?? 0.6,
        }

        return { id: o.id ?? `e${i}`, mesh, transform, material }
    })

    return {
        camera: def.camera,
        light: def.light,
        entities,
    }
}

import { Mesh, Vertex } from "./classes"

export async function loadOBJURL(url: string): Promise<Mesh> {
    const res = await fetch(url)
    const text = await res.text()
    return parseOBJToMesh(text)
}

// only parses vs vns and fs
export function parseOBJToMesh(text: string): Mesh {
    const mesh = new Mesh()

    const pos: [number, number, number][] = []
    const vns: [number, number, number][] = []
    const tri: [number, number, number][] = []
    const accNorms: [number, number, number][] = []

    const add = (a: [number, number, number], b: [number, number, number]) => {
        a[0] += b[0]; a[1] += b[1]; a[2] += b[2]
    }
    const normalize = (v: [number, number, number]) => {
        const l = Math.hypot(v[0], v[1], v[2]) || 1
        v[0] /= l; v[1] /= l; v[2] /= l
    }
    const toIndex = (s: string, len: number) => {
        const i = parseInt(s, 10)
        return (i > 0 ? i - 1 : len + i)
    }

    for (const raw of text.split('\n')) {
        const line = raw.trim()
        if (!line || line.startsWith('#')) continue

        const parts = line.split(/\s+/)
        const tag = parts[0]

        if (tag === 'v') {
            const x = parseFloat(parts[1]), y = parseFloat(parts[2]), z = parseFloat(parts[3])
            pos.push([x, y, z])
            accNorms.push([0, 0, 0])
        } else if (tag === 'vn') {
            const x = parseFloat(parts[1]), y = parseFloat(parts[2]), z = parseFloat(parts[3])
            vns.push([x, y, z])
        } else if (tag === 'f') {
            const verts = parts.slice(1).map(tok => {
                const [vStr, , vnStr] = tok.split('/')
                return {
                    v: toIndex(vStr, pos.length),
                    vn: vnStr ? toIndex(vnStr, vns.length) : undefined,
                }
            })

            for (let i = 1; i < verts.length - 1; i++) {
                const a = verts[0], b = verts[i], c = verts[i + 1]
                tri.push([a.v, c.v, b.v])
                if (a.vn !== undefined && b.vn !== undefined && c.vn !== undefined) {
                    add(accNorms[a.v], vns[a.vn])
                    add(accNorms[b.v], vns[b.vn])
                    add(accNorms[c.v], vns[c.vn])
                }
            }
        }
        // ignore vt, s, and others
    }

    mesh.vertices = pos.map(p => new Vertex(p[0], p[1], p[2]))
    mesh.triangles = tri

    const hasVN = accNorms.some(n => n[0] !== 0 || n[1] !== 0 || n[2] !== 0)
    if (hasVN) {
        mesh.normals = accNorms.map(n => {
            const m: [number, number, number] = [-n[0], -n[1], -n[2]]
            normalize(m)
            return m
        })
    } else {
        mesh.buildVertexNormals()
    }

    return mesh
}

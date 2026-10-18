/**
 * Helpers that build "ghost" boxes: a see-through fill plus a bright edge outline.
 * Uses a unit cube mesh (1 x 1 x 1 cm), so scale equals size.
 */

export interface GhostMaterials {
  mesh: RenderMesh
  fill: Material
  outline: Material
}

function addMeshVisual(obj: SceneObject, mesh: RenderMesh, material: Material): RenderMeshVisual {
  const rmv = obj.createComponent("Component.RenderMeshVisual") as RenderMeshVisual
  rmv.mesh = mesh
  rmv.mainMaterial = material
  return rmv
}

/** Adds the 12 edges of a box of `size` centred on `center` (local to parent). */
export function addBoxEdges(
  parent: SceneObject,
  center: vec3,
  size: vec3,
  thickness: number,
  mesh: RenderMesh,
  material: Material,
): SceneObject[] {
  const edges: SceneObject[] = []
  const hx = size.x / 2
  const hy = size.y / 2
  const hz = size.z / 2
  const t = thickness
  const signs = [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ]
  for (const [a, b] of signs) {
    // Edges running along X, Y and Z.
    const specs: [vec3, vec3][] = [
      [new vec3(0, a * hy, b * hz), new vec3(size.x + t, t, t)],
      [new vec3(a * hx, 0, b * hz), new vec3(t, size.y + t, t)],
      [new vec3(a * hx, b * hy, 0), new vec3(t, t, size.z + t)],
    ]
    for (const [offset, edgeSize] of specs) {
      const edge = global.scene.createSceneObject("Edge")
      edge.setParent(parent)
      edge.getTransform().setLocalPosition(center.add(offset))
      edge.getTransform().setLocalScale(edgeSize)
      addMeshVisual(edge, mesh, material)
      edges.push(edge)
    }
  }
  return edges
}

/** Creates a ghost box (fill + outline) as a child of `parent`. */
export function createGhostBox(
  parent: SceneObject,
  name: string,
  center: vec3,
  size: vec3,
  mats: GhostMaterials,
  edgeThickness: number = 0.4,
): SceneObject {
  const box = global.scene.createSceneObject(name)
  box.setParent(parent)
  box.getTransform().setLocalPosition(center)

  const fill = global.scene.createSceneObject(name + " Fill")
  fill.setParent(box)
  fill.getTransform().setLocalScale(size)
  addMeshVisual(fill, mats.mesh, mats.fill)

  addBoxEdges(box, vec3.zero(), size, edgeThickness, mats.mesh, mats.outline)
  return box
}

export function cloneWithColor(material: Material, color: vec4): Material {
  const clone = material.clone()
  clone.mainPass.baseColor = color
  return clone
}

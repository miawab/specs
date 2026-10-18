/**
 * Preview-only stand-in for the user's real room.
 *
 * The room's boxes are exact-size (desk 120 x 61 x 75 cm, shelf 40.3 cm above the desk and
 * 28 cm deep, ...) and double as the collision model the monitors use. In Lens Studio's preview
 * they are drawn as a realistic room (wood, paint, a keyboard and a lamp for scale). On a real
 * device the real room is right there, so every visual here is switched off and the Lens only
 * draws the ghost monitors, the menu and the fit cues.
 */
@component
export class PreviewRoom extends BaseScriptComponent {
  @ui.label("Preview-only room (hidden on device)")
  @ui.separator
  @input
  @hint("Unit cube mesh (1 x 1 x 1 cm)")
  boxMesh: RenderMesh

  @input
  @hint("Unit cylinder mesh (1 cm across, 1 cm tall)")
  cylinderMesh: RenderMesh

  @input
  @hint("Unit cone mesh (1 cm across, 1 cm tall, apex up)")
  coneMesh: RenderMesh

  @input
  @hint("Desk top wood")
  deskWood: Material

  @input
  @hint("Dark wood for the shelf")
  shelfWood: Material

  @input
  @hint("Floor wood")
  floorWood: Material

  @input
  @hint("Second table wood")
  tableWood: Material

  @input
  @hint("Light wall paint (also tinted white for the keyboard)")
  wallPaint: Material

  @input
  @hint("Dark metal for desk and table legs")
  legMetal: Material

  /** True when the room is drawn (Lens Studio preview), false on a device. */
  visible = false

  onAwake(): void {
    this.visible = global.deviceInfoSystem.isEditor()
    if (!this.visible) {
      // On a device: keep the boxes (they are the collision model) but draw none of them.
      this.forEachVisual(this.sceneObject, (rmv) => (rmv.enabled = false))
      return
    }
    this.dressRoom()
    this.addKeyboard()
    this.addLamp()
  }

  private forEachVisual(o: SceneObject, fn: (rmv: RenderMeshVisual) => void): void {
    const rmv = o.getComponent("Component.RenderMeshVisual") as RenderMeshVisual
    if (rmv) fn(rmv)
    for (let i = 0; i < o.getChildrenCount(); i++) this.forEachVisual(o.getChild(i), fn)
  }

  private textured(source: Material, uvScale: number): Material {
    const m = source.clone()
    m.mainPass.uvScale = uvScale
    return m
  }

  /** Real materials on the exact-size boxes. uvScale keeps the grain at a believable size. */
  private dressRoom(): void {
    const looks: {[name: string]: Material} = {
      "Floor": this.textured(this.floorWood, 6),
      "Wall": this.wallPaint,
      "Desk Top": this.textured(this.deskWood, 1.5),
      "Desk Leg": this.legMetal,
      "Shelf": this.textured(this.shelfWood, 2),
      "Table Top": this.textured(this.tableWood, 1.5),
      "Table Leg": this.legMetal,
    }
    this.forEachVisual(this.sceneObject, (rmv) => {
      const name = rmv.getSceneObject().name
      // Every wall and the ceiling share the light paint.
      const look = looks[name] ?? (name.indexOf("Wall") === 0 || name === "Ceiling" ? this.wallPaint : null)
      if (look) rmv.mainMaterial = look
    })
  }

  private find(name: string): SceneObject | null {
    const search = (o: SceneObject): SceneObject | null => {
      if (o.name === name) return o
      for (let i = 0; i < o.getChildrenCount(); i++) {
        const f = search(o.getChild(i))
        if (f) return f
      }
      return null
    }
    return search(this.sceneObject)
  }

  /** A white compact (65%) keyboard, about 32 x 11 cm, on the front-left of the desk. */
  private addKeyboard(): void {
    const deskTop = this.find("Desk Top")
    if (!deskTop) return
    const t = deskTop.getTransform()
    const top = t.getWorldPosition().y + t.getWorldScale().y / 2
    const front = t.getWorldPosition().z + t.getWorldScale().z / 2

    const caseMat = this.wallPaint.clone()
    caseMat.mainPass.baseColor = new vec4(0.9, 0.9, 0.88, 1)
    const keyMat = this.wallPaint.clone()
    keyMat.mainPass.baseColor = new vec4(0.97, 0.97, 0.96, 1)

    const kb = global.scene.createSceneObject("Keyboard")
    kb.setParent(this.sceneObject)
    kb.getTransform().setWorldPosition(new vec3(-38, top, front - 8))

    const box = (name: string, pos: vec3, size: vec3, mat: Material) => {
      const o = global.scene.createSceneObject(name)
      o.setParent(kb)
      o.getTransform().setLocalPosition(pos)
      o.getTransform().setLocalScale(size)
      const rmv = o.createComponent("Component.RenderMeshVisual") as RenderMeshVisual
      rmv.mesh = this.boxMesh
      rmv.mainMaterial = mat
    }

    box("Keyboard Case", new vec3(0, 1.1, 0), new vec3(31.5, 2.2, 11), caseMat)
    const pitch = 1.9
    const rows = 5
    const cols = 15
    for (let r = 0; r < rows; r++) {
      const z = -((rows - 1) / 2) * pitch + r * pitch
      if (r === rows - 1) {
        // Bottom row: modifiers either side of a long space bar.
        box("Space", new vec3(0, 2.75, z), new vec3(11.5, 1.1, 1.6), keyMat)
        for (const x of [-12.4, -10.5, -8.6, 8.6, 10.5, 12.4]) box("Key", new vec3(x, 2.75, z), new vec3(1.6, 1.1, 1.6), keyMat)
        continue
      }
      for (let c = 0; c < cols; c++) {
        const x = -((cols - 1) / 2) * pitch + c * pitch
        box("Key", new vec3(x, 2.75, z), new vec3(1.6, 1.1, 1.6), keyMat)
      }
    }
  }

  /**
   * A simple, neutral desk lamp (about 34 cm tall, so it sits under the 40.3 cm shelf) at the
   * back-left of the desk, inside the seated view and clear of where monitors go.
   */
  private addLamp(): void {
    const deskTop = this.find("Desk Top")
    if (!deskTop) return
    const t = deskTop.getTransform()
    const top = t.getWorldPosition().y + t.getWorldScale().y / 2
    const back = t.getWorldPosition().z - t.getWorldScale().z / 2

    const white = this.wallPaint.clone()
    white.mainPass.baseColor = new vec4(0.95, 0.95, 0.93, 1)
    const metal = this.legMetal.clone()
    metal.mainPass.baseColor = new vec4(0.7, 0.71, 0.72, 1)

    const lamp = global.scene.createSceneObject("Desk Lamp")
    lamp.setParent(this.sceneObject)
    lamp.getTransform().setWorldPosition(new vec3(-36, top, back + 10))
    lamp.getTransform().setWorldRotation(quat.fromEulerAngles(0, (25 * Math.PI) / 180, 0))

    const part = (name: string, mesh: RenderMesh, mat: Material, pos: vec3, size: vec3, tiltDeg: number = 0) => {
      const o = global.scene.createSceneObject(name)
      o.setParent(lamp)
      o.getTransform().setLocalPosition(pos)
      o.getTransform().setLocalRotation(quat.fromEulerAngles((tiltDeg * Math.PI) / 180, 0, 0))
      o.getTransform().setLocalScale(size)
      const rmv = o.createComponent("Component.RenderMeshVisual") as RenderMeshVisual
      rmv.mesh = mesh
      rmv.mainMaterial = mat
    }
    // Round base, upright pole, an arm leaning toward the user, and a cone shade open at the bottom.
    part("Lamp Base", this.cylinderMesh, white, new vec3(0, 0.8, 0), new vec3(14, 1.6, 14))
    part("Lamp Pole", this.cylinderMesh, metal, new vec3(0, 13, 0), new vec3(1.2, 23, 1.2))
    part("Lamp Arm", this.cylinderMesh, metal, new vec3(0, 27.5, 5), new vec3(1.0, 12, 1.0), 55)
    part("Lamp Shade", this.coneMesh, white, new vec3(0, 28.5, 10.5), new vec3(11, 10, 11))
  }
}

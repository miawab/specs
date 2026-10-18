import {Interactable} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable"
import {InteractorEvent} from "SpectaclesInteractionKit.lspkg/Core/Interactor/InteractorEvent"
import {TargetingMode} from "SpectaclesInteractionKit.lspkg/Core/Interactor/Interactor"
import {COLORS, MonitorSpec} from "./FitConfig"
import {GhostMaterials, addBoxEdges, cloneWithColor} from "./GhostBox"
import {Box3, RoomModel} from "./RoomModel"
import {createLabel} from "./Label"

const GRAVITY = 980 // cm/s^2
const SKIN = 0.05 // cm gap kept when stopped against an obstacle
const MAX_DRAG_DISTANCE = 600 // cm, guards against grazing-angle rays
const MAX_STEP = 2 // cm per collision sub-step

export type BlockInfo = {obstacle: Box3; x: number; z: number}

/** Callbacks the monitor uses to talk to its owner (the MonitorManager). */
export interface MonitorHost {
  room: RoomModel
  onMonitorPressed(monitor: Monitor): void
  onShelfBlocked(monitor: Monitor, overBy: number, x: number): void
  onSlidUnderShelf(monitor: Monitor, spare: number, x: number): void
  onHeightBlocked(monitor: Monitor, x: number): void
}

/**
 * A real-size ghost monitor. The scene object sits at the centre of the monitor's bounding box
 * (collider and Interactable on the same object); `position` is the centre of the footprint at
 * the bottom of the stand, so its Y is the height of the surface it stands on.
 */
@component
export class Monitor extends BaseScriptComponent {
  spec: MonitorSpec
  displayName = ""
  height = 0

  private host: MonitorHost
  private mats: GhostMaterials
  private outlineMat: Material
  private screenMat: Material
  private visualRoot: SceneObject
  private label: Text
  private collider: ColliderComponent
  private interactable: Interactable

  /** Z of the panel's front face, relative to the footprint centre. */
  private panelFrontOffset = 0
  private hovered = false
  private selected = false
  private dragging = false
  private dragStartPos = vec3.zero()
  private dragAnchor: vec3 | null = null
  private dragPlaneY = 0
  private wasUnderShelf = false

  private falling = false
  private fallSpeed = 0
  private fallTarget = 0

  /** Count of frames the latest drag was stopped by the shelf (for tests). */
  shelfBlockCount = 0
  lastDropFrom = 0

  onAwake(): void {
    this.createEvent("UpdateEvent").bind(() => this.update())
  }

  init(spec: MonitorSpec, displayName: string, host: MonitorHost, mats: GhostMaterials): void {
    this.spec = spec
    this.displayName = displayName
    this.sceneObject.name = displayName
    this.host = host
    this.mats = mats
    this.height = spec.startHeight
    this.outlineMat = cloneWithColor(mats.outline, COLORS.outline)
    this.screenMat = cloneWithColor(mats.fill, COLORS.screenTint)

    // Collider first: SIK picks up colliders when the Interactable registers.
    const base = this.sceneObject.getTransform().getWorldPosition()
    this.collider = this.sceneObject.createComponent("Physics.ColliderComponent") as ColliderComponent
    this.collider.shape = Shape.createBoxShape()

    this.interactable = this.sceneObject.createComponent(Interactable.getTypeName()) as Interactable
    this.interactable.targetingMode = TargetingMode.All
    this.interactable.enableInstantDrag = false

    this.label = createLabel(this.sceneObject, displayName + " Label", 70, COLORS.text)

    this.rebuildVisual()
    this.position = base

    this.createEvent("OnStartEvent").bind(() => this.bindInteraction())
  }

  private bindInteraction(): void {
    this.interactable.onHoverEnter.add(() => {
      this.hovered = true
      this.refreshOutline()
    })
    this.interactable.onHoverExit.add(() => {
      this.hovered = false
      this.refreshOutline()
    })
    this.interactable.onTriggerStart.add((e: InteractorEvent) => {
      this.host.onMonitorPressed(this)
      this.beginDrag(e)
    })
    this.interactable.onDragUpdate.add((e: InteractorEvent) => this.updateDrag(e))
    this.interactable.onTriggerUpdate.add((e: InteractorEvent) => {
      if (this.dragging) this.updateDrag(e)
    })
    this.interactable.onTriggerEnd.add(() => this.endDrag())
    this.interactable.onTriggerEndOutside.add(() => this.endDrag())
    this.interactable.onTriggerCanceled.add(() => this.endDrag())
  }

  // ---------------------------------------------------------------- visuals

  get isAdjustable(): boolean {
    return this.spec.stand === "adjustable"
  }

  setSelected(selected: boolean): void {
    this.selected = selected
    this.refreshOutline()
  }

  private refreshOutline(): void {
    let color = COLORS.outline
    if (this.selected) color = COLORS.outlineSelected
    if (this.hovered) color = COLORS.outlineHover
    this.outlineMat.mainPass.baseColor = color
  }

  private rebuildVisual(): void {
    if (this.visualRoot) this.visualRoot.destroy()
    this.visualRoot = global.scene.createSceneObject(this.displayName + " Ghost")
    this.visualRoot.setParent(this.sceneObject)
    // Visuals are built from the base; the object itself sits at the box centre.
    this.visualRoot.getTransform().setLocalPosition(new vec3(0, -this.height / 2, 0))

    const s = this.spec
    const w = s.width
    const d = s.depth
    const h = this.height
    const ph = s.panelHeight
    const panelThickness = 4.5
    const baseH = 1.6
    const baseW = Math.min(26, w * 0.42)
    const neckW = 7
    const neckD = 3
    const neckZ = -d / 2 + 4
    const panelZ = neckZ + neckD / 2 + panelThickness / 2
    this.panelFrontOffset = panelZ + panelThickness / 2

    const mats: GhostMaterials = {mesh: this.mats.mesh, fill: this.mats.fill, outline: this.outlineMat}
    // Stand base: uses the full footprint depth.
    this.addPart("Base", new vec3(0, baseH / 2, 0), new vec3(baseW, baseH, d), mats)
    // Neck: from the base up to the middle of the panel.
    const neckTop = h - ph / 2
    this.addPart("Neck", new vec3(0, (baseH + neckTop) / 2, neckZ), new vec3(neckW, neckTop - baseH, neckD), mats)
    // Panel.
    this.addPart("Panel", new vec3(0, h - ph / 2, panelZ), new vec3(w, ph, panelThickness), mats)
    // Screen: a faint light-blue tint inside the bezel so it reads as a screen, plus its outline.
    const screenCenter = new vec3(0, h - ph / 2 + 1.0, panelZ + panelThickness / 2 + 0.05)
    const screenSize = new vec3(w - 2.4, ph - 4.0, 0)
    const screen = global.scene.createSceneObject("Screen")
    screen.setParent(this.visualRoot)
    screen.getTransform().setLocalPosition(screenCenter)
    screen.getTransform().setLocalScale(new vec3(screenSize.x, screenSize.y, 0.1))
    const screenRmv = screen.createComponent("Component.RenderMeshVisual") as RenderMeshVisual
    screenRmv.mesh = mats.mesh
    screenRmv.mainMaterial = this.screenMat
    addBoxEdges(this.visualRoot, screenCenter, screenSize, 0.25, mats.mesh, this.outlineMat)

    // Collider covers the whole monitor.
    const hitShape = this.collider.shape as BoxShape
    hitShape.size = new vec3(w, h, d)
    this.collider.shape = hitShape

    // Name tag on the desk in front of the stand, like a price tag: it never collides with the
    // shelf cue above the panel. (The label hangs off the object, which sits at the box centre.)
    this.label.text = this.displayName + "  " + s.id + "  " + h.toFixed(1) + " cm"
    this.label.getSceneObject().getTransform().setLocalPosition(new vec3(0, -h / 2 + 2.2, d / 2 + 1.5))
  }

  private addPart(name: string, center: vec3, size: vec3, mats: GhostMaterials): void {
    const part = global.scene.createSceneObject(name)
    part.setParent(this.visualRoot)
    part.getTransform().setLocalPosition(center)
    const fill = global.scene.createSceneObject(name + " Fill")
    fill.setParent(part)
    fill.getTransform().setLocalScale(size)
    const rmv = fill.createComponent("Component.RenderMeshVisual") as RenderMeshVisual
    rmv.mesh = mats.mesh
    rmv.mainMaterial = mats.fill
    addBoxEdges(part, vec3.zero(), size, 0.45, mats.mesh, mats.outline)
  }

  /** Name tag on the desk; hidden while a fit cue shows so it never overlaps the cue. */
  get tagVisible(): boolean {
    return this.label.getSceneObject().enabled
  }

  set tagVisible(visible: boolean) {
    const o = this.label.getSceneObject()
    if (o.enabled !== visible) o.enabled = visible
  }

  // ---------------------------------------------------------------- geometry

  /** World point at the top of the panel, on its front face. */
  get panelTopFront(): vec3 {
    const p = this.position
    return new vec3(p.x, p.y + this.height, p.z + this.panelFrontOffset)
  }

  get position(): vec3 {
    return this.sceneObject.getTransform().getWorldPosition().sub(new vec3(0, this.height / 2, 0))
  }

  set position(p: vec3) {
    this.sceneObject.getTransform().setWorldPosition(p.add(new vec3(0, this.height / 2, 0)))
  }

  boxAt(p: vec3, height: number = this.height): Box3 {
    const hw = this.spec.width / 2
    const hd = this.spec.depth / 2
    return new Box3(this.displayName, new vec3(p.x - hw, p.y, p.z - hd), new vec3(p.x + hw, p.y + height, p.z + hd))
  }

  get box(): Box3 {
    return this.boxAt(this.position)
  }

  private static overlaps(a: Box3, b: Box3): boolean {
    const eps = 0.01
    return (
      a.min.x < b.max.x - eps &&
      a.max.x > b.min.x + eps &&
      a.min.y < b.max.y - eps &&
      a.max.y > b.min.y + eps &&
      a.min.z < b.max.z - eps &&
      a.max.z > b.min.z + eps
    )
  }

  /** Room pieces only: monitors are ghosts and pass through each other. */
  private obstacles(): Box3[] {
    return this.host.room.obstacles
  }

  /** True when the back of the monitor is under the shelf's footprint. */
  isUnderShelf(p: vec3 = this.position): boolean {
    const shelf = this.host.room.shelf
    if (!shelf) return false
    const b = this.boxAt(p)
    return b.min.z < shelf.max.z - SKIN && b.max.x > shelf.min.x && b.min.x < shelf.max.x && p.y < shelf.min.y
  }

  /**
   * Moves toward `target` (same Y), sliding along obstacles one axis at a time.
   * Returns which obstacle stopped the Z motion, if any.
   */
  slideTo(target: vec3): BlockInfo | null {
    // Step at most MAX_STEP from where the monitor actually is, so a fast move can't jump over
    // a thin obstacle like the shelf. An axis that gets blocked stays blocked for this move.
    let goalX = target.x
    let goalZ = target.z
    let zBlock: BlockInfo | null = null
    for (let i = 0; i < 400; i++) {
      const pos = this.position
      const remaining = new vec3(goalX - pos.x, 0, goalZ - pos.z)
      const len = remaining.length
      if (len < 0.001) break
      const step = len > MAX_STEP ? remaining.uniformScale(MAX_STEP / len) : remaining
      const want = pos.add(step)
      const block = this.slideStep(want)
      const got = this.position
      if (block) zBlock = block
      if (Math.abs(got.x - want.x) > 0.001) goalX = got.x
      if (Math.abs(got.z - want.z) > 0.001) goalZ = got.z
    }
    this.afterMove(zBlock)
    return zBlock
  }

  private slideStep(target: vec3): BlockInfo | null {
    const start = this.position
    let p = start
    let zBlock: BlockInfo | null = null
    const obstacles = this.obstacles()

    // X axis
    let nx = target.x
    for (const o of obstacles) {
      if (Monitor.overlaps(this.boxAt(start), o)) continue // already inside, don't trap it
      const b = this.boxAt(new vec3(nx, p.y, p.z))
      if (!Monitor.overlaps(b, o)) continue
      nx = nx > p.x ? o.min.x - this.spec.width / 2 - SKIN : o.max.x + this.spec.width / 2 + SKIN
    }
    p = new vec3(nx, p.y, p.z)

    // Z axis
    let nz = target.z
    for (const o of obstacles) {
      if (Monitor.overlaps(this.boxAt(start), o)) continue
      const b = this.boxAt(new vec3(p.x, p.y, nz))
      if (!Monitor.overlaps(b, o)) continue
      nz = nz < p.z ? o.max.z + this.spec.depth / 2 + SKIN : o.min.z - this.spec.depth / 2 - SKIN
      zBlock = {obstacle: o, x: p.x, z: nz}
    }
    p = new vec3(p.x, p.y, nz)

    this.position = p
    return zBlock
  }

  private afterMove(zBlock: BlockInfo | null): void {
    const room = this.host.room
    const shelf = room.shelf
    if (zBlock && shelf && zBlock.obstacle === shelf) {
      this.shelfBlockCount++
      const over = this.height - room.shelfClearance(this.position.y)
      this.host.onShelfBlocked(this, over, this.position.x)
    }
    const under = this.isUnderShelf()
    if (under && !this.wasUnderShelf) {
      const spare = room.shelfClearance(this.position.y) - this.height
      if (spare >= 0) this.host.onSlidUnderShelf(this, spare, this.position.x)
    }
    this.wasUnderShelf = under
  }

  // ---------------------------------------------------------------- stand height

  /** Sets the stand height (clamped to the stand's range and to the shelf above). Returns the applied height. */
  setHeight(requested: number): number {
    let h = Math.max(this.spec.minHeight, Math.min(this.spec.maxHeight, requested))
    if (this.isUnderShelf()) {
      const clearance = this.host.room.shelfClearance(this.position.y)
      if (h > clearance) {
        h = Math.max(this.spec.minHeight, clearance - SKIN)
        this.host.onHeightBlocked(this, this.position.x)
      }
    }
    if (Math.abs(h - this.height) > 0.001) {
      const base = this.position
      this.height = h
      this.rebuildVisual()
      this.position = base
    }
    return this.height
  }

  // ---------------------------------------------------------------- drag

  private rayPoint(e: InteractorEvent, planeY: number): vec3 | null {
    const it = e.interactor
    if (!it) return null
    const mode = it.activeTargetingMode
    const origin = it.startPoint
    if (!origin) return null
    if (mode === TargetingMode.Direct || mode === TargetingMode.Poke) {
      return origin
    }
    const dir = it.direction
    if (!dir || Math.abs(dir.y) < 0.02) return null
    const t = (planeY - origin.y) / dir.y
    if (t <= 0) return null
    const p = origin.add(dir.uniformScale(t))
    if (p.distance(origin) > MAX_DRAG_DISTANCE) return null
    return p
  }

  private beginDrag(e: InteractorEvent): void {
    this.falling = false
    this.dragging = true
    this.shelfBlockCount = 0
    this.dragStartPos = this.position
    const hit = e.interactor ? e.interactor.targetHitPosition : null
    this.dragPlaneY = hit ? hit.y : this.position.y + this.height / 2
    // The anchor is taken on the first drag update, once the pointer ray has settled.
    this.dragAnchor = null
  }

  private updateDrag(e: InteractorEvent): void {
    if (!this.dragging) return
    const p = this.rayPoint(e, this.dragPlaneY)
    if (!p) return
    if (!this.dragAnchor) {
      this.dragAnchor = p
      return
    }
    const delta = p.sub(this.dragAnchor)
    const target = new vec3(this.dragStartPos.x + delta.x, this.dragStartPos.y, this.dragStartPos.z + delta.z)
    this.slideTo(target)
  }

  private endDrag(): void {
    if (!this.dragging) return
    this.dragging = false
    this.dragAnchor = null
    this.settle()
  }

  /** Falls to whatever surface is under the monitor's centre. */
  settle(): void {
    const p = this.position
    const support = this.host.room.supportBelow(p.x, p.z, p.y)
    const target = support ? support.top : this.host.room.floorY
    if (target < p.y - 0.01) {
      this.falling = true
      this.fallSpeed = 0
      this.fallTarget = target
      this.lastDropFrom = p.y
    }
  }

  get isFalling(): boolean {
    return this.falling
  }

  get isDragging(): boolean {
    return this.dragging
  }

  private update(): void {
    if (!this.falling) return
    const dt = Math.min(getDeltaTime(), 1 / 20)
    this.fallSpeed += GRAVITY * dt
    const p = this.position
    let y = p.y - this.fallSpeed * dt
    if (y <= this.fallTarget) {
      y = this.fallTarget
      this.falling = false
      this.wasUnderShelf = this.isUnderShelf(new vec3(p.x, y, p.z))
    }
    // Stays upright: only the position changes.
    this.position = new vec3(p.x, y, p.z)
  }
}

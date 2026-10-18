import WorldCameraFinderProvider from "SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider"
import {CATALOG, MonitorSpec, findSpec} from "./FitConfig"
import {FitCue} from "./FitCue"
import {GhostMaterials} from "./GhostBox"
import {Monitor, MonitorHost} from "./Monitor"
import {Box3, RoomModel} from "./RoomModel"

/** Why the app changed: the monitor list, the selection, or the selected monitor's height. */
export type ChangeKind = "list" | "select" | "height"
type Listener = (kind: ChangeKind) => void

/**
 * Fit Check app root: owns the room model, the monitors in the room, selection and the fit cue.
 * The menu and tests talk to it through `FitApp.instance`.
 */
@component
export class FitApp extends BaseScriptComponent {
  @input
  @hint("Unit cube mesh (1 x 1 x 1 cm)")
  boxMesh: RenderMesh

  @input
  @hint("See-through light grey fill")
  ghostMaterial: Material

  @input
  @hint("Bright solid outline")
  outlineMaterial: Material

  @input
  @hint("Parent of the virtual stand-in room")
  roomRoot: SceneObject

  @input
  @hint("Development only: start with both Dells on the desk")
  devStartWithBoth: boolean = false

  static instance: FitApp

  room: RoomModel
  cue: FitCue
  readonly monitors: Monitor[] = []
  selected: Monitor | null = null

  private mats: GhostMaterials
  private nextNumber = 1
  private listeners: Listener[] = []

  onAwake(): void {
    FitApp.instance = this
    this.room = new RoomModel(this.roomRoot)
    this.host.room = this.room
    this.mats = {mesh: this.boxMesh, fill: this.ghostMaterial, outline: this.outlineMaterial}
    // The room itself is drawn (preview only) by PreviewRoom; the Lens draws just monitors,
    // menu and cues.
    if (this.room.shelf) {
      this.cue = new FitCue(this.sceneObject, this.room.shelf, this.mats)
    }
    this.createEvent("UpdateEvent").bind(() => {
      this.cue?.update()
      this.updateLabels()
    })
    this.createEvent("OnStartEvent").bind(() => {
      if (this.devStartWithBoth) {
        this.addMonitor("SE2722H")
        this.addMonitor("P2722H")
      }
    })
  }

  // ---------------------------------------------------------------- room

  /** Labels never overlap the fit cue: monitor name tags hide while it shows. */
  private updateLabels(): void {
    const cueShowing = !!this.cue && this.cue.visible
    for (const m of this.monitors) m.tagVisible = !cueShowing
  }

  // ---------------------------------------------------------------- events

  onChanged(listener: Listener): void {
    this.listeners.push(listener)
  }

  private notify(kind: ChangeKind): void {
    for (const l of this.listeners) l(kind)
  }

  // ---------------------------------------------------------------- monitors

  get catalog(): MonitorSpec[] {
    return CATALOG
  }

  /** Adds a monitor from the catalog in front of the user, on the desk near its front edge. */
  addMonitor(specId: string): Monitor | null {
    const spec = findSpec(specId)
    if (!spec || !this.room.desk) return null

    const name = "Dell " + this.nextNumber++
    const obj = global.scene.createSceneObject(name)
    obj.setParent(this.sceneObject)
    const monitor = obj.createComponent(Monitor.getTypeName()) as Monitor

    const desk = this.room.desk
    const z = desk.max.z - spec.depth / 2 - 4
    const camX = WorldCameraFinderProvider.getInstance().getWorldPosition().x
    const minX = desk.min.x + spec.width / 2
    const maxX = desk.max.x - spec.width / 2
    const preferred = Math.max(minX, Math.min(maxX, camX))

    obj.getTransform().setWorldPosition(new vec3(preferred, desk.max.y, z))
    monitor.init(spec, name, this.host, this.mats)
    // Monitors are ghosts and pass through each other; still, pick the spot along the front
    // of the desk that overlaps the existing monitors least.
    const candidates = [preferred, minX, maxX, (minX + preferred) / 2, (maxX + preferred) / 2]
    let best = preferred
    let bestOverlap = Infinity
    for (const x of candidates) {
      const overlap = this.overlapWidth(monitor, monitor.boxAt(new vec3(x, desk.max.y, z)))
      if (overlap < bestOverlap - 0.01) {
        best = x
        bestOverlap = overlap
      }
    }
    monitor.position = new vec3(best, desk.max.y, z)

    this.monitors.push(monitor)
    this.select(monitor)
    this.notify("list")
    print(`[FitCheck] Added ${name} (${spec.label}) at ${monitor.position.toString()}`)
    return monitor
  }

  private overlapWidth(self: Monitor, box: Box3): number {
    let total = 0
    for (const m of this.monitors) {
      if (m === self) continue
      const o = m.box
      const dx = Math.min(box.max.x, o.max.x) - Math.max(box.min.x, o.min.x)
      const dz = Math.min(box.max.z, o.max.z) - Math.max(box.min.z, o.min.z)
      if (dx > 0 && dz > 0) total += dx
    }
    return total
  }

  select(monitor: Monitor | null): void {
    this.selected = monitor
    for (const m of this.monitors) m.setSelected(m === monitor)
    this.notify("select")
  }

  deleteSelected(): void {
    const m = this.selected
    if (!m) return
    const i = this.monitors.indexOf(m)
    if (i >= 0) this.monitors.splice(i, 1)
    print(`[FitCheck] Deleted ${m.displayName}`)
    m.getSceneObject().destroy()
    this.selected = null
    this.notify("list")
  }

  /** Removes every monitor (used to give each test a clean desk). Numbering continues. */
  removeAll(): void {
    while (this.monitors.length > 0) {
      this.select(this.monitors[this.monitors.length - 1])
      this.deleteSelected()
    }
  }

  /** Sets the selected monitor's stand height. Returns the applied height, or null if not adjustable. */
  setSelectedHeight(height: number): number | null {
    const m = this.selected
    if (!m || !m.isAdjustable) return null
    const applied = m.setHeight(height)
    this.notify("height")
    return applied
  }

  findMonitor(name: string): Monitor | null {
    for (const m of this.monitors) if (m.displayName === name) return m
    return null
  }

  private host: MonitorHost = {
    room: null, // set in onAwake
    onMonitorPressed: (m: Monitor) => {
      if (this.selected !== m) this.select(m)
    },
    onShelfBlocked: (m: Monitor, overBy: number, x: number) => {
      this.cue?.showBlocked(overBy, m.panelTopFront)
    },
    onSlidUnderShelf: (m: Monitor, spare: number, x: number) => {
      this.cue?.showFits(spare, m.panelTopFront)
      print(`[FitCheck] ${m.displayName} slid under the shelf: ${spare.toFixed(1)} cm to spare`)
    },
    onHeightBlocked: (m: Monitor, x: number) => {
      this.cue?.showMessage("Shelf above: can't go higher", x)
    },
  }
}

import {COLORS, CUE_FADE_SECONDS, CUE_HOLD_SECONDS} from "./FitConfig"
import {GhostMaterials, cloneWithColor} from "./GhostBox"
import {Box3} from "./RoomModel"
import {createLabel} from "./Label"

const LINE_THICKNESS = 0.6 // cm
const TICK_WIDTH = 5 // cm

/**
 * The fit cue on the shelf's front edge: a glowing bar, a short message, and a measuring line
 * between the monitor's top and the shelf's underside. Red when a monitor is blocked (the line
 * spans the overlap), green when it slides under (the line spans the gap).
 */
export class FitCue {
  readonly root: SceneObject
  private bar: SceneObject
  private material: Material
  private text: Text
  private line: SceneObject
  private lineBar: SceneObject
  private tickTop: SceneObject
  private tickBottom: SceneObject
  private shownAt = -1000
  private color = COLORS.cueRed
  private textY: number
  private textZ: number

  /** Last message shown, for tests and logs. */
  message = ""
  kind: "none" | "blocked" | "fits" = "none"
  /** Length of the measuring line (cm) the last time the cue showed. */
  lineLength = 0
  /** Seconds the cue stays fully visible after the last push (demo capture can raise it). */
  holdSeconds = CUE_HOLD_SECONDS

  constructor(
    parent: SceneObject,
    private shelf: Box3,
    private mats: GhostMaterials,
  ) {
    this.root = global.scene.createSceneObject("Fit Cue")
    this.root.setParent(parent)
    // Fill material blends, so the whole cue can fade out.
    this.material = cloneWithColor(mats.fill, COLORS.cueRed)

    // Glow along the bottom front edge of the shelf.
    const width = shelf.max.x - shelf.min.x
    this.bar = this.box(this.root, "Fit Cue Glow")
    this.bar.getTransform().setWorldPosition(new vec3((shelf.min.x + shelf.max.x) / 2, shelf.min.y + 0.6, shelf.max.z + 0.4))
    this.bar.getTransform().setLocalScale(new vec3(width + 1, 1.6, 1.2))

    // Measuring line with end ticks; positioned when shown.
    this.line = global.scene.createSceneObject("Fit Cue Measure")
    this.line.setParent(this.root)
    this.lineBar = this.box(this.line, "Measure Line")
    this.tickTop = this.box(this.line, "Measure Tick Top")
    this.tickBottom = this.box(this.line, "Measure Tick Bottom")

    this.text = createLabel(this.root, "Fit Cue Text", 230, COLORS.cueRed)
    ;(this.text as Text & {weight?: number}).weight = 700
    // Just above the shelf's front edge, so it reads over the monitor's top, not through it.
    this.textY = shelf.max.y + 6
    this.textZ = shelf.max.z + 3

    this.setAlpha(0)
  }

  private box(parent: SceneObject, name: string): SceneObject {
    const o = global.scene.createSceneObject(name)
    o.setParent(parent)
    const rmv = o.createComponent("Component.RenderMeshVisual") as RenderMeshVisual
    rmv.mesh = this.mats.mesh
    rmv.mainMaterial = this.material
    return o
  }

  /**
   * Blocked: shelf edge glows red, the line spans the overlap. Called every frame the user keeps
   * pushing. `monitorTop` is the top-front point of the monitor's panel.
   */
  showBlocked(overBy: number, monitorTop: vec3): void {
    this.show("blocked", overBy.toFixed(1) + " cm too tall", COLORS.cueRed, monitorTop)
  }

  /** Fits: green message, the line spans the gap between monitor top and shelf. */
  showFits(spare: number, monitorTop: vec3): void {
    this.show("fits", spare.toFixed(1) + " cm to spare", COLORS.cueGreen, monitorTop)
  }

  /** A plain red message with no measurement (e.g. raising a stand into the shelf). */
  showMessage(message: string, x: number): void {
    this.show("blocked", message, COLORS.cueRed, null, x)
  }

  private show(kind: "blocked" | "fits", message: string, color: vec4, monitorTop: vec3 | null, x?: number): void {
    this.kind = kind
    this.message = message
    this.color = color
    this.text.text = message
    const cx = monitorTop ? monitorTop.x : x
    this.text.getSceneObject().getTransform().setWorldPosition(new vec3(cx, this.textY, this.textZ))
    this.placeLine(monitorTop)
    this.shownAt = getTime()
    this.setAlpha(1)
  }

  private placeLine(monitorTop: vec3 | null): void {
    if (!monitorTop) {
      this.lineLength = 0
      return
    }
    const a = monitorTop.y
    const b = this.shelf.min.y
    const lo = Math.min(a, b)
    const hi = Math.max(a, b)
    this.lineLength = hi - lo
    // Just in front of the monitor's panel, off to one side of centre so it doesn't hide the stand.
    const x = monitorTop.x + 12
    const z = monitorTop.z + 1
    const len = Math.max(this.lineLength, 0.2)
    this.lineBar.getTransform().setWorldPosition(new vec3(x, (lo + hi) / 2, z))
    this.lineBar.getTransform().setLocalScale(new vec3(LINE_THICKNESS, len, LINE_THICKNESS))
    this.tickTop.getTransform().setWorldPosition(new vec3(x, hi, z))
    this.tickTop.getTransform().setLocalScale(new vec3(TICK_WIDTH, LINE_THICKNESS, LINE_THICKNESS))
    this.tickBottom.getTransform().setWorldPosition(new vec3(x, lo, z))
    this.tickBottom.getTransform().setLocalScale(new vec3(TICK_WIDTH, LINE_THICKNESS, LINE_THICKNESS))
  }

  /** True while any cue is visible. */
  get visible(): boolean {
    return getTime() - this.shownAt < this.holdSeconds + CUE_FADE_SECONDS
  }

  /** True while the measuring line is showing. */
  get lineVisible(): boolean {
    return this.line.enabled
  }

  update(): void {
    const age = getTime() - this.shownAt
    if (age < this.holdSeconds) {
      this.setAlpha(1)
    } else if (age < this.holdSeconds + CUE_FADE_SECONDS) {
      this.setAlpha(1 - (age - this.holdSeconds) / CUE_FADE_SECONDS)
    } else if (this.kind !== "none") {
      this.setAlpha(0)
      this.kind = "none"
    }
  }

  private setAlpha(a: number): void {
    const c = this.color
    this.material.mainPass.baseColor = new vec4(c.x, c.y, c.z, a)
    this.text.textFill.color = new vec4(c.x, c.y, c.z, a)
    const on = a > 0.001
    this.bar.enabled = on
    this.text.getSceneObject().enabled = on
    this.line.enabled = on && this.lineLength > 0
  }
}

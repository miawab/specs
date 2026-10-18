import {BackPlate} from "SpectaclesUIKit.lspkg/Scripts/BackPlate"
import {Button} from "SpectaclesUIKit.lspkg/Scripts/Components/Button/Button"
import {Slider} from "SpectaclesUIKit.lspkg/Scripts/Components/Slider/Slider"
import {FlexItem} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexItem"
import {FlexLayout} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexLayout"
import {
  FlexAlign,
  FlexDirection,
  FlexJustify,
} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexTypes"
import {TargetingMode} from "SpectaclesInteractionKit.lspkg/Core/Interactor/Interactor"
import WorldCameraFinderProvider from "SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider"
import {ChangeKind, FitApp} from "./FitApp"
import {Monitor} from "./Monitor"

// ── Type scale — single source of truth (see specs-build-ui patterns → Typography)
const FONT_SIZE_SCALE = 1.0
type TextRole =
  | "Title1" | "Title2" | "HeadlineXL" | "Headline1" | "Headline2"
  | "Subheadline" | "Button" | "Callout" | "Body" | "Caption"
const TYPE_SCALE: Record<TextRole, {size: number; weight: number}> = {
  Title1: {size: 105, weight: 700}, Title2: {size: 93, weight: 700},
  HeadlineXL: {size: 62, weight: 700}, Headline1: {size: 54, weight: 700},
  Headline2: {size: 48, weight: 700}, Subheadline: {size: 41, weight: 700},
  Button: {size: 39, weight: 500}, Callout: {size: 39, weight: 700},
  Body: {size: 39, weight: 500}, Caption: {size: 38, weight: 500},
}
function roleSize(role: TextRole, distanceCm: number): number {
  return TYPE_SCALE[role].size * FONT_SIZE_SCALE * (distanceCm / 110)
}
function applyTextRole(t: Text, role: TextRole, distanceCm: number): void {
  t.size = roleSize(role, distanceCm)
  ;(t as Text & {weight?: number}).weight = TYPE_SCALE[role].weight
}

const PANEL_W = 30
const PAD = 1.6
const INNER_W = PANEL_W - PAD * 2
const ROW_H = 3.4
const BUTTON_LABEL_Z = 0.08
const TEXT_SECONDARY = new vec4(1, 1, 1, 0.7)

/**
 * The Fit Check menu: add a monitor from the catalog, pick a monitor in the room, delete it,
 * adjust an adjustable stand's height, close. Opened by the menu orb.
 */
@component
export class FitMenu extends BaseScriptComponent {
  @ui.label("Fit Check menu")
  @ui.separator
  @ui.group_start("Placement")
  @input
  @hint("Distance from the user when opened (cm). 70 keeps it a comfortable far-field pinch; LEAF's IK arm could not press most buttons near-field at 55.")
  @widget(new SliderWidget(35, 90, 1))
  openDistance: number = 70

  @input
  @hint("How far below eye level the menu opens (cm)")
  @widget(new SliderWidget(0, 40, 1))
  openDrop: number = 18

  @input
  @hint("Degrees to the right of straight ahead, so the menu sits beside the desk, not over the shelf")
  @widget(new SliderWidget(0, 60, 1))
  openAngle: number = 38

  @input
  @hint("Distance the text sizes are tuned for (cm)")
  @widget(new SliderWidget(40, 110, 1))
  textDistance: number = 100
  @ui.group_end

  private app: FitApp
  private contentFlex: FlexLayout
  private dynamicPane: SceneObject | null = null
  private dynamicItem: FlexItem | null = null
  private columnBefore: FlexItem[] = []
  private columnAfter: FlexItem[] = []
  private roomLabels: {monitor: Monitor; text: Text}[] = []
  private selectedText: Text | null = null
  private deleteButton: Button | null = null
  private lastButtonLabel: Text
  private needsRefresh = false
  private heightText: Text | null = null
  private slider: Slider | null = null
  private settingSlider = false
  private dirty = false

  get isOpen(): boolean {
    return this.sceneObject.enabled
  }

  onAwake(): void {
    this.app = FitApp.instance
    this.build()
    this.app.onChanged((kind) => this.onAppChanged(kind))
    this.rebuildDynamic()
    // Rebuild a frame later, never inside a button's own click handler (it may destroy that button).
    this.createEvent("UpdateEvent").bind(() => {
      if (this.dirty) this.rebuildDynamic()
      else if (this.needsRefresh) {
        this.needsRefresh = false
        this.refreshSelection()
      }
    })
    // Hidden until the orb is pinched. Children initialize on first show.
    this.sceneObject.enabled = false
  }

  // ---------------------------------------------------------------- open / close

  open(): void {
    const cam = WorldCameraFinderProvider.getInstance().getTransform()
    const camPos = cam.getWorldPosition()
    // The camera looks down its local -Z; flatten that view direction and turn it to the right.
    const look = cam.getWorldRotation().multiplyVec3(new vec3(0, 0, -1))
    const fwd = new vec3(look.x, 0, look.z).normalize()
    const a = (this.openAngle * Math.PI) / 180
    const dir = new vec3(fwd.x * Math.cos(a) - fwd.z * Math.sin(a), 0, fwd.x * Math.sin(a) + fwd.z * Math.cos(a))
    const pos = camPos.add(dir.uniformScale(this.openDistance)).add(new vec3(0, -this.openDrop, 0))
    const t = this.sceneObject.getTransform()
    t.setWorldPosition(pos)
    // Face the user (panel front is +Z).
    const toUser = camPos.sub(pos)
    t.setWorldRotation(quat.lookAt(new vec3(toUser.x, 0, toUser.z).normalize(), vec3.up()))
    if (this.dirty) this.rebuildDynamic()
    this.sceneObject.enabled = true
    this.needsRefresh = true
    print("[FitCheck] Menu opened")
  }

  close(): void {
    this.sceneObject.enabled = false
    print("[FitCheck] Menu closed")
  }

  toggle(): void {
    if (this.isOpen) this.close()
    else this.open()
  }

  // ---------------------------------------------------------------- layout

  /**
   * Column: header, catalog, room list, selected row, height label, slider.
   * Only the room list is ever rebuilt (on add/delete, by buttons outside it), so no button is
   * destroyed while it is being pressed. Everything else updates in place.
   */
  private build(): void {
    this.sceneObject.createComponent("Component.Canvas")
    const backPlate = this.sceneObject.createComponent(BackPlate.getTypeName()) as BackPlate

    const content = global.scene.createSceneObject("Content")
    content.setParent(this.sceneObject)
    content.getTransform().setLocalPosition(new vec3(0, 0, 0.6))

    const flex = content.createComponent(FlexLayout.getTypeName()) as FlexLayout
    flex.autoDiscoverItemsOnStart = false // children are registered explicitly
    flex.width = PANEL_W
    flex.height = -1
    flex.direction = FlexDirection.Column
    flex.justifyContent = FlexJustify.Start
    flex.alignItems = FlexAlign.Stretch
    flex.rowGap = 1.0
    flex.paddingTop = PAD
    flex.paddingBottom = PAD
    flex.paddingLeft = PAD
    flex.paddingRight = PAD
    flex.onLayoutComplete.add((r) => {
      backPlate.size = new vec2(r.containerWidth, r.containerHeight)
    })
    this.contentFlex = flex

    // Header: title + Close
    const header = this.makeRow(content, "Header", FlexJustify.SpaceBetween)
    this.addText(header, "Fit Check", "Headline1", INNER_W - 9)
    this.addButton(header, "Close", "Close", 8, () => this.close())
    this.columnBefore.push(this.register(flex, header))

    this.columnBefore.push(this.register(flex, this.addText(content, "Add a monitor (real size)", "Caption", INNER_W, TEXT_SECONDARY)))

    const addRow = this.makeRow(content, "Catalog", FlexJustify.SpaceBetween)
    const half = (INNER_W - 1) / 2
    for (const spec of this.app.catalog) {
      this.addButton(addRow, "Add " + spec.id, spec.label, half, () => {
        this.app.addMonitor(spec.id)
      })
    }
    this.columnBefore.push(this.register(flex, addRow))

    this.columnBefore.push(this.register(flex, this.addText(content, "In the room", "Caption", INNER_W, TEXT_SECONDARY)))

    // (room list goes here)

    // Selected monitor: name + Delete
    const selRow = this.makeRow(content, "Selected", FlexJustify.SpaceBetween)
    this.selectedText = this.addText(selRow, "", "Subheadline", INNER_W - 10).getComponent("Component.Text") as Text
    this.deleteButton = this.addButton(selRow, "Delete", "Delete", 9, () => this.app.deleteSelected())
    this.columnAfter.push(this.register(flex, selRow))

    // Height: label + slider (greyed out for a fixed stand)
    this.heightText = this.addText(content, "", "Body", INNER_W).getComponent("Component.Text") as Text
    this.columnAfter.push(this.register(flex, this.heightText.getSceneObject()))
    const sliderSO = global.scene.createSceneObject("Height Slider")
    sliderSO.setParent(content)
    const slider = sliderSO.createComponent(Slider.getTypeName()) as Slider
    slider.size = new vec3(INNER_W, 2.6, 1) // before init, so the knob and fill start right
    slider.currentValue = 1
    slider.onValueChange.add((v: number) => this.onSlider(v))
    this.allowPoke(slider)
    const sliderItem = sliderSO.createComponent(FlexItem.getTypeName()) as FlexItem
    flex.addItems([sliderItem])
    this.columnAfter.push(sliderItem)
    this.slider = slider
  }

  private onAppChanged(kind: ChangeKind): void {
    if (kind === "list") this.dirty = true
    if (kind === "height") this.refreshHeight()
    else this.refreshSelection()
  }

  /** Rebuilds just the room list (destroy-and-rebuild so the column re-lays out). */
  private rebuildDynamic(): void {
    this.dirty = false
    if (this.dynamicPane) {
      if (this.dynamicItem) this.contentFlex.removeItems([this.dynamicItem])
      this.dynamicPane.destroy()
    }
    this.roomLabels = []

    const content = this.contentFlex.getSceneObject()
    const pane = global.scene.createSceneObject("Room List")
    pane.setParent(content)
    pane.getTransform().setLocalPosition(new vec3(0, 0, 0.02))
    const flex = pane.createComponent(FlexLayout.getTypeName()) as FlexLayout
    flex.autoDiscoverItemsOnStart = false // children are registered explicitly
    flex.width = INNER_W
    flex.height = -1
    flex.direction = FlexDirection.Column
    flex.alignItems = FlexAlign.Stretch
    flex.rowGap = 0.8
    this.dynamicItem = pane.createComponent(FlexItem.getTypeName()) as FlexItem
    this.dynamicPane = pane

    const monitors = this.app.monitors
    if (monitors.length === 0) {
      this.register(flex, this.addText(pane, "Nothing yet. Add one above.", "Body", INNER_W, TEXT_SECONDARY))
    }
    const half = (INNER_W - 1) / 2
    for (let i = 0; i < monitors.length; i += 2) {
      const row = this.makeRow(pane, "Room Row", FlexJustify.Start)
      ;(row.getComponent(FlexLayout.getTypeName()) as FlexLayout).columnGap = 1
      for (const m of monitors.slice(i, i + 2)) {
        this.addButton(row, "Room " + m.displayName, "", half, () => this.app.select(m))
        this.roomLabels.push({monitor: m, text: this.lastButtonLabel})
      }
      this.register(flex, row)
    }

    this.contentFlex.addItems([this.dynamicItem])
    this.contentFlex.reorderItems(this.columnBefore.concat([this.dynamicItem], this.columnAfter))
    this.refreshSelection()
  }

  /** Updates labels, Delete and the slider for the current selection, in place. */
  private refreshSelection(): void {
    const sel = this.app.selected
    for (const r of this.roomLabels) {
      if (this.app.monitors.indexOf(r.monitor) < 0) continue // deleted; the list rebuilds next frame
      r.text.text = (r.monitor === sel ? "> " : "") + r.monitor.displayName + "  " + r.monitor.spec.id
    }
    if (this.selectedText) this.selectedText.text = sel ? sel.displayName + " selected" : "Pick a monitor"
    // UIKit elements set up on their first OnStart (first time the menu shows); before that,
    // `inactive` is applied by the refresh that runs right after opening.
    if (this.deleteButton && this.deleteButton.initialized) this.deleteButton.inactive = !sel
    if (this.slider) {
      this.settingSlider = true
      this.slider.currentValue = this.sliderValueFor(sel ? sel.height : this.sliderRange()[1])
      this.settingSlider = false
      if (this.slider.initialized) this.slider.inactive = !sel || !sel.isAdjustable
    }
    this.refreshHeight()
  }

  private sliderRange(): [number, number] {
    // The adjustable stand's range (P2722H); a fixed stand shows its single height.
    for (const spec of this.app.catalog) {
      if (spec.stand === "adjustable") return [spec.minHeight, spec.maxHeight]
    }
    return [0, 1]
  }

  private sliderValueFor(height: number): number {
    const [lo, hi] = this.sliderRange()
    return Math.max(0, Math.min(1, (height - lo) / (hi - lo)))
  }

  private onSlider(v: number): void {
    if (this.settingSlider) return
    const sel = this.app.selected
    if (!sel || !sel.isAdjustable) return
    const [lo, hi] = this.sliderRange()
    this.app.setSelectedHeight(lo + v * (hi - lo))
  }

  /** Sets the slider as if the user dragged it to `height` (cm). Used by tests and keeps the label in sync. */
  setSliderHeight(height: number): void {
    if (!this.slider) return
    this.slider.currentValue = this.sliderValueFor(height)
  }

  get sliderInactive(): boolean {
    return this.slider ? this.slider.inactive : true
  }

  private refreshHeight(): void {
    if (!this.heightText) return
    const sel = this.app.selected
    if (!sel) {
      this.heightText.text = "Stand height: pick a monitor"
    } else if (sel.isAdjustable) {
      this.heightText.text = `Stand height ${sel.height.toFixed(1)} cm  (${sel.spec.minHeight} to ${sel.spec.maxHeight})`
    } else {
      this.heightText.text = `Fixed stand: ${sel.height.toFixed(1)} cm, can't adjust`
    }
  }

  // ---------------------------------------------------------------- helpers

  /** Lets a fingertip poke press the control up close, as well as pinch (near and far). */
  private allowPoke(element: Button | Slider): void {
    element.onInitialized.add(() => {
      element.interactable.targetingMode = TargetingMode.All
    })
  }

  private register(flex: FlexLayout, child: SceneObject): FlexItem {
    const item = child.getComponent(FlexItem.getTypeName()) as FlexItem
    if (item) flex.addItems([item])
    return item
  }

  private makeRow(parent: SceneObject, name: string, justify: FlexJustify): SceneObject {
    const row = global.scene.createSceneObject(name)
    row.setParent(parent)
    row.getTransform().setLocalPosition(new vec3(0, 0, 0.02))
    const f = row.createComponent(FlexLayout.getTypeName()) as FlexLayout
    f.autoDiscoverItemsOnStart = false // children are registered explicitly
    f.direction = FlexDirection.Row
    f.justifyContent = justify
    f.alignItems = FlexAlign.Center
    f.width = INNER_W
    f.height = ROW_H
    const item = row.createComponent(FlexItem.getTypeName()) as FlexItem
    item.overrideHeight = ROW_H
    return row
  }

  private addText(parent: SceneObject, text: string, role: TextRole, widthCM: number, color?: vec4): SceneObject {
    const so = global.scene.createSceneObject("Text")
    so.setParent(parent)
    so.getTransform().setLocalPosition(new vec3(0, 0, 0.15))
    const t = so.createComponent("Component.Text") as Text
    t.text = text
    t.depthTest = true
    applyTextRole(t, role, this.textDistance)
    t.horizontalAlignment = HorizontalAlignment.Left
    t.verticalAlignment = VerticalAlignment.Center
    t.horizontalOverflow = HorizontalOverflow.Overflow
    t.verticalOverflow = VerticalOverflow.Overflow
    t.layoutRect = Rect.create(-widthCM / 2, widthCM / 2, -1.2, 1.2)
    if (color) t.textFill.color = color
    const item = so.createComponent(FlexItem.getTypeName()) as FlexItem
    item.overrideWidth = widthCM
    item.overrideHeight = 2.4
    const parentFlex = parent.getComponent(FlexLayout.getTypeName()) as FlexLayout
    if (parentFlex) parentFlex.addItems([item])
    return so
  }

  private addButton(parent: SceneObject, name: string, label: string, widthCM: number, onClick: () => void): Button {
    const so = global.scene.createSceneObject(name)
    so.setParent(parent)
    const btn = so.createComponent(Button.getTypeName()) as Button
    btn.size = new vec3(widthCM, ROW_H - 0.4, 1)

    const labelSO = global.scene.createSceneObject("Label")
    labelSO.setParent(so)
    labelSO.getTransform().setLocalPosition(new vec3(0, 0, BUTTON_LABEL_Z))
    const t = labelSO.createComponent("Component.Text") as Text
    t.text = label
    t.depthTest = true
    applyTextRole(t, "Button", this.textDistance)
    t.horizontalAlignment = HorizontalAlignment.Center
    t.verticalAlignment = VerticalAlignment.Center
    t.horizontalOverflow = HorizontalOverflow.Overflow
    t.verticalOverflow = VerticalOverflow.Overflow
    t.layoutRect = Rect.create(-(widthCM - 0.5) / 2, (widthCM - 0.5) / 2, -1.2, 1.2)
    this.lastButtonLabel = t

    const item = so.createComponent(FlexItem.getTypeName()) as FlexItem
    const parentFlex = parent.getComponent(FlexLayout.getTypeName()) as FlexLayout
    if (parentFlex) parentFlex.addItems([item])
    btn.onTriggerUp.add(() => onClick())
    this.allowPoke(btn)
    return btn
  }
}

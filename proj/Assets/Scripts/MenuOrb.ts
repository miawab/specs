import {Interactable} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable"
import {InteractorEvent} from "SpectaclesInteractionKit.lspkg/Core/Interactor/InteractorEvent"
import {TargetingMode} from "SpectaclesInteractionKit.lspkg/Core/Interactor/Interactor"
import {COLORS} from "./FitConfig"
import {FitMenu} from "./FitMenu"

/**
 * The menu orb: pinch it to open or close the menu; grab and drag it to put it anywhere.
 * It can't be added or deleted. The orb only moves once SIK reports a real drag, so a pinch
 * never nudges it and a drag never toggles the menu.
 */
@component
export class MenuOrb extends BaseScriptComponent {
  @input
  @hint("The menu this orb opens")
  menu: FitMenu

  @input
  @hint("Orb material (light; it is cloned so hover can brighten it)")
  orbMaterial: Material

  @input
  @hint("Orb diameter (cm)")
  diameter: number = 5

  private interactable: Interactable
  private mat: Material
  private dragged = false
  private startPos = vec3.zero()
  private grabDistance = 0
  private anchor: vec3 | null = null

  /** Number of times the orb toggled the menu (for tests). */
  toggleCount = 0

  onAwake(): void {
    const t = this.sceneObject.getTransform()
    // Sphere mesh is 1 cm across, so scale = diameter.
    t.setLocalScale(vec3.one().uniformScale(this.diameter))

    const rmv = this.sceneObject.getComponent("Component.RenderMeshVisual") as RenderMeshVisual
    if (rmv && this.orbMaterial) {
      this.mat = this.orbMaterial.clone()
      this.mat.mainPass.baseColor = COLORS.outline
      rmv.mainMaterial = this.mat
    }

    const collider = this.sceneObject.createComponent("Physics.ColliderComponent") as ColliderComponent
    const shape = Shape.createSphereShape()
    shape.radius = 0.7 // local units: 1.4x the orb's radius, a generous target
    collider.shape = shape

    this.interactable = this.sceneObject.createComponent(Interactable.getTypeName()) as Interactable
    this.interactable.targetingMode = TargetingMode.All

    this.createEvent("OnStartEvent").bind(() => {
      this.interactable.onHoverEnter.add(() => this.setColor(COLORS.outlineHover))
      this.interactable.onHoverExit.add(() => this.setColor(COLORS.outline))
      this.interactable.onTriggerStart.add((e: InteractorEvent) => this.begin(e))
      this.interactable.onDragUpdate.add((e: InteractorEvent) => this.drag(e))
      this.interactable.onTriggerEnd.add(() => this.end())
      this.interactable.onTriggerCanceled.add(() => (this.dragged = false))
    })
  }

  private handPoint(e: InteractorEvent): vec3 | null {
    const it = e.interactor
    if (!it || !it.startPoint) return null
    const mode = it.activeTargetingMode
    if (mode === TargetingMode.Direct || mode === TargetingMode.Poke || !it.direction) return it.startPoint
    // Far-field: the point on the ray at the distance the orb was grabbed at.
    return it.startPoint.add(it.direction.uniformScale(this.grabDistance))
  }

  private begin(e: InteractorEvent): void {
    this.dragged = false
    this.anchor = null
    this.startPos = this.sceneObject.getTransform().getWorldPosition()
    const origin = e.interactor ? e.interactor.startPoint : null
    this.grabDistance = origin ? origin.distance(this.startPos) : 50
  }

  private drag(e: InteractorEvent): void {
    const p = this.handPoint(e)
    if (!p) return
    if (!this.anchor) {
      this.anchor = p
      return
    }
    this.dragged = true
    this.sceneObject.getTransform().setWorldPosition(this.startPos.add(p.sub(this.anchor)))
  }

  private end(): void {
    if (!this.dragged) {
      this.toggleCount++
      this.menu.toggle()
    }
    this.dragged = false
  }

  private setColor(c: vec4): void {
    if (this.mat) this.mat.mainPass.baseColor = c
  }
}

import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils"
import {awaitEventOnce, nextFrame, sleep} from "Leaf.lspkg/Utils/common/Utils"
import {Interactable} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable"
import {InteractorTriggerType} from "SpectaclesInteractionKit.lspkg/Core/Interactor/Interactor"

/** Shared LEAF actions for Fit Check scenarios. */
export class FitLeafInteractor extends DefaultLeafInteractor {
  find(name: string): Interactable {
    const found = findInteractablesByName(name, undefined, true)[0]
    if (!found) throw new Error(`Interactable "${name}" not found or not enabled`)
    return found
  }

  async tap(name: string): Promise<void> {
    await this.trigger(this.find(name))
    await sleep(250)
  }

  /**
   * Grabs a monitor and drags it. `perFrame` is the hand motion per frame (cm); the monitor
   * follows on its surface until something stops it.
   */
  async dragMonitor(name: string, perFrame: vec3, durationMs: number): Promise<void> {
    await this.drag(this.find(name), perFrame, durationMs)
    await sleep(300)
  }

  /**
   * One continuous grab whose hand follows a polyline of horizontal offsets (cm, relative to
   * where the grab starts) at `speed` cm per frame, then lets go. Like a user carrying a monitor
   * across the room without releasing it.
   */
  async dragAlongPath(name: string, offsets: vec3[], speed: number = 1.5, maxMs: number = 20000, settleMs: number = 300): Promise<void> {
    const target = this.find(name)
    // Expand the polyline into per-frame hand steps.
    const steps: vec3[] = []
    let from = vec3.zero()
    for (const to of offsets) {
      const seg = to.sub(from)
      const n = Math.max(1, Math.ceil(seg.length / speed))
      for (let i = 0; i < n; i++) steps.push(seg.uniformScale(1 / n))
      from = to
    }
    let index = 0
    const unsubscribe = target.onDragUpdate.add(() => {
      if (index >= steps.length) return
      const v = steps[index++]
      this.startPoint = this.startPoint.add(v)
      this.endPoint = this.endPoint.add(v)
    })

    const dragStarted = awaitEventOnce(target.onDragStart)
    const dragEnded = awaitEventOnce(target.onDragEnd)
    await this.enterHover(target)
    await nextFrame()
    await nextFrame()
    this.setTriggerType(InteractorTriggerType.Select)
    await nextFrame()
    this.overrideDragVector = steps.length > 0 ? steps[0] : new vec3(0.1, 0, 0)
    await dragStarted

    const t0 = getTime()
    while (index < steps.length && (getTime() - t0) * 1000 < maxMs) {
      await awaitEventOnce(target.onTriggerUpdate)
    }
    unsubscribe()
    this.setTriggerType(InteractorTriggerType.None)
    await dragEnded
    this.resetStartEndPoint()
    this.overrideDragVector = undefined
    await this.exitHover()
    if (settleMs > 0) await sleep(settleMs)
  }
}

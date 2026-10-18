import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {findSceneObjectByName, sleep} from "Leaf.lspkg/Utils/common/Utils"
import {FitApp} from "../Scripts/FitApp"
import {Monitor} from "../Scripts/Monitor"
import {FitLeafInteractor} from "./FitLeafInteractor"

/** Checks a monitor stands upright at real size: identity rotation, panel exactly the spec width. */
export function expectUprightRealSize(m: Monitor): void {
  const rot = m.getSceneObject().getTransform().getWorldRotation()
  expect(Math.abs(rot.w)).toBeCloseTo(1, 3)
  const panel = findSceneObjectByName("Panel Fill", m.getSceneObject())
  const scale = panel.getTransform().getWorldScale()
  expect(scale.x).toBeCloseTo(m.spec.width, 2)
  expect(scale.y).toBeCloseTo(m.spec.panelHeight, 2)
  // Overall height from the bottom of the stand to the top of the panel.
  const top = panel.getTransform().getWorldPosition().y + scale.y / 2
  expect(top - m.position.y).toBeCloseTo(m.height, 2)
}

/**
 * Done criterion 1, move it on the desk: grab a monitor and slide it across the desk. It stays
 * standing on the desktop, at real size.
 */
@component
export class MoveOnDeskScenario extends Scenario {
  async run(): Promise<void> {
    const it = new FitLeafInteractor()
    const app = FitApp.instance
    await sleep(800)
    app.removeAll()
    const desk = app.room.desk

    const m = app.addMonitor("P2722H")
    const start = m.position
    expect(start.y).toBeCloseTo(desk.max.y, 2)
    expectUprightRealSize(m)

    // Slide right and a little back toward the wall (not far enough to reach the shelf), in one grab.
    await it.dragAlongPath(m.displayName, [new vec3(25, 0, 0), new vec3(25, 0, -8)], 1.0)
    const end = m.position
    print(`[FitTest] Slid ${m.displayName} from ${start.toString()} to ${end.toString()}`)
    // The monitor follows the hand; the first drag frame only sets the anchor, so allow 2 cm.
    expect(Math.abs(end.x - start.x - 25) < 2).toBe(true)
    expect(Math.abs(end.z - start.z + 8) < 2).toBe(true)
    expect(end.y).toBeCloseTo(desk.max.y, 2) // still on the desktop
    expect(m.isFalling).toBe(false)
    expectUprightRealSize(m)

    // Slide left across the desk, past the middle.
    await it.dragAlongPath(m.displayName, [new vec3(-40, 0, 0)], 1.0)
    expect(Math.abs(m.position.x - end.x + 40) < 2).toBe(true)
    expect(m.position.y).toBeCloseTo(desk.max.y, 2)
    expectUprightRealSize(m)

    app.removeAll()
  }
}

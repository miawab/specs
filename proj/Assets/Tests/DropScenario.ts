import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {nextFrame, sleep} from "Leaf.lspkg/Utils/common/Utils"
import {FitApp} from "../Scripts/FitApp"
import {FitLeafInteractor} from "./FitLeafInteractor"
import {expectUprightRealSize} from "./MoveOnDeskScenario"

/**
 * Done criterion 2, drop it: drag a monitor off the edge of the desk and let go. It falls to the
 * floor and lands upright.
 */
@component
export class DropScenario extends Scenario {
  async run(): Promise<void> {
    const it = new FitLeafInteractor()
    const app = FitApp.instance
    await sleep(800)
    app.removeAll()
    const desk = app.room.desk
    const floorY = app.room.floorY

    const m = app.addMonitor("SE2722H")
    // Pull it toward the user, past the desk's front edge, and let go.
    await it.dragAlongPath(m.displayName, [new vec3(0, 0, 30)], 1.5, 20000, 0)
    expect(m.position.z > desk.max.z).toBe(true) // centre is off the desk

    // Sample its height every frame after release: it must fall through the air, not snap.
    const ys: number[] = []
    for (let i = 0; i < 60 && (ys.length === 0 || m.isFalling); i++) {
      ys.push(m.position.y)
      await nextFrame()
    }
    const between = ys.filter((y) => y < desk.max.y - 0.5 && y > floorY + 0.5).length
    let monotonic = true
    for (let i = 1; i < ys.length; i++) if (ys[i] > ys[i - 1] + 0.001) monotonic = false
    print(`[FitTest] ${m.displayName} fell over ${ys.length} frames, ${between} of them in mid-air: ${ys.map((y) => y.toFixed(0)).join(" ")}`)
    expect(between >= 3).toBe(true)
    expect(monotonic).toBe(true)

    await sleep(1200)
    expect(m.isFalling).toBe(false)
    expect(m.position.y).toBeCloseTo(floorY, 2) // on the floor
    expect(m.lastDropFrom).toBeCloseTo(desk.max.y, 2)
    expectUprightRealSize(m) // landed upright, same real size
    print(`[FitTest] ${m.displayName} landed upright on the floor at ${m.position.toString()}`)

    app.removeAll()
  }
}

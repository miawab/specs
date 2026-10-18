import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {sleep} from "Leaf.lspkg/Utils/common/Utils"
import {FitApp} from "../Scripts/FitApp"
import {FitLeafInteractor} from "./FitLeafInteractor"

/** Not a test: leaves an SE2722H on the second table and a P2722H on the desk, for walk-around captures. */
@component
export class DemoFarTableScenario extends Scenario {
  async run(): Promise<void> {
    const it = new FitLeafInteractor()
    const app = FitApp.instance
    await sleep(600)
    app.removeAll()
    const table = app.room.surfaces.filter((s) => s.name === "Table")[0]
    const m = app.addMonitor("SE2722H")
    const start = m.position
    const c = table.box.min.add(table.box.max).uniformScale(0.5)
    await it.dragAlongPath(m.displayName, [new vec3(c.x - start.x - 25, 0, 0), new vec3(c.x - start.x, 0, c.z - start.z)], 2.0)
    app.addMonitor("P2722H")
  }
}

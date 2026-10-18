import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {findSceneObjectByName, sleep} from "Leaf.lspkg/Utils/common/Utils"
import {FitApp} from "../Scripts/FitApp"
import {FitMenu} from "../Scripts/FitMenu"
import {place} from "./RecHelpers"

/** Recording only (c11) setup: an SE2722H on the far table and a P2722H on the desk. The camera walk is separate. */
@component
export class RecFarSetupScenario extends Scenario {
  async run(): Promise<void> {
    const app = FitApp.instance
    const menu = findSceneObjectByName("Menu").getComponent(FitMenu.getTypeName()) as FitMenu
    app.removeAll()
    if (menu.isOpen) menu.close()
    const table = app.room.surfaces.filter((s) => s.name === "Table")[0]
    const c = table.box.min.add(table.box.max).uniformScale(0.5)
    const far = app.addMonitor("SE2722H")
    place(far, c.x, table.top, c.z)
    const near = app.addMonitor("P2722H")
    const desk = app.room.desk
    place(near, 0, desk.max.y, desk.max.z - near.spec.depth / 2 - 4)
    app.select(null)
    await sleep(500)
  }
}

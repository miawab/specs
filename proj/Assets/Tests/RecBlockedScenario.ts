import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {findSceneObjectByName, sleep} from "Leaf.lspkg/Utils/common/Utils"
import {FitApp} from "../Scripts/FitApp"
import {CUE_HOLD_SECONDS} from "../Scripts/FitConfig"
import {FitMenu} from "../Scripts/FitMenu"
import {FitLeafInteractor} from "./FitLeafInteractor"
import {mark, place} from "./RecHelpers"

/** Recording only (c08): slide the SE2722H toward the wall; it stops at the shelf; the red cue holds. */
@component
export class RecBlockedScenario extends Scenario {
  async run(): Promise<void> {
    const it = new FitLeafInteractor()
    const app = FitApp.instance
    const menu = findSceneObjectByName("Menu").getComponent(FitMenu.getTypeName()) as FitMenu
    app.removeAll()
    if (menu.isOpen) menu.close()
    app.cue.holdSeconds = CUE_HOLD_SECONDS
    const se = app.addMonitor("SE2722H")
    const desk = app.room.desk
    place(se, 0, desk.max.y, desk.max.z - se.spec.depth / 2 - 4)
    app.select(null)
    await sleep(2500)

    mark("start")
    await sleep(800)
    mark("grab")
    await it.dragMonitor(se.displayName, new vec3(0, 0, -0.22), 3400)
    mark("released")
    await sleep(3200)
    mark("end")
  }
}

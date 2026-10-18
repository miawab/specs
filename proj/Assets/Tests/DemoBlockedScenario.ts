import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {findSceneObjectByName, sleep} from "Leaf.lspkg/Utils/common/Utils"
import {FitApp} from "../Scripts/FitApp"
import {FitMenu} from "../Scripts/FitMenu"
import {FitLeafInteractor} from "./FitLeafInteractor"

/** Not a test: ends with the SE2722H pushed against the shelf and the red cue up (for captures). */
@component
export class DemoBlockedScenario extends Scenario {
  async run(): Promise<void> {
    const it = new FitLeafInteractor()
    const app = FitApp.instance
    const menu = findSceneObjectByName("Menu").getComponent(FitMenu.getTypeName()) as FitMenu
    app.cue.holdSeconds = 20
    await sleep(600)
    app.removeAll()
    if (menu.isOpen) menu.close()
    await sleep(800)
    await it.tap("Menu Orb")
    await sleep(1000)
    await it.tap("Add SE2722H")
    await sleep(1000)
    menu.close() // keep the shot to monitor, desk and shelf
    await sleep(300)
    await it.dragMonitor(app.selected.displayName, new vec3(0, 0, -0.5), 2500)
  }
}

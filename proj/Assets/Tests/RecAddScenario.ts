import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {findSceneObjectByName, sleep} from "Leaf.lspkg/Utils/common/Utils"
import {FitApp} from "../Scripts/FitApp"
import {FitMenu} from "../Scripts/FitMenu"
import {FitLeafInteractor} from "./FitLeafInteractor"
import {REC_MENU_SPOT, aimMenuAt, mark, prepareMenu, spawnAtUser} from "./RecHelpers"

/** Recording only (c07): pinch the orb, the menu opens, add a Dell SE2722H, close the menu. */
@component
export class RecAddScenario extends Scenario {
  async run(): Promise<void> {
    const it = new FitLeafInteractor()
    const app = FitApp.instance
    const menu = findSceneObjectByName("Menu").getComponent(FitMenu.getTypeName()) as FitMenu
    app.removeAll()
    if (menu.isOpen) menu.close()
    spawnAtUser(app, true)
    aimMenuAt(menu, REC_MENU_SPOT)
    await prepareMenu(menu, sleep)
    await sleep(2500)

    mark("start")
    await sleep(1000)
    mark("pinch-orb")
    await it.tap("Menu Orb")
    await sleep(1400)
    mark("add")
    await it.tap("Add SE2722H")
    await sleep(1800)
    mark("close")
    await it.tap("Close")
    await sleep(1500)
    mark("end")
    spawnAtUser(app, false)
  }
}

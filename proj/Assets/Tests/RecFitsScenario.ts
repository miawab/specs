import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {findSceneObjectByName, sleep} from "Leaf.lspkg/Utils/common/Utils"
import {FitApp} from "../Scripts/FitApp"
import {CUE_HOLD_SECONDS} from "../Scripts/FitConfig"
import {FitMenu} from "../Scripts/FitMenu"
import {FitLeafInteractor} from "./FitLeafInteractor"
import {REC_MENU_SPOT, aimMenuAt, mark, place, prepareMenu, spawnAtUser} from "./RecHelpers"

/**
 * Recording only (c09): with the SE2722H stuck at the shelf and the menu open, switch to the
 * P2722H, lower its stand with the slider, close the menu, slide it under; the green cue holds.
 */
@component
export class RecFitsScenario extends Scenario {
  async run(): Promise<void> {
    const it = new FitLeafInteractor()
    const app = FitApp.instance
    const menu = findSceneObjectByName("Menu").getComponent(FitMenu.getTypeName()) as FitMenu
    app.removeAll()
    if (menu.isOpen) menu.close()
    app.cue.holdSeconds = CUE_HOLD_SECONDS
    spawnAtUser(app, true)
    aimMenuAt(menu, REC_MENU_SPOT)
    await prepareMenu(menu, sleep)
    // Setup (trimmed out of the clip): SE2722H against the shelf, menu open, SE selected.
    const se = app.addMonitor("SE2722H")
    const shelf = app.room.shelf
    place(se, 0, app.room.desk.max.y, shelf.max.z + se.spec.depth / 2 + 0.05)
    await it.tap("Menu Orb")
    app.select(se)
    await sleep(3000)

    mark("start")
    await sleep(700)
    mark("delete")
    await it.tap("Delete")
    await sleep(700)
    mark("add")
    await it.tap("Add P2722H")
    const p = app.selected
    await sleep(900)
    mark("slider")
    const left = findSceneObjectByName("Height Slider").getTransform().left
    await it.drag(it.find("Height Slider"), left.uniformScale(0.5), 1500)
    await sleep(600)
    mark("close")
    await it.tap("Close")
    await sleep(500)
    mark("slide")
    await it.dragMonitor(p.displayName, new vec3(0, 0, -0.6), 2000)
    mark("released")
    await sleep(2700)
    mark("end")
    spawnAtUser(app, false)
  }
}

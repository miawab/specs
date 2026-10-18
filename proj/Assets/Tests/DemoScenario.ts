import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {findSceneObjectByName, sleep} from "Leaf.lspkg/Utils/common/Utils"
import {FitApp} from "../Scripts/FitApp"
import {FitMenu} from "../Scripts/FitMenu"
import {FitLeafInteractor} from "./FitLeafInteractor"

/**
 * Not a test: plays the storyboard's shelf moment slowly and leaves the result on screen,
 * for screenshots and video capture. Paces are human-ish.
 */
@component
export class DemoScenario extends Scenario {
  async run(): Promise<void> {
    const it = new FitLeafInteractor()
    const app = FitApp.instance
    const hold = this.holdCue ? 20 : 2
    app.cue.holdSeconds = hold
    const menu = findSceneObjectByName("Menu").getComponent(FitMenu.getTypeName()) as FitMenu
    await sleep(600)
    app.removeAll()
    if (menu.isOpen) menu.close()
    await sleep(1000)

    await it.tap("Menu Orb")
    await sleep(1200)
    await it.tap("Add SE2722H")
    await sleep(1200)
    const se = app.selected
    await it.dragMonitor(se.displayName, new vec3(0, 0, -0.5), 2500)
    await sleep(2500)

    await it.tap("Delete")
    await sleep(800)
    await it.tap("Add P2722H")
    await sleep(1200)
    const p = app.selected
    await it.dragMonitor(p.displayName, new vec3(0, 0, -0.5), 2500)
    await sleep(1500)
    const left = findSceneObjectByName("Height Slider").getTransform().left
    await it.drag(it.find("Height Slider"), left.uniformScale(0.4), 2500)
    await sleep(1000)
    menu.close() // keep the shot to monitor, desk and shelf
    await sleep(300)
    await it.dragMonitor(p.displayName, new vec3(0, 0, -0.5), 2500)
    // Returns with the green cue still up (for a capture); tests reset holdSeconds themselves.
  }

  /** Keep each cue up for 20 s so screenshots can catch it. */
  protected holdCue = true
}

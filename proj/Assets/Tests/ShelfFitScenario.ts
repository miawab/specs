import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {findSceneObjectByName, sleep} from "Leaf.lspkg/Utils/common/Utils"
import {FitApp} from "../Scripts/FitApp"
import {CUE_HOLD_SECONDS} from "../Scripts/FitConfig"
import {FitMenu} from "../Scripts/FitMenu"
import {FitLeafInteractor} from "./FitLeafInteractor"

/**
 * Done criterion 4, the small space: slide the SE2722H toward the wall and it stops at the shelf
 * with "5.6 cm too tall". Switch to the P2722H, lower its stand with the slider, and it slides
 * under with "1.9 cm to spare". Everything goes through the menu and a real grab-and-drag.
 */
@component
export class ShelfFitScenario extends Scenario {
  async run(): Promise<void> {
    const it = new FitLeafInteractor()
    const app = FitApp.instance
    const menu = findSceneObjectByName("Menu").getComponent(FitMenu.getTypeName()) as FitMenu
    await sleep(800)
    app.removeAll()
    app.cue.holdSeconds = CUE_HOLD_SECONDS
    const shelf = app.room.shelf
    expect(shelf !== null).toBe(true)
    if (!menu.isOpen) await it.tap("Menu Orb")
    expect(menu.isOpen).toBe(true)
    await sleep(400)

    // 1. Fixed-stand SE2722H: push it toward the wall.
    await it.tap("Add SE2722H")
    const se = app.selected
    expect(se.spec.id).toBe("SE2722H")
    expect(se.height).toBeCloseTo(45.9, 2)
    expect(menu.sliderInactive).toBe(true) // fixed stand: slider greyed out
    await it.dragMonitor(se.displayName, new vec3(0, 0, -1.2), 1500)

    expect(se.box.min.z).toBeCloseTo(shelf.max.z, 0) // stopped at the shelf's front edge
    expect(se.isUnderShelf()).toBe(false)
    expect(se.shelfBlockCount).toBeGreaterThan(0)
    expect(app.cue.kind).toBe("blocked")
    expect(app.cue.message).toBe("5.6 cm too tall")
    print(`[FitTest] SE2722H stopped at z=${se.box.min.z.toFixed(2)} (shelf edge ${shelf.max.z}): "${app.cue.message}"`)
    // Red measuring line spans the overlap; labels stay out of the cue's way.
    expect(app.cue.lineVisible).toBe(true)
    expect(app.cue.lineLength).toBeCloseTo(5.6, 1)
    expect(se.tagVisible).toBe(false)

    // Cue fades about 2 s after the user stops pushing.
    await sleep(3000)
    expect(app.cue.visible).toBe(false)
    expect(app.cue.lineVisible).toBe(false)
    expect(se.tagVisible).toBe(true) // name tag back once the cue is gone

    // 2. Switch to the P2722H (delete the SE, add the P). At its highest it is blocked too.
    await it.tap("Delete")
    await it.tap("Add P2722H")
    const p = app.selected
    expect(p.spec.id).toBe("P2722H")
    expect(p.height).toBeCloseTo(53.4, 2)
    await sleep(300)
    expect(menu.sliderInactive).toBe(false)
    await it.dragMonitor(p.displayName, new vec3(0, 0, -1.2), 1500)
    expect(p.isUnderShelf()).toBe(false)
    expect(app.cue.message).toBe("13.1 cm too tall")

    // 3. Lower its stand with the slider, then push again: it slides under.
    const sliderObj = findSceneObjectByName("Height Slider")
    const left = sliderObj.getTransform().left
    await it.drag(it.find("Height Slider"), left.uniformScale(1.0), 1200)
    await sleep(400)
    print(`[FitTest] Slider lowered the stand to ${p.height.toFixed(2)} cm`)
    expect(p.height).toBeCloseTo(38.4, 1)
    await it.dragMonitor(p.displayName, new vec3(0, 0, -1.2), 1500)
    expect(p.isUnderShelf()).toBe(true)
    expect(app.cue.kind).toBe("fits")
    expect(app.cue.message).toBe("1.9 cm to spare")
    print(`[FitTest] P2722H under the shelf, back at z=${p.box.min.z.toFixed(2)}: "${app.cue.message}"`)
    // Green measuring line spans the gap.
    expect(app.cue.lineVisible).toBe(true)
    expect(app.cue.lineLength).toBeCloseTo(1.9, 1)
    expect(p.tagVisible).toBe(false)

    // 4. Under the shelf it can't be raised through it.
    await it.drag(it.find("Height Slider"), left.uniformScale(-1.0), 1200)
    await sleep(300)
    expect(p.height <= 40.3).toBe(true)
    expect(p.isUnderShelf()).toBe(true)
    print(`[FitTest] Raising under the shelf stopped at ${p.height.toFixed(2)} cm: "${app.cue.message}"`)

    await sleep(500)
    app.removeAll()
    menu.close()
  }
}

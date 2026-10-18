import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {findSceneObjectByName, sleep} from "Leaf.lspkg/Utils/common/Utils"
import WorldCameraFinderProvider from "SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider"
import {FitApp} from "../Scripts/FitApp"
import {FitMenu} from "../Scripts/FitMenu"
import {FitLeafInteractor} from "./FitLeafInteractor"

/**
 * Done criterion 5, the menu: pinch the orb and the menu opens. Add a P2722H and it appears in
 * front of the user as the next Dell number. Delete it and it's gone. Close hides the menu.
 */
@component
export class MenuScenario extends Scenario {
  async run(): Promise<void> {
    const it = new FitLeafInteractor()
    const app = FitApp.instance
    const menu = findSceneObjectByName("Menu").getComponent(FitMenu.getTypeName()) as FitMenu
    await sleep(800)
    app.removeAll()
    if (menu.isOpen) menu.close()
    await sleep(200)

    // Pinch the orb: the menu opens.
    await it.tap("Menu Orb")
    expect(menu.isOpen).toBe(true)
    await sleep(500)

    // It opens in front of the user (not behind), about 70 cm away and below eye level.
    const camT = WorldCameraFinderProvider.getInstance().getTransform()
    const look = camT.getWorldRotation().multiplyVec3(new vec3(0, 0, -1))
    const toMenu = menu.getSceneObject().getTransform().getWorldPosition().sub(camT.getWorldPosition())
    print(`[FitTest] Menu opened at offset ${toMenu.toString()} from the eye`)
    expect(toMenu.dot(new vec3(look.x, 0, look.z).normalize()) > 20).toBe(true)
    expect(toMenu.length > 50 && toMenu.length < 85).toBe(true)
    expect(toMenu.y < 0).toBe(true)

    // Add a P2722H.
    const before = app.monitors.map((m) => m.displayName)
    await it.tap("Add P2722H")
    await sleep(300)
    expect(app.monitors.length).toBe(before.length + 1)
    const added = app.monitors[app.monitors.length - 1]
    expect(added.spec.id).toBe("P2722H")
    expect(/^Dell \d+$/.test(added.displayName)).toBe(true)
    expect(before.indexOf(added.displayName)).toBe(-1)
    expect(app.selected === added).toBe(true)
    print(`[FitTest] Added ${added.displayName} at ${added.position.toString()}`)

    // It appears in front of the user, standing on the desk near its front edge.
    const desk = app.room.desk
    expect(added.position.y).toBeCloseTo(desk.max.y, 1)
    expect(desk.max.z - added.box.max.z < 10).toBe(true)
    const cam = WorldCameraFinderProvider.getInstance().getWorldPosition()
    expect(Math.abs(added.position.x - cam.x) < 35).toBe(true)
    expect(added.position.z < cam.z).toBe(true)

    // Its room-list button exists.
    await sleep(300)
    expect(findSceneObjectByName("Room " + added.displayName) !== undefined).toBe(true)

    // Delete it: it's gone.
    const name = added.displayName
    await it.tap("Delete")
    await sleep(300)
    expect(app.findMonitor(name)).toBeNull()
    expect(app.monitors.length).toBe(before.length)
    expect(findSceneObjectByName(name) === undefined).toBe(true)

    // Close hides the menu.
    await it.tap("Close")
    expect(menu.isOpen).toBe(false)
  }
}

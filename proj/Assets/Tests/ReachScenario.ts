import {DiagnosticRecorder} from "Leaf.lspkg/Diagnostic/DiagnosticRecorder"
import {createIKInteractor} from "Leaf.lspkg/Interactors/interactor/ik/visualizer/BitmojiAvatar"
import {findInteractableByName} from "Leaf.lspkg/Interactors/InteractableUtils"
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {findSceneObjectByName, sleep} from "Leaf.lspkg/Utils/common/Utils"
import {FitApp} from "../Scripts/FitApp"
import {FitMenu} from "../Scripts/FitMenu"

/**
 * Reachability (supports criterion 5): a simulated full arm and head reach for the orb and the
 * menu buttons the way a standing user would. A reach that can't converge fails the scenario.
 */
@component
export class ReachScenario extends Scenario {
  private readonly ik = createIKInteractor()

  /** Reaches for a control; fails with LEAF's reach report if the arm can't get there. */
  private async reach(name: string): Promise<void> {
    await this.ik.trigger(findInteractableByName(name))
    const recorder = DiagnosticRecorder.getInstance()
    if (recorder.hasErrors()) {
      print(`[FitTest] Reach report for "${name}":
${recorder.toReport()}`)
      throw new Error(`IK could not reach "${name}" (see reach report)`)
    }
    print(`[FitTest] IK reached "${name}"`)
  }

  async run(): Promise<void> {
    const app = FitApp.instance
    const menu = findSceneObjectByName("Menu").getComponent(FitMenu.getTypeName()) as FitMenu
    await sleep(1000)
    app.removeAll()
    if (menu.isOpen) menu.close()
    await sleep(300)

    await this.reach("Menu Orb")
    await sleep(800)
    expect(menu.isOpen).toBe(true)

    const before = app.monitors.length
    await this.reach("Add P2722H")
    await sleep(800)
    expect(app.monitors.length).toBe(before + 1)

    await this.reach("Delete")
    await sleep(800)
    expect(app.monitors.length).toBe(before)

    await this.reach("Close")
    await sleep(800)
    expect(menu.isOpen).toBe(false)
  }
}

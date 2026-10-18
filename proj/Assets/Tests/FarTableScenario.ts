import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {sleep} from "Leaf.lspkg/Utils/common/Utils"
import WorldCameraFinderProvider from "SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider"
import {FitApp} from "../Scripts/FitApp"
import {Monitor} from "../Scripts/Monitor"
import {FitLeafInteractor} from "./FitLeafInteractor"
import {expectUprightRealSize} from "./MoveOnDeskScenario"

function angleBetween(eye: vec3, p: vec3, q: vec3): number {
  const a = p.sub(eye).normalize()
  const b = q.sub(eye).normalize()
  return (Math.acos(Math.max(-1, Math.min(1, a.dot(b)))) * 180) / Math.PI
}

/** Angle (degrees) the panel's width covers at the user's eye (shrinks with distance and with viewing angle). */
function angularWidth(m: Monitor): number {
  const eye = WorldCameraFinderProvider.getInstance().getWorldPosition()
  const p = m.position.add(new vec3(0, m.height - m.spec.panelHeight / 2, 0))
  const half = new vec3(m.spec.width / 2, 0, 0)
  return angleBetween(eye, p.sub(half), p.add(half))
}

/** Angle (degrees) the panel's height covers at the user's eye: how big it looks, regardless of which way it faces. */
function angularHeight(m: Monitor): number {
  const eye = WorldCameraFinderProvider.getInstance().getWorldPosition()
  const top = m.position.add(new vec3(0, m.height, 0))
  const bottom = m.position.add(new vec3(0, m.height - m.spec.panelHeight, 0))
  return angleBetween(eye, bottom, top)
}

/**
 * Done criterion 3, real size from far away: put a monitor on the second table across the room.
 * From where the user stands it looks smaller, the way a real object would; it is still 62 cm wide.
 */
@component
export class FarTableScenario extends Scenario {
  async run(): Promise<void> {
    const it = new FitLeafInteractor()
    const app = FitApp.instance
    await sleep(800)
    app.removeAll()
    const table = app.room.surfaces.filter((s) => s.name === "Table")[0]
    expect(table !== undefined).toBe(true)

    // Carry an SE2722H from the desk to the table in one grab: right past the wall, then across.
    const m = app.addMonitor("SE2722H")
    const start = m.position
    const tableCenter = table.box.min.add(table.box.max).uniformScale(0.5)
    const dx = tableCenter.x - start.x
    const dz = tableCenter.z - start.z
    await it.dragAlongPath(m.displayName, [new vec3(dx - 25, 0, 0), new vec3(dx, 0, dz)], 2.0)
    await sleep(800)

    const p = m.position
    print(`[FitTest] ${m.displayName} carried to ${p.toString()} (table centre ${tableCenter.toString()})`)
    expect(table.box.containsXZ(p.x, p.z)).toBe(true)
    expect(p.y).toBeCloseTo(table.top, 2) // standing on the table, not the floor
    expect(m.isFalling).toBe(false)
    expectUprightRealSize(m) // still 62.3 cm wide
    expect(m.spec.width).toBeCloseTo(62.3, 2)

    const cam = WorldCameraFinderProvider.getInstance().getWorldPosition()
    const farDistance = cam.distance(p)
    expect(farDistance > 200).toBe(true) // about 2.5 m away

    // Compare with the same model on the desk, near the user.
    const near = app.addMonitor("SE2722H")
    const nearDistance = cam.distance(near.position)
    const farW = angularHeight(m)
    const nearW = angularHeight(near)
    print(
      `[FitTest] Same monitor's panel looks ${nearW.toFixed(1)} deg tall at ${nearDistance.toFixed(0)} cm, ` +
        `${farW.toFixed(1)} deg at ${farDistance.toFixed(0)} cm ` +
        `(width ${angularWidth(near).toFixed(1)} vs ${angularWidth(m).toFixed(1)} deg, also foreshortened by the side view)`,
    )
    expect(farW < nearW * 0.6).toBe(true) // looks smaller far away
    // Perspective, like a real object: apparent size falls off roughly with distance.
    const ratio = farW / nearW
    const expected = nearDistance / farDistance
    expect(Math.abs(ratio - expected) / expected < 0.35).toBe(true)

    await sleep(500)
    app.removeAll()
  }
}

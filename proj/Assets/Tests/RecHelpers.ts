import WorldCameraFinderProvider from "SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider"
import {FitApp} from "../Scripts/FitApp"
import {FitMenu} from "../Scripts/FitMenu"
import {Monitor} from "../Scripts/Monitor"
import {findSceneObjectByName} from "Leaf.lspkg/Utils/common/Utils"

/**
 * Helpers for the demo-video recording scenarios (test code only; the Lens is unchanged).
 * The preview camera is a 3/4 spectator during recording, while the "user" sits at x = 0.
 */

const state = {spawnAtUser: false, installed: false}

/** Prints a timestamp mark the recorder uses to trim clips. */
export function mark(name: string): void {
  print(`[FitRec] mark ${name} ${Date.now()}`)
}

/**
 * While on, a monitor added from the menu is placed in front of the seated user (x = 0) in the
 * same frame it is created, instead of in front of the spectator camera.
 */
export function spawnAtUser(app: FitApp, on: boolean): void {
  state.spawnAtUser = on
  if (state.installed) return
  state.installed = true
  app.onChanged((kind) => {
    if (kind !== "list" || !state.spawnAtUser || app.monitors.length === 0) return
    const m = app.monitors[app.monitors.length - 1]
    if (!m.isDragging && Math.abs(m.position.x) > 0.01 && m.position.y === app.room.desk.max.y) {
      const p = m.position
      m.position = new vec3(0, p.y, p.z)
    }
  })
}

/** Makes the menu open at `world` (facing the camera) by setting its own placement inputs. */
export function aimMenuAt(menu: FitMenu, world: vec3): void {
  const cam = WorldCameraFinderProvider.getInstance().getTransform()
  const camPos = cam.getWorldPosition()
  const look = cam.getWorldRotation().multiplyVec3(new vec3(0, 0, -1))
  const f = new vec3(look.x, 0, look.z).normalize()
  const to = world.sub(camPos)
  const t = new vec3(to.x, 0, to.z)
  menu.openDistance = t.length
  menu.openDrop = camPos.y - world.y
  // FitMenu turns the flat view direction right by openAngle: dir = (fx cos a - fz sin a, fx sin a + fz cos a).
  const a = Math.atan2(f.x * t.z - f.z * t.x, f.x * t.x + f.z * t.z)
  menu.openAngle = (a * 180) / Math.PI
}

/** Puts a monitor straight at a spot on a surface (setup only, before a clip starts). */
export function place(m: Monitor, x: number, y: number, z: number): void {
  m.position = new vec3(x, y, z)
}

/**
 * Setup before a menu clip: put the orb on the desk front (in the 3/4 shot) and open and close the
 * menu once so UI Kit has laid it out before it opens on camera.
 */
export async function prepareMenu(menu: FitMenu, wait: (ms: number) => Promise<void>): Promise<void> {
  const orb = findSceneObjectByName("Menu Orb")
  orb.getTransform().setWorldPosition(REC_ORB_SPOT)
  menu.open()
  await wait(600)
  menu.close()
  await wait(200)
}

/** Recording spots, chosen for the 3/4 seated camera at (-95, 12, -20) looking at (5, -28, -128). */
export const REC_ORB_SPOT = new vec3(-16, -42.5, -92)
export const REC_MENU_SPOT = new vec3(-33, -16, -113)

/**
 * Fit Check: hard-coded stand-in data.
 * All sizes are centimeters. The real product would read these from retailer spec sheets.
 */

export type StandType = "fixed" | "adjustable"

export interface MonitorSpec {
  id: string
  label: string
  stand: StandType
  /** Overall width of the panel (cm). */
  width: number
  /** Footprint depth (cm). Not on the spec sheets; 17 cm default per brief. */
  depth: number
  /** Panel height including bezel (cm). */
  panelHeight: number
  /** Overall height with stand: fixed value, or the adjustable range. */
  minHeight: number
  maxHeight: number
  /** Height a new monitor starts at. */
  startHeight: number
}

export const CATALOG: MonitorSpec[] = [
  {
    id: "SE2722H",
    label: "Dell SE2722H",
    stand: "fixed",
    width: 62.3,
    depth: 17,
    panelHeight: 36.6,
    minHeight: 45.9,
    maxHeight: 45.9,
    startHeight: 45.9,
  },
  {
    id: "P2722H",
    label: "Dell P2722H",
    stand: "adjustable",
    width: 61.0,
    depth: 17,
    panelHeight: 36.2,
    minHeight: 38.4,
    maxHeight: 53.4,
    startHeight: 53.4,
  },
]

export function findSpec(id: string): MonitorSpec | null {
  for (const spec of CATALOG) {
    if (spec.id === id) return spec
  }
  return null
}

/** Colors. The display is additive: keep everything light, never black. */
export const COLORS = {
  ghostFill: new vec4(0.82, 0.84, 0.88, 0.28),
  screenTint: new vec4(0.62, 0.82, 1.0, 0.32), // faint light blue, never dark
  outline: new vec4(0.35, 0.95, 1.0, 1.0),
  outlineHover: new vec4(1.0, 1.0, 1.0, 1.0),
  outlineSelected: new vec4(1.0, 0.92, 0.35, 1.0),
  cueRed: new vec4(1.0, 0.35, 0.3, 1.0),
  cueGreen: new vec4(0.4, 1.0, 0.5, 1.0),
  text: new vec4(0.95, 0.97, 1.0, 1.0),
}

/** Seconds a fit cue stays fully visible after the last push, then it fades. */
export const CUE_HOLD_SECONDS = 2.0
export const CUE_FADE_SECONDS = 0.6

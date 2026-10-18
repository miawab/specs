# Fit Check

A Lens for Snap's SPECS glasses that puts a monitor at its real size on your desk, so you know it fits before you buy.

Two Dells both say "27 inch". Under my shelf (a 40.3 cm gap), the fixed-stand **Dell SE2722H** stops with **"5.6 cm too tall"**. The height-adjustable **Dell P2722H**, lowered to 38.4 cm, slides under with **"1.9 cm to spare"**. The stand decides, not the screen.

## What's here
| Path | What |
|---|---|
| `proj/devpost/design-brief.md` | The design brief |
| `proj/proj.esproj` | The Lens Studio project (Lens Studio 5.24+) |
| `proj/Assets/Scripts/` | The Lens: room model, monitor ghosts, fit cue, menu orb and menu, spec data (`FitConfig.ts`) |
| `proj/Assets/Tests/` | LEAF scenarios, one per done criterion plus a reach check (6 of 6 pass) and the demo recording scenes |
| `fit-facts.md` | My desk measurements and the two Dell spec sheets, with sources |

## Try it
1. Open `proj/proj.esproj` in Lens Studio 5.24 or later.
2. In the Preview panel, use Interactive Preview: WASD to move, right-drag to look, click to pinch.
3. Pinch the orb on the desk corner, add a monitor, and drag it toward the wall under the shelf.

In the preview, the desk, shelf and room are stand-ins built to my real measurements. On glasses, the Lens would measure your room instead.

## License
MIT

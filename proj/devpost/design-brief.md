---
status: approved
---

# Design brief: Fit Check

<!-- Filled in by plan-lens from the learner's interview. Use the learner's words. Mark any value they didn't choose as (default). -->

## The one spatial moment
Standing at my desk, I place a real-size 27" Dell monitor on it and slide it toward the wall under my shelf. The fixed-stand SE2722H stops at the shelf with "5.6 cm too tall". I switch to the height-adjustable P2722H, lower its stand with a slider, and it slides under with 1.9 cm to spare. Both listings say "27 inch"; the stand decides whether it fits.

## Why it belongs on glasses
- Uses: draws in the world (a monitor at true size on my own desk).
- Why it's better than the phone or laptop version: a spec sheet or a phone photo can't show whether a monitor fits *my* desk under *my* shelf. Seeing it at real size in my space, and trying to push it where it can't go, settles it before buying, or before carrying a borrowed monitor home.
- The pitch around the demo: in the real product the glasses measure your room, and sellers publish their items' dimensions and abilities (like Dell's spec sheets), so you can try any physical product in your space before buying online.

## Product or overlay
- Type: product. The virtual monitor and the fit check are the experience.
- What the real version would sense: the real room's dimensions (desk, shelf, floor), plus product dimensions published by retailers.
- Stand-in for the preview:
  - **Room:** a virtual desk and shelf built at my measured sizes (below). Keep them obviously virtual in the scene.
  - **Retailer data:** the two Dell spec sheets, hard-coded:

    | Monitor | Stand | Height with stand | Width | Depth |
    |---|---|---|---|---|
    | Dell SE2722H | Fixed (tilt only) | 45.9 cm | 62.3 cm | 17 cm (default) |
    | Dell P2722H | Height-adjustable, 15 cm range | 38.4 cm lowest to 53.4 cm highest | 61.0 cm | 17 cm (default) |

## Where things live
- Where the user is looking during the main task: down at the desk, at the monitor and the shelf above it.
- **Desk:** 120 cm wide, 61 cm deep, 75 cm tall (default). Back edge against a virtual wall. Front edge about 50 cm in front of the user at start (default), centered.
- **Shelf:** on the wall above the desk. Lowest edge 40.3 cm above the desktop, about 28 cm deep from the wall, running the full desk width. My real shelf is zigzag (W-shaped); a straight shelf at the lowest edge height is fine for the demo (default).
- **Second table:** a plain table about 2.5 m away across the room (default), for the "real size from far away" check.
- **Floor:** a virtual floor so dropped monitors have somewhere to land.
- **Monitors:** real size per the spec table. Added monitors appear in front of the user, on the desk near its front edge (default). Named Dell 1, Dell 2, and so on as they're added.
- **Menu orb:** a small orb, about 5 cm (default), at the front-right corner of the desk (default). It can't be added or deleted. The user can grab it and put it anywhere.
- **Menu:** opens about 55 cm in front of the user, a little below eye level and beside the desk so it doesn't cover the shelf (default). Roughly 30 × 25 cm (default).
- **Fit cue:** on the shelf edge, right where the monitor is blocked.

## Hands and input
- **Move a monitor:** grab it and drag it. It slides along the surface it's on and stays upright.
- **Blocked where it can't fit:** the monitor can't be pushed into a space it doesn't fit. If its top is above 40.3 cm, it stops at the shelf's front edge instead of passing under or through it.
- **Drop:** drag a monitor off the desk edge and let go. It falls to the floor and lands upright.
- **Open the menu:** pinch the orb. **Move the orb:** grab and drag it.
- **Menu contents:**
  - A list of the catalog: Dell SE2722H and Dell P2722H. Pinch one to **Add** it.
  - A list of monitors in the room (Dell 1, Dell 2, …). Pinch one to select it.
  - **Delete** removes the selected monitor.
  - **Height slider** for the selected monitor, 38.4 to 53.4 cm. Only for adjustable stands; hidden or greyed for the SE2722H.
  - **Close.**
- Targets are big and highlight when aimed at.
- Voice: none.

## When things show
- **Menu:** hidden until the orb is pinched; hides on Close.
- **Fit cue when blocked:** the shelf edge glows red with "5.6 cm too tall" (the actual amount over 40.3 cm), shown only while the monitor is pushed against the shelf. It fades about 2 s after the user stops pushing (default).
- **Fit cue when it fits:** when a monitor slides under the shelf, a green "1.9 cm to spare" (the actual gap) shows briefly at the shelf edge, then fades (default).
- If something needs attention out of view: none.

## Done criteria
Each one can be checked in Lens Studio's preview.
1. **Move it on the desk:** grab a monitor and slide it across the desk. It stays standing on the desktop, at real size.
2. **Drop it:** drag it off the edge of the desk and let go. It falls to the floor and lands upright.
3. **Real size from far away:** put a monitor on the second table across the room. Walk back and it looks smaller, the way a real object would. Walk up to it and it's still 62 cm wide.
4. **The small space, my shelf:** slide the SE2722H toward the wall. It stops at the shelf with "5.6 cm too tall". Switch to the P2722H, lower its stand with the slider, and it slides under with "1.9 cm to spare".
5. **The menu:** pinch the orb and the menu opens. Add a P2722H and it appears in front of me as Dell 1 (or the next number). Delete it and it's gone. Close hides the menu.

## Out of scope
- Scanning the real room. The desk, shelf and table are virtual stand-ins.
- Live retailer data or a product search. The catalog is the two hard-coded Dells.
- Editing other monitor properties, or turning or rotating monitors.
- "Calling back" the orb with a gesture or voice.
- Other furniture, and planning a whole room.
- The price-checking and bargaining assistant (a separate project).

## Risks and open questions
- **Slanted surfaces:** dropped from the done criteria. What a monitor should do on a tilted surface (slide off, tip over, refuse with a cue) is still open.
- **Zigzag shelf** simplified to a straight shelf at the lowest edge height.
- **Monitor depth** (17 cm) is a default; the spec sheets in `fit-facts.md` don't list it.
- Feel unproven: whether real-size placement *feels* convincing enough to trust before buying can only be judged on real glasses.

## Build notes for CLAD
- Build for SPECS so it runs and can be demonstrated in Lens Studio's preview. No SPECS device is available.
- Use Spectacles Interaction Kit (SIK) and UI Kit for all interactions, so they work with the mouse in Interactive Preview and with LEAF.
- Build any stand-in exactly as described above, and keep it obvious in the scene.
- Use real-world scale in centimeters. Keep content inside the user's view during the main task.
- The display is additive: black renders as transparent. Don't rely on black or very dark content to be seen; keep text light and readable from where the user stands.
- Get the basic flow working first, then add detail.
- Write LEAF scenarios for each done criterion, run them in preview, and report which pass. Say which criteria have no test.
- Don't record, identify, or follow people.

## After the build: judge it
This part is for you, after CLAD finishes.

1. **Does it work?** Ask your agent which LEAF tests passed and which done criteria have no test.
2. **Walk around it.** Open the preview in Interactive Preview. Use WASD to move, Q and E to go down and up, and right-drag (or hold Shift) to look around. Clicking acts as a pinch. Stand where a user would and look at the task.
3. **Ask the three questions.**
   - Does it use what I'm looking at?
   - Does it put something in my space, where it belongs?
   - Does it free my hands or let me keep my eyes up?
   - Would it be just as good on a phone? If so, what would make it need the glasses?
4. **Check comfort.**
   - Everything I need is in view while I do the task. Nothing sits at the edges, behind me, or stuck to my face.
   - Every control is within reach of someone standing there.
   - Text reads easily from where I stand. No dark UI disappearing.
   - Things show when needed and get out of the way.
5. **Label what you know.** Write "logic proven" next to anything the tests and preview show working, and "feel unproven" next to anything only real glasses could tell you (comfort over time, real hand tracking, real recognition).
6. **Fix with design notes, not code.** Tell your agent what to change in design terms, for example: "Move the step card 15 cm lower and next to the pan. Make the Next button twice as big. Re-run the tests." If a fix takes under a minute, like nudging a panel, do it yourself in the scene.
7. **Submit.** Record a video under 3 minutes of your Lens in the preview, public on YouTube. Make your repo public with your Lens Studio project and this `devpost/` folder. Details are on the hackathon site: https://learn-specs.devpost.com/resources

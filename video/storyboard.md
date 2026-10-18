# Video storyboard: Fit Check (target 2:45, hard cap 2:59)

v2, 2026-10-18. Decisions (user): real desk photos OK with the monitor screen blurred; high-quality TTS voice; Remotion.

## What the video has to do
- Rules: under 3 min, public YouTube, shows the Lens working in the Lens Studio preview. Reviewers don't run the repo. "If you can, also talk about your design process."
- Judges (Devpost staff) score: Design (a complete product), Technical (use of CLAD, Lens Studio, the MCP), Innovation, Presentation (problem, who it's for, why it matters, easy to follow).
- Style rules: big text, big zooms on the one thing that matters, empty space, one idea per frame, captions 44 px or more, no interpuncts or em dashes on screen. Voice: short plain sentences, point first, talking to the viewer.

## The story in one line
Two monitors, both "27 inch". One fits under my shelf, one doesn't. The listing can't tell you which. Fit Check can.

## Engagement tricks
- **A question in the first 5 seconds** the viewer wants answered ("which one fits?"), answered only at 1:45.
- **A stick figure of me** acts out the bad ending (carrying the box home, clunk into the shelf), so the stakes are felt, not explained.
- **Sound design:** a dull *clunk* every time something hits the shelf (photo beat, stick figure, red cue) and a soft *chime* for the green fit. The viewer learns the two sounds early, so the payoff lands by ear too.
- **A guess:** the viewer is asked to pick A or B at 0:30. The reveal at 1:45 pays it off.
- **Callback ending:** the last line echoes the first.

| # | Time | Picture | Sound + voiceover |
|---|---|---|---|
| 1 | 0:00 to 0:05 | Black. Two identical monitor silhouettes fade in side by side, both labelled **27 inch**. A big **?** between them. | VO: "These are both twenty-seven inch monitors. Only one of them fits on my desk." |
| 2 | 0:05 to 0:14 | My real desk photo (front, screen blurred). Slow push in toward the shelf above the monitor. | VO: "This is my desk. And this shelf is the problem." |
| 3 | 0:14 to 0:26 | A measuring line draws itself from desk top to shelf: **40.3 cm**. Cut to the side photo: my 24 inch sitting out in front of the shelf. Label: **pushed 29 cm out**. Then a bracket over the leftover desk: **32 cm left for everything else**. | *clunk* as the side photo lands. VO: "Forty centimetres. My current monitor doesn't even fit under it, so it sits out front and eats half my desk." |
| 4 | 0:26 to 0:40 | The two listing cards slide in: **Dell SE2722H, 27 inch** and **Dell P2722H, 27 inch**. Same size, both look the same. Big text: **Which one fits?** A 3 second countdown ring. | VO: "So I went shopping for a bigger one. Here are two. Same size. Which one would you buy?" |
| 5 | 0:40 to 0:52 | Stick figure me carries a big box home, unboxes, lifts the monitor toward the shelf. **CLUNK.** It doesn't fit. Stick figure looks at the camera. Text: **No returns.** | *clunk*. VO: "Pick wrong, and you find out at home. With a box, a receipt, and no way back." |
| 6 | 0:52 to 1:00 | Title card, big: **Fit Check**. Under it: **Try it on your desk before you buy.** Small: *A Lens for Snap's SPECS glasses* | soft whoosh. VO: "So I designed Fit Check. A Lens for Snap's SPECS glasses." |
| 7 | 1:00 to 1:15 | **Preview footage**, 3/4 view. The desk and shelf, built to my real measurements. Label: **my desk, my measurements**. Pinch the orb, the menu opens, pinch **Dell SE2722H**. A bright ghost monitor appears on the desk, real size. | VO: "It rebuilds my desk at its real size. Pick a monitor, and the seller's own spec sheet puts it right there." |
| 8 | 1:15 to 1:32 | Grab it, slide it toward the wall. It stops at the shelf. **CLUNK.** Red measuring line. Huge zoom: **5.6 cm too tall**. | *clunk*. VO: "Push it under the shelf. It stops. Five point six centimetres too tall. That's the one I would have bought." |
| 9 | 1:32 to 1:52 | Menu: **Dell P2722H**. Grab the height slider and drag it all the way down. Slide the monitor back. It glides under. Green line. Huge zoom: **1.9 cm to spare**. Hold 2 s. | *chime*. VO: "Same size. Different stand. Drop it to its lowest, and it slides right under. One point nine centimetres to spare." |
| 10 | 1:52 to 2:00 | Back to the two silhouettes from beat 1. The left one gets a red **✕**, the right one a green **✓**. Text: **The stand decides. Not the screen.** | VO: "The listing says twenty-seven inch. The stand decides if it fits." |
| 11 | 2:00 to 2:10 | Preview: walk across the room to the far table. The monitor on it looks small, then walk up close. Label: **still 62 cm wide**. | VO: "And it behaves like a real object. Far away it's small. Up close, it's still sixty-two centimetres." |
| 12 | 2:10 to 2:30 | **How it was built.** Three cards, one at a time: **"One moment, done well: will it fit under my shelf?"** **"Black disappears on glasses, so the monitors are bright ghosts."** **"Planned with Devpost's skill pack. Built by Snap's CLAD agents."** Then a big counter ticks up: **5 of 5 tests pass**. | VO: "I planned one moment and kept it small. Bright ghosts, because black disappears on glasses. Snap's CLAD agents built it, and wrote automated tests for every step. All five pass." |
| 13 | 2:30 to 2:40 | Plain frame, two lines: **"Here, my desk and the specs are typed in."** **"On real glasses, it measures your room. Any product, any desk."** | VO: "Here, the desk and specs are typed in. On real glasses, it would measure your room itself, so you could try anything before you buy it." |
| 14 | 2:40 to 2:48 | End card: **Fit Check**. *Know it fits before it's on your desk.* Small: *Built with CLAD and Lens Studio*, repo link. | soft chime. VO: "Fit Check. Know it fits before it's on your desk." |

## Production
- **Remotion** project in `work/specs/video/` with `node_modules` kept small; renders and recordings go to `D:\specs-video\` (C: is nearly full).
- **Voice:** edge-tts neural voice (free, high quality). Make 2-3 short samples first (e.g. en-US-AndrewMultilingualNeural, en-US-BrianMultilingualNeural, en-GB-RyanNeural) and let the user pick.
- **Sound effects:** clunk and chime synthesized with ffmpeg, no copyrighted audio. No music, or a very quiet self-made tone bed.
- **Desk photos:** `D:\specs-video\desk-photos\` (front.jpeg, angle.jpeg, side-close.jpeg, side-stand.jpeg). Blur the monitor screen (it shows a chat).
- **Lens footage:** the `proj` session places the preview camera and plays the LEAF demo scenes (demo-blocked, demo-shelf-story, demo-far-table); ffmpeg gdigrab records the preview panel region at 60 fps.
- **Stick figure:** drawn in Remotion (SVG), unnamed, no quotes. It's me acting out a "what if", labelled as such by context.
- Every beat doubles as a Devpost gallery still.

## Audit before render
- No "·" or "—" in scene code or captions.
- Captions 44 px or more at 1080p, labels 40 px or more.
- Total under 2:59.

## Change 2026-10-18 (user): product vision added
Beat 13 is replaced by four beats after the tests: "One monitor. One shelf. Anything with dimensions." (ghost shapes of a sofa, fridge, bed, wardrobe); three drawn examples labelled ILLUSTRATION (the sofa fits between wall and door, the fridge is too wide for the kitchen gap, a room planned before it arrives); who it's for (a family choosing a sofa, a student setting up a hostel room; sellers publish dimensions, Fit Check shows them in your space); then the honest line. Draft runs 2:27.

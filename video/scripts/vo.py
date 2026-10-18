# Voiceover for the Fit Check video, one mp3 per beat (storyboard.md). Same voice as the earlier videos.
# Run with the YouCam venv (it has edge-tts): ../../youcam/video/.venv/Scripts/python.exe scripts/vo.py
import asyncio, json, edge_tts
VOICE = "en-US-AndrewMultilingualNeural"
LINES = {
 "v01": "These are both twenty-seven inch monitors. Only one of them fits on my desk.",
 "v02": "This is my desk. And this shelf is the problem.",
 "v03": "Forty centimetres. My current monitor doesn't even fit under it. So it sits out front, and eats half my desk.",
 "v04": "So I went shopping for a bigger one. Here are two. Same size. Which one would you buy?",
 "v05": "Pick wrong, and you find out at home. With a box, a receipt, and no way back.",
 "v06": "So I designed Fit Check. A Lens for Snap's SPECS glasses.",
 "v07": "It rebuilds my desk at its real size. Pick a monitor, and the seller's own spec sheet puts it right there.",
 "v08": "Push it under the shelf. It stops. Five point six centimetres too tall. That's the one I would have bought.",
 "v09": "Same size. Different stand. Drop it to its lowest, and it slides right under. One point nine centimetres to spare.",
 "v10": "The listing says twenty-seven inch. The stand decides if it fits.",
 "v11": "And it behaves like a real object. Far away, it's small. Up close, it's still sixty-two centimetres.",
 "v12": "I planned one moment, and kept it small. Bright ghosts, because black disappears on glasses. Snap's CLAD agents built it, and wrote automated tests for every step. All of them pass.",
 "v13": "This is one monitor and one shelf. But anything with dimensions works the same way.",
 "v13b": "A sofa between the wall and the door. A fridge in the gap in your kitchen. A whole room, planned before anything arrives.",
 "v13c": "It's for anyone buying big things online, from a family choosing a sofa, to a student setting up a hostel room. Sellers already publish the dimensions. Fit Check turns them into something you can see, in your own space.",
 "v13d": "Here, my desk and the specs are typed in. On real glasses, it would measure the room itself.",
 "v14": "Fit Check. Know it fits, before it's on your desk.",
}
async def main():
    for k, text in LINES.items():
        await edge_tts.Communicate(text, VOICE, rate="+2%").save(f"public/vo/{k}.mp3")
    json.dump(LINES, open("public/vo/lines.json", "w"), indent=1)
asyncio.run(main())

// Measures each voiceover mp3 (seconds) so scene lengths follow the narration. Writes public/vo/durations.json.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";

// MP3 duration from frame headers (edge-tts writes constant-bitrate MPEG-1 Layer III).
function mp3Seconds(buf) {
  const rates = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320]; // MPEG-1 Layer III
  const rates2 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160]; // MPEG-2/2.5 Layer III (edge-tts)
  const srates = [44100, 48000, 32000];
  let i = 0, secs = 0;
  if (buf.slice(0, 3).toString() === "ID3") i = 10 + ((buf[6] << 21) | (buf[7] << 14) | (buf[8] << 7) | buf[9]);
  while (i + 4 < buf.length) {
    if (buf[i] !== 0xff || (buf[i + 1] & 0xe0) !== 0xe0) { i++; continue; }
    const ver = (buf[i + 1] >> 3) & 3, br = (ver === 3 ? rates : rates2)[(buf[i + 2] >> 4) & 15], sr = srates[(buf[i + 2] >> 2) & 3];
    if (!br || !sr) { i++; continue; }
    const mpeg1 = ver === 3, rate = mpeg1 ? sr : sr / (ver === 2 ? 2 : 4);
    const samples = mpeg1 ? 1152 : 576, pad = (buf[i + 2] >> 1) & 1;
    const len = Math.floor((samples / 8) * (br * 1000) / rate) + pad;
    secs += samples / rate; i += len;
  }
  return Math.round(secs * 100) / 100;
}

const dir = "public/vo";
const out = {};
for (const f of readdirSync(dir).filter((n) => n.endsWith(".mp3")).sort()) out[f.replace(".mp3", "")] = mp3Seconds(readFileSync(`${dir}/${f}`));
writeFileSync(`${dir}/durations.json`, JSON.stringify(out, null, 1));
console.log(out, "total", Object.values(out).reduce((a, b) => a + b, 0).toFixed(1), "s");

// The Fit Check demo video (storyboard.md). Lens shots are real Lens Studio preview captures from the
// project in ../proj; desk photos are the user's own desk (screen blurred).
//
// Style rules (user, 2026-10-17): big text, big zoomed focus points, empty space, one idea per frame,
// no interpuncts or em dashes on screen.
import React from "react";
import {
  AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, Series, interpolate, spring, staticFile,
  useCurrentFrame, useVideoConfig, Easing,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/InterTight";
import lines from "../public/vo/lines.json";
import durations from "../public/vo/durations.json";

const { fontFamily } = loadFont("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] });

const BG = "#0e1013";
const INK = "#f4f4f2";
const MUTED = "#9a9ea6";
const RED = "#ff5a4e";
const GREEN = "#5ee38a";
const GHOST = "#ffe066"; // the Lens's own ghost outline colour
const FONT = `${fontFamily}, "Segoe UI", sans-serif`;

const FPS = 30;
const s = (sec: number) => Math.round(sec * FPS);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.bezier(0.45, 0, 0.2, 1);

// Scene lengths follow the measured voiceover (scripts/measure.mjs) plus time to look.
const VO = durations as Record<string, number>;
const ORDER = ["v01", "v02", "v03", "v04", "v05", "v06", "v07", "v08", "v09", "v10", "v11", "v12", "v13", "v13b", "v13c", "v13d", "v14"];
const PAD: Record<string, number> = { v01: 1.4, v02: 1.0, v03: 2.0, v04: 3.6, v05: 2.0, v06: 1.4, v07: 2.0, v08: 2.2, v09: 2.6, v10: 1.8, v11: 1.6, v12: 2.4, v13: 1.6, v13b: 1.8, v13c: 1.6, v13d: 1.2, v14: 2.6 };
const LEN = (k: string) => VO[k] + (PAD[k] ?? 1) + 0.2;
export const TOTAL = ORDER.reduce((a, k) => a + s(LEN(k)), 0);

// ---------- building blocks ----------

const useT = () => useCurrentFrame() / FPS;

const Pop: React.FC<{ at: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ at, children, style }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: f - s(at), fps, config: { damping: 15 } });
  return <div style={{ ...style, opacity: p, transform: `${style?.transform ?? ""} translateY(${(1 - p) * 30}px)` }}>{children}</div>;
};

const Big: React.FC<{ children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties }> = ({ children, size = 110, color = INK, style }) => (
  <div style={{ fontFamily: FONT, fontSize: size, fontWeight: 650, letterSpacing: -size * 0.03, lineHeight: 1.05, color, ...style }}>{children}</div>
);

const Center: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", textAlign: "center", ...style }}>{children}</AbsoluteFill>
);

const Captions: React.FC<{ id: string }> = ({ id }) => {
  const f = useCurrentFrame();
  const text: string = (lines as Record<string, string>)[id];
  const chunks = text.match(/[^.?!,]+[.?!,]*/g)!.flatMap((c) => {
    const w = c.trim().split(" ");
    const n = Math.ceil(w.length / 7), size = Math.ceil(w.length / n);
    return Array.from({ length: n }, (_, i) => w.slice(i * size, (i + 1) * size).join(" "));
  }).filter(Boolean);
  const total = chunks.reduce((a, c) => a + c.length, 0);
  const t = f / FPS / VO[id];
  let acc = 0, cur = "";
  for (const c of chunks) { if (t * total >= acc) cur = c; acc += c.length; }
  if (f / FPS > VO[id] + 0.3) return null;
  return (
    <div style={{ position: "absolute", bottom: 44, width: "100%", display: "flex", justifyContent: "center" }}>
      <div style={{ background: "rgba(0,0,0,.72)", color: "#fff", fontFamily: FONT, fontSize: 46, fontWeight: 600, padding: "10px 30px", borderRadius: 10, maxWidth: 1600, textAlign: "center" }}>{cur.replace(/,$/, "")}</div>
    </div>
  );
};

// A photo or still with a slow push-in on a focus point. fx, fy are 0..1 of the frame.
const Shot: React.FC<{ src: string; z?: [number, number]; fx?: number; fy?: number; fit?: "cover" | "contain"; children?: React.ReactNode }> = ({ src, z = [1, 1.15], fx = 0.5, fy = 0.5, fit = "cover", children }) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const k = interpolate(f, [0, durationInFrames], z, { ...clamp, easing: ease });
  return (
    <AbsoluteFill style={{ background: BG, overflow: "hidden" }}>
      {fit === "contain" && <Img src={staticFile(src)} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", filter: "blur(40px) brightness(.45)", transform: "scale(1.2)" }} />}
      <AbsoluteFill style={{ transformOrigin: `${fx * 100}% ${fy * 100}%`, transform: `scale(${k})` }}>
        <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: fit }} />
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Label: React.FC<{ at: number; x: number; y: number; children: React.ReactNode; color?: string; size?: number }> = ({ at, x, y, children, color = INK, size = 54 }) => (
  <Pop at={at} style={{ position: "absolute", left: x, top: y }}>
    <div style={{ fontFamily: FONT, fontSize: size, fontWeight: 650, color, background: "rgba(10,12,15,.78)", padding: "10px 24px", borderRadius: 12, whiteSpace: "nowrap" }}>{children}</div>
  </Pop>
);

// A front-on monitor outline, `h` = total height in px including the stand.
const MonitorIcon: React.FC<{ w: number; h: number; color?: string; fill?: string }> = ({ w, h, color = INK, fill = "transparent" }) => {
  const panel = w * 0.58;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      <rect x={4} y={4} width={w - 8} height={panel} rx={10} fill={fill} stroke={color} strokeWidth={8} />
      <rect x={w / 2 - 12} y={panel + 4} width={24} height={h - panel - 22} fill={color} />
      <rect x={w / 2 - w * 0.2} y={h - 18} width={w * 0.4} height={14} rx={7} fill={color} />
    </svg>
  );
};

// ---------- scenes ----------

// v01 + v10: the two "27 inch" monitors. `verdict` adds the cross and tick.
const TwoMonitors: React.FC<{ verdict?: boolean }> = ({ verdict }) => {
  const t = useT();
  const q = 1 + 0.06 * Math.sin(t * 5);
  return (
    <AbsoluteFill style={{ background: BG }}>
      <div style={{ position: "absolute", top: 130, width: "100%", display: "flex", justifyContent: "center", gap: 360, alignItems: "flex-end", height: 600 }}>
        {[{ name: "Dell SE2722H", h: verdict ? 520 : 470, ok: false, cm: "45.9 cm tall" }, { name: "Dell P2722H", h: verdict ? 435 : 470, ok: true, cm: "38.4 cm tall" }].map((m, i) => {
          const c = verdict ? (m.ok ? GREEN : RED) : INK;
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
              <Pop at={0.2 + i * 0.25}><MonitorIcon w={520} h={m.h} color={c} /></Pop>
              <Pop at={0.6 + i * 0.25} style={{ marginTop: 30 }}><Big size={64} color={c}>{verdict ? m.cm : "27 inch"}</Big></Pop>
              {verdict && <Pop at={1.2 + i * 0.3} style={{ position: "absolute", top: 70 }}><Big size={220} color={c}>{m.ok ? "✓" : "✕"}</Big></Pop>}
            </div>
          );
        })}
      </div>
      {!verdict && <Pop at={1.4} style={{ position: "absolute", left: 0, right: 0, top: 230, textAlign: "center", transform: `scale(${q})` }}><Big size={200} color={GHOST}>?</Big></Pop>}
      {verdict && <Pop at={2.2} style={{ position: "absolute", left: 0, right: 0, top: 860, textAlign: "center" }}><Big size={72}>The stand decides. Not the screen.</Big></Pop>}
    </AbsoluteFill>
  );
};

// v02: the real desk, pushing in on the shelf.
const Desk: React.FC = () => <Shot src="photos/front.jpg" z={[1, 1.3]} fx={0.42} fy={0.18}><Label at={1.4} x={1180} y={120} size={64}>The shelf</Label></Shot>;

// v03: the gap, then the side photo with the monitor pushed out.
const Gap: React.FC = () => {
  const f = useCurrentFrame();
  const draw = interpolate(f, [s(0.4), s(1.6)], [0, 1], { ...clamp, easing: ease });
  const side = f >= s(3.6);
  return (
    <AbsoluteFill style={{ background: BG }}>
      {!side && (
        <Shot src="photos/front.jpg" z={[1.05, 1.12]} fx={0.15} fy={0.45}>
          {/* desk top to the shelf's lowest edge, left of the monitor (front.jpg mapped to 1920 x 1440, offset -180) */}
          <svg width={1920} height={1080} style={{ position: "absolute" }}>
            <line x1={300} y1={186} x2={300} y2={186 + 654 * draw} stroke={GHOST} strokeWidth={10} />
            <line x1={260} y1={186} x2={340} y2={186} stroke={GHOST} strokeWidth={10} />
            {draw > 0.98 && <line x1={260} y1={840} x2={340} y2={840} stroke={GHOST} strokeWidth={10} />}
          </svg>
          <Label at={1.5} x={370} y={450} size={96} color={GHOST}>40.3 cm</Label>
        </Shot>
      )}
      {side && (
        <Sequence from={s(3.6)} layout="none">
          <Shot src="photos/side-stand.jpg" z={[1.0, 1.08]} fx={0.75} fy={0.4}>
            <Label at={0.4} x={120} y={700} size={60}>Too tall to go under</Label>
            <Label at={1.2} x={120} y={820} size={60} color={RED}>Pushed 29 cm out</Label>
          </Shot>
          <Audio src={staticFile("sfx/clunk.wav")} volume={0.55} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};

// v04: two listings, same size. Which one would you buy?
const Listings: React.FC = () => {
  const f = useCurrentFrame();
  const start = VO.v04 - 0.6;
  const n = 3 - Math.floor((f / FPS - start));
  const ring = interpolate(f / FPS, [start, start + 3], [0, 1], clamp);
  const Card = ({ name, at }: { name: string; at: number }) => (
    <Pop at={at}>
      <div style={{ width: 640, background: "#f6f6f4", borderRadius: 24, padding: "44px 48px", fontFamily: FONT, color: "#16181b", boxShadow: "0 30px 80px rgba(0,0,0,.5)" }}>
        <div style={{ height: 250, display: "flex", alignItems: "center", justifyContent: "center", background: "#e8e8e4", borderRadius: 16 }}><MonitorIcon w={300} h={230} color="#16181b" /></div>
        <div style={{ fontSize: 54, fontWeight: 650, marginTop: 30 }}>{name}</div>
        <div style={{ fontSize: 96, fontWeight: 700, marginTop: 6 }}>27 inch</div>
      </div>
    </Pop>
  );
  return (
    <AbsoluteFill style={{ background: BG }}>
      <div style={{ position: "absolute", top: 90, width: "100%", display: "flex", justifyContent: "center", gap: 120 }}>
        <Card name="Dell SE2722H" at={0.3} />
        <Card name="Dell P2722H" at={0.7} />
      </div>
      <Pop at={start - 0.4} style={{ position: "absolute", bottom: 150, width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: 40 }}>
        <Big size={84}>Which one fits?</Big>
        {f / FPS >= start && n > 0 && (
          <svg width={110} height={110} viewBox="0 0 110 110">
            <circle cx={55} cy={55} r={46} fill="none" stroke="#333" strokeWidth={10} />
            <circle cx={55} cy={55} r={46} fill="none" stroke={GHOST} strokeWidth={10} strokeDasharray={289} strokeDashoffset={289 * ring} transform="rotate(-90 55 55)" />
            <text x={55} y={73} textAnchor="middle" fontFamily={FONT} fontSize={52} fontWeight={700} fill={INK}>{n}</text>
          </svg>
        )}
      </Pop>
      {[0, 1, 2].map((i) => <Sequence key={i} from={s(start + i)} durationInFrames={s(0.5)}><Audio src={staticFile("sfx/tick.wav")} volume={0.6} /></Sequence>)}
    </AbsoluteFill>
  );
};

// v05: stick figure me buys the wrong one. Side view: wall on the right, shelf sticking out of it.
const WrongOne: React.FC = () => {
  const t = useT();
  const walk = interpolate(t, [0, 1.6], [-200, 760], { ...clamp, easing: ease });
  const placed = t > 1.9;
  const slide = interpolate(t, [2.2, 3.0], [1180, 1388], { ...clamp, easing: Easing.in(Easing.quad) });
  const hit = t > 3.0;
  const shake = hit && t < 3.35 ? Math.sin(t * 90) * 8 : 0;
  const step = Math.sin(t * 12) * (t < 1.6 ? 1 : 0);
  const fx = placed ? 980 : walk;
  const ink = "#e9e9e6";
  return (
    <AbsoluteFill style={{ background: BG }}>
      <svg width={1920} height={1080}>
        {/* wall, shelf, desk, floor */}
        <rect x={1700} y={120} width={30} height={800} fill="#2a2d33" />
        <rect x={1430} y={380} width={270} height={22} fill={hit ? RED : "#6b4b34"} />
        <rect x={1100} y={640} width={600} height={20} fill="#8a6446" />
        <rect x={1130} y={660} width={16} height={260} fill="#55402f" /><rect x={1660} y={660} width={16} height={260} fill="#55402f" />
        <line x1={0} y1={920} x2={1920} y2={920} stroke="#3a3d44" strokeWidth={4} />
        {/* the monitor, side profile: too tall for the gap */}
        {placed && (
          <g transform={`translate(${slide + shake}, 0)`}>
            <rect x={-6} y={366} width={14} height={200} rx={4} fill={GHOST} />
            <rect x={-4} y={560} width={10} height={64} fill={GHOST} />
            <rect x={-40} y={624} width={84} height={14} rx={6} fill={GHOST} />
          </g>
        )}
        {/* stick figure */}
        <g transform={`translate(${fx}, 0)`} stroke={ink} strokeWidth={9} strokeLinecap="round" fill="none">
          <circle cx={0} cy={560} r={42} />
          <line x1={0} y1={602} x2={0} y2={760} />
          <line x1={0} y1={760} x2={-40 * step - 20} y2={915} /><line x1={0} y1={760} x2={40 * step + 20} y2={915} />
          {!placed ? (<><line x1={0} y1={640} x2={90} y2={680} /><rect x={60} y={620} width={170} height={130} fill="#c9a77c" stroke="none" /></>) : (<line x1={0} y1={640} x2={hit ? 70 : 140} y2={hit ? 700 : 600} />)}
          <line x1={0} y1={640} x2={-60} y2={720} />
          {hit && t > 3.5 && <path d="M -16 580 Q 0 568 16 580" />}
        </g>
      </svg>
      {hit && <Sequence from={s(3.0)} layout="none"><Audio src={staticFile("sfx/clunk.wav")} volume={0.6} /></Sequence>}
      <Pop at={3.7} style={{ position: "absolute", left: 160, top: 170 }}><Big size={130} color={RED}>No returns.</Big></Pop>
    </AbsoluteFill>
  );
};

const Title: React.FC = () => (
  <Center style={{ background: BG }}>
    <Audio src={staticFile("sfx/whoosh.wav")} volume={1.6} />
    <Pop at={0.1}><Big size={190} color={GHOST}>Fit Check</Big></Pop>
    <Pop at={0.6} style={{ marginTop: 34 }}><Big size={70}>Try it on your desk before you buy.</Big></Pop>
    <Pop at={1.2} style={{ marginTop: 40 }}><Big size={44} color={MUTED}>A Lens for Snap's SPECS glasses</Big></Pop>
  </Center>
);

// Lens footage: real Lens Studio preview recordings (726x758, 30 fps), slowed slightly to fill the beat.
// zoom = [start s, end s, scale] pushes in on the cue label (fx, fy) once it appears.
const Clip: React.FC<{ src: string; bg: string; rate: number; from?: number; zoom?: [number, number, number]; fx?: number; fy?: number }> = ({ src, bg, rate, from = 0, zoom, fx = 0.5, fy = 0.5 }) => {
  const t = useT();
  const k = zoom ? interpolate(t, [zoom[0], zoom[1]], [1, zoom[2]], { ...clamp, easing: ease }) : 1;
  return (
    <AbsoluteFill style={{ background: BG, overflow: "hidden" }}>
      <Img src={staticFile(bg)} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", filter: "blur(40px) brightness(.45)", transform: "scale(1.2)" }} />
      <AbsoluteFill style={{ transformOrigin: `${fx * 100}% ${fy * 100}%`, transform: `scale(${k})` }}>
        <OffthreadVideo src={staticFile(src)} muted playbackRate={rate} startFrom={s(from)} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Lens: React.FC<{ still: string; clip?: string; rate?: number; from?: number; zoom?: [number, number, number]; z?: [number, number]; fx?: number; fy?: number; sfx?: [number, string][]; labels?: React.ReactNode }> = ({ still, clip, rate = 1, from = 0, zoom, z = [1, 1.12], fx = 0.5, fy = 0.5, sfx = [], labels }) => (
  <AbsoluteFill style={{ background: BG }}>
    {clip ? <Clip src={clip} bg={still} rate={rate} from={from} zoom={zoom} fx={fx} fy={fy} /> : <Shot src={still} z={z} fx={fx} fy={fy} fit="contain" />}
    {labels}
    <div style={{ position: "absolute", top: 36, right: 44, fontFamily: FONT, fontSize: 32, color: MUTED, letterSpacing: 2 }}>LENS STUDIO PREVIEW</div>
    {sfx.map(([at, name], i) => <Sequence key={i} from={s(at)} layout="none"><Audio src={staticFile(`sfx/${name}.wav`)} volume={name === "clunk" ? 0.55 : 0.9} /></Sequence>)}
  </AbsoluteFill>
);

const Built: React.FC = () => {
  const cards = ["One moment, done well: will it fit under my shelf?", "Black disappears on glasses, so the monitors are bright ghosts.", "Planned with Devpost's skill pack. Built by Snap's CLAD agents."];
  const t = useT();
  const each = 2.6;
  const i = Math.min(cards.length, Math.floor(t / each));
  const n = Math.round(interpolate(t, [each * 3, each * 3 + 1.2], [0, 6], clamp));
  return (
    <Center style={{ background: BG, padding: "0 200px" }}>
      {i < 3 ? (
        <Sequence key={i} from={s(i * each)} layout="none"><Pop at={0}><Big size={84}>{cards[i]}</Big></Pop></Sequence>
      ) : (
        <><Big size={260} color={GREEN}>{n} of 6</Big><Big size={70} style={{ marginTop: 10 }}>automated tests pass</Big></>
      )}
    </Center>
  );
};

// v13 to v13d: the product beyond one monitor. Drawn illustrations in the Lens's ghost style, not built features.
const Ghost: React.FC<{ d: string; color?: string }> = ({ d, color = GHOST }) => <path d={d} fill="rgba(170,210,255,.16)" stroke={color} strokeWidth={7} strokeLinejoin="round" />;
const SHAPES = {
  sofa: "M0 40 h40 v-40 h220 v40 h40 v90 h-300 z",
  fridge: "M0 0 h120 v240 h-120 z M0 80 h120",
  bed: "M0 0 h160 v240 h-160 z M0 50 h160",
  wardrobe: "M0 0 h200 v70 h-200 z M100 0 v70",
};

const Anything: React.FC = () => (
  <Center style={{ background: BG }}>
    <Pop at={0.1}><Big size={88}>One monitor. One shelf.</Big></Pop>
    <Pop at={2.2} style={{ marginTop: 26 }}><Big size={88} color={GHOST}>Anything with dimensions.</Big></Pop>
    <div style={{ display: "flex", gap: 90, marginTop: 90, alignItems: "flex-end" }}>
      {(Object.keys(SHAPES) as (keyof typeof SHAPES)[]).map((k, i) => (
        <Pop key={k} at={2.6 + i * 0.25}><svg width={320} height={260} viewBox="-20 -20 340 300"><Ghost d={SHAPES[k]} /></svg></Pop>
      ))}
    </div>
  </Center>
);

const Uses: React.FC = () => {
  const t = useT();
  const part = t < 2.6 ? 0 : t < 5.0 ? 1 : 2;
  const p = (a: number, b: number) => interpolate(t, [a, b], [0, 1], { ...clamp, easing: ease });
  const room = <rect x={460} y={200} width={1000} height={600} fill="none" stroke="#5a5e66" strokeWidth={8} />;
  return (
    <AbsoluteFill style={{ background: BG }}>
      <svg width={1920} height={1080}>
        {part === 0 && (<>
          {room}
          {/* door on the right wall with its swing */}
          <rect x={1452} y={560} width={16} height={180} fill={BG} />
          <path d="M1460 560 L1300 560 A160 160 0 0 1 1460 720" fill="none" stroke="#5a5e66" strokeWidth={5} strokeDasharray="12 10" />
          <g transform={`translate(${480 + 0 * p(0.2, 1.6)}, ${-200 + 860 * p(0.2, 1.6)})`}><Ghost d={SHAPES.sofa} color={t > 1.6 ? GREEN : GHOST} /></g>
          {t > 1.7 && <text x={960} y={160} textAnchor="middle" fontFamily={FONT} fontSize={80} fontWeight={700} fill={GREEN}>{"✓ The sofa fits"}</text>}
        </>)}
        {part === 1 && (<>
          {/* kitchen counters with a gap */}
          <rect x={360} y={520} width={520} height={300} fill="none" stroke="#5a5e66" strokeWidth={8} />
          <rect x={1080} y={520} width={520} height={300} fill="none" stroke="#5a5e66" strokeWidth={8} />
          <line x1={300} y1={820} x2={1660} y2={820} stroke="#5a5e66" strokeWidth={8} />
          <g transform={`translate(${860}, ${-420 + 580 * p(2.7, 3.6)}) scale(1.0, 1.5)`}><Ghost d="M0 0 h240 v240 h-240 z M0 80 h240" color={t > 3.6 ? RED : GHOST} /></g>
          {t > 3.7 && <text x={960} y={140} textAnchor="middle" fontFamily={FONT} fontSize={80} fontWeight={700} fill={RED}>{"✕ The fridge is too wide"}</text>}
        </>)}
        {part === 2 && (<>
          {room}
          <g transform={`translate(${500 + 0 * p(5.1, 5.7)}, ${240 + 0})`} opacity={p(5.1, 5.6)}><Ghost d={SHAPES.bed} /></g>
          <g transform="translate(1220, 230)" opacity={p(5.6, 6.1)}><Ghost d={SHAPES.wardrobe} /></g>
          <g transform="translate(1180, 640)" opacity={p(6.1, 6.6)}><Ghost d="M0 0 h240 v120 h-240 z" /></g>
          {t > 6.4 && <text x={960} y={140} textAnchor="middle" fontFamily={FONT} fontSize={80} fontWeight={700} fill={GHOST}>Plan the room before it arrives</text>}
        </>)}
      </svg>
      <div style={{ position: "absolute", top: 36, right: 44, fontFamily: FONT, fontSize: 32, color: MUTED, letterSpacing: 2 }}>ILLUSTRATION</div>
    </AbsoluteFill>
  );
};

const WhoFor: React.FC = () => (
  <Center style={{ background: BG, padding: "0 180px" }}>
    <Pop at={0.2}><Big size={64} color={MUTED}>For anyone buying big things online</Big></Pop>
    <Pop at={2.2} style={{ marginTop: 40 }}><Big size={84}>A family choosing a sofa</Big></Pop>
    <Pop at={3.6} style={{ marginTop: 18 }}><Big size={84}>A student setting up a hostel room</Big></Pop>
    <Pop at={7.0} style={{ marginTop: 70 }}><Big size={72} color={GHOST}>Sellers publish the dimensions.</Big></Pop>
    <Pop at={9.4} style={{ marginTop: 14 }}><Big size={72} color={GHOST}>Fit Check shows them in your space.</Big></Pop>
  </Center>
);

const Honest: React.FC = () => (
  <Center style={{ background: BG, padding: "0 180px", gap: 50 }}>
    <Pop at={0.2}><Big size={70} color={MUTED}>Here, my desk and the specs are typed in.</Big></Pop>
    <Pop at={2.6}><Big size={70}>On real glasses, it measures the room itself.</Big></Pop>
  </Center>
);

const End: React.FC = () => (
  <Center style={{ background: BG }}>
    <Sequence from={s(0.3)} layout="none"><Audio src={staticFile("sfx/chime.wav")} volume={0.8} /></Sequence>
    <Pop at={0.1}><Big size={190} color={GHOST}>Fit Check</Big></Pop>
    <Pop at={0.5} style={{ marginTop: 30 }}><Big size={70}>Know it fits before it's on your desk.</Big></Pop>
    <Pop at={1.1} style={{ marginTop: 60 }}><Big size={40} color={MUTED}>Built with CLAD and Lens Studio</Big></Pop>
    <Pop at={1.3} style={{ marginTop: 14 }}><Big size={40} color={MUTED}>github.com/miawab/specs</Big></Pop>
  </Center>
);

const SCENES: Record<string, React.FC> = {
  v01: () => <TwoMonitors />,
  v02: Desk,
  v03: Gap,
  v04: Listings,
  v05: WrongOne,
  v06: Title,
  v07: () => <Lens still="clips/03-far-table-v2.png" clip="clips/c07-add.mp4" rate={0.8} labels={<Label at={0.8} x={80} y={80} size={52}>My desk, my measurements</Label>} />,
  v08: () => <Lens still="clips/01-blocked-red-v2.png" clip="clips/c08-blocked.mp4" rate={0.77} from={0.6} zoom={[2.8, 4.1, 1.5]} fx={0.42} fy={0.12} sfx={[[2.6, "clunk"]]} />,
  v09: () => <Lens still="clips/02-fits-green-v2.png" clip="clips/c09-fits.mp4" rate={0.92} zoom={[7.4, 8.6, 1.5]} fx={0.55} fy={0.1} sfx={[[7.3, "chime"]]} />,
  v10: () => <TwoMonitors verdict />,
  v11: () => <Lens still="clips/03-far-table-v2.png" clip="clips/c11-far.mp4" rate={0.94} labels={<Label at={5.5} x={80} y={80} size={52}>Still 62 cm wide</Label>} />,
  v12: Built,
  v13: Anything,
  v13b: Uses,
  v13c: WhoFor,
  v13d: Honest,
  v14: End,
};

export const Main: React.FC = () => (
  <AbsoluteFill style={{ background: BG }}>
    <Series>
      {ORDER.map((k) => {
        const Scene = SCENES[k];
        return (
          <Series.Sequence key={k} durationInFrames={s(LEN(k))}>
            <Scene />
            <Sequence from={s(0.2)} layout="none"><Audio src={staticFile(`vo/${k}.mp3`)} /></Sequence>
            <Sequence from={s(0.2)}><Captions id={k} /></Sequence>
          </Series.Sequence>
        );
      })}
    </Series>
  </AbsoluteFill>
);

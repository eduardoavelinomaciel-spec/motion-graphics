import React from "react";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { CIRO, Fish, Mouth } from "../characters/Fish";
import { EXPR, EyeExpr, mixExpr, sceneUniforms } from "../lib/materials";
import { Cam, CameraRig, project, V3 } from "./cam";
import { Crystal, OpenBlue } from "../fx/PixelWorld";
import { Halftone, Onoma, Panel, SpeedLines } from "../fx/Hq";
import { Grade, Iris } from "../fx/Grade";
import { ensureFonts } from "../lib/fonts";

// Cena 2 · [0:50–1:40] · O cardume sumiu. Local frames 0–1500 (film f1500–3000).
export const CENA2_FRAMES = 1500;

const ease = Easing.bezier(0.45, 0, 0.25, 1);
const k = (f: number, a: number, b: number, from = 0, to = 1, e = ease) =>
  interpolate(f, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });

const FACE = -Math.PI / 2 + 1.0; // 3/4: nose to screen right, towards the camera

// moments
const T = { turn: 60, panels: 150, close: 540, circles: 560, stop: 840, dissolve: 870, oneBit: 882, silence: 1050, ice: 1140 };

const openLook = () => {
  sceneUniforms.uFogDensity.value = 0;
  sceneUniforms.uCaustic.value = 0;
  sceneUniforms.uSilhouette.value = 0;
  sceneUniforms.uLightDir.value.set(0.35, 1.0, 0.55);
};

type CiroPose = { pos: [number, number, number]; rot: [number, number, number]; expr: EyeExpr; mouth: Mouth; swim: number; swimSpeed: number; fin: number; scale: number; t: number };

const CiroLayer: React.FC<{ cam: Cam; pose: CiroPose; w: number; h: number }> = ({ cam, pose, w, h }) => (
  <ThreeCanvas width={Math.round(w)} height={Math.round(h)} flat linear={false} gl={{ antialias: true, alpha: true }} camera={{ fov: cam.fov, position: [0, 0, 3] }} style={{ position: "absolute", left: 0, top: 0 }}>
    <CameraRig cam={cam} />
    <Fish variant={CIRO} time={pose.t} position={pose.pos} rotation={pose.rot} expr={pose.expr} mouth={pose.mouth}
      swim={pose.swim} swimSpeed={pose.swimSpeed} finOpen={pose.fin} scale={pose.scale} />
  </ThreeCanvas>
);

// --- the four HQ panels: left / right / up / down ------------------------------------------------
const DIRS = [
  { yaw: FACE - 2.0, pitch: 0, look: [0.35, 0.0] as [number, number], at: 160, zip: "zip", expr: EXPR.curioso },
  { yaw: FACE + 0.45, pitch: 0, look: [0.35, 0.0] as [number, number], at: 250, zip: "zip", expr: { ...EXPR.curioso, lidTop: 0.05 } },
  { yaw: FACE + 0.2, pitch: 0.75, look: [0.15, 0.55] as [number, number], at: 340, zip: "zip", expr: mixExpr(EXPR.curioso, EXPR.triste, 0.35) },
  { yaw: FACE + 0.2, pitch: -0.65, look: [0.15, -0.55] as [number, number], at: 430, zip: "zip", expr: mixExpr(EXPR.triste, EXPR.susto, 0.5) },
];

const panelPose = (i: number, f: number): CiroPose => {
  const d = DIRS[i];
  const pf = f - d.at;
  const snap = k(pf, 10, 15, 0, 1, Easing.out(Easing.cubic));
  const tremble = pf > 15 ? Math.sin(pf * 1.9) * 0.015 * (1 + i * 0.5) : 0;
  const base: EyeExpr = { ...d.expr, look: [0.2, 0] };
  const e = mixExpr(base, { ...d.expr, look: d.look }, snap);
  return {
    pos: [0, tremble, 0],
    rot: [0, FACE + (d.yaw - FACE) * snap, d.pitch * snap],
    expr: e,
    mouth: i < 2 ? "o" : "frown",
    swim: 0.25,
    swimSpeed: 1,
    fin: 0.5,
    scale: 1,
    t: f / 30,
  };
};

export const Cena2: React.FC = () => {
  const f = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const u = W / 1920;
  const t = f / 30;
  openLook();
  ensureFonts();

  // ---------------- 1) opening, 2) panels ----------------
  if (f < T.circles) {
    if (f < T.panels + 8) {
      // the iris opens on a happy Ciro; he turns round… nothing.
      const cam: Cam = { pos: V3(0.35, 0.15, 2.7), target: V3(0, 0.03, 0), fov: 36 };
      const turn = k(f, T.turn, T.turn + 10, 0, 1, Easing.out(Easing.cubic)) * (1 - k(f, 108, 122));
      const e: EyeExpr = f < T.turn ? EXPR.alegria : f < 108 ? EXPR.neutro : mixExpr(EXPR.curioso, { ...EXPR.triste, lidTop: 0.15 }, k(f, 122, 145));
      const pose: CiroPose = {
        pos: [0, 0.02 * Math.sin(t * 2), 0],
        rot: [0, FACE - turn * 2.0, 0.03 * Math.sin(t * 1.5)],
        expr: e,
        mouth: f < T.turn ? "open" : f < 122 ? "flat" : "o",
        swim: f < T.turn ? 0.5 : 0.25,
        swimSpeed: 1,
        fin: 0.55,
        scale: 1,
        t,
      };
      const scr = project(V3(0.15, 0.05, 0.2), cam, W, H);
      const irisR = k(f, 0, 20, 0, 1400 * u, Easing.out(Easing.cubic));
      const frozen = f >= T.panels; // quebra de quadro: the image freezes, takes halftone
      return (
        <AbsoluteFill>
          <OpenBlue cam={cam} time={t} width={W} height={H} div={2} />
          <CiroLayer cam={cam} pose={pose} w={W} h={H} />
          {frozen ? <Halftone opacity={0.28 * k(f, T.panels, T.panels + 6)} size={10 * u} /> : null}
          {frozen ? <div style={{ position: "absolute", inset: 0, border: `${k(f, T.panels, T.panels + 6, 0, 14 * u)}px solid #10141f` }} /> : null}
          <Grade />
          {f < 22 ? <Iris cx={scr.x} cy={scr.y} r={irisR} /> : null}
        </AbsoluteFill>
      );
    }
    // the page of four panels
    const gut = 26 * u * (1 - k(f, T.close, T.close + 16));
    const border = 9 * u * (1 - k(f, T.close + 8, T.close + 18));
    const pw = (W - gut * 3) / 2;
    const ph = (H - gut * 3) / 2;
    return (
      <AbsoluteFill style={{ background: "#f2eee4" }}>
        {DIRS.map((d, i) => {
          if (f < d.at) return null;
          const pf = f - d.at;
          const col = i % 2;
          const row = Math.floor(i / 2);
          const slide = k(pf, 0, 9, 1, 0, Easing.out(Easing.back(1.4)));
          const x = gut + col * (pw + gut) + (col === 0 ? -1 : 1) * slide * 120 * u;
          const y = gut + row * (ph + gut) + (row === 0 ? -1 : 1) * slide * 80 * u;
          const cam: Cam = { pos: V3(0.3, 0.12, 2.5), target: V3(0, 0.02, 0), fov: 34 };
          const pose = panelPose(i, f);
          const zipScale = k(pf, 11, 17, 0, 1, Easing.out(Easing.back(2.5)));
          return (
            <Panel key={i} x={x} y={y} w={pw} h={ph} border={border}>
              <OpenBlue cam={cam} time={t} width={pw} height={ph} div={2} />
              <CiroLayer cam={cam} pose={pose} w={pw} h={ph} />
              {pf > 10 && pf < 18 ? <SpeedLines w={pw} h={ph} cx={pw / 2} cy={ph / 2} amount={0.5} step={Math.floor(f / 2.5)} inner={0.38} /> : null}
              <Halftone opacity={0.16} size={9 * u} />
              {zipScale > 0 ? (
                <Onoma text={d.zip} x={[pw * 0.2, pw * 0.8, pw * 0.5, pw * 0.5][i]} y={[ph * 0.5, ph * 0.5, ph * 0.15, ph * 0.85][i]} size={64 * u} scale={zipScale} rot={[-12, 10, -4, 6][i]} />
              ) : null}
            </Panel>
          );
        })}
        <Grade vignette={0.15} />
      </AbsoluteFill>
    );
  }

  // ---------------- 3) circles, 4) stop, 5) pixel world ----------------
  const s = (Math.min(f, T.stop) - T.circles) / 30;
  const ang = 2.0 * s + 0.62 * s * s; // faster and faster
  const omega = 2.0 + 1.24 * s;
  const R = 1.7;
  const circling = f < T.stop;
  const stopJolt = f >= T.stop ? Math.exp(-(f - T.stop) / 5) * Math.sin((f - T.stop) * 1.6) * 0.08 : 0;
  const curl = k(f, 1150, 1260);
  const pos: [number, number, number] = circling
    ? [R * Math.cos(ang), 0.15 * Math.sin(ang * 2), R * Math.sin(ang)]
    : [stopJolt, -0.05 * curl, 0];
  const yaw = circling ? -ang - Math.PI / 2 : FACE + 0.15;
  const pose: CiroPose = {
    pos,
    rot: [0, yaw, circling ? 0 : -0.25 * curl],
    expr: circling ? mixExpr(EXPR.curioso, EXPR.susto, k(f, T.circles, T.circles + 90)) : f < T.ice ? EXPR.triste : mixExpr(EXPR.triste, EXPR.choro, k(f, 1180, 1240)),
    mouth: circling ? "o" : "frown",
    swim: circling ? 0.9 : 0.25 + 0.7 * curl,
    swimSpeed: circling ? 2.4 : 1 - 0.95 * curl,
    fin: circling ? 0.6 : 0.5 - 0.4 * curl,
    scale: 1 - 0.1 * curl,
    t: circling ? t : T.stop / 30 + (t - T.stop / 30) * (1 - 0.9 * curl),
  };

  // long dolly-out: from his level until he is a dot
  const dist = f < T.dissolve ? 7.5 - 2.6 * k(f, T.stop, T.dissolve) : interpolate(f, [T.dissolve, 1420], [4.9, 36], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.sin) });
  const camY = f < T.stop ? 0.9 : 0.35;
  const cam: Cam = { pos: V3(0.15 * Math.min(1, dist / 10), camY, dist), target: V3(0, f < T.stop ? 0 : 0.02, 0), fov: f < T.stop ? 42 : 36 };

  // pixel-dissolve: 1920 → 960 → 480 → 320 in 12 frames, then 1-bit at 320×180
  const div = f < T.dissolve ? 1 : f < T.dissolve + 3 ? 2 : f < T.dissolve + 6 ? 4 : 6;
  const oneBit = f >= T.oneBit;
  const step = Math.floor(f / 2.5); // pixel things move at 12 fps
  const ciroScr = project(V3(0, 0, 0), cam, 320, 180);
  const crystals: Crystal[] = f >= T.ice
    ? Array.from({ length: 14 }).map((_, i) => {
        const at = T.ice + i * 16 + random(`ia${i}`) * 10;
        const a = random(`ic${i}`) * Math.PI * 2;
        const r = 7 + random(`ir${i}`) * 16;
        const st = f < at ? 0 : Math.min(4, Math.floor((Math.floor(f / 2.5) - Math.floor(at / 2.5)) / 2) + 1);
        return { x: ciroScr.x + Math.cos(a) * r * 1.4, y: ciroScr.y + Math.sin(a) * r, stage: st, tw: (step + i) % 3 === 0 ? 1 : 0 };
      })
    : [];
  const ciroScreen = project(V3(pos[0], pos[1], pos[2]), cam, W, H);
  return (
    <AbsoluteFill>
      <OpenBlue cam={cam} time={oneBit ? step / 12 : t} width={W} height={H} div={div === 1 ? 2 : div} oneBit={oneBit} crystals={crystals} />
      {circling ? <SpeedLines w={W} h={H} cx={W / 2} cy={H / 2} amount={Math.min(1, 0.25 + (omega - 2) / 7)} step={step} color="rgba(150,220,255,0.9)" /> : null}
      <CiroLayer cam={cam} pose={pose} w={W} h={H} />
      {/* the pixel-bloom flash in the scene's key colour at the moment of the dissolve */}
      {f >= T.dissolve && f < T.dissolve + 12 ? <AbsoluteFill style={{ background: "#1C3F94", opacity: 0.35 * (1 - (f - T.dissolve) / 12), mixBlendMode: "screen" }} /> : null}
      <Grade vignette={oneBit ? 0.25 : 0.38} grain={oneBit ? 0 : 0.05} />
      <div style={{ display: "none" }}>{ciroScreen.x}</div>
    </AbsoluteFill>
  );
};

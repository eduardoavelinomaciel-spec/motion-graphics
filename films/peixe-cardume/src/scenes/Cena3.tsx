import React, { useMemo } from "react";
import * as THREE from "three";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { CIRO, Fish, Mouth } from "../characters/Fish";
import { Marisa } from "../characters/Marisa";
import { EXPR, EyeExpr, mixExpr, sceneUniforms } from "../lib/materials";
import { applyLook, Bubble, BubbleColumns, GodRays, LONE, Sand, Sky } from "../world/World";
import { Rock, recessSeat, ROCK } from "../world/Rock";
import { CurrentField } from "../world/Current";
import { Cam, CameraRig, lerpCam, project, V3 } from "./cam";
import { Grade } from "../fx/Grade";
import { Sparkle } from "../fx/AnimeFx";
import { Balloon, BalloonMark, FishGlyph } from "../fx/Balloon";
import { ensureFonts } from "../lib/fonts";
import { makeToon } from "../lib/materials";

// Cena 3 · [1:40–2:30] · Dona Marisa. Local frames 0–1500.
export const CENA3_FRAMES = 1500;

const ease = Easing.bezier(0.45, 0, 0.25, 1);
const k = (f: number, a: number, b: number, from = 0, to = 1, e = ease) =>
  interpolate(f, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });

const T = { bloom: 12, shadow: 296, impact: 333, tilt: 340, land: 600, settle: 540, blink1: 615, balloon: 700, balloonOut: 880, draw: 930, drawEnd: 1040, arrow: 1045, point: 1080, current: 1110, two: 1200, blink2: 1300, out: 1350, rise: 1430, whip: 1484 };

const SEAT = recessSeat(0.5);
const MS = 1.7; // Marisa's scale
const LAND = V3(-5.6, 0.31, 1.4);

// sand height (mirrors the sand vertex shader)
const sandH = (x: number, z: number) => {
  const w = x * 1.6 + 0.9 * Math.sin(z * 0.35) + 0.5 * Math.sin(z * 0.9 + x * 0.2);
  return 0.07 * Math.sin(w) + 0.25 * Math.sin(x * 0.08 + z * 0.05) + 0.18 * Math.sin(z * 0.11 - x * 0.03);
};

// --- Marisa ----------------------------------------------------------------------------------
const marisaState = (f: number) => {
  const t = f / 30;
  // descends from above, slow and effortless
  const start = V3(-1.2, 12.5, 3.4);
  const d = k(f, 300, T.land, 0, 1, Easing.bezier(0.2, 0.0, 0.2, 1));
  const pos = start.clone().lerp(LAND, d);
  pos.x += Math.sin(d * Math.PI) * -1.2;
  // glides forward while drawing in the sand
  pos.x += k(f, T.draw, T.drawEnd, 0, 1.7, (x) => x);
  pos.y += 1.6 * k(f, T.rise, 1500);
  pos.x += 0.8 * k(f, T.rise, 1500);
  const pitch = -0.35 * (1 - d) + 0.12 * k(f, T.rise, 1500);
  const rot: [number, number, number] = [0, -0.45, pitch];
  // right front flipper: idle → drawing (wave) → pointing up → idle
  const drawPhase = (f - T.draw) * 0.1;
  const draw: [number, number, number] = [0, -0.8 + 0.32 * Math.sin(drawPhase), -0.3];
  const flick: [number, number, number] = [0, -0.35, -0.25];
  const point: [number, number, number] = [0.2, -1.1, 1.25];
  const idle: [number, number, number] = [0, -1.6, -0.12];
  const L = (a: [number, number, number], b: [number, number, number], x: number): [number, number, number] => [a[0] + (b[0] - a[0]) * x, a[1] + (b[1] - a[1]) * x, a[2] + (b[2] - a[2]) * x];
  let rFlip: [number, number, number] | null = null;
  if (f >= 900 && f < T.point) {
    rFlip = f < T.draw ? L(idle, [0, -0.8, -0.3], k(f, 900, T.draw)) : f < T.drawEnd ? draw : L(draw.map((v, i) => (i === 1 ? -0.8 + 0.32 * Math.sin((T.drawEnd - T.draw) * 0.1) : v)) as [number, number, number], flick, k(f, T.drawEnd, T.arrow + 15));
  } else if (f >= T.point && f < 1240) {
    rFlip = L(flick, point, k(f, T.point, T.point + 25)) ;
    if (f > 1200) rFlip = L(point, idle, k(f, 1200, 1240));
  }
  // eyes: calm; slow blinks with both eyes ("you can trust me")
  let expr: EyeExpr = EXPR.calma;
  for (const b of [T.blink1, T.blink2]) {
    const x = interpolate(f, [b, b + 14, b + 24, b + 40], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    if (x > 0) expr = mixExpr(EXPR.calma, EXPR.fechado, x);
  }
  if (f > T.point && f < T.two) expr = { ...EXPR.calma, look: [0.1, 0.4] };
  return { pos, rot, rFlip, expr, paddle: f < T.land ? 0.9 : f > T.rise ? 0.6 : 0.15, t };
};

// --- Ciro ------------------------------------------------------------------------------------
const ciroState = (f: number) => {
  const t = f / 30;
  const pos = SEAT.p.clone();
  // comes out of the hole, then rises with her
  pos.add(ROCK.recess.clone().multiplyScalar(1.5 * k(f, T.out, T.rise))).add(V3(0.5 * k(f, T.out, T.rise), 0.3 * k(f, T.out, T.rise), 0));
  pos.add(V3(0.9 * k(f, T.rise, 1500), 1.8 * k(f, T.rise, 1500), 0));
  let yaw = SEAT.yaw + 0.75;
  let pitch = 0.04 * Math.sin(t * 1.6);
  // startle jump at the impact
  if (f >= T.impact && f < T.impact + 20) pos.y += 0.12 * Math.sin(((f - T.impact) / 20) * Math.PI);
  // the "yes": the whole body nods
  if (f >= 775 && f < 835) pitch += 0.22 * Math.sin((f - 775) * 0.7) * (1 - (f - 775) / 60);
  if (f >= T.tilt && f < T.settle) pitch += 0.3 * k(f, T.tilt, 400);
  if (f >= 1200 && f < 1270) pitch += 0.35 * k(f, 1200, 1225) * (1 - k(f, 1250, 1270));
  if (f >= 1270 && f < T.out) yaw += -0.9 * k(f, 1270, 1295);
  if (f >= T.out) yaw += -0.9 * (1 - k(f, T.out, T.out + 30));
  if (f >= T.rise) pitch += 0.3 * k(f, T.rise, T.rise + 20);
  let expr: EyeExpr = EXPR.choro;
  let mouth: Mouth = "frown";
  if (f >= T.shadow && f < T.impact) expr = EXPR.choro;
  if (f >= T.impact && f < 420) { expr = EXPR.susto; mouth = "o"; }
  if (f >= 420 && f < 700) { expr = mixExpr({ ...EXPR.curioso, look: [0.0, 0.5] }, { ...EXPR.triste, lidTop: 0.15, look: [-0.25, 0.1] }, k(f, 560, 640)); mouth = "o"; }
  if (f >= 700 && f < 900) { expr = { ...EXPR.curioso, irisScale: 1.12, pupil: 0.55, look: [-0.2, 0.35] }; mouth = f > 770 ? "open" : "o"; }
  if (f >= 900 && f < 1200) { expr = { ...EXPR.curioso, look: f < T.point ? [-0.2, -0.25] : [0.0, 0.5] }; mouth = "o"; }
  if (f >= 1200 && f < 1270) { expr = { ...EXPR.curioso, look: [0.1, 0.55] }; mouth = "o"; }
  if (f >= 1270 && f < T.out) { expr = mixExpr({ ...EXPR.curioso, look: [0.3, 0.0] }, EXPR.ternura, k(f, 1305, 1335)); mouth = "smile"; }
  if (f >= T.out) { expr = mixExpr(EXPR.ternura, { ...EXPR.curioso, look: [0.3, 0.2] }, k(f, T.out, T.out + 30)); mouth = "open"; }
  // blinks
  for (const b of [700, 1110, 1390]) {
    const d = Math.abs(f - b);
    if (d < 4 && expr.mode === 0) expr = { ...expr, lidTop: Math.max(expr.lidTop, 1 - d / 4) };
  }
  return { pos, rot: [0, yaw, pitch] as [number, number, number], expr, mouth, swim: f >= T.out ? 0.5 : 0.18, fin: f < T.impact ? 0.25 : 0.5, t };
};

const eyesWorld = (c: ReturnType<typeof ciroState>) => {
  const m = new THREE.Matrix4().compose(c.pos, new THREE.Quaternion().setFromEuler(new THREE.Euler(...c.rot)), V3(1, 1, 1));
  return [V3(0.3, 0.07, 0.3).applyMatrix4(m), V3(0.3, 0.07, -0.3).applyMatrix4(m)];
};

// --- cameras ---------------------------------------------------------------------------------
const camFor = (f: number, c: THREE.Vector3, m: THREE.Vector3): Cam => {
  const R = ROCK.recess;
  if (f < T.tilt) {
    const push = k(f, 0, T.shadow, 0, 0.3);
    return { pos: c.clone().add(V3(-0.75 + push * 0.3, 0.12, 2.25 - push)), target: c.clone().add(V3(0.2, 0.08, 0.1)), fov: 32 };
  }
  if (f < T.settle + 10) {
    // tilt-up: from Ciro to the turtle descending (contra-plongée)
    const pos = c.clone().add(R.clone().multiplyScalar(1.9)).add(V3(0.4, -0.35, 0));
    const tgt = c.clone().lerp(m.clone().add(V3(0.8, 0.4, 0)), k(f, T.tilt + 4, 430));
    return { pos, target: tgt, fov: 40 + 8 * k(f, T.tilt, 430) };
  }
  const two: Cam = { pos: V3(-1.7, 2.6, 10.6), target: V3(-1.9, 1.15, 1.3), fov: 40 };
  if (f < T.draw - 30) return lerpCam({ ...two, pos: V3(-1.4, 3.0, 12.0) }, two, k(f, T.settle + 10, 640));
  if (f < T.point) {
    const top: Cam = { pos: V3(-3.4, 4.1, 8.0), target: V3(-3.4, 0.3, 4.3), fov: 42 };
    return lerpCam(two, top, k(f, T.draw - 30, T.draw));
  }
  if (f < T.two) {
    const a: Cam = { pos: V3(-2.6, 1.7, 9.8), target: V3(-3.2, 1.4, 1.6), fov: 44 };
    const b: Cam = { pos: V3(-2.6, 1.4, 9.8), target: V3(-1.0, 8.6, -1.5), fov: 52 };
    return lerpCam(a, b, k(f, T.current, 1170));
  }
  const close: Cam = { pos: V3(-1.3, 2.1, 8.2), target: V3(-1.6, 1.35, 1.4), fov: 40 };
  if (f < T.rise) return close;
  // they rise into the current; the camera tilts with them, then whips away
  const up: Cam = { pos: V3(-0.8, 3.2, 9.0), target: V3(-0.6, 4.2, 0.5), fov: 44 };
  const cam = lerpCam(close, up, k(f, T.rise, 1480));
  if (f >= T.whip) {
    const w = k(f, T.whip, 1500, 0, 1, Easing.in(Easing.cubic));
    cam.target = cam.target.clone().add(V3(18 * w, 1.5 * w, 0));
  }
  return cam;
};

export const Cena3: React.FC = () => {
  ensureFonts();
  const f = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const u = W / 1920;
  const t = f / 30;
  applyLook(LONE, t);
  sceneUniforms.uLightDir.value.set(0.15, 1.0, 0.35);

  const c = ciroState(f);
  const m = marisaState(f);
  const cam = camFor(f, c.pos, m.pos);

  // the line she draws: a clean wave whose head rides with her flipper as she glides, then an arrow
  const line = useMemo(() => {
    if (f < T.draw + 2) return null;
    const x0 = LAND.x + 1.2;
    const z0 = LAND.z + 3.05;
    const head = (ff: number) => {
      const x = marisaState(ff).pos.x + 1.2;
      return V3(x, 0, z0 + 0.32 * Math.sin(((x - x0) / 1.1) * Math.PI * 2));
    };
    const pts: THREE.Vector3[] = [];
    for (let ff = T.draw; ff <= Math.min(f, T.drawEnd); ff += 2) {
      const p = head(ff);
      p.y = sandH(p.x, p.z) + 0.03;
      pts.push(p);
    }
    if (pts.length < 3) return null;
    const geos: THREE.BufferGeometry[] = [new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length * 3, 0.07, 6, false)];
    if (f >= T.arrow) {
      const e = pts[pts.length - 1];
      const dir = V3(1, 0, 0);
      const grow = k(f, T.arrow, T.arrow + 14);
      for (const a of [0.65, -0.65]) {
        const wing = dir.clone().applyAxisAngle(V3(0, 1, 0), Math.PI + a).multiplyScalar(0.6 * grow);
        const q = e.clone().add(wing);
        q.y = sandH(q.x, q.z) + 0.03;
        if (grow > 0.02) geos.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([e, q]), 6, 0.07, 6, false));
      }
    }
    return { geos, pts };
  }, [f]);
  const lineMat = useMemo(() => makeToon({ color: "#7d735a", rim: 0.1 }), []);

  // tears that leave as little trembling bubbles
  const tears = useMemo(() => {
    const out: { p: THREE.Vector3; r: number }[] = [];
    if (f > 520) return out;
    for (let i = 0; i < 60; i++) {
      const born = 50 + i * 7;
      const age = (f - born) / 30;
      if (age < 0 || age > 2.6) continue;
      const src = eyesWorld(ciroState(born))[i % 2];
      out.push({ p: src.clone().add(V3(0.04 * age + Math.sin(age * 9 + i) * 0.04, age * 0.2, Math.cos(age * 7 + i) * 0.03)), r: (0.05 + random(`tr${i}`) * 0.035) * Math.min(1, age * 6) });
    }
    return out;
  }, [f]);

  const rays = useMemo(() => Array.from({ length: 6 }).map((_, i) => ({ x: -8 + i * 4 + random(`r3${i}`) * 2, z: -6 + random(`r3z${i}`) * 5, w: 1 + random(`r3w${i}`) * 1.5, tilt: 0.15, ph: i })), []);

  // pixel-bloom from the 1-bit world: 320 → 480 → 960 → 1920 in 12 frames
  const div = f < 3 ? 6 : f < 6 ? 4 : f < 9 ? 2 : 1;
  const cw = Math.round(W / div);
  const ch = Math.round(H / div);

  // 2D overlays
  const headWorld = m.pos.clone().add(V3(1.52 * MS * Math.cos(0.45), 0.3 * MS, 1.52 * MS * Math.sin(0.45)));
  const head = project(headWorld, cam, W, H);
  const pop = f < T.balloonOut
    ? interpolate(f, [T.balloon, T.balloon + 5, T.balloon + 8], [0, 1.1, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : interpolate(f, [T.balloonOut, T.balloonOut + 3, T.balloonOut + 8], [1, 1.1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const impact = f >= T.impact && f < T.impact + 3;
  const shadowX = interpolate(f, [T.shadow, T.impact + 4], [-0.6, 1.4], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#104a66" }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id="whip"><feGaussianBlur stdDeviation={`${60 * u * k(f, T.whip, 1500)} 0`} /></filter>
      </svg>
      <div style={{
        position: "absolute", left: 0, top: 0, width: cw, height: ch,
        transform: `scale(${div})`, transformOrigin: "0 0", imageRendering: div > 1 ? "pixelated" : "auto",
        filter: impact ? ((f - T.impact) % 2 === 0 ? "grayscale(1) contrast(9) invert(1)" : "grayscale(1) contrast(9)") : f >= T.whip ? "url(#whip)" : undefined,
      }}>
        <ThreeCanvas width={cw} height={ch} flat linear={false} camera={{ fov: 40, position: [0, 2, 10] }} gl={{ antialias: div === 1 }}>
          <CameraRig cam={cam} />
          <Sky look={LONE} camPos={cam.pos} sunAmt={0.35} />
          <Sand look={LONE} time={t} centerX={0} />
          <Rock time={t} />
          <BubbleColumns vents={[{ x: 5, z: -4 }, { x: -9, z: -3 }]} time={t} perVent={10} />
          <Fish variant={CIRO} time={c.t} position={[c.pos.x, c.pos.y, c.pos.z]} rotation={c.rot} expr={c.expr} mouth={c.mouth} swim={c.swim} finOpen={c.fin} />
          {f >= 300 ? (
            <Marisa time={m.t} position={[m.pos.x, m.pos.y, m.pos.z]} rotation={m.rot} scale={MS} expr={m.expr} paddle={m.paddle} rFlip={m.rFlip} />
          ) : null}
          {line ? line.geos.map((g, i) => <mesh key={i} geometry={g} material={lineMat} />) : null}
          {tears.map((tr, i) => <Bubble key={i} position={[tr.p.x, tr.p.y, tr.p.z]} radius={tr.r} squash={0.12 * Math.sin(f * 0.9 + i)} />)}
          <CurrentField time={t} center={[0, 8.6, -1]} size={[60, 3.2, 12]} dir={[1, 0, 0]} speed={2.4} intensity={0.35 + 1.0 * k(f, T.current, 1160)} pxScale={H} />
          <GodRays rays={rays} time={t} camPos={cam.pos} intensity={0.12} />
        </ThreeCanvas>
      </div>

      {/* the huge shadow passing over */}
      {f >= T.shadow && f < T.impact + 6 ? (
        <AbsoluteFill style={{ background: `radial-gradient(ellipse 55% 75% at ${shadowX * 100}% 35%, rgba(2,10,20,0.72) 0%, rgba(2,10,20,0.35) 45%, rgba(2,10,20,0) 75%)` }} />
      ) : null}

      {/* the glitter of the lifted sand along the drawing */}
      {line && f < T.point + 20
        ? Array.from({ length: 9 }).map((_, i) => {
            const p = line.pts[Math.floor(random(`gl${i}`) * line.pts.length)];
            const s = project(V3(p.x, p.y + 0.15 + ((f + i * 7) % 30) / 60, p.z), cam, W, H);
            const tw = Math.max(0, Math.sin(f * 0.35 + i * 1.7));
            return <Sparkle key={i} x={s.x} y={s.y} size={(10 + 10 * tw) * u} rot={f * 4 + i * 30} opacity={tw * (1 - k(f, T.point, T.point + 20))} color="#fff6d0" />;
          })
        : null}

      {/* pictographic balloon: the school in a spiral, and a "?" */}
      <Balloon x={head.x - 330 * u} y={head.y - 300 * u} w={470 * u} h={300 * u} tx={head.x - 40 * u} ty={head.y - 60 * u} pop={pop}>
        {Array.from({ length: 16 }).map((_, i) => {
          const a = i * 0.62 + f * 0.03;
          const r = (18 + i * 6.2) * u;
          return <FishGlyph key={i} x={-55 * u + Math.cos(a) * r} y={Math.sin(a) * r * 0.75} s={u * 1.25} rot={(a * 180) / Math.PI + 90} />;
        })}
        <BalloonMark ch="?" x={150 * u} y={0} size={150 * u} />
      </Balloon>

      <Grade vignette={0.42} />
      {f < T.bloom ? <AbsoluteFill style={{ background: "#bff3ff", opacity: 0.55 * (1 - f / T.bloom), mixBlendMode: "screen" }} /> : null}
    </AbsoluteFill>
  );
};

import React, { useMemo } from "react";
import * as THREE from "three";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { CIRO, Fish, finTipWorld, MAE, Mouth } from "../characters/Fish";
import { EXPR, EyeExpr, mixExpr } from "../lib/materials";
import { applyLook, Bubble, BubbleColumns, FarReef, GodRays, Sand, SHALLOW, Sky } from "../world/World";
import { School } from "../world/School";
import { millPose, millSlots, streamPose, streamSlots } from "../world/formation";
import { Cam, CameraRig, lerpCam, project, V3 } from "./cam";
import { Grade, Iris } from "../fx/Grade";
import { Pop, Sparkle } from "../fx/AnimeFx";

// Cena 1 · [0:05–0:50] · O menor e o mais curioso. Local frames 0–1350 (film f150–1500).
export const CENA1_FRAMES = 1350;

const ease = Easing.bezier(0.45, 0, 0.25, 1);
const k = (f: number, a: number, b: number, from = 0, to = 1) =>
  interpolate(f, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });

const SPEED = 1.25;
const ORIGIN: [number, number, number] = [0, 3.6, 0];
const CIRO_SLOT = V3(-1.0, 1.1, 2.0);
const MAE_SLOT = V3(-1.7, 0.85, 0.75);
const MILL_C: [number, number, number] = [4, 4.6, -7];

// Shot boundaries (local frames)
const S = {
  wide: 0, enter: 210, bubbles: 390, ray: 490, reef: 590, touch: 690, detail: 830, iri: 930, starClose: 1020,
  leave: 1110, popClose: 1290, end: 1350,
};

const schoolX = (f: number) => ORIGIN[0] + (SPEED * f) / 30;

// Ciro's choreography, relative to his slot in the travelling school
const ciroState = (f: number) => {
  const t = f / 30;
  const base = V3(schoolX(f), ORIGIN[1], ORIGIN[2]).add(CIRO_SLOT);
  // drift out of formation while curious (S3), pulled back by the mother (S4)
  const drift = k(f, 400, 600, 0, 1) * (1 - k(f, 740, 820, 0, 1));
  base.add(V3(0.3 * drift, 0.45 * drift, 0.55 * drift));
  // rises to touch the light ray
  base.y += 0.25 * k(f, 505, 545) * (1 - k(f, 575, 600));
  // leaves after the iridescent bubble: chases it
  if (f > 1125) {
    const b = iriBubble(f).pos.clone().add(V3(-1.25, -0.12, -0.15));
    base.lerp(b, k(f, 1125, 1195));
  }

  let pitch = 0.04 * Math.sin(t * 2.1);
  let yaw = 0;
  let lean = 0;
  if (f >= S.enter && f < S.ray) pitch += 0.28 * k(f, 330, 420) ;
  if (f >= S.bubbles && f < S.ray) lean = 0.28 * k(f, 400, 430);
  if (f >= S.ray && f < S.reef) pitch += 0.3 * k(f, 495, 540) * (1 - k(f, 570, 590));
  if (f >= S.reef && f < S.touch) yaw = -0.5 * k(f, 600, 645);
  if (f >= S.iri && f < S.leave) yaw = interpolate(f, [940, 1000, 1060], [-0.35, 0.1, 0.35], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (f >= S.leave) {
    yaw = 0.15;
    pitch += 0.2 * k(f, 1135, 1180);
  }

  // eyes
  const up: EyeExpr = { ...EXPR.curioso, look: [0.05, 0.5] };
  let expr: EyeExpr = EXPR.neutro;
  let mouth: Mouth = "smile";
  if (f >= 300 && f < S.bubbles) expr = mixExpr(EXPR.neutro, up, k(f, 315, 340));
  if (f >= S.bubbles && f < S.ray) expr = mixExpr({ ...EXPR.curioso, look: [0.2, 0.05] }, up, k(f, 400, 470));
  if (f >= S.ray && f < S.reef) {
    expr = { ...EXPR.curioso, look: [0.1, 0.3], shine: 0.3 + 0.9 * k(f, 535, 550) };
    mouth = f > 530 ? "o" : "smile";
  }
  if (f >= S.reef && f < S.touch) expr = { ...EXPR.curioso, look: [0.3, 0.06] };
  if (f >= S.touch && f < S.iri) {
    expr = f < 750 ? { ...EXPR.curioso, look: [-0.1, -0.1] } : mixExpr({ ...EXPR.curioso, look: [-0.1, -0.1] }, EXPR.ternura, k(f, 750, 775));
  }
  if (f >= S.iri && f < S.starClose) {
    expr = { ...EXPR.curioso, look: [interpolate(f, [940, 1015], [-0.25, 0.3], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), 0.15] };
    mouth = "o";
  }
  if (f >= S.starClose) {
    expr = f < 1040 ? mixExpr(EXPR.curioso, EXPR.estrela, k(f, 1022, 1034)) : EXPR.estrela;
    mouth = "grin";
  }
  // blink (keeps him alive), not during the star close-up
  const blinkAt = [250, 470, 640, 900, 1210];
  for (const b of blinkAt) {
    const d = Math.abs(f - b);
    if (d < 4 && expr.mode === 0) expr = { ...expr, lidTop: Math.max(expr.lidTop, 1 - d / 4) };
  }
  // fin: flap normally; at the touch the left fin reaches out
  const finOpen = 0.55 + 0.4 * k(f, 715, 750) * (1 - k(f, 905, 935));
  return { pos: base, pitch, yaw, lean, expr, mouth, finOpen, swimSpeed: f >= S.leave ? 1.6 : 1 };
};

const maeRot = (t: number): [number, number, number] => [0, 0, 0.02 * Math.sin(t * 1.7)];

const ciroTip = (f: number) => {
  const c = ciroState(f);
  const t = f / 30;
  return finTipWorld(CIRO, -1, { position: [c.pos.x, c.pos.y, c.pos.z], rotation: [0, c.yaw, c.pitch], lean: c.lean, finOpen: c.finOpen, time: t, swimSpeed: c.swimSpeed });
};

const maeState = (f: number) => {
  const t = f / 30;
  const slot = V3(schoolX(f), ORIGIN[1], ORIGIN[2]).add(MAE_SLOT);
  const finOpen = 0.55 + 0.42 * k(f, 715, 750) * (1 - k(f, 905, 935));
  // she glides beside him until her right fin tip meets his left fin tip
  const rel = finTipWorld(MAE, 1, { position: [0, 0, 0], rotation: maeRot(t + 0.4), finOpen, time: t + 0.4 });
  const touch = ciroTip(f).sub(rel).add(V3(0, 0, -0.015));
  const g = k(f, 695, 750) * (1 - k(f, 910, 965));
  const pos = slot.clone().lerp(touch, g);
  const expr = f > 740 ? EXPR.ternura : EXPR.calma;
  return { pos, expr, finOpen };
};

// --- cameras -----------------------------------------------------------------
const camFor = (f: number, c: THREE.Vector3): Cam => {
  if (f < S.enter) {
    const a = k(f, 0, 210, -0.3, 0.12);
    const R = 25 - k(f, 0, 210, 0, 3);
    return { pos: V3(MILL_C[0] + Math.sin(a) * R, 11 - k(f, 0, 210, 0, 1.5), MILL_C[2] + Math.cos(a) * R), target: V3(MILL_C[0], MILL_C[1] - 0.8, MILL_C[2]), fov: 40 };
  }
  if (f < S.bubbles) {
    // inside the school, then finds Ciro at the edge
    const a: Cam = { pos: c.clone().add(V3(-8.5, -0.5, -1.5)), target: c.clone().add(V3(2, -0.3, -1.8)), fov: 46 };
    const b: Cam = { pos: c.clone().add(V3(1.9, 0.05, 2.5)), target: c.clone().add(V3(0.1, 0.05, 0)), fov: 34 };
    return lerpCam(a, b, k(f, 210, 320));
  }
  if (f < S.ray) {
    const a: Cam = { pos: c.clone().add(V3(1.7, -0.35, 1.55)), target: c.clone().add(V3(0.25, 0.3, 0.1)), fov: 36 };
    const b: Cam = { pos: c.clone().add(V3(1.6, -0.5, 1.5)), target: c.clone().add(V3(0.2, 0.55, 0.2)), fov: 36 };
    return lerpCam(a, b, k(f, 390, 490));
  }
  if (f < S.reef) {
    return { pos: c.clone().add(V3(0.6, 0.15, 2.3 - 0.4 * k(f, 490, 590))), target: c.clone().add(V3(0.25, 0.25, 0)), fov: 34 };
  }
  if (f < S.touch) {
    // what he sees: the reef, far and blurred by the blue, past the edge of the school
    const a: Cam = { pos: c.clone().add(V3(-1.1, 0.45, 0.35)), target: V3(c.x + 22, 2.4, c.z + 40), fov: 42 };
    const b: Cam = { pos: c.clone().add(V3(-0.9, 0.4, 0.45)), target: V3(c.x + 22, 2.4, c.z + 40), fov: 36 };
    return lerpCam(a, b, k(f, 590, 690));
  }
  if (f < S.detail) {
    const a: Cam = { pos: c.clone().add(V3(2.7, 1.5, 1.7)), target: c.clone().add(V3(-0.25, -0.15, -0.5)), fov: 36 };
    const b: Cam = { pos: c.clone().add(V3(2.3, 1.3, 1.45)), target: c.clone().add(V3(-0.25, -0.15, -0.5)), fov: 36 };
    return lerpCam(a, b, k(f, 690, 830));
  }
  if (f < S.iri) {
    // the detail: two blue tips together, seen from below
    const tip = ciroTip(f);
    return { pos: tip.clone().add(V3(1.25 - 0.25 * k(f, 830, 930), -0.42, 0.04)), target: tip.clone().add(V3(0, 0.05, 0)), fov: 30 };
  }
  if (f < S.starClose) {
    return { pos: c.clone().add(V3(1.6, 0.2, 2.7)), target: c.clone().add(V3(0.4, 0.1, 0)), fov: 36 };
  }
  if (f < S.leave) {
    const a: Cam = { pos: c.clone().add(V3(1.45, 0.12, 1.75)), target: c.clone().add(V3(0.3, 0.07, 0.1)), fov: 30 };
    const b: Cam = { pos: c.clone().add(V3(1.2, 0.1, 1.45)), target: c.clone().add(V3(0.3, 0.07, 0.1)), fov: 29 };
    return lerpCam(a, b, k(f, 1020, 1110));
  }
  if (f < S.popClose) {
    const x0 = schoolX(1110);
    const pan = k(f, 1150, 1290, 0, 7);
    return { pos: V3(x0 + 4 + pan, 7.5, 15.5), target: V3(x0 + 4 + pan * 1.1, 3.4, -3), fov: 48 };
  }
  // the bubble in close-up, Ciro behind it
  const b = iriBubble(f);
  return { pos: b.pos.clone().add(V3(1.7 - 0.4 * k(f, 1290, 1330), 0.08, 0.45)), target: b.pos.clone().add(V3(-0.3, -0.05, 0)), fov: 36 };
};

// The iridescent bubble: drifts in, passes Ciro, then leads him away
const iriBubble = (f: number) => {
  const t = (f - 930) / 30;
  const c0 = V3(schoolX(930), ORIGIN[1], ORIGIN[2]).add(CIRO_SLOT);
  const pos = c0.clone().add(V3(-1.2 + t * (SPEED + 0.55), 0.55 + Math.sin(t * 1.7) * 0.12, 0.9));
  if (f > 1120) {
    const g = (f - 1120) / 30;
    pos.x += g * g * 0.25 + g * 0.9;
    pos.y += k(f, 1120, 1300, 0, 1.4);
    pos.z += k(f, 1120, 1300, 0, 1.0);
  }
  const popped = f >= 1328;
  return { pos, popped, visible: f >= 930 && !popped };
};

export const Cena1: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const f = frame;
  const t = f / 30;
  applyLook(SHALLOW, t);

  const mSlots = useMemo(millSlots, []);
  const sSlots = useMemo(
    () => streamSlots([[CIRO_SLOT.x, CIRO_SLOT.y, CIRO_SLOT.z], [MAE_SLOT.x, MAE_SLOT.y, MAE_SLOT.z], [CIRO_SLOT.x - 0.3, CIRO_SLOT.y, CIRO_SLOT.z - 1.0], [CIRO_SLOT.x + 0.3, CIRO_SLOT.y + 0.45, CIRO_SLOT.z + 0.55]], 300),
    [],
  );
  const rays = useMemo(
    () => Array.from({ length: 16 }).map((_, i) => ({
      x: -10 + i * 6 + random(`ray${i}`) * 4, z: -14 + random(`rayz${i}`) * 14, w: 1.2 + random(`rayw${i}`) * 2.2, tilt: 0.38, ph: i * 1.7,
    })),
    [],
  );
  const vents = useMemo(
    () => [...Array.from({ length: 10 }).map((_, i) => ({ x: -6 + i * 8 + random(`v${i}`) * 3, z: -10 + random(`vz${i}`) * 8 })), { x: 18.6, z: 3.0 }, { x: 18.95, z: 2.7 }],
    [],
  );

  const c = ciroState(f);
  const m = maeState(f);
  const cam = camFor(f, c.pos);
  const ib = iriBubble(f);

  const pose = f < S.enter
    ? (i: number) => millPose(mSlots[i], t, MILL_C[0], MILL_C[1], MILL_C[2])
    : (i: number) => streamPose(sSlots[i], t, ORIGIN, SPEED, f >= S.leave ? 1165 / 30 : null);
  const count = f < S.enter ? mSlots.length : sSlots.length;

  // the special light ray Ciro touches (S3b)
  const touchRay = f >= S.ray && f < S.reef;
  const rayPos = ciroState(540).pos;

  // 2D overlays
  const eyeWorld = c.pos.clone().add(V3(0.32, 0.12, 0.3));
  const eyeScr = project(eyeWorld, cam, width, height);
  const ibScr = project(ib.pos, cam, width, height);
  const irisR = f >= S.popClose ? interpolate(f, [1300, 1342], [1300, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) }) : 99999;

  return (
    <AbsoluteFill style={{ background: "#0E6E8C" }}>
      <ThreeCanvas width={width} height={height} flat linear={false} camera={{ fov: 40, position: [0, 3, 20] }} gl={{ antialias: true }}>
        <CameraRig cam={cam} />
        <Sky look={SHALLOW} camPos={cam.pos} />
        <Sand look={SHALLOW} time={t} />
        <FarReef position={[12, 0, -48]} scale={1.3} />
        <FarReef position={[72, 0, -40]} scale={1.5} />
        <FarReef position={[50, 0, 44]} scale={1.6} />
        <School count={count} pose={pose} />
        <BubbleColumns vents={vents} time={t} />
        {f >= S.enter ? <Fish variant={CIRO} time={t} position={[c.pos.x, c.pos.y, c.pos.z]} rotation={[0, c.yaw, c.pitch]} lean={c.lean}
          expr={c.expr} mouth={c.mouth} finOpen={c.finOpen} swimSpeed={c.swimSpeed} swim={0.45} /> : null}
        {f >= S.enter ? (
          <Fish variant={MAE} time={t + 0.4} position={[m.pos.x, m.pos.y, m.pos.z]} rotation={maeRot(t + 0.4)}
            expr={m.expr} finOpen={m.finOpen} swim={0.4} />
        ) : null}
        {ib.visible ? <Bubble position={[ib.pos.x, ib.pos.y, ib.pos.z]} radius={0.32 + 0.04 * Math.sin(t * 3)} iri={1} squash={0.06 * Math.sin(t * 4)} /> : null}
        <GodRays rays={rays} time={t} camPos={cam.pos} intensity={0.2} />
        {touchRay ? (
          <GodRays rays={[{ x: rayPos.x + 0.75, z: rayPos.z, w: 1.3, tilt: 0.3, ph: 0 }]} time={t} camPos={cam.pos} intensity={0.9} color="#fff6d8" />
        ) : null}
      </ThreeCanvas>

      {/* S3b: light catches his eyes */}
      {touchRay && f > 538
        ? [0, 1, 2].map((i) => (
            <Sparkle key={i} x={eyeScr.x + [-30, 50, 15][i] * (width / 1920)} y={eyeScr.y + [-60, -20, 40][i] * (width / 1920)}
              size={(22 + 10 * Math.sin((f - 538) * 0.4 + i * 2)) * (width / 1920)} rot={(f - 538) * 3 + i * 20}
              opacity={k(f, 538, 548) * (1 - k(f, 575, 590))} />
          ))
        : null}
      {/* S5 close-up: star pupils + sparkles */}
      {f >= S.starClose && f < S.leave
        ? [0, 1, 2, 3, 4].map((i) => {
            const a = (i / 5) * Math.PI * 2 + f * 0.02;
            const r = 300 * (width / 1920);
            return (
              <Sparkle key={i} x={eyeScr.x + Math.cos(a) * r} y={eyeScr.y + Math.sin(a) * r * 0.7}
                size={(18 + 12 * Math.sin(f * 0.3 + i)) * (width / 1920)} rot={f * 2} opacity={k(f, 1034, 1046) * 0.9} color={i % 2 ? "#fff3b0" : "#ffffff"} />
            );
          })
        : null}
      {f >= 1326 && f < 1345 ? <Pop x={ibScr.x} y={ibScr.y} t={(f - 1328) / 14} r={120 * (width / 1920)} /> : null}
      <Grade />
      {f >= S.popClose ? <Iris cx={ibScr.x} cy={ibScr.y} r={irisR * (width / 1920)} /> : null}
    </AbsoluteFill>
  );
};

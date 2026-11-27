import React, { useMemo } from "react";
import * as THREE from "three";
import { Toon } from "../lib/Toon";
import { bump, ellipsoid, fin, sweepX } from "../lib/geom";
import { applyExpr, EXPR, EyeExpr, makeEye, makeOutline, makeToon, makeWave, PATTERN } from "../lib/materials";
import { C } from "../lib/palette";

export type Mouth = "smile" | "o" | "flat" | "frown" | "grin";

type Variant = {
  len: number;
  height: number;
  width: number;
  front: number; // bluntness of the nose (lower = rounder)
  back: number;
  tailScale: number;
  tailFork: number;
  eyeSize: number;
  eyeX: number;
  body: string;
  outline: number;
  lash: number;
};

export const CIRO: Variant = {
  len: 1.5, height: 0.56, width: 0.62, front: 0.38, back: 0.95,
  tailScale: 0.85, tailFork: 0.06, eyeSize: 0.27, eyeX: 0.46, body: C.silverLight, outline: 0.022, lash: 0,
};
export const MAE: Variant = {
  len: 2.4, height: 0.5, width: 0.48, front: 0.62, back: 1.15,
  tailScale: 1.25, tailFork: 0.2, eyeSize: 0.22, eyeX: 0.56, body: C.silver, outline: 0.026, lash: 1,
};

const tailShape = (s: number, fork: number) => {
  const sh = new THREE.Shape();
  sh.moveTo(0.06, 0.08 * s);
  sh.quadraticCurveTo(-0.16 * s, 0.12 * s, -0.4 * s, 0.34 * s);
  sh.quadraticCurveTo(-0.5 * s, 0.18 * s, (-0.42 + fork) * s, 0);
  sh.quadraticCurveTo(-0.5 * s, -0.18 * s, -0.4 * s, -0.34 * s);
  sh.quadraticCurveTo(-0.16 * s, -0.12 * s, 0.06, -0.08 * s);
  sh.closePath();
  return sh;
};

const dorsalShape = (s: number) => {
  const sh = new THREE.Shape();
  sh.moveTo(0.26 * s, -0.04);
  sh.quadraticCurveTo(0.12 * s, 0.3 * s, -0.22 * s, 0.26 * s);
  sh.quadraticCurveTo(-0.32 * s, 0.12 * s, -0.3 * s, -0.04);
  sh.closePath();
  return sh;
};

const pectoralShape = () => {
  const sh = new THREE.Shape();
  sh.moveTo(0.02, 0.035);
  sh.quadraticCurveTo(-0.14, 0.13, -0.29, 0.06);
  sh.quadraticCurveTo(-0.33, -0.02, -0.25, -0.05);
  sh.quadraticCurveTo(-0.1, -0.055, 0.02, -0.035);
  sh.closePath();
  return sh;
};

// A mouth drawn as an ink tube lying on the body surface, so it reads from 3/4 views.
const mouthCurve = (
  kind: Mouth,
  len: number,
  ry: (t: number) => number,
  rz: (t: number) => number,
  yOff: (t: number) => number,
) => {
  const pts: THREE.Vector3[] = [];
  const n = 21;
  const wide = kind === "grin" ? 1.35 : kind === "o" ? 0.45 : 1;
  for (let i = 0; i < n; i++) {
    const s = (i / (n - 1)) * 2 - 1;
    const as = Math.abs(s);
    const t = 0.03 + 0.085 * wide * Math.pow(as, 1.4);
    let bend = 0.0;
    if (kind === "smile" || kind === "grin") bend = -0.1 * as * as;
    if (kind === "frown") bend = 0.1 * as * as;
    const a = Math.PI * (0.64 + bend) * Math.sign(s || 1);
    const x = len / 2 - t * len;
    const k = 1.02;
    pts.push(new THREE.Vector3(x + 0.004, yOff(t) + ry(t) * Math.cos(a) * k, rz(t) * Math.sin(a) * k));
  }
  if (kind === "o") {
    // close into a small loop
    const back = pts.slice(1, -1).reverse().map((p) => p.clone().add(new THREE.Vector3(0, -0.07, 0)));
    pts.push(...back);
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 48, 0.02, 6, true);
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, kind === "grin" ? 0.024 : 0.019, 6, false);
};

export const Fish: React.FC<{
  variant?: Variant;
  time: number;
  expr?: EyeExpr | keyof typeof EXPR;
  mouth?: Mouth;
  swim?: number; // 0..1 tail amplitude
  swimSpeed?: number;
  lean?: number; // roll to the side (curious gesture)
  finOpen?: number;
  finTip?: string | null; // the electric-blue fin tip (null to hide)
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}> = ({
  variant = CIRO,
  time,
  expr = "neutro",
  mouth = "smile",
  swim = 0.5,
  swimSpeed = 1,
  lean = 0,
  finOpen = 0.55,
  finTip = C.ciroBlue,
  position,
  rotation,
  scale = 1,
}) => {
  const v = variant;
  const parts = useMemo(() => {
    const prof = bump(v.front, v.back);
    const ry = (t: number) => v.height * Math.max(prof(Math.min(t, 0.985)), 0.0) * (t > 0.985 ? 0 : 1);
    const rz = (t: number) => ry(t) * v.width;
    const yOff = (t: number) => -0.04 * Math.sin(t * Math.PI);
    const body = sweepX(v.len, ry, rz, yOff);
    const tail = fin(tailShape(v.tailScale, v.tailFork), 0.015, 0.02);
    tail.translate(-v.len / 2 + 0.12, 0, 0);
    const dorsal = fin(dorsalShape(v.len / 1.5), 0.012, 0.018);
    const dT = 0.5;
    dorsal.translate(v.len / 2 - dT * v.len, ry(dT) - 0.07, 0);
    const anal = fin(dorsalShape(v.len / 2.6), 0.012, 0.016);
    anal.rotateX(Math.PI);
    anal.translate(v.len / 2 - 0.72 * v.len, -ry(0.72) + 0.06, 0);
    const pect = fin(pectoralShape(), 0.012, 0.018);
    const eye = ellipsoid(0.92, 1, 0.34, 40, 28);
    const tEye = v.eyeX / v.len;
    return { body, tail, dorsal, anal, pect, eye, ry, rz, yOff, tEye };
  }, [v]);

  const mats = useMemo(() => {
    const wave = makeWave();
    const body = makeToon(
      {
        color: v.body,
        tip: C.belly,
        tipAxis: [0, -1, 0],
        tipStart: 0.12,
        tipSoft: 0.03,
        spec: 0.5,
        rim: 0.45,
        pattern: PATTERN.scales,
        patternColor: "#8ea3c4",
        patternScale: 9,
        patternAmt: 0.55,
      },
      wave,
    );
    const finM = makeToon({ color: "#dbe6f2", rim: 0.3, spec: 0.2 }, wave);
    const pect = makeToon({
      color: "#dbe6f2",
      tip: finTip ?? "#dbe6f2",
      tipAxis: [-1, 0, 0],
      tipStart: 0.2,
      tipSoft: 0.015,
      rim: 0.3,
    });
    const line = makeOutline(v.outline, wave);
    const lineStatic = makeOutline(v.outline);
    const eyeR = makeEye({ iris: "#2b7fd6", irisDark: "#0d2a63", skin: v.body, side: 1, lash: v.lash });
    const eyeL = makeEye({ iris: "#2b7fd6", irisDark: "#0d2a63", skin: v.body, side: -1, lash: v.lash });
    const eyeLine = makeOutline(0.06);
    const ink = new THREE.MeshBasicMaterial({ color: C.ink });
    return { wave, body, finM, pect, line, lineStatic, eyeR, eyeL, eyeLine, ink };
  }, [v, finTip]);

  const phase = time * 9 * swimSpeed;
  mats.wave.uWaveAmp.value = 0.32 * swim;
  mats.wave.uWavePhase.value = phase;
  mats.wave.uWaveFreq.value = 3.2;
  mats.wave.uWaveStart.value = v.len * 0.08;

  const e = typeof expr === "string" ? EXPR[expr] : expr;
  applyExpr(mats.eyeR, e);
  applyExpr(mats.eyeL, e);

  const { ry, rz, tEye } = parts;
  const ex = v.len / 2 - v.eyeX;
  const ey = 0.06;
  const ez = rz(tEye) * 0.97;
  const yaw = 0.42;

  const px = v.len / 2 - 0.66 * Math.min(v.len, 1.7);
  const pz = rz(0.45) * 0.8;
  const flap = finOpen + 0.18 * Math.sin(time * 7 * swimSpeed);

  const mouthG = useMemo(
    () => mouthCurve(mouth, v.len, parts.ry, parts.rz, parts.yOff),
    [mouth, v.len, parts],
  );

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <group rotation={[lean, 0, 0]}>
        <Toon geometry={parts.body} material={mats.body} outline={mats.line} />
        <Toon geometry={parts.tail} material={mats.finM} outline={mats.line} />
        <Toon geometry={parts.dorsal} material={mats.finM} outline={mats.line} />
        <Toon geometry={parts.anal} material={mats.finM} outline={mats.line} />
        {/* pectoral fins (with the blue tip) */}
        <Toon geometry={parts.pect} material={mats.pect} outline={mats.lineStatic}
          position={[px, -0.2, pz]} rotation={[0.25, flap, -0.5]} />
        <Toon geometry={parts.pect} material={mats.pect} outline={mats.lineStatic}
          position={[px, -0.2, -pz]} rotation={[-0.25, -flap, -0.5]} />
        {/* eyes */}
        <Toon geometry={parts.eye} material={mats.eyeR} outline={mats.eyeLine}
          position={[ex, ey, ez]} rotation={[0, yaw, 0]} scale={v.eyeSize} />
        <Toon geometry={parts.eye} material={mats.eyeL} outline={mats.eyeLine}
          position={[ex, ey, -ez]} rotation={[0, Math.PI - yaw, 0]} scale={v.eyeSize} />
        {/* mouth */}
        <mesh geometry={mouthG} material={mats.ink} />
      </group>
      {/* keep ry referenced for future attachments */}
      <group userData={{ h: ry(0.4) }} />
    </group>
  );
};

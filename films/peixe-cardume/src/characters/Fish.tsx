import React, { useMemo } from "react";
import * as THREE from "three";
import { Toon } from "../lib/Toon";
import { bump, ellipsoid, fin, sweepX } from "../lib/geom";
import { applyExpr, EXPR, EyeExpr, makeEye, makeOutline, makeToon, makeWave, PATTERN } from "../lib/materials";
import { C } from "../lib/palette";

export type Mouth = "smile" | "o" | "flat" | "frown" | "grin" | "open";

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
  tailScale: 1.2, tailFork: 0.05, eyeSize: 0.27, eyeX: 0.46, body: C.silverLight, outline: 0.022, lash: 0,
};
export const MAE: Variant = {
  len: 2.4, height: 0.5, width: 0.48, front: 0.62, back: 1.15,
  tailScale: 1.7, tailFork: 0.22, eyeSize: 0.22, eyeX: 0.56, body: C.silver, outline: 0.026, lash: 1,
};

const tailShape = (s: number, fork: number) => {
  const sh = new THREE.Shape();
  sh.moveTo(0.06, 0.07 * s);
  sh.quadraticCurveTo(-0.12 * s, 0.14 * s, -0.36 * s, 0.4 * s);
  sh.quadraticCurveTo(-0.52 * s, 0.3 * s, (-0.4 + fork) * s, 0.04 * s);
  sh.quadraticCurveTo(-0.45 * s, 0, (-0.4 + fork) * s, -0.04 * s);
  sh.quadraticCurveTo(-0.52 * s, -0.3 * s, -0.36 * s, -0.4 * s);
  sh.quadraticCurveTo(-0.12 * s, -0.14 * s, 0.06, -0.07 * s);
  sh.closePath();
  return sh;
};

const dorsalShape = (s: number) => {
  const sh = new THREE.Shape();
  sh.moveTo(0.3 * s, -0.04);
  sh.quadraticCurveTo(0.16 * s, 0.42 * s, -0.2 * s, 0.4 * s);
  sh.quadraticCurveTo(-0.34 * s, 0.2 * s, -0.32 * s, -0.04);
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
  const wide = kind === "grin" ? 1.35 : kind === "o" ? 0.45 : kind === "open" ? 1.25 : 1;
  for (let i = 0; i < n; i++) {
    const s = (i / (n - 1)) * 2 - 1;
    const as = Math.abs(s);
    const t = 0.02 + 0.036 * wide * Math.pow(as, 1.3);
    let bend = 0.0;
    if (kind === "smile" || kind === "grin" || kind === "open") bend = -0.1 * as * as;
    if (kind === "frown") bend = 0.1 * as * as;
    const a = Math.PI * (0.78 + bend) * Math.sign(s || 1);
    const x = len / 2 - t * len;
    const k = 1.02;
    pts.push(new THREE.Vector3(x + 0.004, yOff(t) + ry(t) * Math.cos(a) * k, rz(t) * Math.sin(a) * k));
  }
  if (kind === "open") {
    const back = pts.slice(1, -1).reverse().map((p, i, arr) => {
      const u = (i + 1) / (arr.length + 1);
      return p.clone().add(new THREE.Vector3(-0.015 * Math.sin(u * Math.PI), -0.2 * Math.sin(u * Math.PI), 0));
    });
    pts.push(...back);
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 64, 0.02, 6, true);
  }
  if (kind === "o") {
    const t0 = 0.035;
    const g = new THREE.SphereGeometry(1, 16, 12);
    g.scale(0.035, 0.07, 0.065);
    g.translate(len / 2 - t0 * len + 0.01, yOff(t0) - ry(t0) * 0.55, 0);
    return g;
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, kind === "grin" ? 0.026 : 0.023, 6, false);
};

// World position of a pectoral fin tip (side 1 = right/+z, -1 = left/−z), mirroring the render transforms.
export const finTipWorld = (
  v: Variant,
  side: 1 | -1,
  o: { position: [number, number, number]; rotation: [number, number, number]; scale?: number; lean?: number; finOpen: number; time: number; swimSpeed?: number },
) => {
  const prof = bump(v.front, v.back);
  const ry = (t: number) => v.height * prof(t);
  const rz = (t: number) => ry(t) * v.width;
  const px = v.len / 2 - 0.66 * Math.min(v.len, 1.7);
  const pz = rz(0.45) * 0.8;
  const flap = o.finOpen + 0.18 * Math.sin(o.time * 7 * (o.swimSpeed ?? 1));
  const finM = new THREE.Matrix4().compose(
    new THREE.Vector3(px, -0.2, side * pz),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(side * 0.25, side * flap, -0.5)),
    new THREE.Vector3(1, 1, 1),
  );
  const leanM = new THREE.Matrix4().makeRotationX(o.lean ?? 0);
  const s = o.scale ?? 1;
  const rootM = new THREE.Matrix4().compose(
    new THREE.Vector3(...o.position),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(...o.rotation)),
    new THREE.Vector3(s, s, s),
  );
  // pectoral is scaled 1.35×1.5 (shape tip at x≈-0.31)
  return new THREE.Vector3(-0.31 * 1.35, 0.0, 0).applyMatrix4(finM).applyMatrix4(leanM).applyMatrix4(rootM);
};

// Dark-pink inside of the open mouth: a strip between the upper lip curve and the lower lip curve,
// both of which already lie on the skin, so it follows the body surface.
const mouthFill = (loop: THREE.Vector3[]) => {
  const n = loop.length;
  const half = Math.floor(n / 2);
  const pos: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= half; i++) {
    const u = loop[i];
    const l = loop[n - 1 - i];
    pos.push(u.x + 0.003, u.y, u.z, l.x + 0.003, l.y, l.z);
  }
  for (let i = 0; i < half; i++) {
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
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
    const dorsal = fin(dorsalShape(v.len / 1.15), 0.012, 0.018);
    const dT = 0.5;
    dorsal.translate(v.len / 2 - dT * v.len, ry(dT) - 0.07, 0);
    const anal = fin(dorsalShape(v.len / 2.0), 0.012, 0.016);
    anal.rotateX(Math.PI);
    anal.translate(v.len / 2 - 0.72 * v.len, -ry(0.72) + 0.06, 0);
    const pect = fin(pectoralShape(), 0.012, 0.018);
    pect.scale(1.35, 1.5, 1);
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
        tipStart: 0.1,
        tipSoft: 0.2,
        spec: 0.5,
        rim: 0.45,
        pattern: PATTERN.scales,
        patternColor: "#8ea3c4",
        patternScale: 9,
        patternAmt: 0.55,
      },
      wave,
    );
    const rayCol = "#6f9ec9";
    const tailM = makeToon(
      {
        color: "#dcecf8", tip: "#7fd0ff", tipAxis: [-1, 0, 0], tipStart: v.len / 2 + 0.12 * v.tailScale, tipSoft: 0.32 * v.tailScale,
        rim: 0.3, spec: 0.2, pattern: PATTERN.rays, patternColor: rayCol, patternScale: 14, patternAmt: 0.6,
        patternOrigin: [-v.len / 2 + 0.12, 0, 0],
      },
      wave,
    );
    const dorsalM = makeToon(
      {
        color: "#dcecf8", tip: "#7fd0ff", tipAxis: [0, 1, 0], tipStart: v.height * 0.85, tipSoft: 0.16,
        rim: 0.3, spec: 0.2, pattern: PATTERN.rays, patternColor: rayCol, patternScale: 12, patternAmt: 0.6,
        patternOrigin: [0, v.height * 0.35, 0],
      },
      wave,
    );
    const analM = makeToon(
      {
        color: "#dcecf8", tip: "#7fd0ff", tipAxis: [0, -1, 0], tipStart: v.height * 0.9, tipSoft: 0.16,
        rim: 0.3, spec: 0.2, pattern: PATTERN.rays, patternColor: rayCol, patternScale: 12, patternAmt: 0.6,
        patternOrigin: [v.len / 2 - 0.72 * v.len, -v.height * 0.4, 0],
      },
      wave,
    );
    const pect = makeToon({
      color: "#dbe6f2",
      tip: finTip ?? "#dbe6f2",
      tipAxis: [-1, 0, 0],
      tipStart: 0.2,
      tipSoft: 0.015,
      rim: 0.3,
      pattern: PATTERN.rays, patternColor: "#6f9ec9", patternScale: 10, patternAmt: 0.45,
      patternOrigin: [0.02, 0, 0],
    });
    const line = makeOutline(v.outline, wave);
    const lineStatic = makeOutline(v.outline);
    const eyeR = makeEye({ iris: "#2b7fd6", irisDark: "#0d2a63", skin: v.body, side: 1, lash: v.lash });
    const eyeL = makeEye({ iris: "#2b7fd6", irisDark: "#0d2a63", skin: v.body, side: -1, lash: v.lash });
    const eyeLine = makeOutline(0.06);
    const ink = new THREE.MeshBasicMaterial({ color: C.ink });
    const mouthIn = new THREE.MeshBasicMaterial({ color: "#7a2a52", side: THREE.DoubleSide });
    return { wave, body, tailM, dorsalM, analM, pect, line, lineStatic, eyeR, eyeL, eyeLine, ink, mouthIn };
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

  const fillG = useMemo(
    () => (mouth === "open" ? mouthFill((mouthG as THREE.TubeGeometry).parameters.path.getPoints(48)) : null),
    [mouth, mouthG],
  );

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <group rotation={[lean, 0, 0]}>
        <Toon geometry={parts.body} material={mats.body} outline={mats.line} />
        <Toon geometry={parts.tail} material={mats.tailM} outline={mats.line} />
        <Toon geometry={parts.dorsal} material={mats.dorsalM} outline={mats.line} />
        <Toon geometry={parts.anal} material={mats.analM} outline={mats.line} />
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
        {fillG && <mesh geometry={fillG} material={mats.mouthIn} />}
      </group>
      {/* keep ry referenced for future attachments */}
      <group userData={{ h: ry(0.4) }} />
    </group>
  );
};

import React, { useMemo } from "react";
import * as THREE from "three";
import { random } from "remotion";
import { Toon } from "../lib/Toon";
import { ellipsoid, fin, smooth, sweepCurve } from "../lib/geom";
import { applyExpr, EXPR, EyeExpr, makeEye, makeOutline, makeToon, PATTERN } from "../lib/materials";
import { ellipsoidLine } from "../lib/surface";
import { C } from "../lib/palette";

const V = (x: number, y: number, z = 0) => new THREE.Vector3(x, y, z);

const starShape = (r1: number, r2: number) => {
  const sh = new THREE.Shape();
  for (let i = 0; i <= 10; i++) {
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    const r = i % 2 === 0 ? r1 : r2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) sh.moveTo(x, y);
    else sh.lineTo(x, y);
  }
  return sh;
};

// Dona Marisa: old green sea turtle. Faces +x.
export const Marisa: React.FC<{
  time: number;
  expr?: EyeExpr | keyof typeof EXPR;
  paddle?: number; // flipper stroke amplitude 0..1
  headTilt?: number;
  reach?: number; // right front flipper reaching forward (drawing in the sand / touching Ciro)
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}> = ({ time, expr = "calma", paddle = 0.4, headTilt = 0, reach = 0, position, rotation, scale = 1 }) => {
  const g = useMemo(() => {
    const shell = new THREE.SphereGeometry(1, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2);
    shell.scale(1.25, 0.62, 1.0);
    const plastron = ellipsoid(1.22, 0.2, 0.97);
    const head = ellipsoid(0.46, 0.38, 0.38);
    const neck = sweepCurve(
      new THREE.CatmullRomCurve3([new THREE.Vector3(0.75, 0.02, 0), new THREE.Vector3(1.05, 0.08, 0), new THREE.Vector3(1.3, 0.16, 0)]),
      () => 0.22,
      16,
      14,
    );
    const front = sweepCurve(
      new THREE.CatmullRomCurve3([V(0, 0, 0), V(0.35, 0, 0.06), V(0.7, 0, 0.02), V(1.0, 0, -0.1)]),
      (t) => 0.2 * Math.sin(Math.PI * Math.min(1, 0.15 + t * 0.95)) + 0.03,
      32, 14, 0.3,
    );
    const rear = ellipsoid(0.24, 0.06, 0.15);
    rear.translate(0.18, 0, 0);
    const tailG = ellipsoid(0.22, 0.08, 0.08);
    const star = fin(starShape(0.14, 0.06), 0.03, 0.02);
    const eye = ellipsoid(0.92, 1, 0.34, 40, 28);
    const mouth = ellipsoidLine([0.46, 0.38, 0.38], (s) => s * 0.5, (s) => -0.3 + 0.1 * s * s, 0.018);
    return { shell: smooth(shell), plastron, head, neck, front, rear, tailG, star, eye, mouth };
  }, []);

  const m = useMemo(() => {
    const shell = makeToon({
      color: C.marisa,
      pattern: PATTERN.shell,
      patternColor: "#33492a",
      patternScale: 2.1,
      rim: 0.35,
      spec: 0,
      shadowTint: "#5a74b8",
    });
    const belly = makeToon({ color: "#E2D69A", rim: 0.2 });
    const skin = makeToon({
      color: C.marisaSkin,
      pattern: PATTERN.chroma,
      patternColor: "#7f9550",
      patternScale: 7,
      patternAmt: 0.45,
      rim: 0.3,
    });
    const algaeA = makeToon({ color: "#B5D35A", rim: 0.2, side: THREE.DoubleSide });
    const algaeB = makeToon({ color: "#6FA046", rim: 0.2, side: THREE.DoubleSide });
    const star = makeToon({ color: "#F3DFB8", tip: "#E8A97E", tipAxis: [0, 0, 1], tipStart: 0.01, rim: 0.2 });
    const line = makeOutline(0.03);
    const thin = makeOutline(0.018);
    const eyeR = makeEye({ iris: "#9a6a32", irisDark: "#3b2410", skin: C.marisaSkin, side: 1, wrinkle: 1 });
    const eyeL = makeEye({ iris: "#9a6a32", irisDark: "#3b2410", skin: C.marisaSkin, side: -1, wrinkle: 1 });
    const eyeLine = makeOutline(0.06);
    const ink = new THREE.MeshBasicMaterial({ color: C.ink });
    return { shell, belly, skin, algaeA, algaeB, star, line, thin, eyeR, eyeL, eyeLine, ink };
  }, []);

  const e = typeof expr === "string" ? EXPR[expr] : expr;
  applyExpr(m.eyeR, e);
  applyExpr(m.eyeL, e);

  // algae strands hanging from the shell: rebuilt per frame (frame-driven sway)
  const algae = useMemo(() => {
    const out: { geo: THREE.BufferGeometry; a: boolean }[] = [];
    for (let i = 0; i < 9; i++) {
      const az = -2.4 + i * 0.6 + random(`alga-az-${i}`) * 0.25;
      const el = 0.35 + random(`alga-el-${i}`) * 0.5;
      const base = new THREE.Vector3(1.25 * Math.cos(el) * Math.cos(az + Math.PI), 0.62 * Math.sin(el), Math.cos(el) * Math.sin(az + Math.PI));
      const L = 0.6 + random(`alga-l-${i}`) * 0.5;
      const ph = random(`alga-ph-${i}`) * 6.28;
      const pts: THREE.Vector3[] = [base.clone().multiplyScalar(0.97)];
      for (let k = 1; k <= 4; k++) {
        const f = k / 4;
        const sway = Math.sin(time * 1.8 + ph + f * 2.2) * 0.12 * f;
        pts.push(
          base
            .clone()
            .add(new THREE.Vector3(-L * f * 0.9, L * f * 0.1 - L * f * f * 0.35 + sway * 0.5, sway + base.z * 0.15 * f)),
        );
      }
      const geo = sweepCurve(new THREE.CatmullRomCurve3(pts), (t) => 0.065 * (1 - t * 0.7), 20, 6, 0.45);
      out.push({ geo, a: i % 2 === 0 });
    }
    return out;
  }, [time]);

  const stroke = Math.sin(time * 2.2) * paddle;
  const headBob = Math.sin(time * 1.1) * 0.03;

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <Toon geometry={g.shell} material={m.shell} outline={m.line} position={[0, 0.06, 0]} />
      <Toon geometry={g.plastron} material={m.belly} outline={m.line} position={[0, 0.02, 0]} />
      <Toon geometry={g.neck} material={m.skin} outline={m.line} />
      <group position={[1.52, 0.2 + headBob, 0]} rotation={[0, 0, headTilt]}>
        <Toon geometry={g.head} material={m.skin} outline={m.line} />
        <Toon geometry={g.eye} material={m.eyeR} outline={m.eyeLine} position={[0.24, 0.1, 0.24]} rotation={[0, 0.8, 0]} scale={0.17} />
        <Toon geometry={g.eye} material={m.eyeL} outline={m.eyeLine} position={[0.24, 0.1, -0.24]} rotation={[0, Math.PI - 0.8, 0]} scale={0.17} />
        <mesh geometry={g.mouth} material={m.ink} />
      </group>
      {/* front flippers */}
      <group position={[0.75, 0.0, 0.72]} rotation={[0.5 * stroke, -1.75 + 0.45 * stroke + reach * 1.6, -0.15 + 0.35 * stroke]}>
        <Toon geometry={g.front} material={m.skin} outline={m.thin} rotation={[Math.PI / 2, 0, 0]} />
      </group>
      <group position={[0.75, 0.0, -0.72]} rotation={[-0.5 * stroke, 1.75 - 0.45 * stroke, -0.15 + 0.35 * stroke]}>
        <Toon geometry={g.front} material={m.skin} outline={m.thin} rotation={[-Math.PI / 2, 0, 0]} />
      </group>
      {/* rear flippers */}
      <Toon geometry={g.rear} material={m.skin} outline={m.thin} position={[-0.85, -0.02, 0.55]} rotation={[0, -2.4, 0]} />
      <Toon geometry={g.rear} material={m.skin} outline={m.thin} position={[-0.85, -0.02, -0.55]} rotation={[0, 2.4, 0]} />
      <Toon geometry={g.tailG} material={m.skin} outline={m.thin} position={[-1.3, 0.0, 0]} />
      {/* star-shaped barnacle */}
      <Toon geometry={g.star} material={m.star} outline={m.thin} position={[0.35, 0.6, 0.38]} rotation={[-0.95, 0.2, 0.3]} />
      {algae.map((a, i) => (
        <mesh key={i} geometry={a.geo} material={a.a ? m.algaeA : m.algaeB} position={[0, 0.06, 0]} />
      ))}
    </group>
  );
};

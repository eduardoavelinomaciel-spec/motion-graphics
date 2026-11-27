import React, { useMemo } from "react";
import * as THREE from "three";
import { Toon } from "../lib/Toon";
import { ellipsoid, fin, sweepCurve } from "../lib/geom";
import { applyExpr, EXPR, EyeExpr, makeEye, makeOutline, makeToon, PATTERN } from "../lib/materials";

const V = (x: number, y: number, z = 0) => new THREE.Vector3(x, y, z);

const fanShape = () => {
  const sh = new THREE.Shape();
  sh.moveTo(0, 0.09);
  sh.quadraticCurveTo(-0.15, 0.09, -0.17, -0.01);
  sh.quadraticCurveTo(-0.11, -0.1, 0, -0.09);
  sh.closePath();
  return sh;
};

// A pastel seahorse, side profile facing +x.
export const Seahorse: React.FC<{
  time: number;
  color: string;
  expr?: EyeExpr | keyof typeof EXPR;
  phase?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}> = ({ time, color, expr = "neutro", phase = 0, position, rotation, scale = 1 }) => {
  const g = useMemo(() => {
    const body = sweepCurve(
      new THREE.CatmullRomCurve3([
        V(0.05, 1.08), V(-0.06, 0.9), V(-0.02, 0.72), V(0.1, 0.5), V(0.08, 0.25), V(-0.04, 0.05),
        V(-0.08, -0.2), V(0.02, -0.42), V(0.2, -0.48), V(0.26, -0.36), V(0.17, -0.28), V(0.11, -0.34),
      ]),
      (t) => {
        if (t < 0.12) return 0.17 - (0.12 - t) * 0.9;
        if (t < 0.22) return 0.12;
        if (t < 0.48) return 0.12 + Math.sin(((t - 0.22) / 0.26) * Math.PI) * 0.09;
        return Math.max(0.02, 0.12 * (1 - (t - 0.48) / 0.52) + 0.02);
      },
      80,
      12,
      0.85,
    );
    const head = ellipsoid(0.19, 0.17, 0.15);
    const snout = sweepCurve(new THREE.CatmullRomCurve3([V(0.1, 1.02), V(0.3, 0.98), V(0.45, 0.93)]), (t) => 0.055 + (t > 0.85 ? 0.02 : 0), 16, 10);
    const crown = sweepCurve(new THREE.CatmullRomCurve3([V(-0.02, 1.15), V(-0.04, 1.26), V(-0.08, 1.32)]), (t) => 0.05 * (1 - t) + 0.015, 12, 8);
    const dfin = fin(fanShape(), 0.01, 0.012);
    const eye = ellipsoid(0.92, 1, 0.34, 32, 24);
    return { body, head, snout, crown, dfin, eye };
  }, []);
  const m = useMemo(() => {
    const skin = makeToon({ color, pattern: PATTERN.scales, patternColor: "#b98fa0", patternScale: 14, patternAmt: 0.35, rim: 0.4, spec: 0.2 });
    const finM = makeToon({ color, rim: 0.5, rimColor: "#ffffff" });
    const line = makeOutline(0.018);
    const eyeR = makeEye({ iris: "#5a4a7a", irisDark: "#1d1433", skin: color, side: 1 });
    const eyeL = makeEye({ iris: "#5a4a7a", irisDark: "#1d1433", skin: color, side: -1 });
    const eyeLine = makeOutline(0.06);
    return { skin, finM, line, eyeR, eyeL, eyeLine };
  }, [color]);
  const e = typeof expr === "string" ? EXPR[expr] : expr;
  applyExpr(m.eyeR, e);
  applyExpr(m.eyeL, e);
  const flutter = Math.sin(time * 30 + phase) * 0.35;
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <Toon geometry={g.body} material={m.skin} outline={m.line} />
      <Toon geometry={g.head} material={m.skin} outline={m.line} position={[0.03, 1.03, 0]} />
      <Toon geometry={g.snout} material={m.skin} outline={m.line} />
      <Toon geometry={g.crown} material={m.skin} outline={m.line} />
      <Toon geometry={g.dfin} material={m.finM} outline={m.line} position={[-0.12, 0.42, 0]} rotation={[flutter, 0, 0.3]} />
      <Toon geometry={g.eye} material={m.eyeR} outline={m.eyeLine} position={[0.09, 1.06, 0.12]} rotation={[0, 0.35, 0]} scale={0.095} />
      <Toon geometry={g.eye} material={m.eyeL} outline={m.eyeLine} position={[0.09, 1.06, -0.12]} rotation={[0, Math.PI - 0.35, 0]} scale={0.095} />
    </group>
  );
};

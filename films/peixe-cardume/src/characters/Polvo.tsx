import React, { useMemo } from "react";
import * as THREE from "three";
import { Toon } from "../lib/Toon";
import { ellipsoid, sweepCurve } from "../lib/geom";
import { applyExpr, EXPR, EyeExpr, makeEye, makeOutline, makeToon, PATTERN } from "../lib/materials";
import { ellipsoidLine } from "../lib/surface";
import { C } from "../lib/palette";

// The octopus. Faces +z (towards camera by default). Chromatophore skin.
export const Polvo: React.FC<{
  time: number;
  expr?: EyeExpr | keyof typeof EXPR;
  jazz?: number; // 0 rest, 1 jazz hands
  color?: string;
  spotColor?: string;
  spots?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}> = ({ time, expr = "curioso", jazz = 0, color = C.polvo, spotColor = "#7347b8", spots = 0.8, position, rotation, scale = 1 }) => {
  const g = useMemo(() => {
    const mantle = ellipsoid(0.78, 0.9, 0.74, 48, 32);
    const eye = ellipsoid(0.92, 1, 0.34, 40, 28);
    const mouth = ellipsoidLine([0.78, 0.9, 0.74], (s) => Math.PI / 2 + s * 0.28, (s) => -0.5 + 0.06 * s * s, 0.022);
    return { mantle, eye, mouth };
  }, []);
  const m = useMemo(() => {
    const skin = makeToon({ color, pattern: PATTERN.chroma, patternColor: spotColor, patternScale: 3.2, patternAmt: spots, rim: 0.45, rimColor: "#ffd9ff", spec: 0.25 });
    const arm = makeToon({ color, tip: "#f3c6ff", tipAxis: [0, -1, 0], tipStart: 99, pattern: PATTERN.chroma, patternColor: spotColor, patternScale: 4, patternAmt: spots * 0.7, rim: 0.4, rimColor: "#ffd9ff" });
    const line = makeOutline(0.03);
    const thin = makeOutline(0.022);
    const eyeR = makeEye({ iris: "#3a2a5e", irisDark: "#150c2b", skin: color, side: 1 });
    const eyeL = makeEye({ iris: "#3a2a5e", irisDark: "#150c2b", skin: color, side: 1 });
    const eyeLine = makeOutline(0.06);
    const ink = new THREE.MeshBasicMaterial({ color: C.ink });
    return { skin, arm, line, thin, eyeR, eyeL, eyeLine, ink };
  }, [color, spotColor, spots]);

  m.skin.uniforms.uTime.value = time;
  const e = typeof expr === "string" ? EXPR[expr] : expr;
  applyExpr(m.eyeR, e);
  applyExpr(m.eyeL, e);

  const arms = useMemo(() => {
    const out: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 8; i++) {
      const phi = (i / 8) * Math.PI * 2 + Math.PI / 8;
      const dir = new THREE.Vector3(Math.cos(phi), 0, Math.sin(phi));
      const front = Math.max(0, Math.sin(phi)); // arms facing camera rise more in jazz pose
      const w = Math.sin(time * 2.4 + i * 0.9);
      const lift = jazz * (1.2 + 0.4 * front);
      const pts: THREE.Vector3[] = [];
      for (let k = 0; k <= 6; k++) {
        const f = k / 6;
        const out1 = 0.35 + f * (1.35 + 0.35 * jazz);
        const down = -0.15 - f * 0.9 + lift * f * 1.6;
        const curl = f > 0.6 ? (f - 0.6) * 2.5 : 0;
        const p = dir.clone().multiplyScalar(out1 - curl * 0.35 * (1 - jazz));
        p.y = down + curl * 0.45 * (1 - jazz) + w * 0.1 * f;
        const side = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(w * 0.18 * f + jazz * Math.sin(time * 14 + i) * 0.05 * f);
        p.add(side);
        pts.push(p);
      }
      out.push(sweepCurve(new THREE.CatmullRomCurve3(pts), (t) => 0.19 * (1 - t) + 0.025, 48, 10));
    }
    return out;
  }, [time, jazz]);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <group position={[0, 0.75, 0]} rotation={[-0.15, 0, 0]}>
        <Toon geometry={g.mantle} material={m.skin} outline={m.line} />
        <Toon geometry={g.eye} material={m.eyeR} outline={m.eyeLine} position={[0.27, -0.1, 0.64]} rotation={[0, 0.42, -0.12]} scale={[0.17, 0.25, 0.25]} />
        <Toon geometry={g.eye} material={m.eyeL} outline={m.eyeLine} position={[-0.27, -0.1, 0.64]} rotation={[0, -0.42, 0.12]} scale={[0.17, 0.25, 0.25]} />
        <mesh geometry={g.mouth} material={m.ink} />
      </group>
      <group position={[0, 0.3, 0]}>
        {arms.map((a, i) => (
          <Toon key={i} geometry={a} material={m.arm} outline={m.thin} />
        ))}
      </group>
    </group>
  );
};

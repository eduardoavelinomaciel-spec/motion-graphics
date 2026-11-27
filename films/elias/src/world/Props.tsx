import React, { useMemo } from "react";
import * as THREE from "three";
import { Toon } from "../lib/Toon";
import { ellipsoid } from "../lib/geom";
import { roundBox } from "../lib/body";
import { makeOutline, makeToon } from "../lib/materials";

const T = (c: string, o: { rim?: number; spec?: number } = {}) => makeToon({ color: c, shadowK: 1, shadowTint: "#b3a4dc", rim: o.rim ?? 0.25, rimColor: "#f3f7ff", spec: o.spec ?? 0.2 });

// banco de praça de frente para a câmera; assento a y=1.15
export const Bench: React.FC<{ position: [number, number, number]; w?: number }> = ({ position, w = 5 }) => {
  const g = useMemo(() => ({ seat: roundBox(w, 0.16, 1.5, 0.05, 0.03), back: roundBox(w, 1.1, 0.14, 0.05, 0.03), leg: roundBox(0.18, 1.1, 1.3, 0.04, 0.02), arm: roundBox(0.18, 0.4, 1.3, 0.04, 0.02) }), [w]);
  const m = useMemo(() => ({ wood: T("#9A6B47"), iron: T("#2F6B4F", { spec: 0.3 }), ol: makeOutline(0.03) }), []);
  return (
    <group position={position}>
      <Toon geometry={g.seat} material={m.wood} outline={m.ol} position={[0, 1.15, 0]} />
      <Toon geometry={g.back} material={m.wood} outline={m.ol} position={[0, 2.0, -0.65]} rotation={[-0.12, 0, 0]} />
      {[-w / 2 + 0.2, w / 2 - 0.2].map((x, i) => (
        <React.Fragment key={i}>
          <Toon geometry={g.leg} material={m.iron} outline={m.ol} position={[x, 0.55, 0]} />
          <Toon geometry={g.arm} material={m.iron} outline={m.ol} position={[x, 1.5, 0]} />
        </React.Fragment>
      ))}
    </group>
  );
};

// balão com fio (fio vai de `hand` ao nó do balão)
export const Balloon3D: React.FC<{ position: THREE.Vector3; color: string; hand: THREE.Vector3; r?: number }> = ({ position, color, hand, r = 0.8 }) => {
  const g = useMemo(() => ({ b: ellipsoid(1, 1.2, 1, 24, 18), knot: ellipsoid(0.1, 0.12, 0.1, 10, 8) }), []);
  const m = useMemo(() => ({ b: makeToon({ color, shadowK: 0.7, shadowTint: "#b3a4dc", rim: 0.6, rimColor: "#ffffff", spec: 0.9 }), ol: makeOutline(0.03 / r) , line: new THREE.LineBasicMaterial({ color: "#10141f" }) }), [color, r]);
  const line = useMemo(() => {
    const knot = position.clone().add(new THREE.Vector3(0, -1.2 * r, 0));
    const mid = knot.clone().lerp(hand, 0.5).add(new THREE.Vector3(0.15, -0.2, 0));
    const pts = new THREE.QuadraticBezierCurve3(hand.clone(), mid, knot).getPoints(20);
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [position.x, position.y, position.z, hand.x, hand.y, hand.z, r]);
  const lineObj = useMemo(() => new THREE.Line(line, m.line), [line, m]);
  return (
    <group>
      <Toon geometry={g.b} material={m.b} outline={m.ol} position={[position.x, position.y, position.z]} scale={r} />
      <Toon geometry={g.knot} material={m.b} position={[position.x, position.y - 1.2 * r, position.z]} />
      <primitive object={lineObj} />
    </group>
  );
};

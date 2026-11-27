import React, { useMemo } from "react";
import * as THREE from "three";
import { Toon } from "../lib/Toon";
import { ellipsoid } from "../lib/geom";
import { roundBox, capsule } from "../lib/body";
import { makeOutline, makeToon } from "../lib/materials";

const T = (c: string, o: { rim?: number; spec?: number } = {}) => makeToon({ color: c, shadowK: 1, shadowTint: "#b3a4dc", rim: o.rim ?? 0.2, rimColor: "#fff1dd", spec: o.spec ?? 0 });

export const COUNTER_Y = 1.9;

export const Loaf: React.FC<{ position: [number, number, number]; rotation?: [number, number, number]; s?: number; hot?: number }> = ({ position, rotation, s = 1, hot = 0 }) => {
  const g = useMemo(() => ({ b: ellipsoid(0.42, 0.22, 0.2, 18, 12), cut: roundBox(0.3, 0.02, 0.05, 0.01, 0.005) }), []);
  const m = useMemo(() => ({ crust: T("#B9773D", { spec: 0.2 }), hot: T("#D9843A", { spec: 0.3 }), cut: T("#F1D9A6"), ol: makeOutline(0.014) }), []);
  return (
    <group position={position} rotation={rotation} scale={s}>
      <Toon geometry={g.b} material={hot > 0.5 ? m.hot : m.crust} outline={m.ol} />
      {[-0.18, 0, 0.18].map((x, i) => (
        <mesh key={i} geometry={g.cut} material={m.cut} position={[x, 0.2, 0.0]} rotation={[0, 0, 0.5]} />
      ))}
    </group>
  );
};

export const Bakery: React.FC<{ glow: number; light: number }> = ({ glow, light }) => {
  const g = useMemo(
    () => ({
      wall: roundBox(26, 12, 0.6, 0.1, 0.05), floor: roundBox(26, 0.3, 14, 0.05, 0.02),
      counter: roundBox(1.6, COUNTER_Y, 3.2, 0.12, 0.05), top: roundBox(2.0, 0.16, 3.6, 0.06, 0.03),
      shelf: roundBox(7, 0.18, 1.0, 0.04, 0.02), post: capsule(5, 0.1, 0.1), seat: new THREE.CylinderGeometry(0.55, 0.5, 0.18, 22), leg: capsule(1.1, 0.07, 0.06),
      oven: roundBox(4.2, 4.4, 2.6, 0.2, 0.08), mouth: roundBox(2.2, 1.3, 0.1, 0.1, 0.03), chim: roundBox(1.2, 3, 1.2, 0.1, 0.04),
      win: roundBox(5, 3.6, 0.15, 0.1, 0.03), crate: roundBox(1.5, 0.9, 1.1, 0.08, 0.04), sack: ellipsoid(0.8, 0.9, 0.55, 18, 12), puddle: ellipsoid(1.4, 0.05, 0.9, 20, 8),
      lamp: ellipsoid(0.4, 0.3, 0.4), cord: capsule(2, 0.02, 0.02), sign: roundBox(3.2, 0.9, 0.12, 0.1, 0.03), clock: new THREE.CylinderGeometry(0.5, 0.5, 0.1, 24),
      note: roundBox(0.5, 0.01, 0.4, 0.01, 0.005),
    }),
    [],
  );
  const m = useMemo(
    () => ({
      wall: T("#E3C9A4"), floor: T("#A57B5A"), counter: T("#7B5A44"), top: T("#E9DCC6"), wood: T("#8A6347"), oven: T("#8E5F4E"), chim: T("#6B4A3C"),
      frame: T("#F3F0E8"), crate: T("#B28B58"), sack: T("#D9CDB1"), flour: new THREE.MeshBasicMaterial({ color: "#F4F1EA" }), lamp: new THREE.MeshBasicMaterial({ color: "#FFE9B0" }),
      cord: new THREE.MeshBasicMaterial({ color: "#10141f" }), sign: T("#3E5F7A"), clock: T("#F4F1EA"), ol: makeOutline(0.04), olS: makeOutline(0.025),
    }),
    [],
  );
  const winC = new THREE.Color("#BFD7EA").lerp(new THREE.Color("#FFE6A8"), light);
  const mouthC = new THREE.Color("#FF7F11").lerp(new THREE.Color("#FFD27A"), 0.3).multiplyScalar(0.5 + 0.7 * glow);
  const loaves = [0, 1, 2, 3, 4, 5, 6];
  return (
    <group>
      <Toon geometry={g.floor} material={m.floor} outline={m.ol} position={[0, -0.15, 0]} />
      <Toon geometry={g.wall} material={m.wall} outline={m.ol} position={[0, 6, -4]} />
      {/* janela com a rua fria / dourada */}
      <Toon geometry={g.win} material={m.frame} outline={m.olS} position={[-7.5, 4.4, -3.6]} />
      <mesh position={[-7.5, 4.4, -3.5]}><planeGeometry args={[4.5, 3.1]} /><meshBasicMaterial color={winC} /></mesh>
      <mesh position={[-7.5, 4.4, -3.45]}><planeGeometry args={[0.1, 3.1]} /><meshBasicMaterial color="#F3F0E8" /></mesh>
      {/* prateleiras com pães */}
      {[2.6, 4.2].map((y, j) => (
        <group key={j}>
          <Toon geometry={g.shelf} material={m.wood} outline={m.olS} position={[-1.5, y, -3.3]} />
          {loaves.map((i) => (
            <Loaf key={i} position={[-4.4 + i * 0.95, y + 0.28, -3.3]} rotation={[0, 0.1 * i, 0]} s={0.8} />
          ))}
        </group>
      ))}
      {/* forno com boca de brasa */}
      <group position={[7.2, 0, -2.3]}>
        <Toon geometry={g.oven} material={m.oven} outline={m.ol} position={[0, 2.2, 0]} />
        <Toon geometry={g.chim} material={m.chim} outline={m.olS} position={[0.4, 6, -0.3]} />
        <mesh geometry={g.mouth} position={[0, 1.7, 1.33]}><meshBasicMaterial color={mouthC} /></mesh>
      </group>
      <Toon geometry={g.sign} material={m.sign} outline={m.olS} position={[1.6, 7.2, -3.6]} />
      <Toon geometry={g.clock} material={m.clock} outline={m.olS} position={[4.6, 5.6, -3.55]} rotation={[Math.PI / 2, 0, 0]} />
      {/* balcão e banquinho */}
      <Toon geometry={g.counter} material={m.counter} outline={m.ol} position={[0.4, COUNTER_Y / 2, -0.4]} />
      <Toon geometry={g.top} material={m.top} outline={m.olS} position={[0.4, COUNTER_Y + 0.08, -0.4]} />
      <group position={[-1.55, 0, 0.4]}>
        <Toon geometry={g.seat} material={m.wood} outline={m.olS} position={[0, 1.15, 0]} />
        {[[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]].map((p, i) => (
          <Toon key={i} geometry={g.leg} material={m.wood} outline={m.olS} position={[p[0], 0.55, p[1]]} />
        ))}
      </group>
      {/* a encomenda perdida: caixotes vazios, saco tombado, farinha no chão */}
      <Toon geometry={g.crate} material={m.crate} outline={m.olS} position={[-5.2, 0.45, 2.0]} rotation={[0, 0.3, 0]} />
      <Toon geometry={g.crate} material={m.crate} outline={m.olS} position={[-4.9, 1.35, 2.1]} rotation={[0, -0.2, 0]} />
      <Toon geometry={g.sack} material={m.sack} outline={m.olS} position={[-3.6, 0.45, 2.6]} rotation={[0, 0, 1.2]} />
      <mesh geometry={g.puddle} material={m.flour} position={[-2.7, 0.03, 2.7]} />
      <Toon geometry={g.lamp} material={m.lamp} outline={m.olS} position={[0.4, 5.5, 0.3]} />
      <Toon geometry={g.cord} material={m.cord} position={[0.4, 6.6, 0.3]} />
    </group>
  );
};

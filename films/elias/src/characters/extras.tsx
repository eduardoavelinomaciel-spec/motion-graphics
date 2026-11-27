import React, { useMemo } from "react";
import * as THREE from "three";
import { Toon } from "../lib/Toon";
import { ellipsoid } from "../lib/geom";
import { capsule, roundBox, tube } from "../lib/body";
import { makeOutline, makeToon } from "../lib/materials";
import { Human, HumanSpec, Pose } from "./Human";

const T = (color: string, o: { spec?: number; rim?: number } = {}) =>
  makeToon({ color, shadowK: 1, shadowTint: "#b3a4dc", rim: o.rim ?? 0.25, rimColor: "#f3f7ff", spec: o.spec ?? 0 });

type P = { pose?: Pose; position?: [number, number, number]; rotation?: [number, number, number]; scale?: number };

/* -------------------------------------------------------- pedestres */
const SK = ["#EBC09A", "#D9A07A", "#A06A4A", "#F1CDAA", "#8A5A3E", "#E2A57A"];
const HAIR = ["#2b1d1a", "#5a3a28", "#1e1512", "#8a6a48", "#c8b89a", "#3a2c24"];
const TOPS = ["#6E8FB8", "#C8604E", "#8AA67A", "#D9B25E", "#7A6AA8", "#B8788C", "#4E7A86", "#D0C2A4"];
const PANTS = ["#3C4252", "#5A5248", "#34425A", "#4A3E3A"];
export const PED_SPECS: HumanSpec[] = Array.from({ length: 12 }).map((_, i) => ({
  skin: SK[i % SK.length],
  brow: HAIR[(i * 5) % HAIR.length],
  iris: "#5a4028",
  irisDark: "#241408",
  lash: i % 3 === 0 ? 1 : 0,
  shoulder: i % 3 === 0 ? 0.34 : 0.4,
  chest: i % 3 === 0 ? 0.27 : 0.31,
  waist: 0.26,
  hip: i % 3 === 0 ? 0.31 : 0.29,
  depth: 0.19,
  limb: 0.9,
  top: TOPS[i % TOPS.length],
  sleeve: i % 2 ? 1 : 0.5,
  sleeveColor: TOPS[i % TOPS.length],
  pants: PANTS[i % PANTS.length],
  shoe: "#2a2420",
}));

export const walkPose = (ph: number, amp: number): Pose => ({
  y: -0.04 * amp * Math.abs(Math.sin(ph)),
  lean: 0.05 * amp,
  lLeg: { h: 0.42 * amp * Math.sin(ph), k: 0.08 + 0.6 * amp * Math.max(0, Math.cos(ph)) },
  rLeg: { h: -0.42 * amp * Math.sin(ph), k: 0.08 + 0.6 * amp * Math.max(0, -Math.cos(ph)) },
  lArm: { f: -0.38 * amp * Math.sin(ph), o: 0.07, e: 0.2 + 0.2 * amp },
  rArm: { f: 0.38 * amp * Math.sin(ph), o: 0.07, e: 0.2 + 0.2 * amp },
});

export const Extra: React.FC<P & { idx: number }> = ({ idx, scale = 1, ...rest }) => {
  const spec = PED_SPECS[idx % PED_SPECS.length];
  const m = useMemo(() => {
    const ol = makeOutline(0.012 / scale);
    return { hair: T(HAIR[(idx * 3 + 1) % HAIR.length], { rim: 0.08 }), ol, back: ellipsoid(0.295, 0.31, 0.3), long: ellipsoid(0.27, 0.42, 0.2) };
  }, [idx, scale]);
  const longHair = idx % 3 === 0;
  return (
    <Human
      spec={spec}
      scale={scale}
      {...rest}
      head={
        <group>
          <Toon geometry={m.back} material={m.hair} outline={m.ol} position={[0, 0.07, -0.07]} />
          {longHair ? <Toon geometry={m.long} material={m.hair} outline={m.ol} position={[0, -0.1, -0.15]} /> : null}
        </group>
      }
    />
  );
};

/* ------------------------------------------------------------- moto */
export const Moto: React.FC<{ roll: number; position: [number, number, number] }> = ({ roll, position }) => {
  const g = useMemo(
    () => ({
      tire: new THREE.TorusGeometry(0.78, 0.2, 14, 36),
      rim: new THREE.TorusGeometry(0.6, 0.06, 8, 28),
      hub: new THREE.CylinderGeometry(0.12, 0.12, 0.3, 12),
      body: capsule(2.2, 0.38, 0.3),
      tank: ellipsoid(0.55, 0.4, 0.4),
      fork: capsule(1.4, 0.07, 0.07),
      bar: capsule(0.9, 0.05, 0.05),
      seat: roundBox(1.1, 0.3, 0.55, 0.1, 0.05),
      box: roundBox(1.15, 1.05, 1.0, 0.12, 0.06),
      lamp: ellipsoid(0.17, 0.17, 0.17),
    }),
    [],
  );
  const m = useMemo(
    () => ({ tire: T("#23262e"), rim: T("#B9C2CF", { spec: 0.4 }), body: T("#D6402F", { spec: 0.3 }), seat: T("#2c2a30"), box: T("#F0602A"), lamp: T("#FFF3C0", { rim: 0 }), ol: makeOutline(0.03), olS: makeOutline(0.02) }),
    [],
  );
  return (
    <group position={position}>
      {[-1.35, 1.35].map((x, i) => (
        <group key={i} position={[x, 0.98, 0]} rotation={[0, 0, -roll]}>
          <Toon geometry={g.tire} material={m.tire} outline={m.ol} />
          <Toon geometry={g.rim} material={m.rim} outline={m.olS} />
        </group>
      ))}
      <Toon geometry={g.body} material={m.body} outline={m.ol} position={[-0.1, 1.55, 0]} rotation={[0, 0, Math.PI / 2 - 0.08]} />
      <Toon geometry={g.tank} material={m.body} outline={m.ol} position={[0.6, 2.0, 0]} />
      <Toon geometry={g.fork} material={m.rim} outline={m.olS} position={[1.2, 2.1, 0]} rotation={[0, 0, 0.35]} />
      <Toon geometry={g.bar} material={m.seat} outline={m.olS} position={[1.0, 2.55, 0.45]} rotation={[Math.PI / 2, 0, 0]} />
      <Toon geometry={g.lamp} material={m.lamp} outline={m.olS} position={[1.62, 2.1, 0]} />
      <Toon geometry={g.seat} material={m.seat} outline={m.olS} position={[-0.55, 2.15, 0]} />
      <Toon geometry={g.box} material={m.box} outline={m.ol} position={[-1.35, 3.0, 0]} />
    </group>
  );
};

export const ENTREGADOR: HumanSpec = {
  skin: "#D9A07A", brow: "#2b1d1a", iris: "#5a4028", irisDark: "#241408",
  shoulder: 0.4, chest: 0.31, waist: 0.27, hip: 0.3, depth: 0.2, limb: 0.9,
  top: "#2F3E5C", sleeve: 1, sleeveFat: 1.12, pants: "#33384A", shoe: "#222",
};
export const Entregador: React.FC<{ roll: number; position: [number, number, number]; look?: number }> = ({ roll, position, look = 0 }) => {
  const m = useMemo(() => ({ helmet: T("#E5483B", { spec: 0.4 }), visor: T("#1c2230", { spec: 0.6 }), ol: makeOutline(0.014), hs: ellipsoid(0.34, 0.33, 0.34), vs: ellipsoid(0.27, 0.15, 0.2) }), []);
  return (
    <group position={position}>
      <Moto roll={roll} position={[0, 0, 0]} />
      <Human
        spec={ENTREGADOR}
        position={[-0.45, 0.28, 0]}
        rotation={[0, Math.PI / 2 - 0.15, 0]}
        pose={{
          lean: 0.28, head: [-0.2, look, 0], expr: "calma", mouth: "closed",
          lLeg: { h: 1.15, k: 1.45, o: 0.12 }, rLeg: { h: 1.15, k: 1.45, o: 0.12 },
          lArm: { f: 1.15, o: 0.15, e: 0.55 }, rArm: { f: 1.15, o: 0.15, e: 0.55 },
        }}
        head={
          <group>
            <Toon geometry={m.hs} material={m.helmet} outline={m.ol} position={[0, 0.1, -0.02]} scale={[1, 1.05, 1.02]} />
            <Toon geometry={m.vs} material={m.visor} outline={m.ol} position={[0, 0.1, 0.22]} />
          </group>
        }
      />
    </group>
  );
};

/* ------------------------------------------------------------- bicicleta */
export const Bike: React.FC<{ position: [number, number, number]; rotation?: [number, number, number]; roll?: number }> = ({ position, rotation, roll = 0 }) => {
  const g = useMemo(
    () => ({
      tire: new THREE.TorusGeometry(0.85, 0.07, 10, 32),
      spoke: new THREE.TorusGeometry(0.5, 0.025, 6, 24),
      f1: tube([[-1.0, 0.95, 0], [0.0, 0.95, 0], [0.55, 1.7, 0]], 0.06, 14),
      f2: tube([[-1.0, 0.95, 0], [-0.1, 1.75, 0], [0.55, 1.7, 0]], 0.06, 14),
      f3: tube([[-0.1, 1.75, 0], [0.0, 0.95, 0]], 0.06, 10),
      fork: tube([[0.55, 1.7, 0], [1.0, 0.95, 0]], 0.055, 10),
      bar: tube([[0.55, 1.7, -0.45], [0.58, 1.95, 0], [0.55, 1.7, 0.45]], 0.045, 14),
      seat: roundBox(0.55, 0.15, 0.3, 0.05, 0.03),
    }),
    [],
  );
  const m = useMemo(() => ({ tire: T("#23262e"), rim: T("#E8EEF5", { spec: 0.4 }), frame: T("#2E7DD1", { spec: 0.4 }), seat: T("#2c2a30"), ol: makeOutline(0.025), olS: makeOutline(0.018) }), []);
  return (
    <group position={position} rotation={rotation}>
      {[-1.0, 1.0].map((x, i) => (
        <group key={i} position={[x, 0.95, 0]} rotation={[0, 0, -roll]}>
          <Toon geometry={g.tire} material={m.tire} outline={m.olS} />
          <Toon geometry={g.spoke} material={m.rim} outline={m.olS} />
        </group>
      ))}
      {[g.f1, g.f2, g.f3, g.fork, g.bar].map((geo, i) => (
        <Toon key={i} geometry={geo} material={m.frame} outline={m.olS} />
      ))}
      <Toon geometry={g.seat} material={m.seat} outline={m.olS} position={[-0.15, 1.85, 0]} />
    </group>
  );
};

/* ------------------------------------------------- menino e pai */
export const MENINO: HumanSpec = {
  skin: "#C58A62", brow: "#2b1d1a", iris: "#5a3a22", irisDark: "#241208",
  headScale: 1.3, shoulder: 0.28, chest: 0.22, waist: 0.2, hip: 0.22, depth: 0.15, limb: 0.78, legLen: 0.62,
  top: "#E8A33D", sleeve: 0.5, sleeveColor: "#E8A33D", sleeveFat: 1.2, pants: "#4A6FA5", shoe: "#F4F1EA",
};
export const MENINO_SCALE = 0.8;
export const Menino: React.FC<P> = ({ scale = MENINO_SCALE, ...rest }) => {
  const m = useMemo(() => ({ hair: T("#1e1512", { rim: 0.08 }), ol: makeOutline(0.012 / scale), back: ellipsoid(0.3, 0.3, 0.3) }), [scale]);
  return <Human spec={MENINO} scale={scale} {...rest} head={<Toon geometry={m.back} material={m.hair} outline={m.ol} position={[0, 0.08, -0.07]} />} />;
};

export const PAI: HumanSpec = {
  skin: "#B5764F", brow: "#2e231e", iris: "#4a3322", irisDark: "#241208",
  shoulder: 0.44, chest: 0.34, waist: 0.3, hip: 0.32, depth: 0.22, limb: 1.0,
  top: "#6B8F6A", sleeve: 1, sleeveFat: 1.12, pants: "#4A4F5C", shoe: "#3A2A22",
};
export const Pai: React.FC<P> = ({ scale = 1, ...rest }) => {
  const m = useMemo(() => ({ hair: T("#2b211d", { rim: 0.08 }), ol: makeOutline(0.012 / scale), back: ellipsoid(0.295, 0.3, 0.3), st: ellipsoid(0.07, 0.03, 0.035, 14, 8) }), [scale]);
  return <Human spec={PAI} scale={scale} {...rest} head={<group><Toon geometry={m.back} material={m.hair} outline={m.ol} position={[0, 0.07, -0.07]} /></group>} />;
};

/* ------------------------------------------------------------- lenço */
export const Lenco: React.FC<{ position?: [number, number, number]; rotation?: [number, number, number]; scale?: number }> = ({ position, rotation, scale = 1 }) => {
  const g = useMemo(() => ({ cloth: roundBox(0.34, 0.06, 0.26, 0.03, 0.02), stripe: roundBox(0.34, 0.02, 0.05, 0.01, 0.01) }), []);
  const m = useMemo(() => ({ cloth: T("#EEF2F8", { rim: 0.2 }), stripe: T("#7BA3D6"), ol: makeOutline(0.012) }), []);
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <Toon geometry={g.cloth} material={m.cloth} outline={m.ol} />
      <Toon geometry={g.stripe} material={m.stripe} position={[0, 0.032, 0.06]} />
    </group>
  );
};

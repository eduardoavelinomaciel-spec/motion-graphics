import React, { useMemo } from "react";
import * as THREE from "three";
import { Toon } from "../lib/Toon";
import { ellipsoid, smooth } from "../lib/geom";
import { capsule, flare, prof } from "../lib/body";
import { applyExpr, EXPR, EyeExpr, makeEye, makeOutline, makeToon, sceneUniforms } from "../lib/materials";
import { ellipsoidLine } from "../lib/surface";
import { C } from "../lib/palette";

export type Arm = { f?: number; o?: number; t?: number; e?: number }; // frente, abre, giro, cotovelo (rad)
export type Leg = { h?: number; o?: number; k?: number }; // quadril, abre, joelho
export type Mouth = "closed" | "smile" | "open" | "sad" | "o" | "grin";

export type Pose = {
  y?: number;
  lean?: number; // tronco para a frente
  twist?: number;
  sway?: number;
  head?: [number, number, number]; // pitch (+ olha p/ baixo), yaw, roll
  lArm?: Arm; // lado +x do personagem (esquerda dele)
  rArm?: Arm;
  lLeg?: Leg;
  rLeg?: Leg;
  expr?: EyeExpr | keyof typeof EXPR;
  mouth?: Mouth;
};

export type HumanSpec = {
  skin: string;
  skinShadow?: string;
  brow: string;
  iris: string;
  irisDark: string;
  lash?: number;
  // proporções
  headScale?: number; // cabeça (criança maior)
  shoulder?: number; // meia-largura dos ombros
  chest?: number; // meia-largura do peito
  waist?: number;
  hip?: number;
  depth?: number; // espessura do tronco
  limb?: number; // espessura dos membros
  legLen?: number; // 1 = adulto
  // roupa
  top: string; // cor do tronco (camisa/blazer/casaco)
  topShadow?: string;
  sleeve?: number; // 0 sem, 0.5 só braço, 1 manga longa
  sleeveColor?: string;
  sleeveFat?: number; // espessura da manga (casaco)
  pants: string;
  shoe: string;
  boot?: { color: string; h: number }; // galocha (altura na canela, 0..0.78)
  tint?: string;
};

export const useKit = (s: HumanSpec, scale = 1) =>
  useMemo(() => {
    const ol = (k: number) => makeOutline((k * 1) / scale);
    const SK = { shadowK: 1, shadowTint: "#b3a4dc" };
    const skin = makeToon({ color: s.skin, ...SK, shadowTint: s.skinShadow ?? "#c9a0c4", rim: 0.3, rimColor: "#fff1e0" });
    const top = makeToon({ color: s.top, ...SK, rim: 0.3, rimColor: "#f3f7ff" });
    const sleeve = makeToon({ color: s.sleeveColor ?? s.top, ...SK, rim: 0.3, rimColor: "#f3f7ff" });
    const pants = makeToon({ color: s.pants, ...SK, rim: 0.25, rimColor: "#dfe8ff" });
    const shoe = makeToon({ color: s.shoe, ...SK, rim: 0.25, spec: 0.35 });
    const boot = s.boot ? makeToon({ color: s.boot.color, ...SK, rim: 0.3, spec: 0.5 }) : null;
    const ink = new THREE.MeshBasicMaterial({ color: C.ink });
    const brow = new THREE.MeshBasicMaterial({ color: s.brow });
    const mouthIn = new THREE.MeshBasicMaterial({ color: "#7a2530" });
    const tongue = new THREE.MeshBasicMaterial({ color: "#e8707c" });
    const lid = "#" + new THREE.Color(s.skin).multiplyScalar(0.87).getHexString();
    const eyeR = makeEye({ iris: s.iris, irisDark: s.irisDark, skin: lid, side: 1, lash: s.lash ?? 0 });
    const eyeL = makeEye({ iris: s.iris, irisDark: s.irisDark, skin: lid, side: -1, lash: s.lash ?? 0 });
    return { skin, top, sleeve, pants, shoe, boot, ink, brow, mouthIn, tongue, eyeR, eyeL, ol: { l: ol(0.024), m: ol(0.016), s: ol(0.01), eye: ol(0.012) } };
  }, [s, scale]);

const HEAD_R: [number, number, number] = [0.27, 0.31, 0.28];

const buildHead = () => {
  const g = new THREE.SphereGeometry(1, 48, 36);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i) * HEAD_R[0];
    const y = p.getY(i) * HEAD_R[1];
    const z = p.getZ(i) * HEAD_R[2];
    if (y < 0) {
      const u = -y / HEAD_R[1];
      x *= 1 - 0.24 * Math.pow(u, 1.5);
    }
    p.setXYZ(i, x, y, z);
  }
  return smooth(g);
};

export const useGeo = (s: HumanSpec) =>
  useMemo(() => {
    const L = s.limb ?? 1;
    const sh = s.shoulder ?? 0.4;
    const torso = flare(
      1.2,
      prof([[0, 0.1], [0.06, sh * 0.82], [0.15, s.chest ?? 0.31], [0.5, s.waist ?? 0.27], [0.82, s.hip ?? 0.3], [1, (s.hip ?? 0.3) * 0.8]]),
      prof([[0, 0.1], [0.08, (s.depth ?? 0.2) * 0.9], [0.2, s.depth ?? 0.2], [0.55, (s.depth ?? 0.2) * 0.92], [0.85, (s.depth ?? 0.2) * 1.02], [1, (s.depth ?? 0.2) * 0.85]]),
      0.1,
    );
    const neck = capsule(0.3, 0.075 * L, 0.085 * L);
    const head = buildHead();
    const upArm = capsule(0.72, 0.085 * L, 0.068 * L);
    const sleeveUp = capsule(0.72, 0.085 * L * (s.sleeveFat ?? 1.12), 0.068 * L * (s.sleeveFat ?? 1.12));
    const foreArm = capsule(0.66, 0.068 * L, 0.052 * L);
    const sleeveFore = capsule(0.66, 0.068 * L * (s.sleeveFat ?? 1.12), 0.056 * L * (s.sleeveFat ?? 1.12));
    const joint = ellipsoid(1, 1, 1, 20, 14);
    const palm = ellipsoid(0.062 * L, 0.095, 0.045 * L);
    const thumb = ellipsoid(0.022 * L, 0.05, 0.022 * L);
    const thigh = capsule(0.82, 0.15 * L, 0.11 * L);
    const shin = capsule(0.78, 0.11 * L, 0.07 * L);
    const boot = s.boot ? capsule(s.boot.h, 0.082 * L, 0.082 * L) : null;
    const foot = ellipsoid(0.1 * L + 0.015, 0.09, 0.22);
    const eye = ellipsoid(0.92, 1, 0.34, 40, 28);
    const ear = ellipsoid(0.035, 0.065, 0.03);
    const nose = ellipsoid(0.028, 0.032, 0.03);
    const browG = ellipsoid(0.075, 0.016, 0.02, 16, 8);
    const mouth = {
      closed: ellipsoidLine(HEAD_R, (st) => Math.PI / 2 + st * 0.26, (st) => -0.54 + 0.03 * st * st, 0.012),
      smile: ellipsoidLine(HEAD_R, (st) => Math.PI / 2 + st * 0.34, (st) => -0.52 - 0.12 * (1 - st * st) + 0.1 * st * st * 0.0, 0.013),
      sad: ellipsoidLine(HEAD_R, (st) => Math.PI / 2 + st * 0.24, (st) => -0.6 + 0.09 * (1 - st * st), 0.013),
      open: ellipsoid(0.055, 0.045, 0.02, 24, 16),
      o: ellipsoid(0.03, 0.04, 0.02, 24, 16),
      grin: ellipsoid(0.085, 0.05, 0.02, 24, 16),
    };
    return { joint, torso, neck, head, upArm, sleeveUp, foreArm, sleeveFore, palm, thumb, thigh, shin, boot, foot, eye, ear, nose, browG, mouth };
  }, [s]);

// Humano estilizado: ~3,5 unidades de altura, olha para +z, pés em y = 0.
export const Human: React.FC<{
  spec: HumanSpec;
  pose?: Pose;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  head?: React.ReactNode; // cabelo, chapéu... (origem no centro da cabeça)
  torso?: React.ReactNode; // casaco, avental, cachecol... (origem na bacia)
  lHand?: React.ReactNode;
  rHand?: React.ReactNode;
  headOnly?: boolean;
}> = ({ spec, pose = {}, position, rotation, scale = 1, head, torso, lHand, rHand, headOnly = false }) => {
  const k = useKit(spec, scale);
  const g = useGeo(spec);
  const e = typeof pose.expr === "string" ? EXPR[pose.expr] : pose.expr ?? EXPR.neutro;
  applyExpr(k.eyeR, e);
  applyExpr(k.eyeL, e);
  const sil = sceneUniforms.uSilhouette.value > 0;
  k.brow.color.set(sil ? "#000000" : spec.brow);
  k.mouthIn.color.set(sil ? "#000000" : "#7a2530");
  k.tongue.color.set(sil ? "#000000" : "#e8707c");
  const hs = spec.headScale ?? 1.15;
  const sh = spec.shoulder ?? 0.4;
  const legLen = spec.legLen ?? 1;
  const hipY = 1.75 * legLen;
  const sleeveLen = spec.sleeve ?? 0;
  const mouth = pose.mouth ?? "closed";

  const arm = (side: 1 | -1, a: Arm = {}, hand: React.ReactNode) => (
    <group position={[side * sh * 0.98, 0.93, 0]} rotation={[-(a.f ?? 0), side * (a.t ?? 0), side * (a.o ?? 0.06)]}>
      <Toon geometry={g.joint} material={sleeveLen > 0 ? k.sleeve : k.skin} outline={k.ol.m} scale={0.1 * (spec.limb ?? 1) * (sleeveLen > 0 ? (spec.sleeveFat ?? 1.12) : 1) * 1.02} />
      <Toon geometry={sleeveLen > 0 ? g.sleeveUp : g.upArm} material={sleeveLen > 0 ? k.sleeve : k.skin} outline={k.ol.m} />
      <group position={[0, -0.72, 0]} rotation={[-(a.e ?? 0.12), 0, 0]}>
        <Toon geometry={g.joint} material={sleeveLen >= 1 ? k.sleeve : k.skin} outline={k.ol.s} scale={0.07 * (spec.limb ?? 1) * (sleeveLen >= 1 ? (spec.sleeveFat ?? 1.12) : 1) * 1.02} />
        <Toon geometry={sleeveLen >= 1 ? g.sleeveFore : g.foreArm} material={sleeveLen >= 1 ? k.sleeve : k.skin} outline={k.ol.m} />
        <group position={[0, -0.66, 0]}>
          <Toon geometry={g.palm} material={k.skin} outline={k.ol.s} position={[0, -0.07, 0.01]} />
          <Toon geometry={g.thumb} material={k.skin} outline={k.ol.s} position={[-side * 0.055, -0.05, 0.035]} rotation={[0.5, 0, side * 0.5]} />
          {hand}
        </group>
      </group>
    </group>
  );

  const leg = (side: 1 | -1, l: Leg = {}) => (
    <group position={[side * 0.14 * (spec.hip ?? 0.3) / 0.3, -0.05, 0]} rotation={[-(l.h ?? 0), 0, side * (l.o ?? 0.03)]}>
      <Toon geometry={g.thigh} material={k.pants} outline={k.ol.m} />
      <group position={[0, -0.82 * legLen, 0]} rotation={[l.k ?? 0.02, 0, 0]} scale={[1, legLen, 1]}>
        <Toon geometry={g.shin} material={k.pants} outline={k.ol.m} />
        {g.boot && spec.boot ? <Toon geometry={g.boot} material={k.boot!} outline={k.ol.m} position={[0, -0.78 + spec.boot.h - 0.02, 0]} /> : null}
        <Toon geometry={g.foot} material={spec.boot ? k.boot! : k.shoe} outline={k.ol.m} position={[0, -0.69, 0.1]} />
      </group>
    </group>
  );

  const [hp, hy, hr] = pose.head ?? [0, 0, 0];
  const browA = e.tilt * 1.2;
  const browY = 0.145 + (1 - e.irisScale) * 0.1 + e.look[1] * 0.04 - e.lidTop * 0.04;
  const mouthY = mouth === "open" ? -0.172 : mouth === "grin" ? -0.168 : mouth === "o" ? -0.178 : 0;
  const mouthIsMesh = mouth === "open" || mouth === "o" || mouth === "grin";

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <group position={[0, hipY + (pose.y ?? 0), 0]}>
        <group visible={!headOnly}>{leg(1, pose.lLeg)}{leg(-1, pose.rLeg)}</group>
        <group rotation={[pose.lean ?? 0, pose.twist ?? 0, pose.sway ?? 0]}>
          <group visible={!headOnly}>
            <Toon geometry={g.torso} material={k.top} outline={k.ol.l} position={[0, 1.1, 0]} />
            {torso}
            {arm(1, pose.lArm, lHand)}
            {arm(-1, pose.rArm, rHand)}
            <Toon geometry={g.neck} material={k.skin} outline={k.ol.m} position={[0, 1.2, 0]} />
          </group>
          <group position={[0, 1.3 + 0.18 * hs, 0.02]} rotation={[hp, hy, hr]} scale={hs}>
            <Toon geometry={g.head} material={k.skin} outline={k.ol.l} />
            {[1, -1].map((s) => (
              <React.Fragment key={s}>
                <Toon geometry={g.ear} material={k.skin} outline={k.ol.s} position={[s * 0.265, -0.04, 0.0]} />
                <Toon
                  geometry={g.eye}
                  material={s > 0 ? k.eyeL : k.eyeR}
                  outline={k.ol.eye}
                  position={[s * 0.128, 0.0, 0.232]}
                  rotation={[0, s * 0.42, 0]}
                  scale={0.112}
                />
                <mesh
                  geometry={g.browG}
                  material={k.brow}
                  position={[s * 0.128, browY, 0.213]}
                  rotation={[-0.25, s * 0.42, -s * browA]}
                />
              </React.Fragment>
            ))}
            <Toon geometry={g.nose} material={k.skin} outline={k.ol.s} position={[0, -0.085, 0.268]} />
            {mouthIsMesh ? (
              <group position={[0, mouthY, 0.256]} rotation={[0.1, 0, 0]}>
                <mesh geometry={g.mouth[mouth as "open" | "o" | "grin"]} material={k.mouthIn} />
                <mesh geometry={g.mouth.o} material={k.tongue} position={[0, -0.02, 0.006]} scale={[mouth === "grin" ? 1.6 : 1.1, 0.5, 1]} />
              </group>
            ) : (
              <mesh geometry={g.mouth[mouth as "closed" | "smile" | "sad"]} material={k.ink} />
            )}
            {head}
          </group>
        </group>
      </group>
    </group>
  );
};

// altura (no espaço local) do centro da cabeça
export const headCenterY = (s: HumanSpec) => 1.75 * (s.legLen ?? 1) + 1.3 + 0.18 * (s.headScale ?? 1.15);

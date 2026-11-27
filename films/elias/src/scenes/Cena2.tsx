import React from "react";
import * as THREE from "three";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { CameraRig, Cam, V3 as v3 } from "./cam";
import { Elias, Rita } from "../characters/cast";
import { Extra, MENINO, Menino, walkPose } from "../characters/extras";
import { Human, HumanSpec, Pose } from "../characters/Human";
import { PixelPoints, Spr, auraSprites, threadSprites, AURA_COLOR, AuraKind } from "../fx/Pixels";
import { Halftone, Onoma, Panel } from "../fx/Hq";
import { Grade } from "../fx/Grade";
import { solveArm } from "../lib/ik";
import { C } from "../lib/palette";
import { makeToon, makeOutline, sceneUniforms } from "../lib/materials";
import { kf, lerp, smooth } from "./mundo";
import { HQ } from "../lib/fonts";

const P = (c: string) => makeToon({ color: c, shadowK: 1, shadowTint: "#b3a4dc", rim: 0.25, rimColor: "#f3f7ff" });

/* ------------------------------------------------ helpers de braço (IK) */
const armTo = (base: [number, number, number], yaw: number, scale: number, spec: HumanSpec, target: THREE.Vector3, right: boolean) => {
  const side = right ? -1 : 1;
  const hip = 1.75 * (spec.legLen ?? 1);
  const sh = new THREE.Vector3(base[0] + Math.cos(yaw) * side * (spec.shoulder ?? 0.4) * 0.98 * scale, base[1] + (hip + 0.93) * scale, base[2] - Math.sin(yaw) * side * (spec.shoulder ?? 0.4) * 0.98 * scale);
  const d = target.clone().sub(sh).divideScalar(scale);
  const lx = Math.cos(yaw) * d.x - Math.sin(yaw) * d.z;
  const lz = Math.sin(yaw) * d.x + Math.cos(yaw) * d.z;
  return solveArm(new THREE.Vector3(right ? -lx : lx, d.y, lz));
};

const KID: HumanSpec = { ...MENINO, skin: "#EBC09A", top: "#A9B8D6", sleeveColor: "#A9B8D6", pants: "#4A4F5C", shoe: "#3A2A22" };
const Kid: React.FC<{ pose?: Pose; position?: [number, number, number]; rotation?: [number, number, number]; scale?: number }> = ({ scale = 0.8, ...rest }) => {
  const m = React.useMemo(() => ({ hair: P("#3a2c24"), ol: makeOutline(0.012 / scale), g: new THREE.SphereGeometry(0.3, 24, 18) }), [scale]);
  return (
    <Human spec={KID} scale={scale} {...rest}
      head={<mesh geometry={m.g} material={m.hair} position={[0, 0.08, -0.07]} />} />
  );
};
void Menino;

/* ------------------------------------------------ miniatura 3D */
type Rect = { x: number; y: number; w: number; h: number };
const RA: Rect = { x: 40, y: 40, w: 880, h: 500 };
const RB: Rect = { x: 944, y: 40, w: 936, h: 500 };
const RC: Rect = { x: 40, y: 564, w: 600, h: 476 };
const RD: Rect = { x: 664, y: 564, w: 600, h: 476 };
const RE: Rect = { x: 1288, y: 564, w: 592, h: 476 };
const START = [0, 225, 468, 708, 990];
const BG = [
  "linear-gradient(#F3E6CF,#E8D3AE)",
  "linear-gradient(#DDE9F2,#BFD7EA)",
  "linear-gradient(#EFD9C6,#E6B98F)",
  "linear-gradient(#E3EFE6,#BFE5D2)",
  "linear-gradient(#0d1330,#2a2150 70%,#4a2f63)",
];

const Mini: React.FC<{ r: Rect; s: number; cam: Cam; px: (h: number) => number; children: (w: number, h: number) => React.ReactNode; dark?: boolean }> = ({ r, s, cam, children, dark }) => {
  const w = Math.round(r.w * s), h = Math.round(r.h * s);
  sceneUniforms.uSilhouette.value = 0;
  sceneUniforms.uLightDir.value.set(-0.3, 0.6, 0.8);
  sceneUniforms.uFogDensity.value = 0;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: r.w, height: r.h, transform: `scale(${1 / s})`, transformOrigin: "0 0" }}>
      <ThreeCanvas width={w} height={h} flat linear={false} camera={{ fov: cam.fov, near: 0.05, far: 200, position: [0, 3, 9] }} gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}>
        <CameraRig cam={cam} />
        <ambientLight intensity={dark ? 0.2 : 0.6} />
        {children(w, h)}
      </ThreeCanvas>
    </div>
  );
};
const fovPx = (h: number, fov: number) => h / (2 * Math.tan((fov * Math.PI) / 360));
const baseCam = (z = 9, y = 2.5, fov = 34): Cam => ({ pos: v3(0, y + 0.3, z), target: v3(0, y, 0), fov });

const Floor: React.FC<{ color: string; y?: number }> = ({ color, y = 0 }) => {
  const m = React.useMemo(() => new THREE.MeshBasicMaterial({ color }), [color]);
  return (
    <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]} material={m}>
      <planeGeometry args={[60, 30]} />
    </mesh>
  );
};

const kinds4: [AuraKind, [number, number, number]][] = [
  ["tristeza", [-5.2, 3.6, -0.5]], ["pressa", [5.0, 2.2, 0.3]], ["alegria", [-4.0, 1.4, 0.8]], ["medo", [4.2, 4.4, -0.8]],
];

/* ---------------- P1: a criança sente ondas de luz e som */
const P1: React.FC<{ lf: number; w: number; h: number; cam: Cam }> = ({ lf, w, h, cam }) => {
  const f = lf;
  const head = new THREE.Vector3(0, 2.1, 0.3);
  const spr: Spr[] = [];
  const hit = smooth(25, 70, f) * (1 - smooth(150, 200, f));
  kinds4.forEach(([k, pos], i) => {
    const a = hit * (0.7 + 0.3 * Math.sin(f * 0.12 + i));
    spr.push(...auraSprites(k, pos, f, `k${i}`, a * 0.9, 1.1));
    spr.push(...threadSprites(pos, [head.x, head.y, head.z], AURA_COLOR[k], f + i * 9, a, `ks${i}`, 26));
  });
  const cover = smooth(45, 70, f) * (1 - smooth(165, 195, f));
  const mom = smooth(120, 160, f);
  const shake = Math.sin(f * 0.9) * 0.05 * cover;
  const pose: Pose = {
    head: [0.1, shake * 2, shake], expr: f < 60 ? "curioso" : f < 170 ? "susto" : "calma", mouth: f < 170 ? "o" : "smile",
    lArm: { f: 0.2 + 1.5 * cover, o: 0.9 * cover + 0.1, e: 0.4 + 1.9 * cover }, rArm: { f: 0.2 + 1.5 * cover, o: 0.9 * cover + 0.1, e: 0.4 + 1.9 * cover },
  };
  const shT = new THREE.Vector3(-1.45 + 0.3 * (1 - mom), 3.4, 0.7);
  const momArm = armTo([-1.9, 0, 0.2], 0.6, 1, { shoulder: 0.34 } as HumanSpec, new THREE.Vector3(-0.5, 2.0, 0.55), true);
  void shT;
  return (
    <>
      <Floor color="#D9BE92" />
      <Kid position={[0, 0, 0]} rotation={[0, 0, 0]} pose={pose} scale={1.0} />
      {mom > 0.01 ? (
        <Extra idx={3} position={[-1.9 - 1.6 * (1 - mom), 0, 0.2]} rotation={[0, 0.6, 0]} pose={{ ...walkPose(f * 0.18, 0.6 * (1 - mom)), lean: 0.1, expr: "ternura", mouth: "smile", rArm: { ...momArm, f: lerp(0.1, momArm.f, mom), e: lerp(0.3, momArm.e, mom) } }} />
      ) : null}
      <PixelPoints sprites={spr} px={fovPx(h, cam.fov)} k={1.2} />
      {w ? null : null}
    </>
  );
};

/* ---------------- P2: separa o que é dele do que é dos outros (frascos) */
const ORBS = ["tristeza", "pressa", "alegria", "medo", "luto", "alivio"] as AuraKind[];
const jarM = (c: string) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.35 });
const P2: React.FC<{ lf: number; h: number; cam: Cam }> = ({ lf, h, cam }) => {
  const f = lf;
  const kid: [number, number, number] = [-0.5, 0, 0];
  const jarL = new THREE.Vector3(-2.6, 1.0, 0.6), jarR = new THREE.Vector3(2.9, 1.0, 0.6);
  const mats = React.useMemo(() => ({ jar: jarM("#f4fbff"), rim: new THREE.MeshBasicMaterial({ color: "#10141f" }), orb: ORBS.map((k) => makeToon({ color: AURA_COLOR[k], shadowK: 0.6, rim: 0.8, rimColor: "#ffffff", spec: 0.6 })), own: makeToon({ color: "#ffffff", rim: 0.9, rimColor: "#cfe9ff", spec: 0.8 }) }), []);
  const orbs = ORBS.map((k, i) => {
    const t0 = 30 + i * 28;
    const u = smooth(t0, t0 + 24, f);
    const start = new THREE.Vector3(-1.5 + 1.2 * Math.sin(i * 2.1) + Math.sin(f * 0.05 + i) * 0.2, 4.2 + (i % 3) * 0.4 + Math.cos(f * 0.06 + i) * 0.2, 0.4);
    const hand = new THREE.Vector3(0.9, 2.3, 0.9);
    const toHand = smooth(t0, t0 + 10, f), toJar = smooth(t0 + 10, t0 + 26, f);
    const p = start.clone().lerp(hand, toHand).lerp(jarR.clone().add(new THREE.Vector3(0, 1.5 - 1.2 * toJar, 0)), toJar);
    return { k, i, p, u, active: f >= t0 && f < t0 + 28 };
  });
  const ownT = 190;
  const own = new THREE.Vector3(-0.1, 4.0 + Math.sin(f * 0.08) * 0.1, 0.4).lerp(new THREE.Vector3(-0.9, 2.5, 0.9), smooth(ownT, ownT + 14, f)).lerp(jarL.clone().add(new THREE.Vector3(0, 0.3, 0)), smooth(ownT + 14, ownT + 34, f));
  const act = orbs.find((o) => o.active);
  const target = act ? act.p.clone() : f >= ownT && f < ownT + 36 ? own.clone() : new THREE.Vector3(0.5, 1.9, 1.0);
  const isOwn = f >= ownT && f < ownT + 36;
  const arm = armTo(kid, 0, 1.0, KID, target, !isOwn);
  const other = armTo(kid, 0, 1.0, KID, new THREE.Vector3(-0.8, 1.7, 0.7), isOwn);
  const pose: Pose = {
    head: [0.1, (target.x - kid[0]) * 0.06, 0], expr: f < 190 ? "curioso" : f < 245 ? "alegria" : "ternura", mouth: f < 190 ? "closed" : "smile",
    rArm: isOwn ? other : arm, lArm: isOwn ? arm : { f: 0.3, o: 0.1, e: 0.5 },
  };
  const spr: Spr[] = [];
  orbs.forEach((o) => {
    if (o.u < 1) spr.push(...auraSprites(o.k, [o.p.x, o.p.y, o.p.z], f, `o${o.i}`, 0.5, 0.35));
  });
  return (
    <>
      <Floor color="#B8CFE0" />
      <Kid position={kid} rotation={[0, 0, 0]} pose={pose} scale={1.0} />
      {[jarL, jarR].map((j, i) => (
        <group key={i} position={[j.x, 0.9, j.z]} scale={i ? 1.4 : 0.8}>
          <mesh material={mats.jar}><cylinderGeometry args={[0.55, 0.5, 1.5, 22]} /></mesh>
          <mesh material={mats.rim} position={[0, 0.75, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.55, 0.04, 8, 24]} /></mesh>
          <mesh material={mats.rim} position={[0, -0.75, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.5, 0.04, 8, 24]} /></mesh>
        </group>
      ))}
      {orbs.map((o) => (
        <mesh key={o.i} position={o.p} material={mats.orb[o.i]}><sphereGeometry args={[0.28, 20, 14]} /></mesh>
      ))}
      <mesh position={own} material={mats.own}><sphereGeometry args={[0.22, 20, 14]} /></mesh>
      <PixelPoints sprites={spr} px={fovPx(h, cam.fov)} k={1} />
    </>
  );
};

/* ---------------- P3: adulto deixa as ondas passarem (filtro) */
const P3: React.FC<{ lf: number; h: number; cam: Cam }> = ({ lf, h, cam }) => {
  const f = lf;
  const peds = [0, 1, 2, 3, 4].map((i) => ({ i, x: -9 + ((f * 0.05 * (1 + (i % 2) * 0.4) + i * 4.7) % 24), z: -2.4 - (i % 2) * 0.6, k: ["pressa", "tristeza", "alegria", "medo", "luto"][i] as AuraKind }));
  const spr: Spr[] = [];
  const chest: [number, number, number] = [0.15, 2.6, 0.3];
  peds.forEach((p) => {
    const near = 1 - Math.min(1, Math.abs(p.x) / 5);
    const pos: [number, number, number] = [p.x, 3.0, p.z];
    spr.push(...auraSprites(p.k, pos, f, `p3${p.i}`, 0.8, 1));
    spr.push(...threadSprites(pos, [1.2, 2.7, 0.6], AURA_COLOR[p.k], f + p.i * 5, near * smooth(20, 60, f), `t3${p.i}`, 20));
    // sai do outro lado, atenuado (o filtro)
    spr.push(...threadSprites([-1.0, 2.7, 0.6], [p.x < 0 ? -6 : 6, 3.4, 0], AURA_COLOR[p.k], f + p.i * 5, near * smooth(20, 60, f) * 0.5, `u3${p.i}`, 14));
  });
  const arm = { f: 1.45, o: 0.5, e: 0.45 };
  return (
    <>
      <Floor color="#C9A47E" />
      <Elias position={[0, 0, 0.3]} rotation={[0, 0.25, 0]} pose={{ lean: 0.02, head: [0.0, 0, 0], expr: "calma", mouth: "closed", lArm: arm, rArm: { f: 0.2, o: 0.1, e: 0.4 } }} />
      {peds.map((p) => (
        <Extra key={p.i} idx={p.i + 4} position={[p.x, 0, p.z]} rotation={[0, Math.PI / 2, 0]} pose={walkPose(f * 0.15 + p.i, 0.8)} />
      ))}
      <PixelPoints sprites={spr} px={fovPx(h, cam.fov)} k={1.1} />
      {chest ? null : null}
    </>
  );
};

/* ---------------- P4: usa a sensibilidade para ajudar (azul → menta) */
const P4: React.FC<{ lf: number; h: number; cam: Cam }> = ({ lf, h, cam }) => {
  const f = lf;
  const mix = smooth(80, 200, f);
  const spr: Spr[] = [];
  spr.push(...auraSprites("tristeza", [-1.5, 2.4, 0.2], f, "r4", (1 - mix) * 0.95, 1));
  spr.push(...auraSprites("alivio", [-1.5, 2.4, 0.2], f, "r4b", mix * 0.9, 1));
  spr.push(...threadSprites([-1.7, 3.0, 0.5], [1.15, 2.6, 0.5], AURA_COLOR.tristeza, f, smooth(15, 50, f) * (1 - mix), "a4", 26));
  spr.push(...threadSprites([1.0, 2.7, 0.5], [-1.5, 3.0, 0.5], AURA_COLOR.alivio, f, smooth(70, 120, f), "b4", 22));
  const hand = armTo([1.3, 0, 0.3], -1.0, 1, { shoulder: 0.37 } as HumanSpec, new THREE.Vector3(-0.95, 2.75, 0.6), true);
  const give = smooth(40, 75, f);
  return (
    <>
      <Floor color="#9DBDA9" />
      <Rita position={[-1.7, 0, 0.1]} rotation={[0, 1.1, 0]} pose={{ lean: 0.04, head: [0.12 - 0.12 * mix, 0, 0], expr: f < 90 ? "choro" : f < 150 ? "curioso" : "ternura", mouth: f < 150 ? "sad" : "smile" }} />
      <Elias position={[1.3, 0, 0.3]} rotation={[0, -1.0, 0]} pose={{ lean: 0.05, head: [0.1, 0, 0], expr: "ternura", mouth: "smile", rArm: { f: lerp(0.2, hand.f, give), o: lerp(0.1, hand.o, give), e: lerp(0.4, hand.e, give) }, lArm: { f: 0.2, o: 0.1, e: 0.3 } }} />
      <PixelPoints sprites={spr} px={fovPx(h, cam.fov)} k={1.1} />
    </>
  );
};

/* ---------------- P5: à noite, a cidade acesa de emoções, Elias de costas */
const P5: React.FC<{ lf: number; h: number; cam: Cam }> = ({ lf, h, cam }) => {
  const f = lf;
  const spr: Spr[] = [];
  spr.push(...auraSprites("luto", [0, 2.6, 0.4], f, "e5", smooth(60, 160, f) * 0.5, 0.9));
  return (
    <>
      <Floor color="#1b1a33" />
      <Elias position={[0, 0, 0]} rotation={[0, Math.PI, 0]} pose={{ lean: 0.1, head: [0.15, 0.0, 0], expr: "calma", mouth: "closed", lArm: { f: 0.1, o: 0.1, e: 0.2 }, rArm: { f: 0.1, o: 0.1, e: 0.2 } }} />
      <PixelPoints sprites={spr} px={fovPx(h, cam.fov)} k={1} />
    </>
  );
};

const CityWindows: React.FC<{ f: number }> = ({ f }) => {
  const cols = ["#3D5A98", "#FF7F11", "#FFD23F", "#6A4C93", "#5C677D", "#7AE7C7", "#F7B2AD"];
  const step = Math.floor(f / 6);
  return (
    <svg width="100%" height="100%" viewBox="0 0 592 476" style={{ position: "absolute", left: 0, top: 0 }}>
      {Array.from({ length: 11 }).map((_, bi) => {
        const bx = bi * 56 - 10, bh = 150 + random(`bb${bi}`) * 150;
        return (
          <g key={bi}>
            <rect x={bx} y={330 - bh} width={52} height={bh + 150} fill="#141233" />
            {Array.from({ length: Math.floor(bh / 30) }).map((_, wy) =>
              [0, 1].map((wx) => {
                const r = random(`w${bi}-${wy}-${wx}`);
                const on = r > 0.25;
                const c = cols[Math.floor(random(`wc${bi}-${wy}-${wx}`) * cols.length)];
                const tw = random(`tw${bi}-${wy}-${wx}-${step}`) > 0.93 ? 0.4 : 1;
                return <rect key={`${wy}${wx}`} x={bx + 8 + wx * 22} y={330 - bh + 10 + wy * 30} width={14} height={14} fill={on ? c : "#1f1c45"} opacity={on ? tw : 1} />;
              }),
            )}
          </g>
        );
      })}
    </svg>
  );
};

/* ------------------------------------------------ página de HQ */
const RECTS = [RA, RB, RC, RD, RE];
const FOCUS: [number, number, number, number][] = [
  [0, 480, 290, 2.05], [215, 480, 290, 2.05], [250, 1412, 290, 1.95], [455, 1412, 290, 1.95], [488, 340, 802, 2.15],
  [700, 340, 802, 2.15], [730, 964, 802, 2.15], [975, 964, 802, 2.15], [1010, 1584, 802, 2.15], [1235, 1584, 802, 2.15],
  [1320, 960, 540, 1.0], [1400, 960, 540, 1.0], [1490, 1584, 802, 4.0],
];
const view = (f: number) => {
  const k = FOCUS;
  const cx = kf(f, k.map((a) => [a[0], a[1]] as [number, number]));
  const cy = kf(f, k.map((a) => [a[0], a[2]] as [number, number]));
  const s = kf(f, k.map((a) => [a[0], a[3]] as [number, number]));
  const ccx = Math.min(1920 - 960 / s, Math.max(960 / s, cx)), ccy = Math.min(1080 - 540 / s, Math.max(540 / s, cy));
  return { cx: ccx, cy: ccy, s };
};

const pop = (f: number, a: number) => {
  const t = (f - a) / 8;
  return t <= 0 ? 0 : t >= 1 ? 1 : t < 0.6 ? (t / 0.6) * 1.1 : 1.1 - ((t - 0.6) / 0.4) * 0.1;
};

export const Cena2: React.FC = () => {
  const f = useCurrentFrame();
  const { cx, cy, s } = view(f);
  const tx = 960 - cx * s, ty = 540 - cy * s;
  const fade = smooth(1455, 1500, f);
  const cams: Cam[] = [baseCam(9, 2.0, 34), baseCam(9, 2.3, 36), baseCam(10, 2.5, 34), baseCam(8.5, 2.6, 34), baseCam(9, 2.9, 34)];
  cams[0].pos.x = 0.0;
  cams[2].pos.x = 1.5; cams[2].target.x = 1.0;
  const camS = (i: number): Cam => {
    const c = cams[i];
    const t = Math.max(0, f - START[i]);
    return { ...c, pos: c.pos.clone().add(v3(0, 0, -0.5 * Math.min(1, t / 220))), target: c.target };
  };
  return (
    <AbsoluteFill style={{ background: "#10141f" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transform: `translate(${tx}px,${ty}px) scale(${s})`, transformOrigin: "0 0", background: "#F4F1EA" }}>
        <Halftone opacity={0.08} size={10} color="120,90,60" />
        {RECTS.map((r, i) => {
          const sc = pop(f, START[i]);
          if (sc <= 0) return null;
          const sx = r.x * s + tx, sy = r.y * s + ty;
          const visible = sx < 1920 && sy < 1080 && sx + r.w * s > 0 && sy + r.h * s > 0;
          const lf = Math.min(Math.max(0, f - START[i]), [230, 235, 235, 285, 260][i]);
          const cam = camS(i);
          const res = Math.min(s, 2.2);
          return (
            <div key={i} style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, transform: `scale(${sc}) rotate(${(1 - sc) * -2}deg)`, filter: "drop-shadow(8px 8px 0 #10141f55)" }}>
              <Panel x={0} y={0} w={r.w} h={r.h} border={7} style={{ background: BG[i] }}>
                {i === 4 ? <div style={{ position: "absolute", left: 0, top: 0, width: 592, height: 476 }}><CityWindows f={f} /></div> : null}
                {visible ? (
                  <Mini r={r} s={res} cam={cam} px={() => 1} dark={i === 4}>
                    {(w, h) => (i === 0 ? <P1 lf={lf} w={w} h={h} cam={cam} /> : i === 1 ? <P2 lf={lf} h={h} cam={cam} /> : i === 2 ? <P3 lf={lf} h={h} cam={cam} /> : i === 3 ? <P4 lf={lf} h={h} cam={cam} /> : <P5 lf={lf} h={h} cam={cam} />)}
                  </Mini>
                ) : null}
                <Halftone opacity={0.1} size={8} color="40,30,50" />
              </Panel>
            </div>
          );
        })}
        {/* onomatopeias */}
        {f > 40 && f < 215 ? <Onoma text="ZZZUUUM" x={RA.x + 740} y={RA.y + 90} size={64} rot={-8} color="#FFD23F" scale={smooth(40, 52, f)} /> : null}
        {f > 520 && f < 700 ? <Onoma text="shhh…" x={RC.x + 120} y={RC.y + 70} size={56} rot={6} color="#BFD7EA" scale={smooth(520, 532, f)} /> : null}
        {f > 790 && f < 980 ? <Onoma text="…ahh" x={RD.x + 480} y={RD.y + 80} size={56} rot={-6} color="#7AE7C7" scale={smooth(790, 802, f)} /> : null}
      </div>
      <Grade vignette={0.25} grain={0.04} vc="30,20,40" />
      <AbsoluteFill style={{ background: C.ink, opacity: fade }} />
      <div style={{ display: "none", fontFamily: HQ }} />
    </AbsoluteFill>
  );
};

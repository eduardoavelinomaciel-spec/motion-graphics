import React from "react";
import * as THREE from "three";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, random } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { CameraRig, Cam, V3 as v3, lerpCam } from "./cam";
import { Street } from "../world/Street";
import { Bench } from "../world/Props";
import { Elias, Rita, ELIAS, RITA } from "../characters/cast";
import { walkPose } from "../characters/extras";
import { Pose } from "../characters/Human";
import { PixelPoints, Spr, auraSprites, threadSprites, chestSprites, burstSprites, AURA_COLOR } from "../fx/Pixels";
import { Pictoballoon } from "../fx/Pictoballoon";
import { PicQuestion, PicHands } from "../fx/Pictos";
import { Halftone } from "../fx/Hq";
import { Grade } from "../fx/Grade";
import { armTo } from "../lib/arm";
import { lerp, smooth, setScene } from "./mundo";
import { dissolveDiv, fovPx } from "./kit";

export const TOTAL7 = 900;
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const mix = (a: any, b: any, k: number) => ({ f: lerp(a.f, b.f, k), o: lerp(a.o, b.o, k), e: lerp(a.e, b.e, k), t: 0 });
const SIT = -0.55, BZ = 0.5, EX = -0.65, RXS = 0.7;
const KNEE = { f: 0.75, o: 0.05, e: 1.25, t: 0 };
const sitLeg = { h: 1.35, k: 1.45, o: 0 };
const ritaX = (f: number) => (f < 280 ? lerp(10, 2.2, smooth(60, 280, f) * 0.9 + (Math.max(0, f - 60) / 220) * 0.1) : lerp(2.2, RXS, smooth(280, 330, f)));
const ritaSit = (f: number) => smooth(300, 340, f);
const ritaAmp = (f: number) => (f < 60 ? 0 : f < 270 ? 1 : 1 - smooth(270, 300, f));
const hug = (f: number) => smooth(460, 520, f) * (1 - smooth(780, 840, f));
const hands = (f: number) => smooth(350, 400, f);

const WIDE: Cam = { pos: v3(0.1, 3.3, 10), target: v3(0.05, 2.1, 0.5), fov: 32 };
const camWide = (f: number): Cam => ({ ...WIDE, pos: v3(0.1, 3.3, lerp(11, 9.4, smooth(0, 900, f))) });
const HANDS: Cam = { pos: v3(-1.3, 2.0, 5.2), target: v3(-1.3, 1.75, 0.7), fov: 30 };
const FACES: Cam = { pos: v3(-1.2, 2.55, 6.2), target: v3(-1.2, 2.45, 0.6), fov: 30 };
const camClose = (f: number): Cam => lerpCam(HANDS, FACES, smooth(450, 520, f));

const Scene: React.FC<{ f: number; h: number; cam: Cam }> = ({ f, h, cam }) => {
  setScene("#202850", 0.010, [0.25, 0.5, 0.8]);
  const rx = ritaX(f), rs = ritaSit(f);
  const rw = walkPose(f * 0.19, ritaAmp(f));
  const hd = hands(f), hg = hug(f);
  const meetH = V(0.02, 1.62, BZ + 0.5);
  const ikEH = armTo([EX, 0, BZ], 0.3, 1, ELIAS, meetH, true, SIT);
  const ikRH = armTo([rx, 0, BZ], -0.3, 1, RITA, meetH, false, SIT * rs);
  const ikEHug = armTo([EX, 0, BZ], 0.4, 1, ELIAS, V(RXS + 0.1, 2.0, BZ - 0.2), true, SIT);
  const ikRHug = armTo([rx, 0, BZ], -0.4, 1, RITA, V(EX - 0.15, 2.05, BZ - 0.2), false, SIT * rs);
  const cry = smooth(500, 560, f);
  const ePose: Pose = {
    y: SIT, lean: 0.22 - 0.1 * hg + 0.02 * Math.sin(f * 0.05), head: [0.42 * (1 - hg * 0.9), 0.0 + 0.4 * hg, 0.1 * hg],
    expr: f < 340 ? "triste" : f < 460 ? "curioso" : f < 800 ? "choro" : "ternura", mouth: f < 800 ? (f > 500 ? "sad" : "closed") : "smile",
    lLeg: sitLeg, rLeg: sitLeg, lArm: KNEE, rArm: mix(mix(KNEE, ikEH, hd), ikEHug, hg),
  };
  const rPose: Pose = {
    ...rw, y: SIT * rs, lean: 0.02 + 0.12 * rs * (1 + hg), head: [0.05, -0.3 * rs, 0],
    expr: f < 340 ? "calma" : "ternura", mouth: f > 340 ? "smile" : "closed",
    lLeg: rs > 0.01 ? { h: 1.35 * rs, k: 1.45 * rs, o: 0 } : rw.lLeg, rLeg: rs > 0.01 ? { h: 1.35 * rs, k: 1.45 * rs, o: 0 } : rw.rLeg,
    lArm: rs > 0.01 ? mix(rw.lArm as any, KNEE, rs) : rw.lArm,
    rArm: mix(mix(rs > 0.01 ? mix(rw.rArm as any, KNEE, rs) : (rw.rArm as any), ikRH, hd), ikRHug, hg),
  };
  const chest: [number, number, number] = [EX + 0.28, 2.6 + SIT, BZ + 0.05];
  const spr: Spr[] = [];
  const load = 1 - smooth(470, 640, f);
  const cols = [AURA_COLOR.pressa, AURA_COLOR.tristeza, AURA_COLOR.medo, AURA_COLOR.luto, AURA_COLOR.alegria];
  spr.push(...chestSprites(chest, f, cols, Math.min(1, load * (f < 470 ? 1 : 1)), 46));
  spr.push(...threadSprites([RXS - 0.1, 2.5 + SIT * 0.5, BZ], chest, AURA_COLOR.carinho, f, smooth(440, 500, f) * (1 - smooth(780, 840, f)), "rt", 38));
  spr.push(...auraSprites("carinho", [(EX + RXS) / 2, 3.0 + SIT * 0.5, BZ + 0.1], f, "c7", smooth(450, 560, f) * (1 - smooth(820, 890, f) * 0.5) * 0.9, 1.2));
  spr.push(...auraSprites("alivio", [EX, 3.2 + SIT * 0.5, BZ], f, "a7", smooth(600, 700, f) * 0.7, 1.0));
  spr.push(...burstSprites([EX + 0.3, 2.8, BZ + 0.5], f, 520, "#F7B2AD", 30, 56));
  const px = fovPx(h, cam.fov);
  return (
    <>
      <CameraRig cam={cam} />
      <Street camX={cam.pos.x} range={Math.max(34, cam.pos.z * 1.2)} />
      <Bench position={[0, 0, BZ - 0.2]} w={5.4} />
      <Elias position={[EX, 0, BZ]} rotation={[0, 0.3, 0]} pose={ePose} />
      <Rita position={[rx, 0, BZ]} rotation={[0, f < 280 ? -Math.PI / 2 + 0.1 : lerp(-Math.PI / 2 + 0.1, -0.3, smooth(280, 340, f)), 0]} pose={rPose} box={f < 300} />
      <PixelPoints sprites={spr} px={px} k={Math.min(2.4, Math.max(1, cam.pos.z / 11))} />
      <group position={[0, 0, 0]} visible={false} />
      {cry < 0 ? null : null}
    </>
  );
};

const STARS = Array.from({ length: 50 }).map((_, i) => ({ x: random(`sx7${i}`) * 1920, y: random(`sy7${i}`) * 420, s: 2 + Math.floor(random(`ss7${i}`) * 3) * 2 }));

const Canvas: React.FC<{ f: number; div: number; cam: Cam; clip?: string }> = ({ f, div, cam, clip }) => {
  const { width, height } = useVideoConfig();
  const w = Math.round(width / div), h = Math.round(height / div);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width, height, clipPath: clip }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, transform: `scale(${div})`, transformOrigin: "0 0", imageRendering: "pixelated" }}>
        <ThreeCanvas width={w} height={h} flat linear={false} camera={{ fov: cam.fov, near: 0.05, far: 400, position: [0, 3, 13] }} gl={{ antialias: div === 1, alpha: true, preserveDrawingBuffer: true }}>
          <Scene f={f} h={h} cam={cam} />
        </ThreeCanvas>
      </div>
    </div>
  );
};

export const Cena7: React.FC = () => {
  const f = useCurrentFrame();
  const div = dissolveDiv(f, TOTAL7);
  const k = smooth(340, 368, f) * (1 - smooth(700, 740, f));
  const xt = lerp(2160, 1180, k), xb = lerp(1920, 940, k);
  const clipL = k > 0.001 ? `polygon(0 0, ${xt}px 0, ${xb}px 1080px, 0 1080px)` : undefined;
  const clipR = `polygon(${xt + 56}px 0, 1920px 0, 1920px 1080px, ${xb + 56}px 1080px)`;
  const bal = smooth(610, 626, f) * (1 - smooth(770, 785, f));
  const warm = smooth(520, 800, f);
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg,#0E1230 0%,#262E63 55%,#4A4A86 100%)" }}>
      <Canvas f={f} div={div} cam={camWide(f)} clip={clipL} />
      {k > 0.001 ? <Canvas f={f} div={div} cam={camClose(f)} clip={clipR} /> : null}
      {k > 0.001 ? (
        <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
          <polygon points={`${xt},0 ${xt + 56},0 ${xb + 56},1080 ${xb},1080`} fill="#fff" stroke="#10141f" strokeWidth="6" strokeLinejoin="round" />
        </svg>
      ) : null}
      <AbsoluteFill style={{ background: "rgba(20,30,90,0.40)", mixBlendMode: "multiply", opacity: 1 - warm * 0.7 }} />
      <AbsoluteFill style={{ background: "rgba(255,170,110,0.28)", mixBlendMode: "soft-light", opacity: 0.15 + warm * 0.85 }} />
      {STARS.map((s, i) => (
        <div key={i} style={{ position: "absolute", left: Math.round(s.x / 6) * 6, top: Math.round(s.y / 6) * 6, width: s.s, height: s.s, background: "#FFF6D8", opacity: (0.3 + 0.3 * Math.sin(f * 0.05 + i) ** 2) * (1 - k * 0.8) * (1 - warm * 0.5) }} />
      ))}
      <Pictoballoon x={760} y={60} w={560} h={300} tail={[900, 440]} t={bal} left={<PicQuestion />} right={<PicHands />} />
      <Halftone opacity={0.035} size={10} color="20,20,60" />
      <Grade vignette={0.4} grain={0.045} vc="20,14,40" />
    </AbsoluteFill>
  );
};

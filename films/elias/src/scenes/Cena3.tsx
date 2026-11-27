import React from "react";
import * as THREE from "three";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { CameraRig, Cam, V3 as v3 } from "./cam";
import { Bakery, Loaf } from "../world/Bakery";
import { Elias, Antonio } from "../characters/cast";
import { ANTONIO } from "../characters/cast";
import { ELIAS } from "../characters/cast";
import { Pose } from "../characters/Human";
import { PixelPoints, Spr, auraSprites, burstSprites, threadSprites, AURA_COLOR } from "../fx/Pixels";
import { Pictoballoon } from "../fx/Pictoballoon";
import { Halftone } from "../fx/Hq";
import { Grade } from "../fx/Grade";
import { armTo } from "../lib/arm";
import { sceneUniforms } from "../lib/materials";
import { C } from "../lib/palette";
import { kf, lerp, smooth } from "./mundo";
import { walkPose } from "../characters/extras";
import { Onoma } from "../fx/Hq";

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const CHEST_ARM = { f: 0.45, o: -0.28, e: 2.15, t: 0 };
const BAKER_HANDS = { f: 0.2, o: 0.7, e: 2.3 };
const BX = 2.0, BZ = 0.3, BYAW = -Math.PI / 2 + 0.3;
const EZ = 0.4, EYAW = Math.PI / 2 - 0.3;

export const eliasX = (f: number) => {
  if (f < 150) return lerp(-9.6, -3.6, smooth(0, 150, f) * 0.75 + (f / 150) * 0.25);
  if (f < 335) return -3.6;
  if (f < 1240) return lerp(-3.6, -1.55, smooth(335, 380, f)) + 0.5 * smooth(450, 490, f) * (1 - smooth(560, 610, f));
  return lerp(-1.55, -9.8, smooth(1250, 1480, f));
};
const sitK = (f: number) => smooth(345, 385, f) * (1 - smooth(1235, 1270, f));
const walkAmp = (f: number) => {
  if (f < 140) return 1 - smooth(130, 150, f);
  if (f > 335 && f < 385) return 0.7 * (smooth(335, 345, f) * (1 - smooth(370, 385, f)));
  if (f > 1240) return smooth(1245, 1275, f);
  return 0;
};
const phase = (f: number) => (f < 600 ? f * 0.19 : 1240 * 0.19 + (f - 1240) * 0.19) + 0;

const camAt = (f: number): Cam => {
  const z = kf(f, [[0, 15], [150, 14], [420, 11.5], [620, 9.6], [1000, 9.6], [1200, 7.8], [1300, 12], [1500, 15]]);
  const tx = kf(f, [[0, -3], [150, -2.4], [420, 0], [620, 0], [1000, 0.2], [1200, 1.5], [1300, -1], [1500, -3]]);
  const ty = kf(f, [[0, 2.9], [1000, 2.9], [1200, 3.1], [1300, 2.8]]);
  return { pos: v3(tx * 0.6 - 1.2, 3.5, z), target: v3(tx, ty, 0.2), fov: 32 };
};

const Scene3: React.FC<{ f: number; w: number; h: number; k: number }> = ({ f, h }) => {
  sceneUniforms.uSilhouette.value = 0;
  sceneUniforms.uLightDir.value.set(0.1, 0.6, 0.85);
  sceneUniforms.uFogDensity.value = 0;
  const cam = camAt(f);
  const ex = eliasX(f);
  const sit = sitK(f);
  const yOff = -0.55 * sit;
  const joy = smooth(1000, 1080, f);
  const glow = smooth(560, 1100, f);
  const light = smooth(700, 1150, f);

  /* pão */
  const loafRest = V(-0.15, 2.14, 0.25);
  const handoff = V(0.6, 2.45, 0.5);
  const held = V(1.3, 2.45, 0.6);
  const loafP = f < 430 ? loafRest : f < 470 ? loafRest : f < 545 ? loafRest.clone().lerp(handoff, smooth(470, 545, f)) : handoff.clone().lerp(held, smooth(545, 580, f));
  const loafHot = f > 380 ? 1 : 0;

  /* braços de Elias */
  const eBase: [number, number, number] = [ex, 0, EZ];
  const restR = V(-0.5, 2.12, 0.9), restL = V(-0.5, 2.12, -0.1);
  let tR = restR;
  if (f >= 430 && f < 470) tR = restR.clone().lerp(loafRest.clone().add(V(0, 0.15, 0.2)), smooth(430, 470, f));
  else if (f >= 470 && f < 545) tR = loafP.clone().add(V(0, 0.15, 0.2));
  else if (f >= 545 && f < 600) tR = handoff.clone().add(V(0, 0.15, 0.2)).lerp(restR, smooth(560, 600, f));
  const ikR = armTo(eBase, EYAW, 1, ELIAS, tR, true, yOff);
  const ikL = armTo(eBase, EYAW, 1, ELIAS, restL, false, yOff);
  const chestK = smooth(150, 190, f) * (1 - smooth(335, 375, f));
  const eWalk = walkPose(phase(f), walkAmp(f));
  const useIk = smooth(360, 400, f) * (1 - smooth(1235, 1265, f));
  const mixArm = (a: any, b: any, k: number) => ({ f: lerp(a.f, b.f, k), o: lerp(a.o, b.o, k), e: lerp(a.e, b.e, k), t: 0 });
  const rBase = mixArm(eWalk.rArm!, CHEST_ARM, chestK);
  const lBase = eWalk.lArm!;
  const ePose: Pose = {
    ...eWalk,
    y: yOff,
    lean: 0.03 + 0.06 * sit + 0.2 * smooth(450, 490, f) * (1 - smooth(560, 610, f)),
    head: [0.06 + 0.08 * sit, f < 150 ? 0 : -0.1, 0],
    expr: f < 160 ? "calma" : f < 440 ? "triste" : f < 640 ? "ternura" : f < 1000 ? "calma" : "ternura",
    mouth: f > 700 && f < 1000 ? "closed" : f >= 1000 ? "smile" : "closed",
    lArm: mixArm(lBase, ikL, useIk),
    rArm: mixArm(rBase, ikR, useIk),
    lLeg: sit > 0.01 ? { h: 1.35 * sit, k: 1.45 * sit, o: 0 } : eWalk.lLeg,
    rLeg: sit > 0.01 ? { h: 1.35 * sit, k: 1.45 * sit, o: 0 } : eWalk.rLeg,
  };

  /* Antônio */
  const bBase: [number, number, number] = [BX, 0, BZ];
  const lift = smooth(460, 520, f);
  const bHandsUp = 1 - lift;
  const bTargetL = f < 545 ? handoff.clone().lerp(held, 0) : held;
  const ikBL = armTo(bBase, BYAW, 1, ANTONIO, f < 500 ? loafRest.clone().add(V(0.6, 0.2, 0.4)) : f < 545 ? handoff : bTargetL, false);
  const ikBR = armTo(bBase, BYAW, 1, ANTONIO, V(1.3, 2.1, 0.1), true);
  const bPose: Pose = {
    lean: 0.04 + 0.06 * bHandsUp,
    head: [0.28 * bHandsUp - 0.06, 0, 0.04],
    expr: f < 150 ? "triste" : f < 470 ? "choro" : f < 640 ? "curioso" : f < 1000 ? "ternura" : "alegria",
    mouth: f < 470 ? "sad" : f < 1000 ? "closed" : "grin",
    lArm: mixArm(BAKER_HANDS, ikBL, lift),
    rArm: mixArm(BAKER_HANDS, ikBR, lift),
  };

  /* sprites */
  const spr: Spr[] = [];
  const bc: [number, number, number] = [BX + 0.1, 3.2, BZ];
  const sadAmt = smooth(40, 110, f) * (1 - smooth(640, 900, f));
  spr.push(...auraSprites("tristeza", bc, f, "bk", sadAmt * 0.95, 1.05));
  spr.push(...auraSprites("pressa", bc, f, "bk2", sadAmt * 0.4, 0.9));
  spr.push(...auraSprites("alivio", bc, f, "bk3", smooth(640, 900, f) * (1 - smooth(1000, 1070, f)) * 0.9, 1.0));
  spr.push(...auraSprites("alegria", bc, f, "bk4", joy * 0.95, 1.05));
  spr.push(...burstSprites([BX, 3.4, BZ + 0.4], f, 1004, "#FFD23F", 26, 50));
  const chest: [number, number, number] = [ex + 0.28, 2.6 + yOff, EZ + 0.05];
  spr.push(...threadSprites([BX - 0.1, 3.3, BZ], chest, AURA_COLOR.tristeza, f, smooth(150, 190, f) * (1 - smooth(420, 470, f)), "bt", 34));
  spr.push(...threadSprites(chest, [BX, 3.3, BZ], AURA_COLOR.alivio, f, smooth(650, 690, f) * (1 - smooth(900, 940, f)), "et", 30));
  // respiração gelada
  const cold = 1 - smooth(560, 900, f);
  [[ex + 0.45, 3.25 + yOff * 0.9, EZ, 1], [BX - 0.35, 3.45, BZ + 0.1, -1]].forEach(([px, py, pz, dr], i) => {
    for (let j = 0; j < 2; j++) {
      const u = ((f + i * 23 + j * 40) % 80) / 80;
      spr.push({ p: [px + dr * u * 0.7, py + u * 0.5, pz], c: "#EAF3FF", s: 0.15 * (1 - 0.3 * u), shape: 4, a: cold * 0.9 * (1 - u) * (u > 0.02 ? 1 : 0) });
    }
  });
  // vapor do pão quente
  for (let i = 0; i < 9; i++) {
    const u = ((f * 0.7 + i * 11) % 55) / 55;
    spr.push({ p: [loafP.x + Math.sin(i * 2 + u * 6) * 0.14, loafP.y + 0.3 + u * 1.2, loafP.z], c: "#F4F1EA", s: 0.14, shape: 4, a: (f > 380 && f < 1150 ? 0.85 : 0) * Math.sin(Math.PI * u) });
  }
  const px = h / (2 * Math.tan((cam.fov * Math.PI) / 360));

  return (
    <>
      <CameraRig cam={cam} />
      <Bakery glow={glow} light={light} />
      <Elias position={[ex, 0, EZ]} rotation={[0, f > 1240 ? -Math.PI / 2 + 0.2 : EYAW, 0]} pose={ePose} />
      <Antonio position={bBase} rotation={[0, BYAW, 0]} pose={bPose} />
      <Loaf position={[loafP.x, loafP.y, loafP.z]} rotation={[0, 0.2, 0]} s={0.9} hot={loafHot} />
      <PixelPoints sprites={spr} px={px} k={Math.min(2, Math.max(1, cam.pos.z / 11))} />
    </>
  );
};

export const Cena3: React.FC = () => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const div = f >= 1497 ? 8 : f >= 1494 ? 6 : f >= 1491 ? 4 : f >= 1488 ? 2 : 1;
  const w = Math.round(width / div), h = Math.round(height / div);
  const warm = smooth(700, 1150, f);
  const bal = smooth(625, 640, f) * (1 - smooth(985, 1000, f));
  return (
    <AbsoluteFill style={{ background: "linear-gradient(#cfd9e6,#e6d2b4)" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, transform: `scale(${div})`, transformOrigin: "0 0", imageRendering: "pixelated" }}>
        <ThreeCanvas width={w} height={h} flat linear={false} camera={{ fov: 32, near: 0.05, far: 200, position: [0, 3, 12] }} gl={{ antialias: div === 1, alpha: true, preserveDrawingBuffer: true }}>
          <Scene3 f={f} w={w} h={h} k={1} />
        </ThreeCanvas>
      </div>
      <AbsoluteFill style={{ background: "rgba(70,110,160,0.22)", mixBlendMode: "multiply", opacity: 1 - warm }} />
      <AbsoluteFill style={{ background: "rgba(255,190,110,0.28)", mixBlendMode: "soft-light", opacity: warm }} />
      <Pictoballoon x={640} y={70} w={560} h={300} tail={[700, 470]} t={bal} />
      {f > 640 && f < 800 ? <Onoma text="…!" x={1260} y={140} size={80} rot={8} color="#FFD23F" scale={smooth(640, 652, f)} /> : null}
      <Halftone opacity={0.04} size={10} color="90,60,40" />
      <Grade vignette={0.3} grain={0.045} vc="40,24,30" />
      <div style={{ display: "none", background: C.ink }} />
    </AbsoluteFill>
  );
};

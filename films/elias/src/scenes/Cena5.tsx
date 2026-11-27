import React from "react";
import * as THREE from "three";
import { AbsoluteFill } from "remotion";
import { CameraRig, Cam, V3 as v3 } from "./cam";
import { Street } from "../world/Street";
import { Bench } from "../world/Props";
import { Elias, Jorge, ELIAS } from "../characters/cast";
import { walkPose } from "../characters/extras";
import { Pose } from "../characters/Human";
import { PixelPoints, Spr, auraSprites, threadSprites, chestSprites, AURA_COLOR } from "../fx/Pixels";
import { Pictoballoon } from "../fx/Pictoballoon";
import { PicWife, PicProud } from "../fx/Pictos";
import { Halftone, Onoma } from "../fx/Hq";
import { armTo } from "../lib/arm";
import { kf, lerp, smooth, setScene } from "./mundo";
import { Shell, fovPx } from "./kit";

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
export const TOTAL5 = 1500;
const mix = (a: any, b: any, k: number) => ({ f: lerp(a.f, b.f, k), o: lerp(a.o, b.o, k), e: lerp(a.e, b.e, k), t: 0 });
const KNEE = { f: 0.75, o: 0.05, e: 1.25 };
const BZ = 0.5, JX = 0.75, EX_SIT = -1.15, SIT = -0.55;
const sitLeg = { h: 1.35, k: 1.45, o: 0 };

const exAt = (f: number) => (f < 300 ? lerp(-10, -2.2, smooth(0, 300, f) * 0.85 + (f / 300) * 0.15) : lerp(-2.2, EX_SIT, smooth(300, 370, f)));
const sitK = (f: number) => smooth(340, 395, f);
const walkAmp = (f: number) => (f < 280 ? 1 - smooth(270, 300, f) : f < 380 ? 0.5 * smooth(300, 310, f) * (1 - smooth(350, 380, f)) : 0);
const camAt = (f: number): Cam => {
  const z = kf(f, [[0, 12], [380, 9.6], [1100, 8.4], [1500, 11.5]]);
  const tx = kf(f, [[0, -2.8], [380, -0.2], [1500, 0]]);
  return { pos: v3(tx * 0.5, 3.3, z), target: v3(tx, 2.2, 0.4), fov: 32 };
};

const Scene: React.FC<{ f: number; h: number }> = ({ f, h }) => {
  setScene("#E8B58F", 0.010, [-0.55, 0.4, 0.8]);
  const cam = camAt(f);
  const sit = sitK(f), ex = exAt(f);
  const ew = walkPose(Math.min(f, 380) * 0.19, walkAmp(f));
  const yOff = SIT * sit;
  const hand = smooth(730, 790, f) * (1 - smooth(1100, 1160, f));
  const eBase: [number, number, number] = [ex, 0, BZ];
  const shoulder = V(JX - 0.28, 2.3 - 0.3, BZ + 0.18);
  const ikR = armTo(eBase, 0.35, 1, ELIAS, shoulder, true, yOff);
  const up = smooth(860, 960, f);
  const jPose: Pose = {
    y: SIT, lean: 0.22 * (1 - up) + 0.02, head: [0.45 * (1 - up) - 0.05 * up, -0.25 * smooth(740, 800, f) * (1 - smooth(1100, 1160, f)), 0],
    expr: f < 760 ? "triste" : f < 1050 ? "choro" : f < 1180 ? "calma" : "ternura",
    mouth: f < 1050 ? "sad" : "smile",
    lLeg: sitLeg, rLeg: sitLeg, lArm: KNEE, rArm: KNEE,
  };
  const ePose: Pose = {
    ...ew, y: yOff, lean: 0.03 + 0.08 * sit + 0.1 * hand, head: [0.06 + 0.05 * sit, f < 260 ? 0 : 0.18 * (1 - sit), 0],
    expr: f < 200 ? "calma" : f < 780 ? "triste" : f < 1100 ? "ternura" : "calma", mouth: f > 1100 ? "smile" : "closed",
    lLeg: sit > 0.01 ? { h: 1.35 * sit, k: 1.45 * sit, o: 0 } : ew.lLeg, rLeg: sit > 0.01 ? { h: 1.35 * sit, k: 1.45 * sit, o: 0 } : ew.rLeg,
    lArm: sit > 0.01 ? mix(ew.lArm as any, KNEE, sit) : ew.lArm,
    rArm: mix(sit > 0.01 ? mix(ew.rArm as any, KNEE, sit) : (ew.rArm as any), ikR, hand),
  };
  const eYaw = f < 260 ? Math.PI / 2 - 0.1 : lerp(Math.PI / 2 - 0.1, 0.35, smooth(260, 360, f));

  const spr: Spr[] = [];
  const jc: [number, number, number] = [JX, 3.0 + SIT * 0.5, BZ];
  const chest: [number, number, number] = [ex + 0.28, 2.6 + yOff, BZ + 0.05];
  const luto = smooth(20, 90, f) * (1 - smooth(900, 1100, f));
  spr.push(...auraSprites("luto", jc, f, "j5", luto, 1.1));
  spr.push(...auraSprites("alivio", jc, f, "j6", smooth(950, 1100, f) * (1 - smooth(1300, 1420, f)) * 0.9, 1.0));
  spr.push(...threadSprites([JX - 0.1, 2.6, BZ], chest, AURA_COLOR.luto, f, smooth(400, 450, f) * (1 - smooth(720, 800, f)), "tj", 34));
  spr.push(...chestSprites(chest, f, [AURA_COLOR.luto], 0.7 * smooth(430, 560, f) * (1 - smooth(900, 1000, f))));
  spr.push(...threadSprites(chest, [JX - 0.1, 2.6, BZ], AURA_COLOR.alivio, f, smooth(950, 990, f) * (1 - smooth(1150, 1200, f)), "te", 28));
  spr.push(...auraSprites("carinho", [EX_SIT, 3.1 + SIT * 0.5, BZ], f, "e6", smooth(1100, 1200, f) * 0.5, 0.8));
  const px = fovPx(h, cam.fov);
  return (
    <>
      <CameraRig cam={cam} />
      <Street camX={cam.pos.x} range={Math.max(34, cam.pos.z * 1.2)} />
      <Bench position={[0, 0, BZ - 0.2]} w={5.4} />
      <Jorge position={[JX, 0, BZ]} rotation={[0, -0.25, 0]} pose={jPose} />
      <Elias position={[ex, 0, BZ]} rotation={[0, eYaw, 0]} pose={ePose} />
      <PixelPoints sprites={spr} px={px} k={Math.min(2.4, Math.max(1, cam.pos.z / 11))} />
    </>
  );
};

export const Cena5: React.FC = () => (
  <Shell
    sky="linear-gradient(180deg,#5B6BA8 0%,#C98FA0 40%,#F2B07A 100%)"
    total={TOTAL5}
    vc="50,30,50"
    overlay={(f) => {
      const bal = smooth(580, 596, f) * (1 - smooth(720, 735, f));
      const warm = smooth(900, 1300, f);
      return (
        <>
          <AbsoluteFill style={{ background: "rgba(90,70,140,0.25)", mixBlendMode: "multiply", opacity: 1 - warm * 0.6 }} />
          <AbsoluteFill style={{ background: "rgba(255,170,100,0.30)", mixBlendMode: "soft-light", opacity: 0.5 + 0.5 * warm }} />
          <Pictoballoon x={960} y={80} w={560} h={300} tail={[1010, 470]} t={bal} left={<PicWife />} right={<PicProud />} />
          {f > 800 && f < 880 ? <Onoma text="…" x={1100} y={200} size={100} rot={5} color="#8DA0B8" scale={smooth(800, 812, f)} /> : null}
          <Halftone opacity={0.04} size={10} color="70,40,50" />
        </>
      );
    }}
  >
    {(f, _w, h) => <Scene f={f} h={h} />}
  </Shell>
);

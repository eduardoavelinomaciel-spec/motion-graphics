import React from "react";
import * as THREE from "three";
import { CameraRig, Cam, V3 as v3 } from "./cam";
import { Street } from "../world/Street";
import { Balloon3D } from "../world/Props";
import { Elias, Bia, BIA, BIA_SCALE } from "../characters/cast";
import { Extra, walkPose } from "../characters/extras";
import { Pose } from "../characters/Human";
import { PixelPoints, Spr, auraSprites, burstSprites, threadSprites, chestSprites, AURA_COLOR } from "../fx/Pixels";
import { Pictoballoon } from "../fx/Pictoballoon";
import { PicHouse, PicHand } from "../fx/Pictos";
import { Onoma, Halftone } from "../fx/Hq";
import { armTo } from "../lib/arm";
import { kf, lerp, smooth, setMorning } from "./mundo";
import { Shell, fovPx } from "./kit";

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
export const TOTAL4 = 1500;
const BX = 0.4, BZ = 0.6;
const RELEASE = 170;
const mix = (a: any, b: any, k: number) => ({ f: lerp(a.f, b.f, k), o: lerp(a.o, b.o, k), e: lerp(a.e, b.e, k), t: 0 });
const FACE = { f: 1.5, o: -0.25, e: 2.3 };
const DOWN = { f: 0.05, o: 0.08, e: 0.2 };

const eliasX = (f: number) => (f < 280 ? lerp(-9.5, -1.7, smooth(0, 280, f) * 0.8 + (f / 280) * 0.2) : f < 960 ? -1.7 : lerp(-1.7, 14, smooth(960, 1500, f)));
const eliasZ = (f: number) => lerp(0.5, 1.9, smooth(960, 1020, f));
const crouchK = (f: number) => smooth(300, 350, f) * (1 - smooth(900, 950, f));
const walkAmp = (f: number) => (f < 250 ? 1 : f < 285 ? 1 - smooth(250, 285, f) : f > 950 ? smooth(950, 985, f) : 0);

const camAt = (f: number): Cam => {
  const z = kf(f, [[0, 13], [170, 11.5], [330, 8.6], [700, 8.6], [1000, 9.5], [1500, 15]]);
  const tx = kf(f, [[0, -2.5], [170, -0.5], [330, -0.4], [700, 0], [1100, 1.4], [1500, 5]]);
  const ty = kf(f, [[0, 2.2], [175, 2.3], [260, 3.6], [340, 2.2], [1500, 2.5]]);
  return { pos: v3(tx * 0.7 - 1, 3.1, z), target: v3(tx, ty, 0.3), fov: 32 };
};

const Scene: React.FC<{ f: number; h: number }> = ({ f, h }) => {
  setMorning();
  const cam = camAt(f);
  const ex = eliasX(f), ez = eliasZ(f), cr = crouchK(f);
  const ph = Math.min(f, 275) * 0.19 + (f > 950 ? (f - 950) * 0.19 : 0);
  const ew = walkPose(ph, walkAmp(f));

  /* Bia */
  const handY = 1.55;
  const hand = V(BX + 0.28, handY, BZ + 0.1);
  const biaCry = smooth(185, 215, f) * (1 - smooth(745, 780, f));
  const biaJoy = smooth(780, 810, f);
  const biaYaw = f < 200 ? 0.4 : f < 300 ? lerp(0.4, -1.1, smooth(200, 260, f)) : f < 800 ? -1.1 : lerp(-1.1, 0.3, smooth(800, 860, f));
  const reachT = V(BX + 0.4, 2.6, BZ + 0.1);
  // balão vermelho
  const t = Math.max(0, f - RELEASE);
  const redBase = V(BX + 0.4, handY + 1.55, BZ + 0.1);
  const redPos = f < RELEASE ? redBase.clone().add(V(0.04 * Math.sin(f * 0.07), 0.06 * Math.sin(f * 0.09), 0)) : redBase.clone().add(V(t * 0.026 + 0.5 * Math.sin(t * 0.04), t * 0.03 + t * t * 0.0006, 0.0));
  const redHand = f < RELEASE ? hand : redPos.clone().add(V(-0.15 * Math.sin(t * 0.1), -2.3, 0));
  // balão amarelo (desconhecido)
  const sx = f < 600 ? 9 : f < 735 ? lerp(9, 1.6, smooth(600, 735, f)) : 1.6;
  const handYel = f < 770 ? V(sx - 0.28, 1.55, 0.8) : hand.clone().add(V(0, 0, 0.1));
  const yelBase = f < 770 ? V(sx - 0.28, 3.3, 0.8) : V(BX + 0.35, handY + 1.55, BZ + 0.1);
  const yelPos = yelBase.clone().add(V(0.05 * Math.sin(f * 0.08), 0.07 * Math.sin(f * 0.1), 0));
  const takeK = smooth(750, 790, f);
  const ikHold = armTo([BX, 0, BZ], biaYaw, BIA_SCALE, BIA, hand, true, 0);
  const ikReach = armTo([BX, 0, BZ], biaYaw, BIA_SCALE, BIA, reachT, true, 0);
  const holdYel = takeK;
  const biaR = f < RELEASE ? ikHold : f < RELEASE + 40 ? mix(ikReach, DOWN, smooth(RELEASE + 10, RELEASE + 40, f)) : mix(DOWN, FACE, biaCry);
  const biaRFinal = holdYel > 0.01 ? mix(biaR, ikHold, holdYel) : biaR;
  const biaPose: Pose = {
    lean: 0.05 + 0.12 * biaCry - 0.06 * biaJoy,
    head: [0.15 * biaCry, 0, 0.0],
    expr: f < RELEASE ? "alegria" : f < RELEASE + 25 ? "susto" : f < 745 ? "choro" : f < 800 ? "curioso" : "alegria",
    mouth: f < RELEASE ? "smile" : f < 745 ? "sad" : f < 800 ? "o" : "grin",
    rArm: biaRFinal,
    lArm: mix(DOWN, FACE, biaCry * 0.95),
  };

  /* Elias */
  const chest: [number, number, number] = [ex + 0.28, 2.6 - 0.65 * cr, ez + 0.05];
  const ePose: Pose = {
    ...ew,
    y: -0.62 * cr,
    lean: 0.03 + 0.22 * cr,
    head: [0.1 * cr, f < 250 ? 0 : -0.2 * smooth(250, 300, f), 0],
    expr: f < 190 ? "calma" : f < 450 ? "triste" : f < 780 ? "ternura" : "alegria",
    mouth: f < 780 ? "closed" : "smile",
    lLeg: cr > 0.01 ? { h: 1.05 * cr, k: 2.1 * cr, o: 0 } : ew.lLeg,
    rLeg: cr > 0.01 ? { h: 0.55 * cr, k: 1.5 * cr, o: 0 } : ew.rLeg,
    lArm: cr > 0.01 ? { f: lerp(ew.lArm!.f ?? 0, 0.8, cr), o: 0.1, e: 1.3 * cr + 0.2, t: 0 } : ew.lArm,
    rArm: cr > 0.01 ? mix(ew.rArm!, { f: 0.9, o: -0.2, e: 1.8 }, cr) : ew.rArm,
  };
  const yaw = f < 250 ? Math.PI / 2 - 0.15 : f < 960 ? Math.PI / 2 - 0.35 : Math.PI / 2 - 0.1;

  /* desconhecido */
  const sPose: Pose = { ...walkPose(f * 0.17, f < 735 ? 0.9 * (1 - smooth(715, 735, f)) : 0), expr: "ternura", mouth: "smile", lArm: f > 700 && f < 800 ? { f: 1.3, o: 0.2, e: 0.5, t: 0 } : undefined };

  /* sprites */
  const spr: Spr[] = [];
  const bc: [number, number, number] = [BX, 2.7, BZ + 0.1];
  spr.push(...auraSprites("tristeza", bc, f, "b4", biaCry * 0.95, 0.9));
  spr.push(...auraSprites("alegria", bc, f, "b5", biaJoy * 0.95, 0.95));
  spr.push(...burstSprites([BX, 2.6, BZ + 0.5], f, 790, "#FFD23F", 28, 52));
  spr.push(...threadSprites([BX + 0.1, 2.4, BZ], chest, AURA_COLOR.tristeza, f, smooth(300, 340, f) * (1 - smooth(640, 700, f)), "t4", 30));
  spr.push(...threadSprites([BX + 0.1, 2.4, BZ], chest, AURA_COLOR.alegria, f, smooth(810, 850, f) * (1 - smooth(1000, 1060, f)), "t5", 30));
  spr.push(...chestSprites(chest, f, [AURA_COLOR.tristeza], 0.55 * smooth(330, 420, f) * (1 - smooth(780, 860, f))));
  spr.push(...auraSprites("alegria", [ex, 3.3, ez], f, "e4", smooth(860, 920, f) * (1 - smooth(1100, 1200, f)) * 0.7, 0.8));
  const px = fovPx(h, cam.fov);

  const BG_X = [-6, 3.5, 7, -3];
  return (
    <>
      <CameraRig cam={cam} />
      <Street camX={cam.pos.x} range={Math.max(34, cam.pos.z * 1.2)} />
      <Bia position={[BX, 0, BZ]} rotation={[0, biaYaw, 0]} pose={biaPose} />
      <Elias position={[ex, 0, ez]} rotation={[0, yaw, 0]} pose={ePose} />
      {f < 640 || f > 640 ? <Balloon3D position={redPos} color="#E5483B" hand={redHand} /> : null}
      {f > 590 ? <Balloon3D position={yelPos} color="#FFD23F" hand={handYel} r={0.8} /> : null}
      {f > 560 && f < 850 ? <Extra idx={9} position={[sx, 0, 0.8]} rotation={[0, -Math.PI / 2 + 0.3, 0]} pose={sPose} /> : null}
      {BG_X.map((x0, i) => {
        const dir = i % 2 ? -1 : 1;
        const x = x0 + dir * f * 0.012;
        if (Math.abs(x - cam.pos.x) > 24) return null;
        return <Extra key={i} idx={i + 1} position={[x, 0, [-2.2, -1.6, -2.4, -1.8][i]]} rotation={[0, dir > 0 ? Math.PI / 2 - 0.2 : -Math.PI / 2 + 0.2, 0]} pose={{ ...walkPose(f * 0.1 + i * 2, 0.8), expr: "neutro", mouth: "closed" }} />;
      })}
      <PixelPoints sprites={spr} px={px} k={Math.min(2.4, Math.max(1, cam.pos.z / 11))} />
    </>
  );
};

const SKY = "linear-gradient(180deg,#8FB8DD 0%,#BFD7EA 45%,#F6E3C6 100%)";
export const Cena4: React.FC = () => (
  <Shell
    sky={SKY}
    total={TOTAL4}
    overlay={(f) => {
      const bal = smooth(430, 446, f) * (1 - smooth(715, 730, f));
      return (
        <>
          <Pictoballoon x={1080} y={70} w={560} h={300} tail={[900, 470]} t={bal} left={<PicHouse />} right={<PicHand />} />
          {f > 175 && f < 260 ? <Onoma text="!" x={560} y={190} size={110} rot={-8} color="#E5483B" scale={smooth(175, 185, f)} /> : null}
          {f > 790 && f < 880 ? <Onoma text="✦" x={620} y={240} size={90} rot={6} color="#FFD23F" scale={smooth(790, 802, f)} /> : null}
          <Halftone opacity={0.04} size={10} color="90,60,40" />
        </>
      );
    }}
  >
    {(f, _w, h) => <Scene f={f} h={h} />}
  </Shell>
);

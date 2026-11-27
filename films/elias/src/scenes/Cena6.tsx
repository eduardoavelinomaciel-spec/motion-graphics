import React from "react";
import { AbsoluteFill, random } from "remotion";
import { CameraRig, Cam, V3 as v3 } from "./cam";
import { Street } from "../world/Street";
import { Bench } from "../world/Props";
import { Elias } from "../characters/cast";
import { Extra, walkPose } from "../characters/extras";
import { Pose } from "../characters/Human";
import { PixelPoints, Spr, auraSprites, threadSprites, chestSprites, AURA_COLOR, AuraKind } from "../fx/Pixels";
import { Halftone } from "../fx/Hq";
import { kf, smooth, setScene } from "./mundo";
import { Shell, fovPx } from "./kit";

export const TOTAL6 = 1200;
const SIT = -0.55;
const EX = 0, EZ = 0.5;
const KNEE = { f: 0.75, o: 0.05, e: 1.25, t: 0 };
const sitLeg = { h: 1.35, k: 1.45, o: 0 };
const KINDS: AuraKind[] = ["pressa", "tristeza", "medo", "alegria", "luto", "pressa", "tristeza", "medo"];
const PASS = KINDS.map((kind, i) => ({ kind, dir: i % 2 ? -1 : 1, t0: 40 + i * 118, z: [1.9, 1.5, 2.0, 1.6][i % 4], idx: i + 2, v: 0.085 + random(`pv6${i}`) * 0.02 }));
const passX = (p: (typeof PASS)[0], f: number) => (p.dir > 0 ? -12 : 12) + p.dir * (f - p.t0) * p.v;

const camAt = (f: number): Cam => {
  const z = kf(f, [[0, 10], [200, 9.2], [800, 9.2], [1180, 24]]);
  const ty = kf(f, [[0, 2.2], [800, 2.2], [1180, 3.2]]);
  return { pos: v3(-0.4, 3.2 + (z - 9) * 0.12, z), target: v3(0, ty, 0.4), fov: 32 };
};

const Scene: React.FC<{ f: number; h: number }> = ({ f, h }) => {
  setScene("#202850", 0.012, [0.25, 0.5, 0.8]);
  const cam = camAt(f);
  const breath = Math.sin(f * 0.05) * 0.01;
  const ePose: Pose = {
    y: SIT, lean: 0.2 + 0.1 * smooth(300, 900, f) + breath, head: [0.4 + 0.15 * smooth(300, 900, f), 0, 0],
    expr: f < 700 ? "triste" : "sonolento", mouth: "closed",
    lLeg: sitLeg, rLeg: sitLeg, lArm: KNEE, rArm: KNEE,
  };
  const chest: [number, number, number] = [EX + 0.28, 2.6 + SIT, EZ + 0.05];
  const spr: Spr[] = [];
  const cols: string[] = [];
  const spr2: Spr[] = [];
  let load = 0;
  PASS.forEach((p, i) => {
    const x = passX(p, f);
    const near = Math.max(0, 1 - Math.abs(x - EX) / 3.2) * (f > p.t0 ? 1 : 0);
    if (f > p.t0 + 60) { cols.push(AURA_COLOR[p.kind]); load += 0.12; }
    spr2.push(...auraSprites(p.kind, [x, 3.0, p.z], f, `p6${i}`, 0.8, 0.8));
    spr.push(...threadSprites([x, 2.5, p.z], chest, AURA_COLOR[p.kind], f, near > 0.15 ? near : 0, `th6${i}`, 22));
  });
  const over = smooth(850, 1100, f);
  const amt = Math.min(1, 0.08 + load + over * 0.9);
  spr.push(...chestSprites(chest, f, cols.length ? cols : [AURA_COLOR.tristeza], amt, 46));
  if (over > 0.05) spr.push(...chestSprites([chest[0], chest[1] + 0.2, chest[2]], f + 20, cols, over, 46));
  spr.push(...auraSprites("tristeza", [EX, 2.6, EZ], f, "e66", smooth(500, 800, f) * 0.6, 1.0));
  const px = fovPx(h, cam.fov);
  return (
    <>
      <CameraRig cam={cam} />
      <Street camX={cam.pos.x} range={Math.max(34, cam.pos.z * 1.2)} />
      <Bench position={[EX, 0, EZ - 0.2]} w={5.4} />
      <Elias position={[EX, 0, EZ]} rotation={[0, 0.1, 0]} pose={ePose} />
      {PASS.map((p) => {
        const x = passX(p, f);
        if (Math.abs(x) > 14) return null;
        return <Extra key={p.idx} idx={p.idx} position={[x, 0, p.z]} rotation={[0, p.dir > 0 ? Math.PI / 2 : -Math.PI / 2, 0]} pose={{ ...walkPose(f * 0.19 + p.idx, 1), expr: "neutro", mouth: "closed", head: [0, 0, 0] }} />;
      })}
      <PixelPoints sprites={[...spr2, ...spr]} px={px} k={Math.min(3.2, Math.max(1, cam.pos.z / 11))} />
    </>
  );
};

const STARS = Array.from({ length: 60 }).map((_, i) => ({ x: random(`sx${i}`) * 1920, y: random(`sy${i}`) * 420, s: 2 + Math.floor(random(`ss${i}`) * 3) * 2 }));
export const Cena6: React.FC = () => (
  <Shell
    sky="linear-gradient(180deg,#0E1230 0%,#262E63 55%,#4A4A86 100%)"
    total={TOTAL6}
    vc="10,10,30"
    vignette={0.45}
    overlay={(f) => (
      <>
        <AbsoluteFill style={{ background: "rgba(20,30,90,0.40)", mixBlendMode: "multiply" }} />
        <AbsoluteFill style={{ background: "rgba(255,200,120,0.10)", mixBlendMode: "soft-light" }} />
        {STARS.map((s, i) => (
          <div key={i} style={{ position: "absolute", left: Math.round(s.x / 6) * 6, top: Math.round(s.y / 6) * 6, width: s.s, height: s.s, background: "#FFF6D8", opacity: 0.35 + 0.35 * Math.sin(f * 0.05 + i) * Math.sin(f * 0.05 + i) }} />
        ))}
        <Halftone opacity={0.035} size={10} color="20,20,60" />
      </>
    )}
  >
    {(f, _w, h) => <Scene f={f} h={h} />}
  </Shell>
);

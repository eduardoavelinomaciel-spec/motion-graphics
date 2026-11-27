import React, { useMemo } from "react";
import { AbsoluteFill, random } from "remotion";
import { CameraRig, Cam, V3 as v3 } from "./cam";
import { Toon } from "../lib/Toon";
import { roundBox } from "../lib/body";
import { makeOutline, makeToon } from "../lib/materials";
import { Elias } from "../characters/cast";
import { walkPose } from "../characters/extras";
import { Pose } from "../characters/Human";
import { PixelPoints, Spr, auraSprites } from "../fx/Pixels";
import { PixelText } from "../fx/PixelText";
import { Halftone } from "../fx/Hq";
import { kf, lerp, smooth, setScene } from "./mundo";
import { Shell, fovPx } from "./kit";

export const TOTAL8 = 750;
const T = (c: string) => makeToon({ color: c, shadowK: 1, shadowTint: "#4a4f9a", rim: 0.1, rimColor: "#8f9be0", spec: 0.05 });

const CITY = Array.from({ length: 34 }).map((_, i) => ({ x: -48 + random(`cx${i}`) * 96, z: -28 - random(`cz${i}`) * 32, w: 2 + random(`cw${i}`) * 3.5, h: 3 + random(`ch${i}`) * 7 }));
const LIGHTS = Array.from({ length: 360 }).map((_, i) => {
  const b = CITY[i % CITY.length];
  return { x: b.x + (random(`lx${i}`) - 0.5) * b.w * 0.9, y: -9 + random(`ly${i}`) * b.h * 0.9, z: b.z + b.w * 0.5 + 0.1, c: ["#FFD23F", "#FFE9B0", "#F7B2AD", "#9FE3D6", "#FFFFFF"][i % 5], ph: random(`lp${i}`) * 6.28 };
});

const Hill: React.FC = () => {
  const g = useMemo(() => ({ ground: roundBox(40, 2, 14, 0.2, 0.1), b: CITY.map((c) => roundBox(c.w, c.h, c.w, 0.1, 0.05)) }), []);
  const m = useMemo(() => ({ grass: T("#2d3b6e"), city: T("#1d2250"), ol: makeOutline(0.05) }), []);
  return (
    <group>
      <Toon geometry={g.ground} material={m.grass} outline={m.ol} position={[0, -1, -0.5]} />
      {CITY.map((c, i) => <Toon key={i} geometry={g.b[i]} material={m.city} position={[c.x, -9 + c.h / 2, c.z]} />)}
    </group>
  );
};

const camAt = (f: number): Cam => {
  const z = kf(f, [[0, 8], [100, 8], [560, 24]]);
  const y = kf(f, [[0, 3.2], [560, 7]]);
  return { pos: v3(0, y, z), target: v3(0, kf(f, [[0, 1.2], [560, -2.5]]), -4), fov: 32 };
};

const Scene: React.FC<{ f: number; h: number }> = ({ f, h }) => {
  setScene("#202850", 0.004, [-0.3, 0.5, -0.6]);
  const cam = camAt(f);
  const wk = f < 110 ? 1 - smooth(90, 110, f) : 0;
  const ex = lerp(-5, 0, smooth(0, 110, f));
  const ew = walkPose(f * 0.19, wk);
  const ePose: Pose = { ...ew, lean: 0.02, head: [-0.05, 0, 0], expr: f < 200 ? "calma" : "ternura", mouth: f > 330 ? "smile" : "closed" };
  const spr: Spr[] = [];
  LIGHTS.forEach((l) => spr.push({ p: [l.x, l.y, l.z], c: l.c, s: 0.32, shape: 0, a: (0.55 + 0.45 * Math.sin(f * 0.04 + l.ph)) * smooth(0, 40, f) }));
  spr.push(...auraSprites("alegria", [ex, 2.6, 0.3], f, "a8", smooth(120, 330, f) * 0.95, 1.4));
  spr.push(...auraSprites("carinho", [ex, 2.6, 0.3], f, "a9", smooth(200, 400, f) * 0.6, 1.2));
  const px = fovPx(h, cam.fov);
  return (
    <>
      <CameraRig cam={cam} />
      <Hill />
      <Elias position={[ex, 0, 0]} rotation={[0, Math.PI - 0.15 * smooth(110, 200, f), 0]} pose={ePose} />
      <PixelPoints sprites={spr} px={px} k={Math.min(3.4, Math.max(1, cam.pos.z / 9))} />
    </>
  );
};

export const Cena8: React.FC = () => (
  <Shell
    sky="linear-gradient(180deg,#0E1230 0%,#262E63 55%,#6A5C9A 100%)"
    total={TOTAL8}
    vc="10,10,30"
    vignette={0.4}
    overlay={(f) => {
      const card = smooth(520, 580, f);
      return (
        <>
          <AbsoluteFill style={{ background: "rgba(10,12,40,0.85)", opacity: card }} />
          <PixelText id="final" f={f} start={560} lines={[{ text: "QUEM CUIDA DE QUEM", size: 190, y: 0.38 }, { text: "CUIDA DE TODO MUNDO?", size: 190, y: 0.62 }]} />
          <Halftone opacity={0.035} size={10} color="20,20,60" />
        </>
      );
    }}
  >
    {(f, _w, h) => <Scene f={f} h={h} />}
  </Shell>
);

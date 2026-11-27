import { random } from "remotion";
import * as THREE from "three";
import { sceneUniforms } from "../lib/materials";
import { C } from "../lib/palette";
import { AuraKind } from "../fx/Pixels";

export const smooth = (a: number, b: number, t: number) => {
  const x = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const kf = (f: number, k: [number, number][]) => {
  if (f <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++)
    if (f <= k[i][0]) return lerp(k[i - 1][1], k[i][1], smooth(k[i - 1][0], k[i][0], f));
  return k[k.length - 1][1];
};

export const setMorning = () => {
  sceneUniforms.uSilhouette.value = 0;
  sceneUniforms.uLightDir.value.set(-0.3, 0.6, 0.8);
  sceneUniforms.uFogColor.value = new THREE.Color(C.morning);
  sceneUniforms.uFogDensity.value = 0.011;
};

/* -------- Elias: tabela de posição/fase (determinística, calculada uma vez) */
export const STOPS: [number, number][] = [[150, 345], [570, 665], [752, 850], [1000, 5000]];
export const walkFactor = (f: number) => {
  let w = 1;
  for (const [a, b] of STOPS) w *= 1 - smooth(a - 14, a + 6, f) * (1 - smooth(b - 6, b + 16, f));
  return w;
};
export const sense = (f: number) => {
  let s = 0;
  for (const [a, b] of STOPS) s = Math.max(s, smooth(a - 10, a + 8, f) * (1 - smooth(b - 6, b + 14, f)));
  return s;
};
const N = 1400;
const raw: number[] = [0];
for (let f = 1; f <= N; f++) raw[f] = raw[f - 1] + walkFactor(f);
let at150 = raw[150];
const SCALE = 8.4 / at150;
export const EX = raw.map((r) => r * SCALE);
export const PHASE = (() => {
  const p = [0];
  for (let f = 1; f <= N; f++) p[f] = p[f - 1] + walkFactor(f) * 0.19;
  return p;
})();
export const exAt = (f: number) => EX[Math.max(0, Math.min(N, Math.round(f)))];
export const phAt = (f: number) => PHASE[Math.max(0, Math.min(N, Math.round(f)))];

export const RITA_X = 9.9;
export const ELIAS_Y_CHEST = 2.62;

export const KINDS: AuraKind[] = ["tristeza", "pressa", "alegria", "medo", "luto", "alivio", "carinho"];
export const rnd = (s: string) => random(s);

export type Ped = { x0: number; z: number; dir: number; v: number; idx: number; kind: AuraKind };
export const PEDS: Ped[] = Array.from({ length: 16 }).map((_, i) => {
  const dir = i % 3 === 1 ? -1 : 1;
  const v = 0.005 + random(`pv${i}`) * 0.005;
  const target = (i < 8 ? 15.5 + i * 1.7 : 38.5 + (i - 8) * 1.6) + random(`px${i}`) * 0.6; // posição no plano geral (f≈1100)
  return { x0: target - dir * v * 1100, z: [-2.4, -1.7, 1.9, -2.1, -1.4][i % 5], dir, v, idx: i, kind: KINDS[(i * 3 + 1) % KINDS.length] };
});
export const pedX = (p: Ped, f: number) => p.x0 + p.dir * p.v * f;

export const setScene = (fog: string, density: number, light: [number, number, number]) => {
  sceneUniforms.uSilhouette.value = 0;
  sceneUniforms.uLightDir.value.set(light[0], light[1], light[2]);
  sceneUniforms.uFogColor.value = new THREE.Color(fog);
  sceneUniforms.uFogDensity.value = density;
};

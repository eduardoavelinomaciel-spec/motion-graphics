import * as THREE from "three";
import {
  EYE_FRAG,
  EYE_VERT,
  OUTLINE_FRAG,
  OUTLINE_VERT,
  TOON_FRAG,
  TOON_VERT,
} from "./glsl";

export const PATTERN = { none: 0, shell: 1, chroma: 2, scales: 3 } as const;

export type ToonOpts = {
  color: string;
  tip?: string;
  tipAxis?: [number, number, number];
  tipStart?: number;
  tipSoft?: number;
  shadowTint?: string;
  rimColor?: string;
  rim?: number;
  spec?: number;
  pattern?: number;
  patternColor?: string;
  patternScale?: number;
  patternAmt?: number;
  transparent?: boolean;
  side?: THREE.Side;
};

// Scene-wide look: light direction, fog, silhouette test. Shared by every material.
export const sceneUniforms = {
  uLightDir: { value: new THREE.Vector3(0.35, 1.0, 0.55) },
  uFogColor: { value: new THREE.Color("#0E6E8C") },
  uFogDensity: { value: 0 },
  uSilhouette: { value: 0 },
  uTime: { value: 0 },
  uCaustic: { value: 0 },
};

const waveUniforms = () => ({
  uWaveAmp: { value: 0 },
  uWavePhase: { value: 0 },
  uWaveFreq: { value: 4 },
  uWaveStart: { value: 0 },
});

export type WaveUniforms = ReturnType<typeof waveUniforms>;

export const makeToon = (o: ToonOpts, wave?: WaveUniforms) =>
  new THREE.ShaderMaterial({
    vertexShader: TOON_VERT,
    fragmentShader: TOON_FRAG,
    transparent: o.transparent ?? false,
    side: o.side ?? THREE.FrontSide,
    uniforms: {
      ...sceneUniforms,
      ...(wave ?? waveUniforms()),
      uColor: { value: new THREE.Color(o.color) },
      uTip: { value: new THREE.Color(o.tip ?? o.color) },
      uTipAxis: { value: new THREE.Vector3(...(o.tipAxis ?? [1, 0, 0])) },
      uTipStart: { value: o.tipStart ?? 99 },
      uTipSoft: { value: o.tipSoft ?? 0.01 },
      uShadowTint: { value: new THREE.Color(o.shadowTint ?? "#7d8fd6") },
      uRimColor: { value: new THREE.Color(o.rimColor ?? "#d8fbff") },
      uRim: { value: o.rim ?? 0.35 },
      uSpec: { value: o.spec ?? 0.0 },
      uPattern: { value: o.pattern ?? 0 },
      uPatternColor: { value: new THREE.Color(o.patternColor ?? "#000000") },
      uPatternScale: { value: o.patternScale ?? 4 },
      uPatternAmt: { value: o.patternAmt ?? 1 },
      uOpacity: { value: 1 },
    },
  });

export const makeOutline = (thick: number, wave?: WaveUniforms, color = "#10141f") =>
  new THREE.ShaderMaterial({
    vertexShader: OUTLINE_VERT,
    fragmentShader: OUTLINE_FRAG,
    side: THREE.BackSide,
    uniforms: {
      ...sceneUniforms,
      ...(wave ?? waveUniforms()),
      uThick: { value: thick },
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: 1 },
    },
  });

export const makeWave = waveUniforms;

export type EyeExpr = {
  look: [number, number];
  irisScale: number;
  pupil: number;
  lidTop: number;
  lidBot: number;
  tilt: number;
  mode: number;
  shine: number;
};

// Guide §4: neutro, curioso, triste, choro, alegria, susto, ternura (+ estrela, from scene 1).
export const EXPR: Record<string, EyeExpr> = {
  neutro: { look: [0.05, 0], irisScale: 1, pupil: 0.42, lidTop: 0.08, lidBot: 0, tilt: 0, mode: 0, shine: 0 },
  curioso: { look: [0.12, 0.14], irisScale: 1.04, pupil: 0.5, lidTop: 0, lidBot: 0, tilt: 0, mode: 0, shine: 0.3 },
  triste: { look: [0, -0.12], irisScale: 1, pupil: 0.4, lidTop: 0.34, lidBot: 0.05, tilt: 0.35, mode: 0, shine: 0.6 },
  choro: { look: [0, -0.08], irisScale: 1, pupil: 0.36, lidTop: 0.3, lidBot: 0.14, tilt: 0.4, mode: 0, shine: 1 },
  alegria: { look: [0, 0], irisScale: 1, pupil: 0.4, lidTop: 0, lidBot: 0, tilt: 0, mode: 2, shine: 0 },
  susto: { look: [0, 0.02], irisScale: 0.46, pupil: 0.45, lidTop: 0, lidBot: 0, tilt: 0, mode: 0, shine: 0 },
  ternura: { look: [0.04, -0.02], irisScale: 1, pupil: 0.44, lidTop: 0.14, lidBot: 0.3, tilt: 0, mode: 0, shine: 0.4 },
  estrela: { look: [0.1, 0.06], irisScale: 1.05, pupil: 0, lidTop: 0, lidBot: 0, tilt: 0, mode: 1, shine: 0.5 },
  calma: { look: [0.05, -0.04], irisScale: 0.95, pupil: 0.45, lidTop: 0.16, lidBot: 0.2, tilt: 0, mode: 0, shine: 0 },
  sonolento: { look: [0.04, -0.06], irisScale: 0.9, pupil: 0.45, lidTop: 0.4, lidBot: 0.12, tilt: 0, mode: 0, shine: 0 },
  fechado: { look: [0, 0], irisScale: 1, pupil: 0.4, lidTop: 1, lidBot: 0, tilt: 0, mode: 0, shine: 0 },
};

export type EyeOpts = {
  iris: string;
  irisDark: string;
  skin: string;
  side: 1 | -1;
  wrinkle?: number;
  lash?: number;
};

export const makeEye = (o: EyeOpts) =>
  new THREE.ShaderMaterial({
    vertexShader: EYE_VERT,
    fragmentShader: EYE_FRAG,
    uniforms: {
      ...sceneUniforms,
      ...waveUniforms(),
      uIris: { value: new THREE.Color(o.iris) },
      uIrisDark: { value: new THREE.Color(o.irisDark) },
      uSkin: { value: new THREE.Color(o.skin) },
      uLine: { value: new THREE.Color("#10141f") },
      uLook: { value: new THREE.Vector2(0, 0) },
      uIrisScale: { value: 1 },
      uPupil: { value: 0.4 },
      uLidTop: { value: 0 },
      uLidBot: { value: 0 },
      uTilt: { value: 0 },
      uSide: { value: o.side },
      uMode: { value: 0 },
      uShine: { value: 0 },
      uWrinkle: { value: o.wrinkle ?? 0 },
      uLash: { value: o.lash ?? 0 },
    },
  });

export const applyExpr = (m: THREE.ShaderMaterial, e: EyeExpr) => {
  const u = m.uniforms;
  u.uLook.value.set(e.look[0], e.look[1]);
  u.uIrisScale.value = e.irisScale;
  u.uPupil.value = e.pupil;
  u.uLidTop.value = e.lidTop;
  u.uLidBot.value = e.lidBot;
  u.uTilt.value = e.tilt;
  u.uMode.value = e.mode;
  u.uShine.value = e.shine;
};

// Blend two expressions (for frame-driven transitions).
export const mixExpr = (a: EyeExpr, b: EyeExpr, t: number): EyeExpr => {
  const l = (x: number, y: number) => x + (y - x) * t;
  return {
    look: [l(a.look[0], b.look[0]), l(a.look[1], b.look[1])],
    irisScale: l(a.irisScale, b.irisScale),
    pupil: l(a.pupil, b.pupil),
    lidTop: l(a.lidTop, b.lidTop),
    lidBot: l(a.lidBot, b.lidBot),
    tilt: l(a.tilt, b.tilt),
    mode: t < 0.5 ? a.mode : b.mode,
    shine: l(a.shine, b.shine),
  };
};

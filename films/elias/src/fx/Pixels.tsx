import React, { useMemo } from "react";
import * as THREE from "three";
import { random } from "remotion";
import { C } from "../lib/palette";

// Auras em pixel art (PIXEL, guia §2): sprites quadrados 7×7 células, tamanho em múltiplos de 7 px,
// fade por pontilhado Bayer. Tudo é função pura do frame.

export type AuraKind = "tristeza" | "pressa" | "alegria" | "medo" | "luto" | "alivio" | "carinho";
export const AURA_COLOR: Record<AuraKind, string> = {
  tristeza: C.tristeza, pressa: C.pressa, alegria: C.alegria, medo: C.medo, luto: C.luto, alivio: C.alivio, carinho: C.carinho,
};
export type V3 = [number, number, number];
export type Spr = { p: V3; c: string; s: number; shape: number; a: number };

const lighten = (hex: string, t: number) => "#" + new THREE.Color(hex).lerp(new THREE.Color("#ffffff"), t).getHexString();
const fract = (x: number) => x - Math.floor(x);
const R = (seed: string, i: number, k = "") => random(`${seed}-${i}-${k}`);

export const auraSprites = (kind: AuraKind, c: V3, f: number, seed: string, amt: number, big = 1): Spr[] => {
  if (amt <= 0.01) return [];
  const out: Spr[] = [];
  const col = AURA_COLOR[kind];
  const [cx, cy, cz] = c;
  const step = Math.floor(f / 2.5);
  const N = 34;
  for (let i = 0; i < N; i++) {
    const h1 = R(seed, i, "a"), h2 = R(seed, i, "b"), h3 = R(seed, i, "c");
    if (kind === "tristeza") {
      const u = fract(f * 0.0055 + h1);
      out.push({ p: [cx + (h2 - 0.5) * 2.3 * big, cy + 1.5 * big - u * 3.6 * big, cz + (h3 - 0.5) * 1.2], c: i % 5 === 0 ? lighten(col, 0.35) : col, s: 0.2 * big, shape: 1, a: amt * Math.pow(Math.sin(Math.PI * u), 0.6) });
    } else if (kind === "pressa") {
      const th = h1 * 6.283 + f * 0.07;
      const r = (0.6 + 0.9 * h2) * big;
      const jx = (R(seed, i, "jx" + step) - 0.5) * 0.55;
      const jy = (R(seed, i, "jy" + step) - 0.5) * 0.55;
      out.push({ p: [cx + Math.cos(th) * r + jx, cy + 0.2 + (h3 - 0.35) * 1.9 * big + jy, cz + Math.sin(th) * r * 0.5], c: i % 4 === 0 ? lighten(col, 0.4) : col, s: 0.17 * big, shape: 2, a: amt });
    } else if (kind === "alegria") {
      const u = fract(f * 0.009 + h1);
      const tw = 0.75 + 0.35 * Math.sin(f * 0.25 + i);
      out.push({ p: [cx + (h2 - 0.5) * 2.1 * big + Math.sin(u * 14 + h3 * 6) * 0.28 * big, cy - 0.4 * big + u * 3.0 * big, cz + (h3 - 0.5) * 1.0], c: i % 3 === 0 ? lighten(col, 0.5) : col, s: 0.22 * big * tw, shape: 3, a: amt * Math.pow(Math.sin(Math.PI * u), 0.5) });
    } else if (kind === "medo") {
      const pulse = 0.5 + 0.5 * Math.sin(f * 0.13 + h3 * 3);
      const th = h1 * 6.283, ph = Math.acos(2 * h2 - 1);
      const r = (1.7 - 1.0 * pulse) * (0.55 + 0.6 * h3) * big;
      out.push({ p: [cx + r * Math.sin(ph) * Math.cos(th), cy + 0.3 + r * Math.cos(ph) * 1.1, cz + r * Math.sin(ph) * Math.sin(th) * 0.6], c: i % 4 === 0 ? lighten(col, 0.3) : col, s: (0.12 + 0.06 * (1 - pulse)) * big, shape: 0, a: amt });
    } else if (kind === "luto") {
      if (i < 9) {
        const gx = (i % 3) - 1, gy = Math.floor(i / 3) - 1;
        const sway = Math.sin(f * 0.02) * 0.04;
        out.push({ p: [cx + gx * 0.36 * big + sway, cy - 0.35 * big - gy * 0.36 * big, cz + 0.1], c: i % 2 ? col : "#4b5468", s: 0.3 * big, shape: 0, a: amt });
      } else if (i < 16) {
        const u = fract(f * 0.0016 + h1);
        out.push({ p: [cx + (h2 - 0.5) * 1.2 * big, cy - 0.9 * big - u * 1.6 * big, cz + 0.1], c: col, s: 0.12 * big, shape: 0, a: amt * Math.sin(Math.PI * u) });
      }
    } else if (kind === "alivio") {
      const ring = i % 3;
      const u = fract(f * 0.0065 + ring / 3);
      const an = (Math.floor(i / 3) / 11) * 6.283;
      const rr = (0.3 + u * 2.0) * big;
      out.push({ p: [cx + Math.cos(an) * rr, cy + 0.3 + Math.sin(an) * rr * 0.9, cz + 0.1], c: col, s: 0.2 * big, shape: 5, a: amt * (1 - u) });
    } else {
      const u = fract(f * 0.005 + h1);
      out.push({ p: [cx + (h2 - 0.5) * 2.2 * big + Math.sin(u * 9 + h3 * 5) * 0.4, cy - 0.5 + u * 2.4 * big, cz + (h3 - 0.5) * 1.0], c: i % 2 ? col : "#F2C879", s: 0.2 * big, shape: 4, a: amt * Math.sin(Math.PI * u) });
    }
  }
  return out;
};

// explosão de estrelinhas (alegria) a partir de um ponto
export const burstSprites = (c: V3, f: number, f0: number, color: string, n = 26, life = 46): Spr[] => {
  const t = f - f0;
  if (t < 0 || t > life) return [];
  const out: Spr[] = [];
  for (let i = 0; i < n; i++) {
    const an = R("burst", i) * 6.283, sp = 0.6 + R("burst", i, "s") * 1.2, up = 0.4 + R("burst", i, "u");
    const k = 1 - Math.pow(1 - t / life, 2);
    out.push({ p: [c[0] + Math.cos(an) * sp * k * 2.4, c[1] + up * k * 2.4 + 0.4 * k, c[2] + Math.sin(an) * sp * k * 0.9], c: i % 3 === 0 ? lighten(color, 0.5) : color, s: 0.22 * (1 - 0.4 * t / life), shape: 3, a: 1 - Math.pow(t / life, 2) });
  }
  return out;
};

// fio de pixels da aura até o peito de Elias
export const threadSprites = (from: V3, to: V3, color: string, f: number, amt: number, seed = "th", count = 30): Spr[] => {
  if (amt <= 0.01) return [];
  const out: Spr[] = [];
  const mid: V3 = [(from[0] + to[0]) / 2, Math.max(from[1], to[1]) + 0.9 + 0.12 * Math.hypot(to[0] - from[0], to[2] - from[2]), (from[2] + to[2]) / 2 + 0.5];
  for (let i = 0; i < count; i++) {
    const u = fract(f * 0.011 + i / count);
    const a = (1 - u) * (1 - u), b = 2 * (1 - u) * u, c = u * u;
    out.push({
      p: [a * from[0] + b * mid[0] + c * to[0], a * from[1] + b * mid[1] + c * to[1] + Math.sin(u * 9 + i) * 0.05, a * from[2] + b * mid[2] + c * to[2]],
      c: i % 4 === 0 ? lighten(color, 0.45) : color,
      s: 0.1 + 0.03 * Math.sin(i * 2.3),
      shape: 0,
      a: amt * Math.min(1, u * 6) * Math.min(1, (1 - u) * 6 + 0.35),
    });
  }
  return out;
};

// pixels acumulados no peito de Elias
export const chestSprites = (c: V3, f: number, colors: string[], amt: number, n = 46): Spr[] => {
  if (amt <= 0.01 || colors.length === 0) return [];
  const out: Spr[] = [];
  for (let i = 0; i < n; i++) {
    const h = R("chest", i);
    if (h > amt) continue;
    const th = R("chest", i, "t") * 6.283 + f * (0.006 + 0.01 * R("chest", i, "w"));
    const ph = Math.acos(2 * R("chest", i, "p") - 1);
    const r = (0.22 + 0.34 * R("chest", i, "r")) * (0.7 + 0.3 * amt);
    out.push({ p: [c[0] + r * Math.sin(ph) * Math.cos(th), c[1] + r * Math.cos(ph) * 0.95, c[2] + 0.12 + Math.abs(r * Math.sin(ph) * Math.sin(th)) * 0.6], c: colors[i % colors.length], s: 0.085, shape: 0, a: 1 });
  }
  return out;
};

const VERT = /* glsl */ `
attribute float aSize; attribute float aShape; attribute float aAlpha; attribute vec3 aCol;
uniform float uPx; uniform float uK;
varying float vShape; varying float vA; varying vec3 vCol;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float d = max(0.1, -mv.z);
  float px = aSize * uK * uPx / d;
  gl_PointSize = 7.0 * max(1.0, floor(px / 7.0 + 0.5));
  gl_Position = projectionMatrix * mv;
  vShape = aShape; vA = aAlpha; vCol = aCol;
}`;
const FRAG = /* glsl */ `
varying float vShape; varying float vA; varying vec3 vCol;
float bayer(vec2 p) {
  vec2 q = mod(floor(p), 4.0);
  float i = q.x + q.y * 4.0;
  float m[16] = float[16](0.,8.,2.,10., 12.,4.,14.,6., 3.,11.,1.,9., 15.,7.,13.,5.);
  return (m[int(i)] + 0.5) / 16.0;
}
void main() {
  vec2 cc = floor(gl_PointCoord * 7.0);
  float x = cc.x, y = cc.y;
  int s = int(vShape + 0.5);
  float m = 0.0;
  if (s == 0) m = 1.0;
  else if (s == 1) { float w = y < 2.0 ? 0.0 : (y < 4.0 ? 1.0 : (y < 6.0 ? 2.0 : 1.0)); m = step(abs(x - 3.0), w); }
  else if (s == 2) {
    float st[7] = float[7](4.,3.,2.,3.,2.,1.,1.); float en[7] = float[7](5.,4.,4.,4.,3.,2.,1.);
    int r = int(y); m = step(st[r] - 0.1, x) * step(x, en[r] + 0.1);
  }
  else if (s == 3) { float dx = abs(x - 3.0), dy = abs(y - 3.0); m = (dx < 0.5 || dy < 0.5 || (dx < 1.5 && dy < 1.5 && dx + dy < 2.5)) ? 1.0 : 0.0; }
  else if (s == 4) { m = (abs(x - 3.0) / 2.6 + abs(y - 3.0) / 3.2 <= 1.0) ? 1.0 : 0.0; }
  else { float yy[7] = float[7](4.,3.,2.,2.,2.,3.,4.); float t = yy[int(x)]; m = (abs(y - t) < 0.6 || abs(y - t - 1.0) < 0.6) ? 1.0 : 0.0; }
  if (m < 0.5) discard;
  if (vA < bayer(gl_FragCoord.xy)) discard;
  vec3 col = vCol;
  if (s != 5 && x > 1.5 && x < 4.5 && y > 1.5 && y < 4.5) col = min(vec3(1.0), col * 1.14 + 0.04);
  else col *= 0.9;
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;

export const PixelPoints: React.FC<{ sprites: Spr[]; px: number; k?: number }> = ({ sprites, px, k = 1 }) => {
  const mat = useMemo(() => new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms: { uPx: { value: 1 }, uK: { value: 1 } }, transparent: false }), []);
  mat.uniforms.uPx.value = px;
  mat.uniforms.uK.value = k;
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = sprites.length;
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), sz = new Float32Array(n), sh = new Float32Array(n), al = new Float32Array(n);
    const cc = new THREE.Color();
    sprites.forEach((s, i) => {
      pos.set(s.p, i * 3);
      cc.set(s.c);
      col.set([cc.r, cc.g, cc.b], i * 3);
      sz[i] = s.s; sh[i] = s.shape; al[i] = s.a;
    });
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aCol", new THREE.BufferAttribute(col, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(sz, 1));
    g.setAttribute("aShape", new THREE.BufferAttribute(sh, 1));
    g.setAttribute("aAlpha", new THREE.BufferAttribute(al, 1));
    return g;
  }, [sprites]);
  return <points geometry={geo} material={mat} frustumCulled={false} />;
};

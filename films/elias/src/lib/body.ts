import * as THREE from "three";
import { smooth } from "./geom";

// Corpo varrido ao longo de -y (topo na origem, desce até -len). Seção elíptica rx × rz.
export const sweepY = (
  len: number,
  rx: (t: number) => number,
  rz: (t: number) => number,
  segs = 40,
  rings = 28,
  zOff: (t: number) => number = () => 0,
) => {
  const pos: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    for (let j = 0; j <= rings; j++) {
      const a = (j / rings) * Math.PI * 2;
      pos.push(rx(t) * Math.sin(a), -t * len, zOff(t) + rz(t) * Math.cos(a));
    }
  }
  const w = rings + 1;
  for (let i = 0; i < segs; i++)
    for (let j = 0; j < rings; j++) {
      const a = i * w + j;
      const b = a + w;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  return smooth(g);
};

// Perfil por chaves [t, valor] com interpolação cosseno.
export const prof = (keys: [number, number][]) => (t: number) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, v0] = keys[i - 1];
      const [t1, v1] = keys[i];
      const u = (t - t0) / (t1 - t0);
      const s = (1 - Math.cos(u * Math.PI)) / 2;
      return v0 + (v1 - v0) * s;
    }
  }
  return keys[keys.length - 1][1];
};

const cap = (t: number, c0: number, c1: number) => {
  if (c0 > 0 && t < c0) return Math.sqrt(Math.max(0, 1 - Math.pow(1 - t / c0, 2)));
  if (c1 > 0 && t > 1 - c1) return Math.sqrt(Math.max(0, 1 - Math.pow(1 - (1 - t) / c1, 2)));
  return 1;
};

// Cápsula cônica (braço, perna, pescoço): topo na origem, desce len.
export const capsule = (len: number, rTop: number, rBot: number, flat = 1) => {
  const c0 = Math.min(0.45, rTop / len);
  const c1 = Math.min(0.45, rBot / len);
  const r = (t: number) => (rTop + (rBot - rTop) * t) * cap(t, c0, c1);
  return sweepY(len, r, (t) => r(t) * flat, 24, 16);
};

// Cilindro arredondado com perfil livre (casaco, saia, chapéu) — sem tampas arredondadas.
export const flare = (len: number, rx: (t: number) => number, rz: (t: number) => number, topCap = 0.0) =>
  sweepY(len, (t) => rx(t) * cap(t, topCap, 0.02), (t) => rz(t) * cap(t, topCap, 0.02), 40, 32);

import { fin } from "./geom";

export const rrShape = (w: number, h: number, r: number) => {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
};

// Caixa de cantos arredondados (largura w, altura h, profundidade d).
export const roundBox = (w: number, h: number, d: number, r = 0.04, bevel = 0.02) =>
  fin(rrShape(w - bevel * 2, h - bevel * 2, r), d - bevel * 2, bevel);

// Tubo fino ao longo de pontos (fios, cordões, fitas).
export const tube = (pts: [number, number, number][], r = 0.012, segs = 40) =>
  new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), segs, r, 8, false);

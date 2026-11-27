import React, { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { random } from "remotion";
import { Cam } from "../scenes/cam";

// The open blue (set 2), drawn in 2D: a view-dependent gradient + plankton projected in perspective.
// Rendered at any resolution so it can pixel-dissolve (guide §2), and in 1-bit with a Bayer 4×4 dither.

export type OpenLook = { top: string; mid: string; deep: string; plankton: string };
export const OPEN: OpenLook = { top: "#2a7fa6", mid: "#0B3D5C", deep: "#05192b", plankton: "#9fd8e8" };

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const NAVY = [28, 63, 148];
const BLACK = [2, 4, 10];

// sRGB bytes straight from the hex (THREE.Color would hand back linear values)
const hex = (h: string) => {
  const n = parseInt(h.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mixc = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * t);
const sstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export const PLANKTON = Array.from({ length: 900 }).map((_, i) => {
  const r = 3 + random(`pr${i}`) * 55;
  const th = random(`pt${i}`) * Math.PI * 2;
  const ph = Math.acos(2 * random(`pp${i}`) - 1);
  return { p: new THREE.Vector3(r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph) * 0.6, r * Math.sin(ph) * Math.sin(th)), s: 0.5 + random(`ps${i}`), ph: random(`pq${i}`) * 6.28 };
});

const camera = (cam: Cam, aspect: number) => {
  const c = new THREE.PerspectiveCamera(cam.fov, aspect, 0.05, 400);
  c.position.copy(cam.pos);
  c.up.set(Math.sin(cam.roll ?? 0), Math.cos(cam.roll ?? 0), 0);
  c.lookAt(cam.target);
  c.updateMatrixWorld();
  c.updateProjectionMatrix();
  return c;
};

export type Crystal = { x: number; y: number; stage: number; tw: number };

// draw into a canvas of size cw×ch
export const drawOpen = (
  ctx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
  cam: Cam,
  time: number,
  look: OpenLook,
  oneBit: boolean,
  crystals: Crystal[] = [],
) => {
  const c = camera(cam, cw / ch);
  const top = hex(look.top);
  const mid = hex(look.mid);
  const deep = hex(look.deep);
  const fwd = new THREE.Vector3();
  c.getWorldDirection(fwd);
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(c.quaternion);
  const tanH = Math.tan((cam.fov * Math.PI) / 360);
  const img = ctx.createImageData(cw, ch);
  const lum = new Float32Array(cw * ch);
  for (let y = 0; y < ch; y++) {
    const v = 1 - (2 * (y + 0.5)) / ch;
    const dy = fwd.y + up.y * v * tanH;
    const n = Math.sqrt(1 + (v * tanH) ** 2);
    const d = dy / n;
    let col = mixc(deep, mid, sstep(-0.5, 0.05, d));
    col = mixc(col, top, sstep(0.05, 0.85, d));
    // 1-bit density: a dithered gradient, brighter towards the light above
    const L = 0.04 + 0.62 * sstep(-0.55, 0.9, d);
    for (let x = 0; x < cw; x++) {
      const i = (y * cw + x) * 4;
      img.data[i] = col[0];
      img.data[i + 1] = col[1];
      img.data[i + 2] = col[2];
      img.data[i + 3] = 255;
      lum[y * cw + x] = L;
    }
  }
  // plankton: tiny points, near ones bigger, far ones fade into the blue
  const pc = hex(look.plankton);
  const v = new THREE.Vector3();
  for (const pl of PLANKTON) {
    v.copy(pl.p);
    v.y += Math.sin(time * 0.4 + pl.ph) * 0.05;
    const dist = v.distanceTo(c.position);
    v.project(c);
    if (v.z > 1 || v.z < -1) continue;
    const px = Math.floor((v.x * 0.5 + 0.5) * cw);
    const py = Math.floor((-v.y * 0.5 + 0.5) * ch);
    const fog = Math.exp(-dist * 0.045);
    const rad = Math.max(0, Math.round((pl.s * ch) / (dist * 30)));
    for (let oy = -rad; oy <= rad; oy++)
      for (let ox = -rad; ox <= rad; ox++) {
        const X = px + ox;
        const Y = py + oy;
        if (X < 0 || Y < 0 || X >= cw || Y >= ch) continue;
        if (ox * ox + oy * oy > rad * rad + 0.5) continue;
        const i = (Y * cw + X) * 4;
        const a = 0.75 * fog;
        img.data[i] += (pc[0] - img.data[i]) * a;
        img.data[i + 1] += (pc[1] - img.data[i + 1]) * a;
        img.data[i + 2] += (pc[2] - img.data[i + 2]) * a;
        lum[Y * cw + X] = Math.max(lum[Y * cw + X], 0.4 + fog);
      }
  }
  if (oneBit) {
    for (let y = 0; y < ch; y++)
      for (let x = 0; x < cw; x++) {
        const on = lum[y * cw + x] > BAYER[(y % 4) * 4 + (x % 4)];
        const col = on ? NAVY : BLACK;
        const i = (y * cw + x) * 4;
        img.data[i] = col[0];
        img.data[i + 1] = col[1];
        img.data[i + 2] = col[2];
      }
    // ice crystals (pale cyan pixel sprites)
    const ICE = [190, 240, 255];
    const put = (X: number, Y: number) => {
      if (X < 0 || Y < 0 || X >= cw || Y >= ch) return;
      const i = (Y * cw + X) * 4;
      img.data[i] = ICE[0];
      img.data[i + 1] = ICE[1];
      img.data[i + 2] = ICE[2];
    };
    for (const k of crystals) {
      const X = Math.round(k.x);
      const Y = Math.round(k.y);
      if (k.stage >= 1) put(X, Y);
      if (k.stage >= 2) [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => put(X + a, Y + b));
      if (k.stage >= 3) {
        [[2, 0], [-2, 0], [0, 2], [0, -2], [3, 0], [-3, 0], [0, 3], [0, -3]].forEach(([a, b]) => put(X + a, Y + b));
        [[1, 1], [-1, -1], [1, -1], [-1, 1]].forEach(([a, b]) => put(X + a * 2, Y + b * 2));
      }
      if (k.stage >= 4 && k.tw > 0.5) [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [-1, 2], [1, -2], [-1, -2]].forEach(([a, b]) => put(X + a, Y + b));
    }
  }
  ctx.putImageData(img, 0, 0);
};

// A <canvas> that draws the open blue at 1/div resolution and is shown pixelated.
export const OpenBlue: React.FC<{
  cam: Cam;
  time: number;
  width: number;
  height: number;
  div?: number;
  oneBit?: boolean;
  crystals?: Crystal[];
  look?: OpenLook;
  style?: React.CSSProperties;
}> = ({ cam, time, width, height, div = 4, oneBit = false, crystals = [], look = OPEN, style }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const cw = Math.max(16, Math.round(width / div));
  const ch = Math.max(9, Math.round(height / div));
  useLayoutEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (ctx) drawOpen(ctx, cw, ch, cam, time, look, oneBit, crystals);
  });
  return (
    <canvas
      ref={ref}
      width={cw}
      height={ch}
      style={{ position: "absolute", left: 0, top: 0, width, height, imageRendering: div > 1.5 ? "pixelated" : "auto", ...style }}
    />
  );
};

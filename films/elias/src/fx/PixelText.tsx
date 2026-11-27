import React, { useEffect, useRef } from "react";
import { continueRender, delayRender, random, staticFile, useVideoConfig } from "remotion";
import { HQ } from "../lib/fonts";
import { smooth } from "../scenes/mundo";

// Letreiro em pixels (mesmo efeito do título): as células voam e formam o texto; opcionalmente se dispersam.
const CELL = 12;
type Cell = { x: number; y: number; ox: number; oy: number; d: number };
const caches = new Map<string, Cell[]>();
export type Line = { text: string; size: number; y: number };

const build = (key: string, lines: Line[], W: number, H: number): Cell[] => {
  const hit = caches.get(key);
  if (hit) return hit;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const g = cv.getContext("2d")!;
  g.fillStyle = "#000"; g.textAlign = "center"; g.textBaseline = "middle";
  lines.forEach((l) => { g.font = `${l.size}px ${HQ}`; g.fillText(l.text, W / 2, H * l.y); });
  const d = g.getImageData(0, 0, W, H).data;
  const out: Cell[] = [];
  let n = 0;
  for (let y = 0; y < H; y += CELL)
    for (let x = 0; x < W; x += CELL) {
      let a = 0;
      for (let dy = 0; dy < CELL; dy += 4) for (let dx = 0; dx < CELL; dx += 4) a += d[((y + dy) * W + (x + dx)) * 4 + 3];
      if (a / 9 > 110) {
        const an = random(`${key}a${n}`) * 6.283, r = 700 + random(`${key}r${n}`) * 900;
        out.push({ x, y, ox: W / 2 + Math.cos(an) * r, oy: H / 2 + Math.sin(an) * r * 0.6, d: random(`${key}d${n}`) });
        n++;
      }
    }
  caches.set(key, out);
  return out;
};

export const PixelText: React.FC<{ id: string; lines: Line[]; f: number; start: number; end?: number }> = ({ id, lines, f, start, end = 1e9 }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const { width: W, height: H } = useVideoConfig();
  useEffect(() => {
    const h = delayRender("pixeltext");
    const face = new FontFace(HQ, `url(${staticFile("fonts/bangers-latin-400-normal.woff2")})`);
    face.load().then((ff) => {
      document.fonts.add(ff);
      const cells = build(id, lines, W, H);
      const c = ref.current!;
      const g = c.getContext("2d")!;
      g.clearRect(0, 0, W, H);
      const items = cells.map((cell) => {
        const a = smooth(start + cell.d * 40, start + 34 + cell.d * 40, f);
        const b = smooth(end + cell.d * 10, end + 30 + cell.d * 10, f);
        const snap = (v: number) => Math.round(v / CELL) * CELL;
        return { sx: snap(cell.x * a + cell.ox * (1 - a)), sy: snap(cell.y * a + cell.oy * (1 - a)), op: Math.min(1, a * 1.4) * (1 - b), gold: random(`${id}g${cell.x}-${cell.y}`) > 0.93 };
      }).filter((it) => it.op > 0.02);
      for (const it of items) { g.globalAlpha = it.op; g.fillStyle = "#10141f"; g.fillRect(it.sx + 9, it.sy + 9, CELL, CELL); }
      for (const it of items) { g.globalAlpha = it.op; g.fillStyle = it.gold ? "#FFD23F" : "#F4F1EA"; g.fillRect(it.sx, it.sy, CELL, CELL); }
      g.globalAlpha = 1;
      continueRender(h);
    });
  }, [f, W, H, id, start, end]);
  return <canvas ref={ref} width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }} />;
};

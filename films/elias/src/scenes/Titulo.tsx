import React, { useEffect, useRef } from "react";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, continueRender, delayRender, random, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CameraRig, V3 as v3 } from "./cam";
import { Street } from "../world/Street";
import { Grade } from "../fx/Grade";
import { HQ } from "../lib/fonts";
import { setMorning, smooth } from "./mundo";

const CELL = 12;
type Cell = { x: number; y: number; ox: number; oy: number; d: number; ex: number; ey: number };
let cache: Cell[] | null = null;

const buildCells = (W: number, H: number): Cell[] => {
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const g = cv.getContext("2d")!;
  g.fillStyle = "#000";
  g.font = `200px ${HQ}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("O HOMEM QUE", W / 2, H * 0.36);
  g.font = `262px ${HQ}`;
  g.fillText("SENTIA TUDO", W / 2, H * 0.62);
  const d = g.getImageData(0, 0, W, H).data;
  const out: Cell[] = [];
  let n = 0;
  for (let y = 0; y < H; y += CELL)
    for (let x = 0; x < W; x += CELL) {
      let a = 0;
      for (let dy = 0; dy < CELL; dy += 4) for (let dx = 0; dx < CELL; dx += 4) a += d[((y + dy) * W + (x + dx)) * 4 + 3];
      if (a / 9 > 110) {
        const an = random(`ta${n}`) * 6.283, r = 700 + random(`tr${n}`) * 900;
        out.push({ x, y, ox: W / 2 + Math.cos(an) * r, oy: H / 2 + Math.sin(an) * r * 0.6, d: random(`td${n}`), ex: (random(`te${n}`) - 0.5) * 2600, ey: (random(`tf${n}`) - 0.5) * 1600 });
        n++;
      }
    }
  return out;
};

export const PixelTitle: React.FC<{ f: number }> = ({ f }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const { width: W, height: H } = useVideoConfig();
  useEffect(() => {
    const h = delayRender("titulo");
    const face = new FontFace(HQ, `url(${staticFile("fonts/bangers-latin-400-normal.woff2")})`);
    face.load().then((ff) => {
      document.fonts.add(ff);
      if (!cache) cache = buildCells(W, H);
      const c = ref.current!;
      const g = c.getContext("2d")!;
      g.clearRect(0, 0, W, H);
      const form = (cell: Cell) => smooth(30 + cell.d * 28, 62 + cell.d * 28, f);
      const away = (cell: Cell) => smooth(112 + cell.d * 20, 142 + cell.d * 8, f);
      const items = cache.map((cell) => {
        const a = form(cell), b = away(cell);
        const x = cell.x * a + cell.ox * (1 - a) + cell.ex * b;
        const y = cell.y * a + cell.oy * (1 - a) + cell.ey * b;
        const snap = (v: number) => Math.round(v / CELL) * CELL;
        const sx = snap(x), sy = snap(y);
        const op = Math.min(1, a * 1.4) * (1 - b);
        return { sx, sy, op, gold: random(`tg${cell.x}-${cell.y}`) > 0.93 };
      }).filter((it) => it.op > 0.02);
      for (const it of items) { g.globalAlpha = it.op; g.fillStyle = "#10141f"; g.fillRect(it.sx + 9, it.sy + 9, CELL, CELL); }
      for (const it of items) { g.globalAlpha = it.op; g.fillStyle = it.gold ? "#FFD23F" : "#F4F1EA"; g.fillRect(it.sx, it.sy, CELL, CELL); }
      g.globalAlpha = 1;
      continueRender(h);
    });
  }, [f, W, H]);
  return <canvas ref={ref} width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }} />;
};

export const Titulo: React.FC = () => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  setMorning();
  const cam = { pos: v3(7 + f * 0.012, 3.4, 15.5), target: v3(9 + f * 0.012, 3.0, 0), fov: 32 };
  const fade = 1 - smooth(120, 150, f) * 0; // a cena 1 corta a seco no frame 150
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg,#8FB8DD 0%,#BFD7EA 45%,#F6E3C6 100%)", opacity: fade }}>
      <ThreeCanvas width={width} height={height} flat linear={false} camera={{ fov: 32, near: 0.05, far: 400, position: [0, 3, 13] }} gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}>
        <CameraRig cam={cam} />
        <Street camX={cam.pos.x} range={34} />
      </ThreeCanvas>
      <AbsoluteFill style={{ background: "rgba(40,36,60,0.28)", opacity: smooth(25, 70, f) * (1 - smooth(112, 140, f)) }} />
      <PixelTitle f={f} />
      <Grade vignette={0.3} grain={0.045} vc="40,28,50" />
    </AbsoluteFill>
  );
};

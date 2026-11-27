import React from "react";
import { HQ } from "../lib/fonts";

// Balão pictográfico de HQ (guia §HQ): bolha com cauda + mini-quadros desenhados, sem fala.
const Cake: React.FC = () => (
  <svg viewBox="0 0 200 160" width="100%" height="100%">
    <rect width="200" height="160" fill="#FFE9B0" />
    <g stroke="#10141f" strokeWidth="5" strokeLinejoin="round">
      <rect x="40" y="96" width="120" height="40" rx="6" fill="#B9773D" />
      <rect x="52" y="64" width="96" height="36" rx="6" fill="#F7B2AD" />
      <rect x="66" y="38" width="68" height="30" rx="6" fill="#F4F1EA" />
      <rect x="97" y="18" width="6" height="22" fill="#FFD23F" />
    </g>
    <circle cx="82" cy="60" r="7" fill="#E5483B" stroke="#10141f" strokeWidth="4" />
    <circle cx="118" cy="60" r="7" fill="#E5483B" stroke="#10141f" strokeWidth="4" />
    <path d="M100 4 q10 10 0 18 q-10 -8 0 -18z" fill="#FF7F11" stroke="#10141f" strokeWidth="3" />
    <path d="M160 24 l6 14 15 1 -12 9 4 15 -13 -8 -13 8 4 -15 -12 -9 15 -1z" fill="#FFD23F" stroke="#10141f" strokeWidth="4" />
  </svg>
);
const Crowd: React.FC = () => (
  <svg viewBox="0 0 200 160" width="100%" height="100%">
    <rect width="200" height="160" fill="#BFD7EA" />
    {[30, 75, 120, 165].map((x, i) => (
      <g key={i} stroke="#10141f" strokeWidth="5" strokeLinecap="round" fill="none">
        <circle cx={x} cy={80 - (i % 2) * 8} r="13" fill={["#F7B2AD", "#FFD23F", "#7AE7C7", "#FF7F11"][i]} />
        <path d={`M${x} ${94 - (i % 2) * 8} v34 M${x - 22} ${70 - (i % 2) * 8} l22 ${28} l22 -28`} />
      </g>
    ))}
    {[[40, 24], [100, 14], [150, 30]].map((p, i) => (
      <path key={i} d={`M${p[0]} ${p[1]} l5 10 11 1 -9 7 3 11 -10 -6 -10 6 3 -11 -9 -7 11 -1z`} fill="#FFD23F" stroke="#10141f" strokeWidth="3" />
    ))}
    <path d="M20 148 q20 -14 40 0 t40 0 t40 0 t40 0" stroke="#10141f" strokeWidth="5" fill="none" />
  </svg>
);

export const Pictoballoon: React.FC<{ x: number; y: number; w: number; h: number; tail: [number, number]; t: number; left?: React.ReactNode; right?: React.ReactNode }> = ({ x, y, w, h, tail, t, left, right }) => {
  if (t <= 0) return null;
  const sc = t < 1 ? 1.12 * Math.sin((t * Math.PI) / 2) : 1;
  const panelW = (w - 70) / 2;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, pointerEvents: "none" }}>
      <svg width="1920" height="1080" style={{ position: "absolute", left: 0, top: 0 }}>
        <g transform={`translate(${x + w / 2} ${y + h / 2}) scale(${sc}) translate(${-(x + w / 2)} ${-(y + h / 2)})`}>
          <path d={`M${x + w * 0.3} ${y + h - 20} L${tail[0]} ${tail[1]} L${x + w * 0.45} ${y + h - 20}z`} fill="#fff" stroke="#10141f" strokeWidth="8" strokeLinejoin="round" />
          <rect x={x} y={y} width={w} height={h} rx={h * 0.28} fill="#fff" stroke="#10141f" strokeWidth="8" />
          <rect x={x + w * 0.3 - 4} y={y + h - 26} width={w * 0.15 + 8} height="14" fill="#fff" />
        </g>
      </svg>
      <div style={{ position: "absolute", left: x + 25, top: y + 25, width: panelW, height: h - 50, border: "6px solid #10141f", transform: `scale(${sc})`, overflow: "hidden", background: "#fff" }}>{left ?? <Cake />}</div>
      <div style={{ position: "absolute", left: x + 45 + panelW, top: y + 25, width: panelW, height: h - 50, border: "6px solid #10141f", transform: `scale(${sc})`, overflow: "hidden", background: "#fff" }}>{right ?? <Crowd />}</div>
      <div style={{ display: "none", fontFamily: HQ }} />
    </div>
  );
};

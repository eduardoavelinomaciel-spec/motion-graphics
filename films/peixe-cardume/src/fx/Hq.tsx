import React from "react";
import { AbsoluteFill } from "remotion";
import { HQ } from "../lib/fonts";

// HQ panel: ink border, halftone dots, optional onomatopoeia.
export const Halftone: React.FC<{ opacity?: number; size?: number; color?: string }> = ({ opacity = 0.22, size = 9, color = "0,0,0" }) => (
  <AbsoluteFill
    style={{
      backgroundImage: `radial-gradient(circle, rgba(${color},${opacity}) ${size * 0.28}px, transparent ${size * 0.3}px)`,
      backgroundSize: `${size}px ${size}px`,
      mixBlendMode: "multiply",
      pointerEvents: "none",
    }}
  />
);

export const Onoma: React.FC<{ text: string; x: number; y: number; size: number; rot?: number; scale?: number; color?: string; stroke?: string }> = ({
  text, x, y, size, rot = -8, scale = 1, color = "#ffffff", stroke = "#10141f",
}) => (
  <div
    style={{
      position: "absolute", left: x, top: y, fontFamily: HQ, fontSize: size, color,
      WebkitTextStroke: `${size * 0.08}px ${stroke}`, paintOrder: "stroke fill",
      transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${scale})`, whiteSpace: "nowrap",
      textShadow: `${size * 0.05}px ${size * 0.06}px 0 ${stroke}`,
    }}
  >
    {text}
  </div>
);

export const Panel: React.FC<{
  x: number; y: number; w: number; h: number; border: number; children: React.ReactNode; style?: React.CSSProperties;
}> = ({ x, y, w, h, border, children, style }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h, overflow: "hidden", boxSizing: "border-box", ...style }}>
    {children}
    <div style={{ position: "absolute", inset: 0, border: `${border}px solid #10141f`, pointerEvents: "none" }} />
  </div>
);

// Radial anime speed lines (deterministic per step).
export const SpeedLines: React.FC<{ w: number; h: number; cx: number; cy: number; amount: number; step: number; color?: string; inner?: number }> = ({
  w, h, cx, cy, amount, step, color = "rgba(140,210,255,0.85)", inner = 0.28,
}) => {
  if (amount <= 0) return null;
  const n = Math.round(30 + amount * 50);
  const R = Math.hypot(w, h);
  const lines = [];
  for (let i = 0; i < n; i++) {
    const r = Math.sin(i * 12.9898 + step * 78.233) * 43758.5453;
    const fr = r - Math.floor(r);
    const a = (i / n) * Math.PI * 2 + fr * 0.15;
    const r0 = R * (inner + fr * 0.2);
    const wdt = (2 + fr * 7) * amount;
    const x1 = cx + Math.cos(a) * r0;
    const y1 = cy + Math.sin(a) * r0;
    const x2 = cx + Math.cos(a) * R;
    const y2 = cy + Math.sin(a) * R;
    const nx = -Math.sin(a) * wdt;
    const ny = Math.cos(a) * wdt;
    lines.push(<polygon key={i} points={`${x1},${y1} ${x2 + nx},${y2 + ny} ${x2 - nx},${y2 - ny}`} fill={color} opacity={0.4 + 0.6 * amount} />);
  }
  return (
    <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
      {lines}
    </svg>
  );
};

import React from "react";
import { AbsoluteFill } from "remotion";

// 4-point anime sparkle
export const Sparkle: React.FC<{ x: number; y: number; size: number; rot?: number; opacity?: number; color?: string }> = ({
  x, y, size, rot = 0, opacity = 1, color = "#ffffff",
}) => (
  <svg
    width={size * 2}
    height={size * 2}
    viewBox="-1 -1 2 2"
    style={{ position: "absolute", left: x - size, top: y - size, opacity, transform: `rotate(${rot}deg)`, overflow: "visible" }}
  >
    <path
      d="M0,-1 C0.12,-0.12 0.12,-0.12 1,0 C0.12,0.12 0.12,0.12 0,1 C-0.12,0.12 -0.12,0.12 -1,0 C-0.12,-0.12 -0.12,-0.12 0,-1 Z"
      fill={color}
      style={{ filter: "drop-shadow(0 0 6px rgba(255,255,255,0.9))" }}
    />
  </svg>
);

// Bubble pop: an expanding ring and droplets flying out.
export const Pop: React.FC<{ x: number; y: number; t: number; r: number }> = ({ x, y, t, r }) => {
  if (t < 0 || t > 1) return null;
  const ease = 1 - (1 - t) ** 3;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width="100%" height="100%" style={{ position: "absolute" }}>
        <circle cx={x} cy={y} r={r * (1 + ease * 0.8)} fill="none" stroke="white" strokeWidth={6 * (1 - t)} opacity={1 - t} />
        {Array.from({ length: 10 }).map((_, i) => {
          const a = (i / 10) * Math.PI * 2 + 0.3;
          const d = r * (0.9 + ease * 1.3);
          return <circle key={i} cx={x + Math.cos(a) * d} cy={y + Math.sin(a) * d} r={(i % 2 ? 7 : 11) * (1 - t * 0.7)} fill="white" opacity={1 - t} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

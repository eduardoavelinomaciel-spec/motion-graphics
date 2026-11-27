import React from "react";
import { HQ } from "../lib/fonts";

// Pictographic HQ balloon (guide §1): ink outline, no words — only drawings and symbols.
// (x, y) = centre; tail points to (tx, ty). pop: 0..1.1..1 scale.
export const Balloon: React.FC<{
  x: number; y: number; w: number; h: number; tx: number; ty: number; pop: number; children?: React.ReactNode;
}> = ({ x, y, w, h, tx, ty, pop, children }) => {
  if (pop <= 0.001) return null;
  const ang = Math.atan2(ty - y, tx - x);
  const bx = Math.cos(ang) * w * 0.38;
  const by = Math.sin(ang) * h * 0.38;
  const px = -Math.sin(ang) * w * 0.07;
  const py = Math.cos(ang) * w * 0.07;
  const stroke = Math.max(4, w * 0.018);
  return (
    <svg
      style={{ position: "absolute", left: 0, top: 0, overflow: "visible", transformOrigin: `${tx}px ${ty}px`, transform: `scale(${pop})` }}
      width="100%"
      height="100%"
    >
      <g>
        <path
          d={`M ${x + bx + px} ${y + by + py} Q ${(x + tx) / 2 + px * 0.3} ${(y + ty) / 2 + py * 0.3} ${tx} ${ty} Q ${(x + tx) / 2 - px * 0.3} ${(y + ty) / 2 - py * 0.3} ${x + bx - px} ${y + by - py} Z`}
          fill="#fffdf6" stroke="#10141f" strokeWidth={stroke} strokeLinejoin="round"
        />
        <ellipse cx={x} cy={y} rx={w / 2} ry={h / 2} fill="#fffdf6" stroke="#10141f" strokeWidth={stroke} />
        {/* cover the seam where the tail meets the ellipse */}
        <ellipse cx={x} cy={y} rx={w / 2 - stroke * 0.6} ry={h / 2 - stroke * 0.6} fill="#fffdf6" />
        <g transform={`translate(${x} ${y})`}>{children}</g>
      </g>
    </svg>
  );
};

// A tiny silver fish glyph (for drawings inside balloons)
export const FishGlyph: React.FC<{ x: number; y: number; s: number; rot: number; blue?: boolean }> = ({ x, y, s, rot, blue }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M -10 0 Q -4 -7 6 -4 Q 11 -2 12 0 Q 11 2 6 4 Q -4 7 -10 0 Z M -10 0 L -16 -6 L -15 0 L -16 6 Z" fill="#c9d6e3" stroke="#10141f" strokeWidth={1.6} strokeLinejoin="round" />
    <circle cx={6} cy={-1} r={1.4} fill="#10141f" />
    {blue ? <path d="M -2 2 Q 0 6 3 5" stroke="#2EC5FF" strokeWidth={2.2} fill="none" /> : null}
  </g>
);

export const BalloonMark: React.FC<{ ch: string; x: number; y: number; size: number }> = ({ ch, x, y, size }) => (
  <text x={x} y={y} fontFamily={HQ} fontSize={size} fill="#10141f" textAnchor="middle" dominantBaseline="central">
    {ch}
  </text>
);

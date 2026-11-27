import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

// Layer 7 (GRADE): vignette + 2% grain. Deterministic grain: the seed is the frame.
export const Grade: React.FC<{ vignette?: number; grain?: number; tint?: string; vc?: string }> = ({ vignette = 0.38, grain = 0.05, tint, vc = "4,20,38" }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {tint ? <AbsoluteFill style={{ background: tint, mixBlendMode: "soft-light" }} /> : null}
      <AbsoluteFill
        style={{ background: `radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 55%, rgba(${vc},${vignette}) 100%)` }}
      />
      <svg width="100%" height="100%" style={{ position: "absolute", opacity: grain, mixBlendMode: "overlay" }}>
        <filter id={`g${frame}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 97} />
        </filter>
        <rect width="100%" height="100%" filter={`url(#g${frame})`} />
      </svg>
    </AbsoluteFill>
  );
};

// Anime iris: a black frame with a circular hole that closes on (cx, cy).
export const Iris: React.FC<{ cx: number; cy: number; r: number }> = ({ cx, cy, r }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(circle at ${cx}px ${cy}px, rgba(0,0,0,0) ${Math.max(0, r)}px, #05070c ${Math.max(0, r) + 1.5}px)`,
    }}
  />
);

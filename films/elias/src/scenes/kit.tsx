import React from "react";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Grade } from "../fx/Grade";

// Casca comum das cenas 3D: céu em gradiente, canvas com dissolve em pixels no fim, grade e vinheta.
export const dissolveDiv = (f: number, total: number) => {
  const k = total - f;
  return k > 12 ? 1 : k > 9 ? 2 : k > 6 ? 4 : k > 3 ? 6 : 8;
};

export const Shell: React.FC<{
  sky: string; total: number; fov?: number; vignette?: number; vc?: string; dissolve?: boolean;
  overlay?: (f: number) => React.ReactNode; children: (f: number, w: number, h: number) => React.ReactNode;
}> = ({ sky, total, fov = 32, vignette = 0.3, vc = "40,28,50", dissolve = true, overlay, children }) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const div = dissolve ? dissolveDiv(f, total) : 1;
  const w = Math.round(width / div), h = Math.round(height / div);
  return (
    <AbsoluteFill style={{ background: sky }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, transform: `scale(${div})`, transformOrigin: "0 0", imageRendering: "pixelated" }}>
        <ThreeCanvas width={w} height={h} flat linear={false} camera={{ fov, near: 0.05, far: 400, position: [0, 3, 13] }} gl={{ antialias: div === 1, alpha: true, preserveDrawingBuffer: true }}>
          {children(f, w, h)}
        </ThreeCanvas>
      </div>
      {overlay ? overlay(f) : null}
      <Grade vignette={vignette} grain={0.045} vc={vc} />
    </AbsoluteFill>
  );
};
export const fovPx = (h: number, fov: number) => h / (2 * Math.tan((fov * Math.PI) / 360));

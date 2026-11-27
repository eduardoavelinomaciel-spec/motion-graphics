import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, staticFile } from "remotion";
import { makeToon } from "../lib/materials";

export const fontCss = `
@font-face{font-family:Bangers;src:url(${staticFile("fonts/bangers-latin-400-normal.woff2")})}
@font-face{font-family:Nunito;font-weight:800;src:url(${staticFile("fonts/nunito-latin-800-normal.woff2")})}
`;

// deterministic pseudo-random in [0,1)
export const rnd = (i: number, k = 0) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export const ease = (a: number, b: number, t: number) => {
  const x = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};

// Comic "recordatório" caption box (yellow, black border, Bangers) with a pop-in.
export const Caption: React.FC<{
  text: string; t: number; from: number; to: number; x?: string; y?: string; size?: number; align?: "center" | "left";
}> = ({ text, t, from, to, x = "50%", y = "50%", size = 76, align = "center" }) => {
  const a = interpolate(t, [from, from + 0.25, to - 0.3, to], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (a <= 0) return null;
  const pop = interpolate(t, [from, from + 0.25], [0.8, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) scale(${pop}) rotate(-1.5deg)`, opacity: a,
      background: "#ffe066", border: "7px solid #10141f", boxShadow: "10px 10px 0 #10141f", padding: "18px 38px",
      fontFamily: "Bangers", fontSize: size, letterSpacing: 2, color: "#10141f", textAlign: align, maxWidth: "78%", lineHeight: 1.08 }}>
      {text}
    </div>
  );
};

// A bubble: soft toon sphere with a rim.
export const Bubble: React.FC<{ position: [number, number, number]; r: number; opacity?: number; shine?: boolean }> = ({ position, r, opacity = 0.5, shine = false }) => {
  const mat = useMemo(() => {
    const m = makeToon({ color: shine ? "#fff6c2" : "#c9f4ff", rim: 0.9, spec: 0.8, transparent: true });
    return m;
  }, [shine]);
  mat.uniforms.uOpacity.value = opacity;
  mat.depthWrite = false;
  return (
    <mesh position={position} scale={r}>
      <sphereGeometry args={[1, 24, 16]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
};

// God rays from the surface (2D overlay).
export const Rays: React.FC<{ t: number; strength?: number }> = ({ t, strength = 0.5 }) => (
  <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen", opacity: strength }}>
    {[0, 1, 2, 3, 4].map((i) => (
      <div key={i} style={{ position: "absolute", top: "-10%", left: `${8 + i * 21 + Math.sin(t * 0.4 + i) * 2}%`, width: "9%", height: "125%",
        transform: "rotate(14deg)", background: "linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0))", filter: "blur(18px)", opacity: 0.45 + 0.25 * Math.sin(t * 0.8 + i * 1.7) }} />
    ))}
  </AbsoluteFill>
);

export const Fade: React.FC<{ a: number }> = ({ a }) => (
  <AbsoluteFill style={{ background: "#03101a", opacity: a, pointerEvents: "none" }} />
);

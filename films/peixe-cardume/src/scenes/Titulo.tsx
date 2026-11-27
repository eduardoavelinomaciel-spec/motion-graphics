import React, { useMemo } from "react";
import * as THREE from "three";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { applyLook, Bubble, BubbleColumns, GodRays, SHALLOW, Sky } from "../world/World";
import { CameraRig, Cam, project, V3 } from "./cam";
import { Grade } from "../fx/Grade";
import { Pop } from "../fx/AnimeFx";
import { ensureFonts, HQ } from "../lib/fonts";
import { CAUSTIC_GLSL } from "../lib/glsl";

// Cartão de título · [0:00–0:05] · f 0–150. The surface seen from below; a bubble rises and pops into the title.
export const TITULO_FRAMES = 150;

const SURFACE_FRAG = /* glsl */ `
${CAUSTIC_GLSL}
uniform float uTime;
varying vec3 vW;
void main() {
  float c = caustic(vW.xz * 0.6, uTime * 1.3);
  vec3 col = mix(vec3(0.3, 0.8, 0.86), vec3(0.85, 0.99, 1.0), c * 0.75);
  float d = length(vW.xz);
  col = mix(col, vec3(0.1, 0.62, 0.72), smoothstep(10.0, 40.0, d));
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`;
const SURFACE_VERT = /* glsl */ `
uniform float uTime;
varying vec3 vW;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  w.y += 0.25 * sin(w.x * 0.5 + uTime * 1.2) + 0.2 * sin(w.z * 0.6 - uTime * 0.9);
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

const LINES = [["O", "Peixe", "que", "se", "Perdeu"], ["do", "Cardume"]];

export const Titulo: React.FC = () => {
  ensureFonts();
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const t = f / 30;
  applyLook(SHALLOW, t);
  const u = width / 1920;
  const surf = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: SURFACE_VERT, fragmentShader: SURFACE_FRAG, side: THREE.DoubleSide, uniforms: { uTime: { value: 0 } } }),
    [],
  );
  surf.uniforms.uTime.value = t;
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(120, 120, 80, 80);
    g.rotateX(Math.PI / 2);
    return g;
  }, []);

  const cam: Cam = { pos: V3(0, 2 + t * 0.15, 8), target: V3(0, 9, -2), fov: 50 };
  // the bubble rises to the camera's centre and pops at f 54
  const by = interpolate(f, [0, 54], [-0.5, 5.6], { easing: Easing.out(Easing.quad), extrapolateRight: "clamp" });
  const bubblePos = V3(Math.sin(t * 4) * 0.15, by, 3.2);
  const scr = project(bubblePos, cam, width, height);
  const rays = useMemo(() => Array.from({ length: 7 }).map((_, i) => ({ x: -9 + i * 3 + random(`tr${i}`) * 2, z: -6 + random(`tz${i}`) * 4, w: 1 + random(`tw${i}`) * 1.5, tilt: 0.25, ph: i })), []);

  // title: elastic pop in (8 frames), hold, then dissolves into bubbles from f 112
  const pop = interpolate(f, [54, 60, 64], [0, 1.1, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const out = interpolate(f, [112, 140], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#1FB5C9" }}>
      <ThreeCanvas width={width} height={height} flat linear={false} camera={{ fov: 50, position: [0, 2, 8] }} gl={{ antialias: true }}>
        <CameraRig cam={cam} />
        <Sky look={SHALLOW} camPos={cam.pos} sunAmt={0.9} />
        <mesh geometry={geo} material={surf} position={[0, 14, -10]} />
        <GodRays rays={rays} time={t} camPos={cam.pos} intensity={0.12} />
        <BubbleColumns vents={[{ x: -5, z: -4 }, { x: 4.5, z: -3 }, { x: 1.5, z: -9 }]} time={t + 3} perVent={10} size={0.08} />
        {f < 54 ? <Bubble position={[bubblePos.x, bubblePos.y, bubblePos.z]} radius={0.55 + f * 0.006} squash={0.08 * Math.sin(t * 9)} /> : null}
      </ThreeCanvas>
      {f >= 52 && f < 70 ? <Pop x={scr.x} y={scr.y} t={(f - 54) / 14} r={110 * u} /> : null}
      {f >= 54 ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", transform: `scale(${pop})` }}>
            {LINES.map((line, li) => (
              <div key={li} style={{ display: "flex", gap: 34 * u }}>
                {line.map((word, wi) => (
                  <div key={wi} style={{ display: "flex", whiteSpace: "nowrap" }}>
                    {word.split("").map((ch, ci) => {
                      const i = li * 100 + wi * 10 + ci;
                      const r = random(`l${i}`);
                      const d = Math.max(0, Math.min(1, out * 1.6 - r * 0.6));
                      const bob = Math.sin(t * 3 + i * 0.6) * 4 * u;
                      return (
                        <span key={ci} style={{
                          fontFamily: HQ, fontSize: (li === 1 ? 190 : 150) * u, lineHeight: 1.0, color: "#ffffff",
                          WebkitTextStroke: `${9 * u}px #1572c9`, paintOrder: "stroke fill",
                          textShadow: `0 ${9 * u}px 0 #0b3d5c`,
                          display: "inline-block",
                          transform: `translateY(${bob - d * 260 * u}px) scale(${1 - d * 0.7}) rotate(${(r - 0.5) * 6}deg)`,
                          opacity: 1 - d,
                        }}>
                          {ch}
                        </span>
                      );
                    })}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </AbsoluteFill>
      ) : null}
      {/* the title dissolves into small bubbles */}
      {out > 0 ? (
        <svg width="100%" height="100%" style={{ position: "absolute" }}>
          {Array.from({ length: 70 }).map((_, i) => {
            const x0 = 260 * u + random(`dx${i}`) * 1400 * u;
            const y0 = 440 * u + random(`dy${i}`) * 220 * u;
            const life = Math.max(0, out * 1.6 - random(`dl${i}`) * 0.6);
            if (life <= 0) return null;
            const y = y0 - life * (300 + random(`ds${i}`) * 300) * u;
            const r = (4 + random(`dr${i}`) * 10) * u;
            return <circle key={i} cx={x0 + Math.sin(life * 8 + i) * 12 * u} cy={y} r={r} fill="none" stroke="white" strokeWidth={2.5 * u} opacity={Math.max(0, 1 - life * 0.9)} />;
          })}
        </svg>
      ) : null}
      <Grade />
    </AbsoluteFill>
  );
};

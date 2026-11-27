import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Stage } from "../sheets/Stage";
import { Fish, CIRO } from "../characters/Fish";
import * as THREE from "three";
import { Bubble, Caption, Rays, ease, fontCss, rnd } from "./common";

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const reefMat = new THREE.MeshBasicMaterial({ color: "#0a5a73" });
const reefMat2 = new THREE.MeshBasicMaterial({ color: "#0c6a85" });

// Cena 1 (0:15-0:45): o cardume nada em formação perfeita, Ciro olha tudo, uma bolha brilhante o leva para longe.
export const Cena1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const xg = 3 - 0.5 * t; // school centre; the school swims to the LEFT
  const dolly = -6 * ease(24, 30, t); // wide pull-back at the end

  // school in a V (leader on the left), plus a second layer behind
  const school: { x: number; y: number; z: number }[] = [{ x: -3, y: 0.3, z: 0 }];
  for (let r = 1; r <= 4; r++) {
    school.push({ x: -3 + 1.15 * r, y: 0.3 + 0.7 * r, z: 0 });
    school.push({ x: -3 + 1.15 * r, y: 0.3 - 0.7 * r, z: 0 });
  }
  for (let r = 1; r <= 2; r++) {
    school.push({ x: -2.5 + 1.2 * r, y: 0.3 + 0.7 * (r - 1.5), z: -1.3 });
    school.push({ x: -2.5 + 1.2 * r, y: 0.3 - 0.7 * (r - 0.5), z: -1.3 });
  }

  // Ciro: starts at the back of the school, lags behind while looking up, then chases the bubble to the right.
  const lag = ease(8, 16, t);
  const chase = ease(16, 24, t);
  const cx = t < 8 ? xg + 3.0 : t < 16 ? lerp(xg + 3.0, 1.3, lag) + 0 : lerp(1.3, 3.8, chase);
  const cy = t < 8 ? -1.0 : t < 16 ? lerp(-1.0, -0.6, lag) : lerp(-0.6, 1.7, chase);
  const face = ease(16, 18, t); // turn from facing left (with the school) to facing right (the bubble)
  const yaw = lerp(Math.PI + 0.4, 2 * Math.PI - 0.4, face);
  const pitch = lerp(0, 0.35, lag) + 0.25 * chase;
  const expr = t < 4 ? "neutro" : t < 24 ? "curioso" : "estrela";

  // the shiny bubble
  const bt = (a: number, b: number, k: number) => lerp(a, b, k);
  const bp = (() => {
    const pts: [number, number, number][] = [[12, 2.4, -3.6], [16, 1.9, -0.8], [20, 2.8, 0.9], [24, 4.2, 2.6], [30, 5.0, 5.2]];
    for (let i = 0; i < pts.length - 1; i++) {
      if (t >= pts[i][0] && t <= pts[i + 1][0]) {
        const k = (t - pts[i][0]) / (pts[i + 1][0] - pts[i][0]);
        return [bt(pts[i][1], pts[i + 1][1], k), bt(pts[i][2], pts[i + 1][2], k)];
      }
    }
    return null;
  })();

  return (
    <AbsoluteFill>
      <style>{fontCss}</style>
      <Stage
        camZ={10}
        background="radial-gradient(ellipse at 50% 0%, #7fe6ef 0%, #1FB5C9 38%, #0E6E8C 100%)"
        overlay={
          <>
            <Rays t={t} strength={0.55} />
            <Caption t={t} from={0.4} to={4.2} text="CIRO ERA O MENOR PEIXE DO CARDUME…" x="34%" y="12%" size={56} />
            <Caption t={t} from={4.6} to={8.4} text="…MAS TINHA A MAIOR CURIOSIDADE." x="34%" y="12%" size={56} />
            <Caption t={t} from={13.5} to={17.5} text="ATÉ QUE UMA BOLHA BRILHANTE PASSOU." x="34%" y="12%" size={56} />
            <Caption t={t} from={25.0} to={29.6} text="E ELE NADOU ATRÁS DELA SEM PERCEBER." x="50%" y="86%" size={60} />
          </>
        }
      >
        <group position={[0, 0, dolly]}>
          {/* distant reef, slow parallax */}
          <group position={[-t * 0.12, -4.4, -16]}>
            {[-10, -5, 0, 5, 10, 15].map((x, i) => (
              <mesh key={i} position={[x, 0.4 + rnd(i) * 1.2, 0]} scale={[3.2 + rnd(i, 1) * 2, 0.8 + rnd(i, 2) * 0.9, 1.2]} material={i % 2 ? reefMat : reefMat2}>
                <sphereGeometry args={[1, 20, 14]} />
              </mesh>
            ))}
          </group>

          {/* the school, facing left */}
          {school.map((p, i) => (
            <Fish key={i} variant={CIRO} time={t + rnd(i) * 2} finTip={null} swim={0.35} swimSpeed={1.1}
              position={[xg + p.x + 3, p.y + Math.sin(t * 0.9 + i) * 0.06, p.z - 1.5]}
              rotation={[0, Math.PI + 0.25, 0]} scale={0.72} />
          ))}

          {/* Ciro */}
          <Fish variant={CIRO} time={t} expr={expr} swim={0.45} swimSpeed={1.1} lean={t > 8 && t < 16 ? 0.15 : 0}
            position={[cx, cy + Math.sin(t * 1.4) * 0.05, 0]} rotation={[0.05, yaw, pitch]} scale={0.6} />

          {/* ambient bubbles */}
          {Array.from({ length: 22 }).map((_, i) => (
            <Bubble key={i} r={0.04 + rnd(i) * 0.1} opacity={0.4}
              position={[-7 + rnd(i, 1) * 14, ((t * (0.35 + rnd(i, 2) * 0.4) + rnd(i, 3) * 9) % 9) - 4.5, -3 + rnd(i, 4) * 4]} />
          ))}

          {/* the shiny bubble */}
          {bp && <Bubble position={[bp[0], bp[1], 0.9]} r={0.3} opacity={0.75} shine />}
        </group>
      </Stage>
    </AbsoluteFill>
  );
};

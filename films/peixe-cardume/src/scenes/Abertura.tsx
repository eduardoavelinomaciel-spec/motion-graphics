import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Stage } from "../sheets/Stage";
import { Fish, CIRO } from "../characters/Fish";
import { Bubble, Caption, Fade, Rays, ease, fontCss, rnd } from "./common";

export const ABERTURA_FRAMES = 345; // 11.5 s

// Abertura 0:00-0:11.5 — gancho: pergunta direta, Ciro sozinho, título, volta no tempo.
export const Abertura: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // black until 3.0s, then a hard cut into the water
  const dark = t < 3.0 ? 1 : 0;
  const dolly = -7 + 7 * ease(3, 9, t); // camera push-in (world moved toward camera)
  const bob = Math.sin(t * 1.3) * 0.08;

  return (
    <AbsoluteFill style={{ background: "#03101a" }}>
      <style>{fontCss}</style>
      <Stage
        camZ={10}
        background="radial-gradient(ellipse at 50% 25%, #1fb5c9 0%, #0e6e8c 50%, #0b3d5c 100%)"
        overlay={
          <>
            <Rays t={t} strength={0.25} />
            <Fade a={dark} />
            <Caption t={t} from={0.35} to={2.9} text="VOCÊ JÁ SE PERDEU DE QUEM AMA?" y="50%" size={92} />
            <Caption t={t} from={8.2} to={11.4} text="ESSE É O CIRO. E ELE ACABOU DE SE PERDER." y="82%" size={64} />
          </>
        }
      >
        <group position={[0, 0, dolly]}>
          {/* Ciro, alone, looking back toward where the school was */}
          <Fish variant={CIRO} time={t} expr="triste" mouth="frown" swim={0.12} swimSpeed={0.6}
            position={[-0.6, -0.1 + bob, 0]} rotation={[0.05, -0.38, 0]} scale={1.9} />
          {/* the school: a few specks far away, drifting off */}
          {Array.from({ length: 9 }).map((_, i) => (
            <Fish key={i} variant={CIRO} time={t + i} finTip={null} swim={0.3} swimSpeed={1.2}
              position={[7 + (i % 3) * 1.1 + t * 0.55, 0.6 + (Math.floor(i / 3) - 1) * 0.7, -26 - (i % 2) * 2]}
              rotation={[0, -0.2, 0]} scale={1.4} />
          ))}
          {/* a few ambient bubbles */}
          {Array.from({ length: 14 }).map((_, i) => (
            <Bubble key={i} r={0.05 + rnd(i) * 0.12} opacity={0.35}
              position={[-6 + rnd(i, 1) * 12, ((t * (0.25 + rnd(i, 2) * 0.35) + rnd(i, 3) * 9) % 9) - 4.5, -2 + rnd(i, 4) * 3]} />
          ))}
        </group>
      </Stage>
    </AbsoluteFill>
  );
};

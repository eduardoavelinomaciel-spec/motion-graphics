import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Stage } from "./Stage";
import { Marisa } from "../characters/Marisa";
import { Polvo } from "../characters/Polvo";
import { Seahorse } from "../characters/Seahorse";
import { C } from "../lib/palette";

export const Test: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return (
    <Stage camZ={9} camY={0.6}>
      <Marisa time={t} position={[-2.6, 0, 0]} rotation={[0.25, -0.6, 0]} />
      <Polvo time={t} position={[1.2, -0.6, 0]} rotation={[0.15, 0, 0]} />
      <Seahorse time={t} color={C.seahorses[0]} position={[3.5, -0.3, 0]} rotation={[0, -0.4, 0]} />
    </Stage>
  );
};

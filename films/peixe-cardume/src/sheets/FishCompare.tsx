import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Stage } from "./Stage";
import { Fish, CIRO, MAE } from "../characters/Fish";

export const FishCompare: React.FC = () => {
  const t = useCurrentFrame() / useVideoConfig().fps;
  return (
    <Stage camZ={7} camY={0.2}>
      <Fish variant={CIRO} time={t} expr="alegria" mouth="open" position={[-1.6, 0, 0]} rotation={[0.1, -0.5, 0]} scale={1.6} />
      <Fish variant={MAE} time={t} expr="ternura" position={[1.9, 0, 0]} rotation={[0.1, -0.5, 0]} scale={1.1} />
    </Stage>
  );
};

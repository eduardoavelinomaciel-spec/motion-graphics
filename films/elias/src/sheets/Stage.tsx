import React from "react";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { sceneUniforms } from "../lib/materials";

export const FRONT_LIGHT: [number, number, number] = [0.3, 0.62, 0.85];

// A studio backdrop for model sheets: perspective camera, underwater gradient behind.
export const Stage: React.FC<{
  children: React.ReactNode;
  camZ?: number;
  camY?: number;
  fov?: number;
  silhouette?: boolean;
  background?: string;
  overlay?: React.ReactNode;
}> = ({ children, camZ = 10, camY = 0, fov = 30, silhouette = false, background, overlay }) => {
  const { width, height } = useVideoConfig();
  sceneUniforms.uSilhouette.value = silhouette ? 1 : 0;
  sceneUniforms.uFogDensity.value = 0;
  sceneUniforms.uLightDir.value.set(...FRONT_LIGHT);
  return (
    <AbsoluteFill
      style={{
        background:
          background ??
          (silhouette ? "#f4f1ea" : "radial-gradient(ellipse at 50% 20%, #3fd0dc 0%, #1FB5C9 35%, #0E6E8C 100%)"),
      }}
    >
      <ThreeCanvas
        width={width}
        height={height}
        flat
        linear={false}
        camera={{ position: [0, 0, camZ], fov, near: 0.1, far: 200 }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
      >
        <group position={[0, -camY, 0]}>{children}</group>
      </ThreeCanvas>
      {overlay}
    </AbsoluteFill>
  );
};

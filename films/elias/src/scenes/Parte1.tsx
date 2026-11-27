import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { Titulo } from "./Titulo";
import { Cena1 } from "./Cena1";

export const Parte1: React.FC = () => (
  <AbsoluteFill style={{ background: "#10141f" }}>
    <Sequence from={0} durationInFrames={150}><Titulo /></Sequence>
    <Sequence from={150} durationInFrames={1350}><Cena1 /></Sequence>
    <Audio src={staticFile("audio/parte1.wav")} />
  </AbsoluteFill>
);

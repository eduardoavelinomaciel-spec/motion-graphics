import React from "react";
import { Sequence, staticFile, Audio } from "remotion";
import { Titulo, TITULO_FRAMES } from "./Titulo";
import { Cena1, CENA1_FRAMES } from "./Cena1";

// Título + Cena 1 (film f 0–1500), with the scored audio for the stretch.
export const PARTE1_FRAMES = TITULO_FRAMES + CENA1_FRAMES;

export const Parte1: React.FC<{ audio: boolean }> = ({ audio }) => (
  <>
    <Sequence name="Título" durationInFrames={TITULO_FRAMES}>
      <Titulo />
    </Sequence>
    <Sequence name="Cena 1" from={TITULO_FRAMES} durationInFrames={CENA1_FRAMES}>
      <Cena1 />
    </Sequence>
    {audio ? <Audio src={staticFile("audio/parte1.wav")} /> : null}
  </>
);

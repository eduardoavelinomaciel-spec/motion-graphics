import React from "react";
import { Sequence } from "remotion";
import { Parte1, PARTE1_FRAMES } from "./Parte1";
import { Parte2, PARTE2_FRAMES } from "./Parte2";
import { Parte3, PARTE3_FRAMES } from "./Parte3";

// The whole film so far, part after part, each with its own score.
export const FILME_FRAMES = PARTE1_FRAMES + PARTE2_FRAMES + PARTE3_FRAMES;

export const Filme: React.FC = () => (
  <>
    <Sequence name="Parte 1 · Título + Cena 1" durationInFrames={PARTE1_FRAMES}>
      <Parte1 audio />
    </Sequence>
    <Sequence name="Parte 2 · Cena 2" from={PARTE1_FRAMES} durationInFrames={PARTE2_FRAMES}>
      <Parte2 audio />
    </Sequence>
    <Sequence name="Parte 3 · Cena 3" from={PARTE1_FRAMES + PARTE2_FRAMES} durationInFrames={PARTE3_FRAMES}>
      <Parte3 audio />
    </Sequence>
  </>
);

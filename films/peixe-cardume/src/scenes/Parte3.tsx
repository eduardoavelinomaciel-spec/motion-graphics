import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
import { Cena3, CENA3_FRAMES } from "./Cena3";

// Cena 3 (Dona Marisa) with its score.
export const PARTE3_FRAMES = CENA3_FRAMES;

export const Parte3: React.FC<{ audio: boolean }> = ({ audio }) => (
  <>
    <Sequence name="Cena 3" durationInFrames={CENA3_FRAMES}>
      <Cena3 />
    </Sequence>
    {audio ? <Audio src={staticFile("audio/cena3.wav")} /> : null}
  </>
);

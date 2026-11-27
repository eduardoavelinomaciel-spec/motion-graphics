import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
import { Cena2, CENA2_FRAMES } from "./Cena2";

// Cena 2 (film f 1500–3000) with its score.
export const PARTE2_FRAMES = CENA2_FRAMES;

export const Parte2: React.FC<{ audio: boolean }> = ({ audio }) => (
  <>
    <Sequence name="Cena 2" durationInFrames={CENA2_FRAMES}>
      <Cena2 />
    </Sequence>
    {audio ? <Audio src={staticFile("audio/cena2.wav")} /> : null}
  </>
);

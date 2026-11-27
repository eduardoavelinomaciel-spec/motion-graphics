import React from "react";
import { AbsoluteFill, Sequence, staticFile, Audio, useCurrentFrame, useVideoConfig } from "remotion";
import { Titulo, TITULO_FRAMES } from "./Titulo";
import { Cena1, CENA1_FRAMES } from "./Cena1";
import { Abertura, ABERTURA_FRAMES } from "./Abertura";
import { Caption, fontCss } from "./common";

// Gancho (pergunta direta) + Título + Cena 1, com o áudio de cada trecho.
export const PARTE1_FRAMES = ABERTURA_FRAMES + TITULO_FRAMES + CENA1_FRAMES;

const BolhaCard: React.FC = () => {
  const t = useCurrentFrame() / useVideoConfig().fps;
  return (
    <AbsoluteFill>
      <style>{fontCss}</style>
      <Caption t={t} from={0.3} to={2.6} text="TUDO COMEÇOU COM UMA BOLHA…" x="50%" y="84%" size={60} />
    </AbsoluteFill>
  );
};

export const Parte1: React.FC<{ audio: boolean }> = ({ audio }) => (
  <>
    <Sequence name="Gancho" durationInFrames={ABERTURA_FRAMES}>
      <Abertura />
    </Sequence>
    <Sequence name="Título" from={ABERTURA_FRAMES} durationInFrames={TITULO_FRAMES}>
      <Titulo />
      <BolhaCard />
    </Sequence>
    <Sequence name="Cena 1" from={ABERTURA_FRAMES + TITULO_FRAMES} durationInFrames={CENA1_FRAMES}>
      <Cena1 />
    </Sequence>
    {audio ? (
      <>
        <Sequence name="Áudio gancho" durationInFrames={ABERTURA_FRAMES}>
          <Audio src={staticFile("audio/gancho.wav")} />
        </Sequence>
        <Sequence name="Áudio título e cena 1" from={ABERTURA_FRAMES}>
          <Audio src={staticFile("audio/parte1.wav")} />
        </Sequence>
      </>
    ) : null}
  </>
);

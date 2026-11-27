import React from "react";
import { Composition, Folder, Still } from "remotion";
import { Test } from "./sheets/Test";
import { ModelSheet } from "./sheets/ModelSheet";
import { Expressions } from "./sheets/Expressions";
import { Cena1, CENA1_FRAMES } from "./scenes/Cena1";
import { Titulo, TITULO_FRAMES } from "./scenes/Titulo";
import { Parte1, PARTE1_FRAMES } from "./scenes/Parte1";

export const RemotionRoot: React.FC = () => (
  <>
    <Folder name="Ficha">
      <Still id="Ficha" component={ModelSheet} width={1920} height={1080} defaultProps={{ silhouette: false }} />
      <Still id="Silhueta" component={ModelSheet} width={1920} height={1080} defaultProps={{ silhouette: true }} />
      <Still id="Expressoes" component={Expressions} width={1920} height={1080} />
    </Folder>
    <Folder name="Cenas">
      <Composition id="Titulo" component={Titulo} width={1920} height={1080} fps={30} durationInFrames={TITULO_FRAMES} />
      <Composition id="Cena1" component={Cena1} width={1920} height={1080} fps={30} durationInFrames={CENA1_FRAMES} />
    </Folder>
    <Composition id="Parte1" component={Parte1} width={1920} height={1080} fps={30} durationInFrames={PARTE1_FRAMES} defaultProps={{ audio: true }} />
    <Folder name="Dev">
      <Composition id="Test" component={Test} width={1280} height={720} fps={30} durationInFrames={60} />
    </Folder>
  </>
);

import React from "react";
import { Composition, Folder, Still } from "remotion";
import { Test } from "./sheets/Test";
import { ModelSheet } from "./sheets/ModelSheet";
import { Expressions } from "./sheets/Expressions";
import { Cena1, CENA1_FRAMES } from "./scenes/Cena1";
import { Titulo, TITULO_FRAMES } from "./scenes/Titulo";
import { Parte1, PARTE1_FRAMES } from "./scenes/Parte1";
import { CiroViews, MaeViews, CiroSil, MaeSil, CiroExpr } from "./sheets/Ficha";
import { MarisaViews, MarisaSil, PolvoViews, PolvoSil, SeahorseSheet } from "./sheets/Ficha2";
import { Abertura, ABERTURA_FRAMES } from "./scenes/Abertura";
import { FishCompare } from "./sheets/FishCompare";

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
      <Composition id="FishCompare" component={FishCompare} width={1280} height={720} fps={30} durationInFrames={60} />
    </Folder>
    <Folder name="Gancho">
      <Composition id="Abertura" component={Abertura} width={1920} height={1080} fps={30} durationInFrames={ABERTURA_FRAMES} />
    </Folder>
    <Folder name="Fichas">
      <Composition id="CiroViews" component={CiroViews} width={1920} height={1080} fps={30} durationInFrames={60} />
      <Composition id="MaeViews" component={MaeViews} width={1920} height={1080} fps={30} durationInFrames={60} />
      <Composition id="CiroSil" component={CiroSil} width={1920} height={1080} fps={30} durationInFrames={60} />
      <Composition id="MaeSil" component={MaeSil} width={1920} height={1080} fps={30} durationInFrames={60} />
      <Composition id="CiroExpr" component={CiroExpr} width={1920} height={1080} fps={30} durationInFrames={60} />
      <Composition id="MarisaViews" component={MarisaViews} width={1920} height={1080} fps={30} durationInFrames={60} />
      <Composition id="MarisaSil" component={MarisaSil} width={1920} height={1080} fps={30} durationInFrames={60} />
      <Composition id="PolvoViews" component={PolvoViews} width={1920} height={1080} fps={30} durationInFrames={60} />
      <Composition id="PolvoSil" component={PolvoSil} width={1920} height={1080} fps={30} durationInFrames={60} />
      <Composition id="SeahorseSheet" component={SeahorseSheet} width={1920} height={1080} fps={30} durationInFrames={60} />
    </Folder>
  </>
);

import React from "react";
import { Composition, Folder, Still } from "remotion";
import { Parte1 } from "./scenes/Parte1";
import { Titulo } from "./scenes/Titulo";
import { Cena1 } from "./scenes/Cena1";
import { Equipe, Expressoes, One } from "./sheets/Cast";

export const RemotionRoot: React.FC = () => (
  <>
    <Folder name="Ficha">
      <Still id="Equipe" component={Equipe} width={1920} height={1080} />
      <Still id="Expressoes" component={Expressoes} width={1920} height={1080} />
      <Still id="EquipeSil" component={Equipe} width={1920} height={1080} defaultProps={{ silhouette: true }} />
    </Folder>
    <Folder name="Filme">
      <Composition id="Titulo" component={Titulo} width={1920} height={1080} fps={30} durationInFrames={150} />
      <Composition id="Parte1" component={Parte1} width={1920} height={1080} fps={30} durationInFrames={1500} />
      <Composition id="Cena1" component={Cena1} width={1920} height={1080} fps={30} durationInFrames={1350} />
    </Folder>
    <Folder name="Dev">
      <Still id="Elias1" component={One} width={960} height={1080} defaultProps={{ who: "elias" }} />
      <Still id="Rita1" component={One} width={960} height={1080} defaultProps={{ who: "rita" }} />
      <Still id="Antonio1" component={One} width={960} height={1080} defaultProps={{ who: "antonio" }} />
      <Still id="Bia1" component={One} width={960} height={1080} defaultProps={{ who: "bia" }} />
      <Still id="Jorge1" component={One} width={960} height={1080} defaultProps={{ who: "jorge" }} />
    </Folder>
  </>
);

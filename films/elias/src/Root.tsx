import React from "react";
import { Folder, Still } from "remotion";
import { Equipe, Expressoes, One } from "./sheets/Cast";

export const RemotionRoot: React.FC = () => (
  <>
    <Folder name="Ficha">
      <Still id="Equipe" component={Equipe} width={1920} height={1080} />
      <Still id="Expressoes" component={Expressoes} width={1920} height={1080} />
      <Still id="EquipeSil" component={Equipe} width={1920} height={1080} defaultProps={{ silhouette: true }} />
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

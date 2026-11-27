import React from "react";
import { Composition, Folder } from "remotion";
import { Test } from "./sheets/Test";
import { CiroViews, MaeViews, CiroSil, MaeSil, CiroExpr } from "./sheets/Ficha";
import { FishCompare } from "./sheets/FishCompare";

export const RemotionRoot: React.FC = () => (
  <>
    <Folder name="Dev">
      <Composition id="Test" component={Test} width={1280} height={720} fps={30} durationInFrames={60} />
      <Composition id="FishCompare" component={FishCompare} width={1280} height={720} fps={30} durationInFrames={60} />
    </Folder>
    <Folder name="Fichas">
      <Composition id="CiroViews" component={CiroViews} width={1920} height={1080} fps={30} durationInFrames={60} />
      <Composition id="MaeViews" component={MaeViews} width={1920} height={1080} fps={30} durationInFrames={60} />
      <Composition id="CiroSil" component={CiroSil} width={1920} height={1080} fps={30} durationInFrames={60} />
      <Composition id="MaeSil" component={MaeSil} width={1920} height={1080} fps={30} durationInFrames={60} />
      <Composition id="CiroExpr" component={CiroExpr} width={1920} height={1080} fps={30} durationInFrames={60} />
    </Folder>
  </>
);

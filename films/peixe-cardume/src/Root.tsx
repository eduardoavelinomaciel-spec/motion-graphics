import React from "react";
import { Composition, Folder } from "remotion";
import { Test } from "./sheets/Test";
import { FishCompare } from "./sheets/FishCompare";

export const RemotionRoot: React.FC = () => (
  <>
    <Folder name="Dev">
      <Composition id="Test" component={Test} width={1280} height={720} fps={30} durationInFrames={60} />
      <Composition id="FishCompare" component={FishCompare} width={1280} height={720} fps={30} durationInFrames={60} />
    </Folder>
  </>
);

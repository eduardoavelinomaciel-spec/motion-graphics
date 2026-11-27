import React from "react";
import { AbsoluteFill, staticFile } from "remotion";
import { Stage } from "./Stage";
import { Marisa } from "../characters/Marisa";
import { Polvo } from "../characters/Polvo";
import { Seahorse } from "../characters/Seahorse";
import { C } from "../lib/palette";

const font = `
@font-face{font-family:Bangers;src:url(${staticFile("fonts/bangers-latin-400-normal.woff2")})}
@font-face{font-family:Nunito;font-weight:800;src:url(${staticFile("fonts/nunito-latin-800-normal.woff2")})}
`;
const Label: React.FC<{ x: number; y: number; text: string; color: string; size?: number }> = ({ x, y, text, color, size = 34 }) => (
  <div style={{ position: "absolute", left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-50%)", fontFamily: "Nunito", fontWeight: 800, fontSize: size, color, textShadow: color === "#fff" ? "0 2px 6px rgba(0,0,0,.45)" : "none", whiteSpace: "nowrap" }}>{text}</div>
);
const Title: React.FC<{ text: string; color: string }> = ({ text, color }) => (
  <div style={{ position: "absolute", left: 60, top: 36, fontFamily: "Bangers", fontSize: 76, color, letterSpacing: 2, textShadow: color === "#fff" ? "0 4px 0 #10141f" : "none" }}>{text}</div>
);

const VIEWS: [number, number, number][] = [[0.0, 0, 0], [0.12, -0.55, 0], [0.05, -1.25, 0]];
const NAMES = ["LATERAL", "3/4", "QUASE DE FRENTE"];

const Sheet: React.FC<{ title: string; sil: boolean; scale: number; y?: number; render: (r: [number, number, number], x: number, i: number) => React.ReactNode }> = ({ title, sil, render, y = 0 }) => {
  const ink = sil ? "#10141f" : "#fff";
  return (
    <AbsoluteFill>
      <style>{font}</style>
      <Stage camZ={10} silhouette={sil} overlay={<><Title text={`${title}${sil ? " · SILHUETA" : ""}`} color={ink} />{NAMES.map((n, i) => <Label key={n} x={50 + (i - 1) * 29.6} y={88} text={n} color={ink} />)}</>}>
        <group position={[0, y, 0]}>{VIEWS.map((r, i) => render(r, -3 + i * 3, i))}</group>
      </Stage>
    </AbsoluteFill>
  );
};

export const MarisaViews = () => <Sheet title="DONA MARISA" sil={false} scale={1} render={(r, x, i) => <Marisa key={i} time={0.5} expr="calma" position={[x, 0, 0]} rotation={[r[0] + 0.15, r[1] - 0.2, 0]} scale={0.74} />} />;
export const MarisaSil = () => <Sheet title="DONA MARISA" sil scale={1} render={(r, x, i) => <Marisa key={i} time={0.5} expr="calma" position={[x, 0, 0]} rotation={[r[0] + 0.15, r[1] - 0.2, 0]} scale={0.74} />} />;
export const PolvoViews = () => <Sheet title="POLVO" sil={false} scale={1} y={-0.3} render={(r, x, i) => <Polvo key={i} time={0.5} expr="curioso" position={[x, 0, 0]} rotation={[0.1, r[1] * 1.3, 0]} scale={0.95} />} />;
export const PolvoSil = () => <Sheet title="POLVO" sil scale={1} y={-0.3} render={(r, x, i) => <Polvo key={i} time={0.5} expr="curioso" position={[x, 0, 0]} rotation={[0.1, r[1] * 1.3, 0]} scale={0.95} />} />;

const HN = ["ROSA", "MENTA", "AMARELO", "LILÁS", "PÊSSEGO"];
export const SeahorseSheet = () => (
  <AbsoluteFill>
    <style>{font}</style>
    <Stage camZ={10} overlay={<><Title text="CAVALOS-MARINHOS" color="#fff" />{HN.map((n, i) => <Label key={n} x={14 + i * 18} y={86} text={`${n} ${C.seahorses[i]}`} color="#fff" size={26} />)}</>}>
      {C.seahorses.map((c, i) => (
        <Seahorse key={c} time={0.5} color={c} phase={i * 1.3} expr={["curioso", "neutro", "alegria", "ternura", "estrela"][i]} position={[-3.6 + i * 1.8, -0.1, 0]} rotation={[0, -0.4, 0]} scale={1.05} />
      ))}
    </Stage>
  </AbsoluteFill>
);

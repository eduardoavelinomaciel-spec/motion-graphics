import React from "react";
import { AbsoluteFill, staticFile } from "remotion";
import { Stage } from "./Stage";
import { Fish, CIRO, MAE, Mouth } from "../characters/Fish";

const font = `
@font-face{font-family:Bangers;src:url(${staticFile("fonts/bangers-latin-400-normal.woff2")})}
@font-face{font-family:Nunito;font-weight:800;src:url(${staticFile("fonts/nunito-latin-800-normal.woff2")})}
`;

const Label: React.FC<{ x: number; y: number; text: string; size?: number; color?: string }> = ({ x, y, text, size = 34, color = "#fff" }) => (
  <div style={{ position: "absolute", left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-50%)", fontFamily: "Nunito", fontWeight: 800, fontSize: size, color, textShadow: color === "#fff" ? "0 2px 6px rgba(0,0,0,.45)" : "none", whiteSpace: "nowrap" }}>
    {text}
  </div>
);
const Title: React.FC<{ text: string; color?: string }> = ({ text, color = "#fff" }) => (
  <div style={{ position: "absolute", left: 60, top: 36, fontFamily: "Bangers", fontSize: 76, color, letterSpacing: 2, textShadow: color === "#fff" ? "0 4px 0 #10141f" : "none" }}>{text}</div>
);

const V: [number, number, number][] = [
  [0.0, 0, 0], // side
  [0.12, -0.55, 0], // 3/4
  [0.05, -1.25, 0], // near front
];
const NAMES = ["LATERAL", "3/4", "QUASE DE FRENTE"];

// views of one character on stage
const Views: React.FC<{ who: "ciro" | "mae"; sil?: boolean }> = ({ who, sil = false }) => {
  const variant = who === "ciro" ? CIRO : MAE;
  const sc = who === "ciro" ? 1.3 : 0.78;
  const mouth: Mouth = "smile";
  const title = who === "ciro" ? "CIRO" : "A MÃE";
  const ink = sil ? "#10141f" : "#fff";
  return (
    <AbsoluteFill>
      <style>{font}</style>
      <Stage camZ={10} silhouette={sil} overlay={
        <>
          <Title text={`${title}${sil ? " · SILHUETA" : ""}`} color={ink} />
          {NAMES.map((n, i) => <Label key={n} x={50 + (i - 1) * 29.6} y={86} text={n} color={ink} />)}
        </>
      }>
        {V.map((r, i) => (
          <Fish key={i} variant={variant} time={0.4} expr={who === "ciro" ? "curioso" : "ternura"} mouth={mouth} swim={0.25}
            position={[-3 + i * 3, 0, 0]} rotation={r} scale={sc} />
        ))}
      </Stage>
    </AbsoluteFill>
  );
};
export const CiroViews = () => <Views who="ciro" />;
export const MaeViews = () => <Views who="mae" />;
export const CiroSil = () => <Views who="ciro" sil />;
export const MaeSil = () => <Views who="mae" sil />;

const EXPRS: [string, Mouth][] = [
  ["neutro", "smile"], ["curioso", "smile"], ["triste", "frown"], ["choro", "frown"],
  ["alegria", "open"], ["susto", "o"], ["ternura", "smile"], ["estrela", "grin"],
  ["calma", "smile"], ["sonolento", "flat"], ["fechado", "flat"],
];
export const CiroExpr = () => (
  <AbsoluteFill>
    <style>{font}</style>
    <Stage camZ={10} overlay={
      <>
        <Title text="CIRO · EXPRESSÕES" />
        {EXPRS.map(([n], i) => <Label key={n} x={14.4 + (i % 4) * 23.9} y={[41, 67, 92.5][Math.floor(i / 4)]} text={n.toUpperCase()} size={30} />)}
      </>
    }>
      {EXPRS.map(([n, m], i) => (
        <Fish key={n} time={0.4} expr={n} mouth={m} swim={0.15}
          position={[-3.4 + (i % 4) * 2.28, 1.2 - Math.floor(i / 4) * 1.38, 0]} rotation={[0.08, -0.5, 0]} scale={0.72} />
      ))}
    </Stage>
  </AbsoluteFill>
);

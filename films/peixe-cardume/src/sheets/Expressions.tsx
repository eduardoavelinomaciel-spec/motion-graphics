import React from "react";
import { Stage } from "./Stage";
import { Fish, MAE, Mouth } from "../characters/Fish";
import { ensureFonts, HQ, UI } from "../lib/fonts";

const PX = 1080 / (2 * 12 * Math.tan((15 * Math.PI) / 180));

const LIST: { e: string; label: string; mouth: Mouth }[] = [
  { e: "neutro", label: "neutro", mouth: "smile" },
  { e: "curioso", label: "curioso", mouth: "o" },
  { e: "triste", label: "triste", mouth: "frown" },
  { e: "choro", label: "choro", mouth: "frown" },
  { e: "alegria", label: "alegria", mouth: "grin" },
  { e: "susto", label: "susto", mouth: "o" },
  { e: "ternura", label: "ternura", mouth: "smile" },
  { e: "estrela", label: "estrela (cena 1)", mouth: "grin" },
];

export const Expressions: React.FC = () => {
  ensureFonts();
  const pos = (i: number): [number, number, number] => [-4.8 + (i % 4) * 2.75, i < 4 ? 1.6 : -1.5, 0];
  return (
    <Stage
      camZ={12}
      overlay={
        <>
          <div style={{ position: "absolute", left: 60, top: 30, fontFamily: HQ, fontSize: 50, color: "#fff", textShadow: "0 4px 0 #0b3d5c" }}>
            Ciro — 7 expressões + pupilas de estrela
          </div>
          {LIST.map((l, i) => {
            const [x, y] = pos(i);
            return (
              <div key={l.e} style={{ position: "absolute", left: 960 + x * PX - 150, top: 540 - (y - 1.0) * PX, width: 300, textAlign: "center", fontFamily: UI, fontWeight: 800, fontSize: 26, color: "#fff", textShadow: "0 2px 0 #0b3d5c" }}>
                {l.label}
              </div>
            );
          })}
        </>
      }
    >
      {LIST.map((l, i) => (
        <Fish key={l.e} time={0.3} position={pos(i)} rotation={[0, -0.5, 0]} expr={l.e} mouth={l.mouth} scale={1.25} swim={0.2} />
      ))}
      <group userData={{ v: MAE.len }} />
    </Stage>
  );
};

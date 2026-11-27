import React from "react";
import { Stage } from "./Stage";
import { CIRO, Fish, MAE } from "../characters/Fish";
import { Marisa } from "../characters/Marisa";
import { Polvo } from "../characters/Polvo";
import { Seahorse } from "../characters/Seahorse";
import { C } from "../lib/palette";
import { ensureFonts, HQ, UI } from "../lib/fonts";

// camZ 16, fov 30 → ~126 px per world unit on the z=0 plane at 1920×1080
const PX = 1080 / (2 * 16 * Math.tan((15 * Math.PI) / 180));
const sx = (x: number) => 960 + x * PX;
const sy = (y: number) => 540 - y * PX;

const Label: React.FC<{ x: number; y: number; name: string; color: string; hex: string; note: string; silhouette: boolean }> = ({
  x, y, name, color, hex, note, silhouette,
}) => (
  <div style={{ position: "absolute", left: sx(x) - 180, top: sy(y), width: 360, textAlign: "center", color: silhouette ? "#222" : "#fff", fontFamily: UI }}>
    <div style={{ fontFamily: HQ, fontSize: 40, letterSpacing: 1, textShadow: silhouette ? "none" : "0 3px 0 #0b3d5c" }}>{name}</div>
    {silhouette ? null : (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 19, fontWeight: 800 }}>
        <span style={{ width: 22, height: 22, borderRadius: 11, background: color, border: "3px solid #10141f", display: "inline-block" }} />
        {hex}
      </div>
    )}
    {silhouette ? null : <div style={{ fontSize: 17, opacity: 0.92, marginTop: 4, lineHeight: 1.25 }}>{note}</div>}
  </div>
);

export const ModelSheet: React.FC<{ silhouette: boolean }> = ({ silhouette }) => {
  ensureFonts();
  const t = 0.35;
  return (
    <Stage
      camZ={16}
      silhouette={silhouette}
      overlay={
        <>
          <div style={{ position: "absolute", left: 60, top: 36, fontFamily: HQ, fontSize: 54, color: silhouette ? "#222" : "#fff", textShadow: silhouette ? "none" : "0 4px 0 #0b3d5c" }}>
            O Peixe que se Perdeu do Cardume — {silhouette ? "teste de silhueta" : "ficha de personagens"}
          </div>
          <Label x={-5.7} y={-0.25} name="Ciro" color={C.ciroBlue} hex="#2EC5FF" note="O menor. Inclina o corpo quando curioso." silhouette={silhouette} />
          <Label x={-2.5} y={-0.25} name="Mãe" color={C.ciroBlue} hex="#2EC5FF" note="Mesma ponta azul. Encosta a nadadeira." silhouette={silhouette} />
          <Label x={1.4} y={-0.25} name="Dona Marisa" color={C.marisa} hex="#6B8F4E" note="Pisca devagar, os dois olhos: pode confiar." silhouette={silhouette} />
          <Label x={5.6} y={-0.25} name="Polvo" color={C.polvo} hex="#A77BE0" note="Muda de cor. Jazz hands com 8 braços." silhouette={silhouette} />
          <Label x={-3.3} y={-3.55} name="Cavalos-marinhos" color={C.seahorses[0]} hex="5 pastéis" note="Cada um nada torto do seu jeito." silhouette={silhouette} />
          {silhouette ? null : (
            <div style={{ position: "absolute", left: sx(1.2), top: sy(-1.55), width: 760, color: "#fff", fontFamily: UI, fontSize: 21, lineHeight: 1.45 }}>
              <div style={{ fontFamily: HQ, fontSize: 34, marginBottom: 6 }}>Regras do visual</div>
              Toon de 3 tons + contorno de tinta (casca invertida) · olhos de anime desenhados por shader,
              trocam de expressão por frame · ponta azul-elétrica nas duas nadadeiras peitorais de Ciro e da Mãe
              (é ela que se toca nas cenas 1 e 7) · Ciro arredondado e de cauda curta; a Mãe mais longa, cauda
              bifurcada, cílios.
            </div>
          )}
        </>
      }
    >
      <Fish time={t} position={[-5.7, 1.2, 0]} rotation={[0, -0.45, 0]} scale={1.2} expr="curioso" lean={0.2} />
      <Fish variant={MAE} time={t} position={[-2.5, 1.2, 0]} rotation={[0, -0.5, 0]} expr="calma" scale={1.05} />
      <Marisa time={t} position={[1.4, 0.75, 0]} rotation={[0.3, -0.55, 0]} scale={0.95} />
      <Polvo time={t} position={[5.6, 0.25, 0]} rotation={[0.12, -0.2, 0]} scale={0.95} jazz={0.45} />
      {C.seahorses.map((c, i) => (
        <Seahorse key={c} time={t} color={c} phase={i} position={[-6.1 + i * 1.4, -2.75, 0]} rotation={[0, -0.35, (i - 2) * 0.12]} scale={0.95} />
      ))}
      <group userData={{ ciro: CIRO.len }} />
    </Stage>
  );
};

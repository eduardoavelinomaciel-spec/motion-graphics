import React from "react";
import { Stage } from "./Stage";
import { Elias, Rita, Antonio, Bia, Jorge } from "../characters/cast";
import { Pose } from "../characters/Human";

export const POSES: Record<string, Pose> = {
  elias: { lean: 0.05, head: [0.04, 0, 0.06], expr: "calma", mouth: "smile", rArm: { f: 0.45, o: -0.28, e: 2.15, t: 0.0 }, lArm: { f: 0.0, o: 0.08, e: 0.12 } },
  rita: { lean: 0.03, head: [0.12, 0, 0.0], expr: "choro", mouth: "sad", rArm: { f: 0.75, o: -0.1, e: 1.5 }, lArm: { f: 0.75, o: -0.1, e: 1.5 } },
  antonio: { lean: 0.02, head: [0.0, 0, 0], expr: "susto", mouth: "o", rArm: { f: 0.2, o: 0.7, e: 2.3 }, lArm: { f: 0.2, o: 0.7, e: 2.3 } },
  bia: { head: [0.1, 0, 0.1], expr: "triste", mouth: "sad", rArm: { f: 0.2, o: 0.2, e: 0.5 }, lArm: { f: 0.0, o: 0.1, e: 0.1 } },
  jorge: { lean: 0.2, head: [0.12, 0, 0], expr: "calma", mouth: "closed", rArm: { f: 0.05, o: 0.05, e: 0.1 }, lArm: { f: 0.35, o: -0.15, e: 1.2 } },
};

const Y = 0.55;
export const Equipe: React.FC<{ silhouette?: boolean }> = ({ silhouette = false }) => (
  <>
  <Stage camZ={11.5} camY={1.75} fov={30} silhouette={silhouette} background={silhouette ? undefined : "linear-gradient(#cfe1f0 0%, #BFD7EA 60%, #9fbbd3 100%)"}>
    <Elias position={[-4.2, 0, 0]} rotation={[0, Y, 0]} pose={POSES.elias} />
    <Rita position={[-2.1, 0, 0]} rotation={[0, Y, 0]} pose={POSES.rita} box />
    <Antonio position={[0.25, 0, 0]} rotation={[0, Y, 0]} pose={POSES.antonio} />
    <Bia position={[2.3, 0, 0]} rotation={[0, Y, 0]} pose={POSES.bia} />
    <Jorge position={[4.2, 0, 0]} rotation={[0, Y, 0]} pose={POSES.jorge} />
  </Stage>
  <FichaLabels title={silhouette ? "TESTE DE SILHUETA" : undefined} />
  </>
);

export const One: React.FC<{ who: "elias" | "rita" | "antonio" | "bia" | "jorge"; yaw?: number }> = ({ who, yaw = 0.5 }) => {
  const C = { elias: Elias, rita: Rita, antonio: Antonio, bia: Bia, jorge: Jorge }[who] as React.FC<any>;
  return (
    <Stage camZ={9} camY={1.75} fov={30} background="linear-gradient(#cfe1f0, #9fbbd3)">
      <C position={[0, 0, 0]} rotation={[0, yaw, 0]} pose={POSES[who]} box={who === "rita"} />
    </Stage>
  );
};

/* ----------------------------------------------------------- rótulos */
import { AbsoluteFill } from "remotion";
import { ensureFonts, HQ, UI } from "../lib/fonts";
import { ANTONIO, BIA, ELIAS, JORGE, RITA } from "../characters/cast";
import { headCenterY, HumanSpec } from "../characters/Human";
import { C } from "../lib/palette";

const PX = 1080 / (2 * 11.5 * Math.tan((15 * Math.PI) / 180));
const LABELS = [
  { x: -4.2, name: "ELIAS", cor: null, g: "Mão no peito quando sente alguém", l: "Violão dedilhado, 6 notas", d: "40 e poucos · sobretudo bege · cachecol cinza · grisalho nas têmporas" },
  { x: -2.1, name: "RITA", cor: C.tristeza, g: "Aperta a caixa contra o peito", l: "—", d: "30 anos · blazer · crachá · caixa de papelão" },
  { x: 0.25, name: "SEU ANTÔNIO", cor: C.pressa, g: "Mãos na cabeça", l: "—", d: "Padeiro robusto · avental com farinha · bigode" },
  { x: 2.3, name: "BIA", cor: C.medo, g: "Segura uma fita sem balão", l: "—", d: "6 anos · tranças · galochas amarelas" },
  { x: 4.2, name: "SEU JORGE", cor: C.luto, g: "Gira a aliança no dedo", l: "—", d: "75 anos · chapéu · aliança larga · terno antigo" },
];

export const FichaLabels: React.FC<{ title?: string }> = ({ title = "O HOMEM QUE SENTIA TUDO · FICHA DE PERSONAGENS" }) => {
  ensureFonts();
  return (
    <AbsoluteFill style={{ fontFamily: UI, color: C.ink }}>
      <div style={{ position: "absolute", left: 50, top: 34, fontFamily: HQ, fontSize: 54, letterSpacing: 2, textShadow: "3px 3px 0 #fff8" }}>{title}</div>
      {LABELS.map((l) => (
        <div key={l.name} style={{ position: "absolute", left: 960 + l.x * PX - 175, width: 350, top: 872, textAlign: "center", fontSize: 19, lineHeight: 1.25 }}>
          <div style={{ fontFamily: HQ, fontSize: 38, letterSpacing: 1.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            {l.name}
            <span style={{ width: 26, height: 26, borderRadius: 13, border: `3px solid ${C.ink}`, background: l.cor ?? "repeating-linear-gradient(45deg,#fff 0 4px,#ccd 4px 8px)" }} />
          </div>
          <div style={{ fontWeight: 800 }}>{l.g}</div>
          <div style={{ opacity: 0.75 }}>{l.d}</div>
        </div>
      ))}
      <div style={{ position: "absolute", left: 50, top: 100, fontSize: 21, fontWeight: 800, opacity: 0.8 }}>
        Círculo = cor da aura (emoção) · Elias não tem aura (hachurado): é o mistério da história
      </div>
    </AbsoluteFill>
  );
};

/* ----------------------------------------------------- folha de expressões */
const CELLS: { who: "elias" | "rita" | "antonio" | "bia" | "jorge"; spec: HumanSpec; expr: string; mouth: Pose["mouth"]; label: string }[] = [
  { who: "elias", spec: ELIAS, expr: "neutro", mouth: "closed", label: "Elias · neutro" },
  { who: "elias", spec: ELIAS, expr: "curioso", mouth: "closed", label: "Elias · atento" },
  { who: "elias", spec: ELIAS, expr: "triste", mouth: "sad", label: "Elias · sente a dor" },
  { who: "elias", spec: ELIAS, expr: "choro", mouth: "sad", label: "Elias · carrega o peso" },
  { who: "elias", spec: ELIAS, expr: "alegria", mouth: "smile", label: "Elias · sorri" },
  { who: "elias", spec: ELIAS, expr: "susto", mouth: "o", label: "Elias · surpresa" },
  { who: "elias", spec: ELIAS, expr: "ternura", mouth: "smile", label: "Elias · ternura" },
  { who: "elias", spec: ELIAS, expr: "estrela", mouth: "open", label: "Elias · alívio" },
  { who: "rita", spec: RITA, expr: "choro", mouth: "sad", label: "Rita · chora" },
  { who: "antonio", spec: ANTONIO, expr: "alegria", mouth: "grin", label: "Antônio · sorri" },
  { who: "bia", spec: BIA, expr: "choro", mouth: "sad", label: "Bia · chora" },
  { who: "jorge", spec: JORGE, expr: "calma", mouth: "closed", label: "Jorge · olha o lago" },
];
const COMP = { elias: Elias, rita: Rita, antonio: Antonio, bia: Bia, jorge: Jorge } as Record<string, React.FC<any>>;

export const Expressoes: React.FC = () => {
  ensureFonts();
  const S = 1.45;
  const CW = 2.35;
  const CH = 1.72;
  return (
    <>
      <Stage camZ={10} camY={0} fov={30} background="linear-gradient(#cfe1f0, #a9c3da)">
        {CELLS.map((c, i) => {
          const col = i % 4;
          const row = Math.floor(i / 4);
          const Comp = COMP[c.who];
          const baseScale = c.who === "bia" ? 0.78 : 1;
          const hy = headCenterY(c.spec) * baseScale;
          const k = S / 1;
          return (
            <Comp
              key={i}
              headOnly
              scale={baseScale * k}
              position={[(col - 1.5) * CW, (1 - row) * CH - hy * k + 0.0, 0]}
              rotation={[0, c.who === "elias" ? 0.3 : 0.3, 0]}
              pose={{ expr: c.expr, mouth: c.mouth, head: [0.02, 0, 0] }}
            />
          );
        })}
      </Stage>
      <AbsoluteFill style={{ fontFamily: UI, color: C.ink }}>
        <div style={{ position: "absolute", left: 40, top: 22, fontFamily: HQ, fontSize: 46, letterSpacing: 2 }}>FOLHA DE EXPRESSÕES</div>
        {CELLS.map((c, i) => {
          const col = i % 4;
          const row = Math.floor(i / 4);
          const PXu = 1080 / (2 * 10 * Math.tan((15 * Math.PI) / 180));
          return (
            <div key={i} style={{ position: "absolute", left: 960 + (col - 1.5) * CW * PXu - 150, width: 300, textAlign: "center", top: 540 - ((1 - row) * CH - 0.8) * PXu + 0, fontWeight: 800, fontSize: 22 }}>
              {c.label}
            </div>
          );
        })}
      </AbsoluteFill>
    </>
  );
};

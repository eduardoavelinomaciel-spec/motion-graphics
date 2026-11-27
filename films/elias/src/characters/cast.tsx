import React, { useMemo } from "react";
import * as THREE from "three";
import { Toon } from "../lib/Toon";
import { ellipsoid } from "../lib/geom";
import { capsule, flare, prof, roundBox, tube } from "../lib/body";
import { makeOutline, makeToon, sceneUniforms } from "../lib/materials";
import { Human, HumanSpec, Pose } from "./Human";
import { C } from "../lib/palette";

const T = (color: string, o: { spec?: number; rim?: number; tint?: string; side?: THREE.Side } = {}) =>
  makeToon({ color, shadowK: 1, shadowTint: "#b3a4dc", rim: o.rim ?? 0.28, rimColor: "#f3f7ff", spec: o.spec ?? 0, side: o.side });
const INK = () => new THREE.MeshBasicMaterial({ color: C.ink });

type CharProps = { headOnly?: boolean; pose?: Pose; position?: [number, number, number]; rotation?: [number, number, number]; scale?: number };

/* ------------------------------------------------------------------ ELIAS */
export const ELIAS: HumanSpec = {
  skin: "#EBC09A",
  brow: "#3a2c24",
  iris: "#8a6a3c",
  irisDark: "#3b2a14",
  shoulder: 0.37,
  chest: 0.28,
  waist: 0.25,
  hip: 0.3,
  depth: 0.19,
  limb: 0.9,
  top: "#CDB591",
  topShadow: "#8d8aa8",
  sleeve: 1,
  sleeveFat: 1.28,
  pants: "#4A4F5C",
  shoe: "#3A2A22",
};

export const Elias: React.FC<CharProps> = ({ scale = 1, ...rest }) => {
  const m = useMemo(() => {
    const ol = makeOutline(0.022 / scale);
    const olS = makeOutline(0.012 / scale);
    return {
      coat: T(ELIAS.top, { }),
      coatDark: T("#a28f6c", { }),
      scarf: T("#8A8F98", { rim: 0.3 }),
      scarfL: T("#a3a8b0", { }),
      hair: T("#3a2c24", { rim: 0.08 }),
      grey: T("#c3c6cc", { }),
      ink: INK(),
      ol,
      olS,
      skirt: flare(1.1, prof([[0, 0.3], [0.35, 0.34], [1, 0.47]]), prof([[0, 0.225], [1, 0.34]])),
      collar: new THREE.TorusGeometry(0.15, 0.055, 14, 32),
      scarfRing: new THREE.TorusGeometry(0.15, 0.075, 14, 32),
      tail: capsule(0.8, 0.07, 0.085, 0.35),
      tail2: capsule(0.62, 0.065, 0.08, 0.35),
      seam: tube([[0, 0.1, 0.34], [0, -0.4, 0.37], [0, -1.0, 0.345]], 0.009),
      button: ellipsoid(0.028, 0.028, 0.016, 12, 8),
      hairBack: ellipsoid(0.295, 0.31, 0.3),
      tuft: ellipsoid(0.075, 0.06, 0.06),
      temple: ellipsoid(0.014, 0.05, 0.03),
      lapel: ellipsoid(0.07, 0.2, 0.03),
    };
  }, [scale]);
  return (
    <Human
      spec={ELIAS}
      scale={scale}
      {...rest}
      torso={
        <group>
          <Toon geometry={m.skirt} material={m.coat} outline={m.ol} position={[0, 0.08, 0]} />
          <mesh geometry={m.seam} material={m.ink} position={[0, 0.08, 0]} />
          {[0.55, 0.2, -0.15].map((y, i) => (
            <Toon key={i} geometry={m.button} material={m.coatDark} outline={m.olS} position={[0, y, 0.2 + (y < 0.1 ? 0.15 + (0.1 - y) * 0.08 : 0)]} />
          ))}
          <Toon geometry={m.collar} material={m.coat} outline={m.olS} position={[0, 1.07, 0]} rotation={[Math.PI / 2 - 0.1, 0, 0]} scale={[1.08, 1.0, 1.6]} />
          <Toon geometry={m.scarfRing} material={m.scarf} outline={m.olS} position={[0, 1.13, 0.01]} rotation={[Math.PI / 2 - 0.15, 0, 0]} scale={[1.04, 0.96, 1.15]} />
          <Toon geometry={m.tail} material={m.scarf} outline={m.olS} position={[0.1, 1.04, 0.24]} rotation={[0.18, 0, -0.05]} />
          <Toon geometry={m.tail2} material={m.scarfL} outline={m.olS} position={[-0.02, 1.05, 0.255]} rotation={[0.2, 0, 0.1]} />
        </group>
      }
      head={
        <group>
          <Toon geometry={m.hairBack} material={m.hair} outline={m.ol} position={[0, 0.07, -0.07]} />
          <Toon geometry={m.tuft} material={m.hair} outline={m.olS} position={[0.09, 0.22, 0.12]} rotation={[0.5, 0, -0.5]} />
          <Toon geometry={m.tuft} material={m.hair} outline={m.olS} position={[-0.05, 0.235, 0.13]} rotation={[0.5, 0, 0.3]} />
          <Toon geometry={m.tuft} material={m.hair} outline={m.olS} position={[-0.17, 0.19, 0.1]} rotation={[0.3, 0, 0.8]} />
          <Toon geometry={m.temple} material={m.grey} outline={m.olS} position={[0.245, 0.13, 0.06]} rotation={[0.1, 0.5, -0.1]} />
          <Toon geometry={m.temple} material={m.grey} outline={m.olS} position={[-0.245, 0.13, 0.06]} rotation={[0.1, -0.5, 0.1]} />
        </group>
      }
    />
  );
};

/* ------------------------------------------------------------------- RITA */
export const RITA: HumanSpec = {
  skin: "#D9A07A",
  brow: "#2b1d1a",
  iris: "#6b4630",
  irisDark: "#2a1a10",
  lash: 1,
  shoulder: 0.34,
  chest: 0.27,
  waist: 0.22,
  hip: 0.3,
  depth: 0.17,
  limb: 0.85,
  top: "#46557A",
  topShadow: "#262f56",
  sleeve: 1,
  sleeveFat: 1.15,
  pants: "#2A2F42",
  shoe: "#1c1c24",
};

export const Box: React.FC<{ time?: number }> = () => {
  const g = useMemo(
    () => ({
      box: roundBox(0.95, 0.5, 0.62, 0.05, 0.02),
      flapF: roundBox(0.95, 0.2, 0.03, 0.02, 0.01),
      pot: capsule(0.2, 0.1, 0.075),
      leaf: ellipsoid(0.07, 0.17, 0.02, 14, 10),
      frame: roundBox(0.26, 0.34, 0.03, 0.02, 0.01),
      mug: new THREE.CylinderGeometry(0.075, 0.07, 0.13, 20),
      handle: new THREE.TorusGeometry(0.04, 0.012, 8, 16, Math.PI),
    }),
    [],
  );
  const m = useMemo(
    () => ({
      card: T("#C8996A", { }),
      cardD: T("#b38455", { }),
      pot: T("#C9704A", { }),
      leaf: T("#5DAA5A", { side: THREE.DoubleSide }),
      frame: T("#F1E7D3"),
      photo: T("#8CC5E8"),
      mug: T("#F4F1EA"),
      ol: makeOutline(0.014),
      olS: makeOutline(0.01),
    }),
    [],
  );
  return (
    <group>
      <Toon geometry={g.box} material={m.card} outline={m.ol} />
      <Toon geometry={g.flapF} material={m.cardD} outline={m.olS} position={[0, 0.34, 0.3]} rotation={[-0.8, 0, 0]} />
      <Toon geometry={g.flapF} material={m.cardD} outline={m.olS} position={[0, 0.34, -0.3]} rotation={[0.8, 0, 0]} />
      <Toon geometry={g.pot} material={m.pot} outline={m.olS} position={[-0.2, 0.28, 0.05]} />
      {[-0.5, 0, 0.5].map((a, i) => (
        <Toon key={i} geometry={g.leaf} material={m.leaf} outline={m.olS} position={[-0.2 + a * 0.18, 0.45, 0.05]} rotation={[0, a * 1.2, -a * 0.5]} />
      ))}
      <Toon geometry={g.frame} material={m.frame} outline={m.olS} position={[0.18, 0.43, -0.05]} rotation={[-0.2, -0.3, 0.12]} />
      <Toon geometry={g.mug} material={m.mug} outline={m.olS} position={[0.32, 0.3, 0.12]} />
    </group>
  );
};

export const Rita: React.FC<CharProps & { box?: boolean }> = ({ scale = 1, box = false, ...rest }) => {
  const m = useMemo(() => {
    const ol = makeOutline(0.022 / scale);
    const olS = makeOutline(0.012 / scale);
    return {
      hair: T("#2b1d1a", { rim: 0.08 }),
      skirt: T("#2E3347", { }),
      blouse: T("#F4F1EA"),
      lan: T("#3FA9A0"),
      badge: T("#ffffff"),
      badgeB: T("#4A78C2"),
      tie: T("#d85a6b"),
      ink: INK(),
      ol,
      olS,
      skirtG: flare(0.95, prof([[0, 0.3], [0.3, 0.315], [1, 0.27]]), prof([[0, 0.205], [1, 0.19]])),
      vee: ellipsoid(0.11, 0.17, 0.035, 18, 12),
      badgeG: roundBox(0.15, 0.2, 0.025, 0.03, 0.01),
      stripe: roundBox(0.15, 0.045, 0.03, 0.01, 0.005),
      lanL: tube([[0.09, 1.1, 0.12], [0.07, 0.8, 0.205], [0.015, 0.58, 0.225]], 0.008),
      lanR: tube([[-0.09, 1.1, 0.12], [-0.07, 0.8, 0.205], [-0.015, 0.58, 0.225]], 0.008),
      back: ellipsoid(0.295, 0.31, 0.3),
      bun: ellipsoid(0.115, 0.1, 0.1),
      tieG: new THREE.TorusGeometry(0.1, 0.017, 8, 20),
      strand: capsule(0.4, 0.022, 0.012, 0.6),
      bang: ellipsoid(0.1, 0.075, 0.055),
    };
  }, [scale]);
  return (
    <Human
      spec={RITA}
      scale={scale}
      {...rest}
      torso={
        <group>
          <Toon geometry={m.skirtG} material={m.skirt} outline={m.ol} position={[0, 0.1, 0]} />
          <Toon geometry={m.vee} material={m.blouse} outline={m.olS} position={[0, 0.9, 0.17]} rotation={[0.15, 0, 0]} />
          <mesh geometry={m.lanL} material={m.lan} />
          <mesh geometry={m.lanR} material={m.lan} />
          <Toon geometry={m.badgeG} material={m.badge} outline={m.olS} position={[0, 0.46, 0.225]} rotation={[0.1, 0, 0.06]} />
          <Toon geometry={m.stripe} material={m.badgeB} outline={m.olS} position={[0, 0.53, 0.24]} rotation={[0.1, 0, 0.06]} />
          {box ? (
            <group position={[0, 0.5, 0.52]} rotation={[-0.08, 0, 0]}>
              <Box />
            </group>
          ) : null}
        </group>
      }
      head={
        <group>
          <Toon geometry={m.back} material={m.hair} outline={m.ol} position={[0, 0.07, -0.07]} />
          <Toon geometry={m.bun} material={m.hair} outline={m.olS} position={[0, 0.31, -0.2]} />
          <Toon geometry={m.tieG} material={m.tie} outline={m.olS} position={[0, 0.25, -0.18]} rotation={[0.6, 0, 0]} />
          <Toon geometry={m.bang} material={m.hair} outline={m.olS} position={[0.1, 0.225, 0.14]} rotation={[0.55, 0, -0.55]} />
          <Toon geometry={m.bang} material={m.hair} outline={m.olS} position={[-0.09, 0.23, 0.14]} rotation={[0.55, 0, 0.5]} />

        </group>
      }
    />
  );
};

/* --------------------------------------------------------- SEU ANTÔNIO */
export const ANTONIO: HumanSpec = {
  skin: "#E2A57A",
  brow: "#2e231e",
  iris: "#5a4028",
  irisDark: "#2a1a0c",
  shoulder: 0.52,
  chest: 0.44,
  waist: 0.46,
  hip: 0.42,
  depth: 0.3,
  limb: 1.2,
  top: "#F4F1EA",
  topShadow: "#a6a6c8",
  sleeve: 0.5,
  sleeveColor: "#F4F1EA",
  sleeveFat: 1.05,
  pants: "#3C4252",
  shoe: "#2a2a2a",
};

export const Antonio: React.FC<CharProps> = ({ scale = 1, ...rest }) => {
  const m = useMemo(() => {
    const ol = makeOutline(0.022 / scale);
    const olS = makeOutline(0.012 / scale);
    return {
      apron: T("#F4F1EA", { }),
      flour: T("#D7D0BF", { }),
      hair: T("#5a4a40", { rim: 0.1 }),
      stache: T("#2b211d", { rim: 0.05 }),
      ink: INK(),
      ol,
      olS,
      apronG: flare(1.05, prof([[0, 0.42], [0.4, 0.47], [1, 0.44]]), prof([[0, 0.3], [0.4, 0.35], [1, 0.3]])),
      pocket: roundBox(0.3, 0.2, 0.03, 0.03, 0.01),
      smudge: ellipsoid(0.09, 0.06, 0.012, 14, 8),
      side: ellipsoid(0.03, 0.09, 0.09),
      st: ellipsoid(0.075, 0.03, 0.035, 16, 10),
      brow2: ellipsoid(0.085, 0.02, 0.02, 14, 8),
    };
  }, [scale]);
  return (
    <Human
      spec={ANTONIO}
      scale={scale}
      {...rest}
      torso={
        <group>
          <Toon geometry={m.apronG} material={m.apron} outline={m.ol} position={[0, 0.0, 0]} />
          <Toon geometry={m.pocket} material={m.apron} outline={m.olS} position={[0.15, 0.2, 0.34]} />
          {[[-0.18, 0.75, 0.3], [0.2, 0.5, 0.33], [-0.1, 0.1, 0.37], [0.25, -0.3, 0.3], [-0.28, -0.4, 0.27]].map((p, i) => (
            <mesh key={i} geometry={m.smudge} material={m.flour} position={p as [number, number, number]} rotation={[0.1, 0, 0.3 * i]} />
          ))}
        </group>
      }
      head={
        <group>
          <Toon geometry={m.side} material={m.hair} outline={m.olS} position={[0.255, 0.06, -0.03]} />
          <Toon geometry={m.side} material={m.hair} outline={m.olS} position={[-0.255, 0.06, -0.03]} />
          <Toon geometry={m.st} material={m.stache} outline={m.olS} position={[0.06, -0.113, 0.262]} rotation={[0.1, 0.35, -0.3]} />
          <Toon geometry={m.st} material={m.stache} outline={m.olS} position={[-0.06, -0.113, 0.262]} rotation={[0.1, -0.35, 0.3]} />
        </group>
      }
    />
  );
};

/* -------------------------------------------------------------------- BIA */
export const BIA: HumanSpec = {
  skin: "#A06A4A",
  brow: "#241713",
  iris: "#5b3a22",
  irisDark: "#241208",
  lash: 1,
  headScale: 1.32,
  shoulder: 0.27,
  chest: 0.21,
  waist: 0.2,
  hip: 0.22,
  depth: 0.15,
  limb: 0.78,
  legLen: 0.62,
  top: "#5FB7A8",
  topShadow: "#2f6a8a",
  sleeve: 0.5,
  sleeveColor: "#5FB7A8",
  sleeveFat: 1.2,
  pants: "#A06A4A",
  shoe: "#FFD23F",
  boot: { color: "#FFD23F", h: 0.5 },
};
export const BIA_SCALE = 0.78;

export const Bia: React.FC<CharProps & { ribbon?: boolean }> = ({ scale = BIA_SCALE, ribbon = true, ...rest }) => {
  const m = useMemo(() => {
    const ol = makeOutline(0.022 / scale);
    const olS = makeOutline(0.012 / scale);
    return {
      hair: T("#1e1512", { rim: 0.08 }),
      dress: T("#5FB7A8", { }),
      bow: T("#F26B8A", { }),
      red: new THREE.MeshBasicMaterial({ color: "#E5483B" }),
      ol,
      olS,
      skirt: flare(0.5, prof([[0, 0.2], [0.2, 0.26], [1, 0.4]]), prof([[0, 0.15], [1, 0.3]])),
      back: ellipsoid(0.3, 0.32, 0.31),
      puff: ellipsoid(0.1, 0.1, 0.1),
      brd: [0, 1, 2, 3].map((i) => ellipsoid(0.055 - i * 0.006, 0.07, 0.055 - i * 0.006, 12, 8)),
      bowG: ellipsoid(0.07, 0.04, 0.025, 12, 8),
      bang: ellipsoid(0.11, 0.07, 0.06),
      ribbon: tube([[0, 0, 0], [0.04, -0.14, 0.03], [-0.04, -0.3, -0.03], [0.03, -0.45, 0.03], [-0.02, -0.6, 0]], 0.013),
    };
  }, [scale]);
  m.red.color.set(sceneUniforms.uSilhouette.value > 0 ? "#000000" : "#E5483B");
  const braid = (s: number) => (
    <group position={[s * 0.27, -0.0, -0.1]} rotation={[0, 0, s * 0.18]}>
      {m.brd.map((g, i) => (
        <Toon key={i} geometry={g} material={m.hair} outline={m.olS} position={[s * 0.01 * i, -0.1 - i * 0.115, 0]} />
      ))}
      <Toon geometry={m.bowG} material={m.bow} outline={m.olS} position={[0, -0.57, 0]} />
    </group>
  );
  return (
    <Human
      spec={BIA}
      scale={scale}
      {...rest}
      torso={<Toon geometry={m.skirt} material={m.dress} outline={m.ol} position={[0, 0.12, 0]} />}
      rHand={ribbon ? <mesh geometry={m.ribbon} material={m.red} position={[0, -0.08, 0.03]} /> : null}
      head={
        <group>
          <Toon geometry={m.back} material={m.hair} outline={m.ol} position={[0, 0.06, -0.08]} />
          <Toon geometry={m.bang} material={m.hair} outline={m.olS} position={[0.09, 0.225, 0.14]} rotation={[0.55, 0, -0.5]} />
          <Toon geometry={m.bang} material={m.hair} outline={m.olS} position={[-0.09, 0.23, 0.14]} rotation={[0.55, 0, 0.5]} />
          <Toon geometry={m.puff} material={m.hair} outline={m.olS} position={[0.22, 0.22, -0.08]} />
          <Toon geometry={m.puff} material={m.hair} outline={m.olS} position={[-0.22, 0.22, -0.08]} />
          {braid(1)}
          {braid(-1)}
        </group>
      }
    />
  );
};

/* -------------------------------------------------------------- SEU JORGE */
export const JORGE: HumanSpec = {
  skin: "#DDB08F",
  brow: "#d9d9d9",
  iris: "#6a5a40",
  irisDark: "#2a2214",
  shoulder: 0.38,
  chest: 0.3,
  waist: 0.31,
  hip: 0.31,
  depth: 0.22,
  limb: 0.95,
  top: "#6B5B4B",
  topShadow: "#3a3558",
  sleeve: 1,
  sleeveFat: 1.18,
  pants: "#4b4238",
  shoe: "#2a2018",
};

export const Jorge: React.FC<CharProps & { hat?: boolean }> = ({ scale = 1, hat = true, ...rest }) => {
  const m = useMemo(() => {
    const ol = makeOutline(0.022 / scale);
    const olS = makeOutline(0.012 / scale);
    return {
      hat: T("#5a4636", { }),
      band: T("#2e2620", { }),
      white: T("#ECECEC", { }),
      shirt: T("#F1E8D6"),
      tie: T("#8A2F2F", { }),
      gold: T("#E8B93D", { spec: 0.6 }),
      ol,
      olS,
      crown: ellipsoid(0.26, 0.17, 0.28),
      brim: ellipsoid(0.38, 0.028, 0.4),
      bandG: ellipsoid(0.268, 0.045, 0.288),
      side: ellipsoid(0.028, 0.085, 0.085),
      st: ellipsoid(0.085, 0.034, 0.04, 16, 10),
      bro: ellipsoid(0.09, 0.025, 0.025, 14, 8),
      tieG: ellipsoid(0.04, 0.24, 0.02, 12, 10),
      vshirt: ellipsoid(0.12, 0.2, 0.03, 16, 10),
      ring: new THREE.TorusGeometry(0.04, 0.02, 10, 20),
    };
  }, [scale]);
  return (
    <Human
      spec={JORGE}
      scale={scale}
      {...rest}
      lHand={<Toon geometry={m.ring} material={m.gold} outline={m.olS} position={[0.0, -0.13, 0.0]} rotation={[Math.PI / 2, 0, 0]} />}
      torso={
        <group>
          <Toon geometry={m.vshirt} material={m.shirt} outline={m.olS} position={[0, 0.88, 0.2]} rotation={[0.15, 0, 0]} />
          <Toon geometry={m.tieG} material={m.tie} outline={m.olS} position={[0, 0.7, 0.225]} rotation={[0.12, 0, 0]} />
        </group>
      }
      head={
        <group>
          <Toon geometry={m.side} material={m.white} outline={m.olS} position={[0.262, 0.04, -0.02]} />
          <Toon geometry={m.side} material={m.white} outline={m.olS} position={[-0.262, 0.04, -0.02]} />
          <Toon geometry={m.st} material={m.white} outline={m.olS} position={[0.065, -0.115, 0.262]} rotation={[0.1, 0.35, -0.25]} />
          <Toon geometry={m.st} material={m.white} outline={m.olS} position={[-0.065, -0.115, 0.262]} rotation={[0.1, -0.35, 0.25]} />
          {hat ? (
            <group position={[0, 0.2, 0]} rotation={[-0.05, 0, 0]}>
              <Toon geometry={m.brim} material={m.hat} outline={m.ol} position={[0, 0.02, 0.01]} />
              <Toon geometry={m.crown} material={m.hat} outline={m.ol} position={[0, 0.1, -0.01]} />
              <Toon geometry={m.bandG} material={m.band} outline={m.olS} position={[0, 0.06, -0.01]} />
            </group>
          ) : null}
        </group>
      }
    />
  );
};

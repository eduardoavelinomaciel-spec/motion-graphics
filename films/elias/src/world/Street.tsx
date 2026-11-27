import React, { useMemo } from "react";
import * as THREE from "three";
import { random } from "remotion";
import { Toon } from "../lib/Toon";
import { ellipsoid } from "../lib/geom";
import { capsule, roundBox, tube } from "../lib/body";
import { makeOutline, makeToon } from "../lib/materials";

// Rua de bairro antigo (cenário 1): calçada de pedras portuguesas, postes de ferro verde, banca de jornal, árvores.
// Eixo x = ao longo da rua. Calçada z ∈ [-3.2, 2.0]; rua (asfalto) z > 2.1; fachadas em z = -3.2.

const PAL = ["#E8C9A0", "#C9D6B5", "#E3B7A8", "#B9C7D9", "#EAD9A6", "#D3B8C9"];
type B = { x: number; w: number; h: number; ci: number; awn: number; door: number };
export const BUILDINGS: B[] = (() => {
  const out: B[] = [];
  let x = -50;
  for (let i = 0; x < 150; i++) {
    const w = 6.5 + random(`bw${i}`) * 3.5;
    out.push({ x: x + w / 2, w, h: 10 + random(`bh${i}`) * 6, ci: Math.floor(random(`bc${i}`) * PAL.length), awn: Math.floor(random(`ba${i}`) * 4), door: random(`bd${i}`) });
    x += w;
  }
  return out;
})();

const AWN = ["#D1584A", "#3E7CB1", "#E0A93B", "#4E9A6E"];

const pedras = () => {
  if (typeof document === "undefined") return null;
  const S = 256;
  const cv = document.createElement("canvas");
  cv.width = S; cv.height = S;
  const g = cv.getContext("2d")!;
  const img = g.createImageData(S, S);
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const wave = Math.sin((x / S) * Math.PI * 4) * 14;
      const band = Math.floor((y + wave + 64) / 32) % 2;
      const stone = (x % 8 === 0 || y % 8 === 0) ? 0.78 : 1;
      const v = (band ? 24 : 236) * stone + (band ? 0 : 0);
      const i = (y * S + x) * 4;
      img.data[i] = v * (band ? 1.0 : 0.97); img.data[i + 1] = v; img.data[i + 2] = v * (band ? 1.2 : 1.03); img.data[i + 3] = 255;
    }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestMipmapLinearFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

export const Street: React.FC<{ camX: number; range?: number; kiosk?: boolean }> = ({ camX, range = 34, kiosk = true }) => {
  const g = useMemo(
    () => ({
      win: roundBox(1.15, 1.7, 0.1, 0.14, 0.04),
      frame: roundBox(1.45, 2.0, 0.08, 0.16, 0.04),
      door: roundBox(1.5, 2.8, 0.14, 0.2, 0.05),
      awn: roundBox(2.6, 0.45, 1.5, 0.1, 0.06),
      cornice: roundBox(1, 0.5, 0.7, 0.08, 0.05),
      trunk: capsule(4.8, 0.3, 0.24),
      clump: ellipsoid(1, 1, 1, 24, 18),
      post: capsule(6.2, 0.13, 0.15),
      lampHead: roundBox(0.7, 0.8, 0.7, 0.2, 0.08),
      arm: tube([[0, 0, 0], [0.5, 0.5, 0], [1.1, 0.55, 0]], 0.06, 12),
      base: roundBox(0.5, 0.7, 0.5, 0.1, 0.05),
      kiosk: roundBox(3.6, 3.6, 2.4, 0.15, 0.08),
      roof: roundBox(4.4, 0.35, 3.0, 0.1, 0.06),
      mag: roundBox(0.5, 0.65, 0.05, 0.04, 0.02),
      curb: roundBox(1, 0.2, 0.4, 0.06, 0.04),
    }),
    [],
  );
  const m = useMemo(() => {
    const t = (c: string, o = {}) => makeToon({ color: c, shadowK: 1, shadowTint: "#b3a4dc", rim: 0.18, rimColor: "#eaf3ff", ...o });
    return {
      wall: PAL.map((c) => t(c)),
      glass: t("#4a6d8c", { rim: 0.0, spec: 0.5 }),
      frame: t("#F3F0E8"),
      door: t("#6B4A38"),
      awn: AWN.map((c) => t(c)),
      cornice: t("#F1EADC"),
      trunk: t("#7a5a48"),
      leaf: t("#7DB56C", { rim: 0.3 }),
      leaf2: t("#5E9A5C"),
      iron: t("#2F6B4F", { spec: 0.3 }),
      lamp: t("#F7E2A0", { rim: 0 }),
      kiosk: t("#C9604E"),
      roof: t("#3E5F7A"),
      white: t("#F4F1EA"),
      curb: t("#B3BBC7"),
      road: new THREE.MeshBasicMaterial({ color: "#62697A" }),
      line: new THREE.MeshBasicMaterial({ color: "#DCE1EA" }),
      gutter: new THREE.MeshBasicMaterial({ color: "#4d5463" }),
      mag: ["#E5483B", "#FFD23F", "#3D5A98", "#7AE7C7", "#F7B2AD"].map((c) => new THREE.MeshBasicMaterial({ color: c })),
      ol: makeOutline(0.05),
      olS: makeOutline(0.03),
      olL: makeOutline(0.06),
    };
  }, []);
  const tex = useMemo(() => pedras(), []);
  const side = useMemo(() => (tex ? new THREE.MeshBasicMaterial({ map: tex, color: "#dfe8f4" }) : new THREE.MeshBasicMaterial({ color: "#999" })), [tex]);
  if (tex) tex.repeat.set((range * 2 + 20) / 8, 5.2 / 8);

  const x0 = camX - range, x1 = camX + range;
  const bs = BUILDINGS.filter((b) => b.x + b.w / 2 > x0 && b.x - b.w / 2 < x1);
  const tx0 = Math.floor((x0 - 4) / 13), tx1 = Math.ceil((x1 - 4) / 13);
  const trees: number[] = [];
  for (let k = tx0; k <= tx1; k++) trees.push(4 + 13 * k);
  const posts = [9.1, 22, 37, 52, 67, -6, -21].filter((x) => x > x0 - 3 && x < x1 + 3);
  const cx = Math.round(camX / 4) * 4;

  return (
    <group>
      {/* chão */}
      <mesh position={[camX, -0.01, 8.8]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[range * 2 + 20, 13]} />
        <primitive object={m.road} attach="material" />
      </mesh>
      <mesh position={[camX, 0.0, 2.15]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[range * 2 + 20, 0.5]} />
        <primitive object={m.gutter} attach="material" />
      </mesh>
      <mesh position={[camX, 0.02, -0.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[range * 2 + 20, 5.2]} />
        <primitive object={side} attach="material" />
      </mesh>
      {Array.from({ length: Math.ceil((range * 2) / 4) + 6 }).map((_, i) => {
        const x = cx - range - 8 + i * 4;
        return (
          <React.Fragment key={i}>
            <mesh position={[x + 1.5, 0.01, 8.8]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[2.2, 0.16]} />
              <primitive object={m.line} attach="material" />
            </mesh>
          </React.Fragment>
        );
      })}
      <Toon geometry={g.curb} material={m.curb} outline={m.olS} position={[camX, 0.08, 2.1]} scale={[range * 2 + 20, 1, 1]} />

      {/* fachadas */}
      {bs.map((b, i) => {
        const cols = Math.max(2, Math.floor(b.w / 2.4));
        const floors = Math.floor((b.h - 3.8) / 3.3);
        return (
          <group key={i} position={[b.x, 0, -3.2]}>
            <Toon geometry={g.kiosk} material={m.wall[b.ci]} outline={m.olL} position={[0, b.h / 2, -2.2]} scale={[b.w / 3.6, b.h / 3.6, 4 / 2.4]} />
            <Toon geometry={g.cornice} material={m.cornice} outline={m.olS} position={[0, b.h + 0.1, -0.1]} scale={[b.w + 0.3, 1, 1.2]} />
            {Array.from({ length: floors }).map((_, fl) =>
              Array.from({ length: cols }).map((__, c) => {
                const wx = (c - (cols - 1) / 2) * (b.w / cols);
                const y = 4.4 + fl * 3.3;
                return (
                  <group key={`${fl}-${c}`} position={[wx, y, 0.05]}>
                    <mesh geometry={g.frame} material={m.frame} />
                    <mesh geometry={g.win} material={m.glass} position={[0, 0, 0.07]} />
                  </group>
                );
              }),
            )}
            {/* térreo: porta + vitrine + toldo */}
            <Toon geometry={g.door} material={m.door} outline={m.olS} position={[(b.door - 0.5) * (b.w - 3), 1.45, 0.08]} />
            {cols > 2 ? (
              <group position={[-(b.door - 0.5) * (b.w - 3) * 0.6 + (b.door > 0.5 ? -1.2 : 1.2), 2.0, 0.05]}>
                <mesh geometry={g.frame} material={m.frame} scale={[1.2, 0.8, 1]} />
                <mesh geometry={g.win} material={m.glass} position={[0, 0, 0.07]} scale={[1.3, 0.85, 1]} />
              </group>
            ) : null}
            <Toon geometry={g.awn} material={m.awn[b.awn]} outline={m.olS} position={[(b.door - 0.5) * (b.w - 3), 3.35, 0.7]} rotation={[0.28, 0, 0]} scale={[1.2, 1, 1]} />
          </group>
        );
      })}

      {/* árvores de copa larga */}
      {trees.map((x) => (
        <group key={x} position={[x, 0, 1.55]}>
          <Toon geometry={g.trunk} material={m.trunk} outline={m.olS} position={[0, 4.8, 0]} />
          {[[0, 6.2, 0, 2.4], [-1.8, 5.6, 0.4, 1.9], [1.9, 5.7, -0.2, 2.0], [0.2, 7.6, -0.3, 1.9], [-0.8, 6.9, 1.0, 1.6]].map((c, i) => (
            <Toon key={i} geometry={g.clump} material={i % 2 ? m.leaf2 : m.leaf} outline={m.ol} position={[c[0], c[1], c[2]]} scale={[c[3] * 1.25, c[3], c[3] * 1.1]} />
          ))}
        </group>
      ))}

      {/* postes de ferro verde */}
      {posts.map((x) => (
        <group key={x} position={[x, 0, x === 9.1 ? 0.75 : 1.75]}>
          <Toon geometry={g.base} material={m.iron} outline={m.olS} position={[0, 0.35, 0]} />
          <Toon geometry={g.post} material={m.iron} outline={m.olS} position={[0, 6.4, 0]} />
          <Toon geometry={g.arm} material={m.iron} outline={m.olS} position={[0, 6.2, 0]} />
          <Toon geometry={g.lampHead} material={m.lamp} outline={m.olS} position={[1.15, 6.35, 0]} scale={[0.8, 0.9, 0.8]} />
        </group>
      ))}

      {/* banca de jornal */}
      {kiosk ? (
        <group position={[44, 0, -1.5]}>
          <Toon geometry={g.kiosk} material={m.kiosk} outline={m.ol} position={[0, 1.8, 0]} />
          <Toon geometry={g.roof} material={m.roof} outline={m.olS} position={[0, 3.8, 0.2]} />
          <Toon geometry={g.awn} material={m.white} outline={m.olS} position={[0, 2.9, 1.4]} rotation={[0.25, 0, 0]} scale={[1.4, 1, 1]} />
          {Array.from({ length: 10 }).map((_, i) => (
            <mesh key={i} geometry={g.mag} material={m.mag[i % 5]} position={[-1.35 + (i % 5) * 0.68, 1.5 + Math.floor(i / 5) * 0.8, 1.23]} />
          ))}
        </group>
      ) : null}
    </group>
  );
};

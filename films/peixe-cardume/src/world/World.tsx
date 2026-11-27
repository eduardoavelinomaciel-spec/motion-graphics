import React, { useMemo } from "react";
import * as THREE from "three";
import { random } from "remotion";
import { sceneUniforms } from "../lib/materials";
import {
  BUBBLE_FRAG, BUBBLE_VERT, RAY_FRAG, RAY_VERT, SAND_FRAG, SAND_VERT, SKY_FRAG, SKY_VERT,
} from "./shaders";
import { ellipsoid, sweepCurve } from "../lib/geom";
import { makeOutline, makeToon } from "../lib/materials";

export type Look = {
  top: string;
  mid: string;
  deep: string;
  fog: string;
  fogDensity: number;
  sand: string;
  sandShadow: string;
  caustic: number;
  rays: number;
};

// Set 1 — mar raso do cardume (bible): turquoise #1FB5C9 → #0E6E8C
export const SHALLOW: Look = {
  top: "#7fe6ee",
  mid: "#1FB5C9",
  deep: "#0E6E8C",
  fog: "#17a2bb",
  fogDensity: 0.03,
  sand: "#F4E7C6",
  sandShadow: "#c9c39f",
  caustic: 0.6,
  rays: 1,
};

export const applyLook = (l: Look, time: number) => {
  sceneUniforms.uFogColor.value.set(l.fog);
  sceneUniforms.uFogDensity.value = l.fogDensity;
  sceneUniforms.uTime.value = time;
  sceneUniforms.uCaustic.value = l.caustic * 0.35;
  sceneUniforms.uSilhouette.value = 0;
};

export const Sky: React.FC<{ look: Look; camPos: THREE.Vector3; sunAmt?: number }> = ({ look, camPos, sunAmt = 0.5 }) => {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: SKY_VERT,
        fragmentShader: SKY_FRAG,
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          uTop: { value: new THREE.Color() },
          uMid: { value: new THREE.Color() },
          uDeep: { value: new THREE.Color() },
          uSun: { value: new THREE.Color("#ffffff") },
          uSunAmt: { value: 0.5 },
        },
      }),
    [],
  );
  mat.uniforms.uTop.value.set(look.top);
  mat.uniforms.uMid.value.set(look.mid);
  mat.uniforms.uDeep.value.set(look.deep);
  mat.uniforms.uSunAmt.value = sunAmt;
  return (
    <mesh position={camPos} material={mat} renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[100, 32, 16]} />
    </mesh>
  );
};

export const Sand: React.FC<{ look: Look; time: number; centerX?: number }> = ({ look, time, centerX = 30 }) => {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: SAND_VERT,
        fragmentShader: SAND_FRAG,
        uniforms: {
          uSand: { value: new THREE.Color() },
          uShadow: { value: new THREE.Color() },
          uLightDir: sceneUniforms.uLightDir,
          uFogColor: sceneUniforms.uFogColor,
          uFogDensity: sceneUniforms.uFogDensity,
          uTime: { value: 0 },
          uCausticAmt: { value: 1 },
          uCausticColor: { value: new THREE.Color("#ffffff") },
        },
      }),
    [],
  );
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(260, 200, 260, 200);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  mat.uniforms.uSand.value.set(look.sand);
  mat.uniforms.uShadow.value.set(look.sandShadow);
  mat.uniforms.uTime.value = time;
  mat.uniforms.uCausticAmt.value = look.caustic;
  return <mesh geometry={geo} material={mat} position={[centerX, 0, 0]} />;
};

// Diagonal god rays, billboarded around their long axis.
export const GodRays: React.FC<{
  rays: { x: number; z: number; w: number; tilt: number; ph: number }[];
  time: number;
  camPos: THREE.Vector3;
  intensity?: number;
  color?: string;
}> = ({ rays, time, camPos, intensity = 0.22, color = "#e8ffff" }) => {
  const mats = useMemo(
    () =>
      rays.map(
        () =>
          new THREE.ShaderMaterial({
            vertexShader: RAY_VERT,
            fragmentShader: RAY_FRAG,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            uniforms: { uColor: { value: new THREE.Color(color) }, uIntensity: { value: 0.2 } },
          }),
      ),
    [rays, color],
  );
  return (
    <>
      {rays.map((r, i) => {
        const sway = Math.sin(time * 0.35 + r.ph) * 0.06;
        const flick = 0.75 + 0.25 * Math.sin(time * 0.9 + r.ph * 3);
        mats[i].uniforms.uIntensity.value = intensity * flick;
        const yaw = Math.atan2(camPos.x - r.x, camPos.z - r.z);
        return (
          <group key={i} position={[r.x, 0, r.z]} rotation={[0, yaw, 0]}>
            <mesh material={mats[i]} rotation={[0, 0, r.tilt + sway]} position={[0, 0, 0]}>
              <planeGeometry args={[r.w, 40, 1, 1]} />
            </mesh>
          </group>
        );
      })}
    </>
  );
};

export const makeBubbleMat = (iri = 0) =>
  new THREE.ShaderMaterial({
    vertexShader: BUBBLE_VERT,
    fragmentShader: BUBBLE_FRAG,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uIri: { value: iri },
      uTime: sceneUniforms.uTime,
      uOpacity: { value: 1 },
      uFogColor: sceneUniforms.uFogColor,
      uFogDensity: sceneUniforms.uFogDensity,
    },
  });

// Columns of thin bubbles rising from the sand.
export const BubbleColumns: React.FC<{
  vents: { x: number; z: number }[];
  time: number;
  perVent?: number;
  height?: number;
  size?: number;
}> = ({ vents, time, perVent = 14, height = 14, size = 0.09 }) => {
  const mat = useMemo(() => makeBubbleMat(0), []);
  const geo = useMemo(() => new THREE.SphereGeometry(1, 16, 12), []);
  const count = vents.length * perVent;
  const mesh = useMemo(() => new THREE.InstancedMesh(geo, mat, count), [geo, mat, count]);
  const m = new THREE.Matrix4();
  let k = 0;
  vents.forEach((v, vi) => {
    for (let i = 0; i < perVent; i++) {
      const sp = 1.1 + random(`bv-${vi}-${i}`) * 0.7;
      const y = (time * sp + (i / perVent) * height + random(`bo-${vi}-${i}`) * 0.8) % height;
      const s = size * (0.6 + random(`bs-${vi}-${i}`) * 0.8) * (1 + y * 0.03);
      const wob = Math.sin(time * 5 + i * 1.7) * 0.06 * (0.3 + y * 0.05);
      m.makeScale(s, s * (1 - 0.12 * Math.sin(time * 9 + i)), s);
      m.setPosition(v.x + wob, 0.2 + y, v.z + Math.cos(time * 4 + i) * 0.05);
      mesh.setMatrixAt(k++, m);
    }
  });
  mesh.instanceMatrix.needsUpdate = true;
  return <primitive object={mesh} frustumCulled={false} />;
};

export const Bubble: React.FC<{
  position: [number, number, number];
  radius: number;
  iri?: number;
  opacity?: number;
  squash?: number;
}> = ({ position, radius, iri = 0, opacity = 1, squash = 0 }) => {
  const mat = useMemo(() => makeBubbleMat(iri), [iri]);
  mat.uniforms.uOpacity.value = opacity;
  return (
    <mesh position={position} scale={[radius * (1 + squash), radius * (1 - squash), radius * (1 + squash)]} material={mat}>
      <sphereGeometry args={[1, 40, 28]} />
    </mesh>
  );
};

// Distant reef: a ridge of coral silhouettes that the fog turns blue.
export const FarReef: React.FC<{ position: [number, number, number]; scale?: number }> = ({ position, scale = 1 }) => {
  const parts = useMemo(() => {
    const out: { g: THREE.BufferGeometry; p: [number, number, number]; c: string }[] = [];
    const cols = ["#ff8a70", "#ffc35a", "#b98cf0", "#5fd5c9", "#ff9db4"];
    for (let i = 0; i < 26; i++) {
      const x = (i - 13) * 1.6 + random(`rx${i}`) * 1.2;
      const z = random(`rz${i}`) * 4 - 2;
      const kind = random(`rk${i}`);
      const c = cols[i % cols.length];
      if (kind < 0.45) {
        const r = 0.9 + random(`rr${i}`) * 1.6;
        out.push({ g: ellipsoid(r, r * 0.75, r), p: [x, r * 0.3, z], c });
      } else {
        const h = 2 + random(`rh${i}`) * 3.5;
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(random(`a${i}`) - 0.5, h * 0.5, 0),
          new THREE.Vector3((random(`b${i}`) - 0.5) * 1.5, h, 0),
        ]);
        out.push({ g: sweepCurve(curve, (t) => 0.35 * (1 - t * 0.6), 12, 8), p: [x, 0, z], c });
      }
    }
    return out;
  }, []);
  const mats = useMemo(() => {
    const map = new Map<string, THREE.ShaderMaterial>();
    parts.forEach((p) => {
      if (!map.has(p.c)) map.set(p.c, makeToon({ color: p.c, rim: 0.2 }));
    });
    return map;
  }, [parts]);
  const line = useMemo(() => makeOutline(0.05), []);
  return (
    <group position={position} scale={scale}>
      {parts.map((p, i) => (
        <group key={i} position={p.p}>
          <mesh geometry={p.g} material={mats.get(p.c)} />
          <mesh geometry={p.g} material={line} />
        </group>
      ))}
    </group>
  );
};

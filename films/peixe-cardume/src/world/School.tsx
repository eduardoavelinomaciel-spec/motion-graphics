import React, { useMemo } from "react";
import * as THREE from "three";
import { bump, fin, sweepX } from "../lib/geom";
import { sceneUniforms } from "../lib/materials";
import { SCHOOL_FRAG, SCHOOL_VERT } from "./shaders";

export type Pose = { x: number; y: number; z: number; yaw: number; pitch: number; roll: number; glint: number; s: number };

// One silver school-fish geometry (body + forked tail + dorsal baked together), facing +x.
const schoolGeometry = () => {
  const len = 2.0;
  const prof = bump(0.6, 1.15);
  const ry = (t: number) => (t > 0.985 ? 0 : 0.42 * prof(t));
  const body = sweepX(len, ry, (t) => ry(t) * 0.45, (t) => -0.03 * Math.sin(t * Math.PI), 28, 14);
  const sh = new THREE.Shape();
  sh.moveTo(0.05, 0.06);
  sh.quadraticCurveTo(-0.2, 0.12, -0.5, 0.38);
  sh.quadraticCurveTo(-0.52, 0.12, -0.34, 0);
  sh.quadraticCurveTo(-0.52, -0.12, -0.5, -0.38);
  sh.quadraticCurveTo(-0.2, -0.12, 0.05, -0.06);
  sh.closePath();
  const tail = fin(sh, 0.012, 0.016);
  tail.translate(-len / 2 + 0.12, 0, 0);
  const ds = new THREE.Shape();
  ds.moveTo(0.3, -0.04);
  ds.quadraticCurveTo(0.05, 0.32, -0.25, 0.22);
  ds.quadraticCurveTo(-0.3, 0.08, -0.3, -0.04);
  ds.closePath();
  const dorsal = fin(ds, 0.01, 0.014);
  dorsal.translate(0, ry(0.5) - 0.06, 0);
  // merge
  const geos = [body, tail, dorsal];
  const pos: number[] = [];
  const nor: number[] = [];
  const idx: number[] = [];
  let off = 0;
  geos.forEach((g) => {
    const p = g.getAttribute("position");
    const n = g.getAttribute("normal");
    for (let i = 0; i < p.count; i++) {
      pos.push(p.getX(i), p.getY(i), p.getZ(i));
      nor.push(n.getX(i), n.getY(i), n.getZ(i));
    }
    const ix = g.getIndex();
    if (ix) for (let i = 0; i < ix.count; i++) idx.push(ix.getX(i) + off);
    off += p.count;
  });
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  out.setIndex(idx);
  return out;
};

const makeMat = (outline: boolean) =>
  new THREE.ShaderMaterial({
    vertexShader: SCHOOL_VERT,
    fragmentShader: SCHOOL_FRAG,
    side: outline ? THREE.BackSide : THREE.FrontSide,
    uniforms: {
      ...sceneUniforms,
      uThick: { value: outline ? 0.03 : 0 },
      uOutline: { value: outline ? 1 : 0 },
      uColor: { value: new THREE.Color("#C9D6E3") },
      uBelly: { value: new THREE.Color("#EEF4FA") },
      uShadowTint: { value: new THREE.Color("#7d8fd6") },
      uInk: { value: new THREE.Color("#10141f") },
      uEyeX: { value: 0.62 },
      uEyeY: { value: 0.07 },
    },
  });

export const School: React.FC<{ count: number; pose: (i: number) => Pose; outline?: boolean }> = ({ count, pose, outline = true }) => {
  const geo = useMemo(schoolGeometry, []);
  const { body, line, phase, glint } = useMemo(() => {
    const ph = new THREE.InstancedBufferAttribute(new Float32Array(count), 1);
    const gl = new THREE.InstancedBufferAttribute(new Float32Array(count), 1);
    for (let i = 0; i < count; i++) ph.setX(i, (i * 2.399) % 6.283);
    geo.setAttribute("aPhase", ph);
    geo.setAttribute("aGlint", gl);
    const b = new THREE.InstancedMesh(geo, makeMat(false), count);
    const l = new THREE.InstancedMesh(geo, makeMat(true), count);
    b.frustumCulled = false;
    l.frustumCulled = false;
    return { body: b, line: l, phase: ph, glint: gl };
  }, [geo, count]);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const v = new THREE.Vector3();
  const sc = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    const p = pose(i);
    e.set(p.roll, p.yaw, p.pitch, "YZX");
    q.setFromEuler(e);
    v.set(p.x, p.y, p.z);
    sc.setScalar(p.s);
    m.compose(v, q, sc);
    body.setMatrixAt(i, m);
    line.setMatrixAt(i, m);
    glint.setX(i, p.glint);
  }
  body.instanceMatrix.needsUpdate = true;
  line.instanceMatrix.needsUpdate = true;
  glint.needsUpdate = true;
  void phase;
  return (
    <>
      <primitive object={body} />
      {outline ? <primitive object={line} /> : null}
    </>
  );
};

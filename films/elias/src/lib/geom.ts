import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// A body swept along +x→-x with an elliptic cross-section.
// ry(t), rz(t): half height / half width at t∈[0,1] (0 = nose at x=+len/2).
export const sweepX = (
  len: number,
  ry: (t: number) => number,
  rz: (t: number) => number,
  yOff: (t: number) => number = () => 0,
  segs = 48,
  rings = 28,
) => {
  const pos: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const x = len / 2 - t * len;
    for (let j = 0; j <= rings; j++) {
      const a = (j / rings) * Math.PI * 2;
      pos.push(x, yOff(t) + ry(t) * Math.cos(a), rz(t) * Math.sin(a));
    }
  }
  const w = rings + 1;
  for (let i = 0; i < segs; i++)
    for (let j = 0; j < rings; j++) {
      const a = i * w + j;
      const b = a + w;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  return smooth(g);
};

// A tube along a curve with a radius profile and optional flattening.
export const sweepCurve = (
  curve: THREE.Curve<THREE.Vector3>,
  radius: (t: number) => number,
  segs = 64,
  rings = 12,
  flat = 1,
) => {
  const frames = curve.computeFrenetFrames(segs, false);
  const pos: number[] = [];
  const idx: number[] = [];
  const p = new THREE.Vector3();
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    curve.getPointAt(t, p);
    const N = frames.normals[i];
    const B = frames.binormals[i];
    const r = radius(t);
    for (let j = 0; j <= rings; j++) {
      const a = (j / rings) * Math.PI * 2;
      const c = Math.cos(a) * r;
      const s = Math.sin(a) * r * flat;
      pos.push(p.x + N.x * c + B.x * s, p.y + N.y * c + B.y * s, p.z + N.z * c + B.z * s);
    }
  }
  const w = rings + 1;
  for (let i = 0; i < segs; i++)
    for (let j = 0; j < rings; j++) {
      const a = i * w + j;
      const b = a + w;
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  return smooth(g);
};

// A flat fin from a 2D shape, extruded with a round bevel so it takes the outline.
export const fin = (shape: THREE.Shape, thick = 0.02, bevel = 0.025) => {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: thick,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 24,
  });
  g.translate(0, 0, -thick / 2);
  return smooth(g);
};

// Merge seams and recompute normals so shading and the inverted-hull outline are continuous.
export const smooth = (g: THREE.BufferGeometry) => {
  g.deleteAttribute("normal");
  g.deleteAttribute("uv");
  const m = mergeVertices(g, 1e-4);
  m.computeVertexNormals();
  return m;
};

export const ellipsoid = (rx: number, ry: number, rz: number, w = 32, h = 24) => {
  const g = new THREE.SphereGeometry(1, w, h);
  g.scale(rx, ry, rz);
  return smooth(g);
};

// Normalised bump: t^a (1-t)^b scaled to peak 1.
export const bump = (a: number, b: number) => {
  const tp = a / (a + b);
  const peak = Math.pow(tp, a) * Math.pow(1 - tp, b);
  return (t: number) => (Math.pow(Math.max(t, 0), a) * Math.pow(Math.max(1 - t, 0), b)) / peak;
};

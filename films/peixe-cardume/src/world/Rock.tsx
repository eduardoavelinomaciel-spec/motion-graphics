import React, { useMemo } from "react";
import * as THREE from "three";
import { random } from "remotion";
import { Toon } from "../lib/Toon";
import { smooth, sweepCurve } from "../lib/geom";
import { makeOutline, makeToon } from "../lib/materials";

// Set 3 — the lonely rock: dark, barnacled, with a recess the size of Ciro and one closed anemone.
export const ROCK = { center: new THREE.Vector3(0, 1.25, 0), R: 2.3, sy: 0.78, recess: new THREE.Vector3(0.12, -0.08, 1).normalize() };

const n3 = (x: number, y: number, z: number) =>
  0.5 * Math.sin(3.1 * x + 1.3) * Math.sin(2.7 * y + 0.4) * Math.sin(2.3 * z + 2.1) +
  0.25 * Math.sin(6.3 * x + 4.1 * z + 0.7) * Math.sin(5.1 * y + 1.9) +
  0.12 * Math.sin(11.7 * x - 9.3 * y + 7.1 * z);

const rockGeometry = () => {
  const g = new THREE.IcosahedronGeometry(1, 24);
  const p = g.getAttribute("position");
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    let r = 1 + 0.14 * n3(v.x, v.y, v.z);
    // the recess: a smooth pocket carved towards the camera side
    const w = THREE.MathUtils.smoothstep(v.dot(ROCK.recess), 0.8, 0.93);
    r *= 1 - 0.48 * w;
    // flatten the bottom into the sand
    const y = v.y * ROCK.sy;
    p.setXYZ(i, v.x * r * ROCK.R, Math.max(y * r * ROCK.R, -0.9), v.z * r * ROCK.R);
  }
  return smooth(g);
};

export const Rock: React.FC<{ time: number }> = ({ time }) => {
  const geo = useMemo(rockGeometry, []);
  const mat = useMemo(() => makeToon({ color: "#4a5868", shadowTint: "#4c5fa0", rim: 0.25, rimColor: "#9fd3e6", pattern: 1, patternColor: "#323d4a", patternScale: 1.6 }), []);
  const line = useMemo(() => makeOutline(0.04), []);
  const barn = useMemo(() => {
    const out: { p: THREE.Vector3; q: THREE.Quaternion; s: number }[] = [];
    let k = 0;
    while (out.length < 46 && k < 400) {
      k++;
      const th = random(`bt${k}`) * Math.PI * 2;
      const ph = Math.acos(2 * random(`bp${k}`) - 1);
      const d = new THREE.Vector3(Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th));
      if (d.y < -0.25 || d.dot(ROCK.recess) > 0.72) continue;
      const r = 1 + 0.14 * n3(d.x, d.y, d.z);
      const p = new THREE.Vector3(d.x * r * ROCK.R, d.y * ROCK.sy * r * ROCK.R, d.z * r * ROCK.R).multiplyScalar(0.98);
      const nrm = new THREE.Vector3(d.x, d.y / ROCK.sy, d.z).normalize();
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), nrm);
      out.push({ p, q, s: 0.07 + random(`bs${k}`) * 0.09 });
    }
    return out;
  }, []);
  const bGeo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.45, 1, 0.9, 10, 1, true);
    g.translate(0, 0.45, 0);
    return smooth(g);
  }, []);
  const bMat = useMemo(() => makeToon({ color: "#d9d1bd", rim: 0.2, side: THREE.DoubleSide }), []);
  const bLine = useMemo(() => makeOutline(0.12), []);
  const anem = useMemo(
    () => sweepCurve(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.05, 0.35, 0), new THREE.Vector3(0, 0.62, 0)]), (t) => 0.28 * Math.sin(Math.PI * Math.min(1, 0.25 + t * 0.8)) + 0.04, 20, 14),
    [],
  );
  const aMat = useMemo(() => makeToon({ color: "#9c5b78", tip: "#c47f9c", tipAxis: [0, 1, 0], tipStart: 0.45, tipSoft: 0.05, rim: 0.3 }), []);
  const aLine = useMemo(() => makeOutline(0.03), []);
  const breathe = 1 + 0.03 * Math.sin(time * 0.9);
  return (
    <group position={ROCK.center}>
      <Toon geometry={geo} material={mat} outline={line} />
      {barn.map((b, i) => (
        <group key={i} position={b.p} quaternion={b.q} scale={b.s}>
          <mesh geometry={bGeo} material={bMat} />
          <mesh geometry={bGeo} material={bLine} />
        </group>
      ))}
      <Toon geometry={anem} material={aMat} outline={aLine} position={[-0.7, ROCK.R * ROCK.sy * 0.98, -0.5]} scale={[breathe, 1 / breathe, breathe]} />
    </group>
  );
};

// Where Ciro sits inside the recess, and the yaw that points his nose out of it.
export const recessSeat = (depth = 0.62) => {
  const p = ROCK.center.clone().add(new THREE.Vector3(ROCK.recess.x * ROCK.R * depth, ROCK.recess.y * ROCK.R * ROCK.sy * depth, ROCK.recess.z * ROCK.R * depth));
  const yaw = Math.atan2(-ROCK.recess.z, ROCK.recess.x);
  return { p, yaw };
};

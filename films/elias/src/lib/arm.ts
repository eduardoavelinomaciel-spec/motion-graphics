import * as THREE from "three";
import { HumanSpec } from "../characters/Human";
import { solveArm } from "./ik";

// IK de braço: devolve (f,o,e) para a mão alcançar `target` (mundo).
export const armTo = (base: [number, number, number], yaw: number, scale: number, spec: HumanSpec, target: THREE.Vector3, right: boolean, yOff = 0) => {
  const side = right ? -1 : 1;
  const hip = 1.75 * (spec.legLen ?? 1);
  const sw = (spec.shoulder ?? 0.4) * 0.98 * scale * side;
  const sh = new THREE.Vector3(base[0] + Math.cos(yaw) * sw, base[1] + (hip + 0.93 + yOff) * scale, base[2] - Math.sin(yaw) * sw);
  const d = target.clone().sub(sh).divideScalar(scale);
  const lx = Math.cos(yaw) * d.x - Math.sin(yaw) * d.z;
  const lz = Math.sin(yaw) * d.x + Math.cos(yaw) * d.z;
  return solveArm(new THREE.Vector3(right ? -lx : lx, d.y, lz));
};

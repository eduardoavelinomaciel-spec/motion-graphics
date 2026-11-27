import * as THREE from "three";

// Resolve (f, o, e) do braço esquerdo (+x) para a mão alcançar um alvo no referencial do ombro.
// Para o braço direito, espelhe x do alvo antes de chamar.
const UP = 0.72, FORE = 0.66, HAND = 0.14;
const tip = (f: number, o: number, e: number) => {
  const R = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(-f, 0, o, "XYZ"));
  const fl = new THREE.Matrix4().makeRotationX(-e);
  const elbow = new THREE.Vector3(0, -UP, 0).applyMatrix4(R);
  const hand = new THREE.Vector3(0, -(FORE + HAND), 0).applyMatrix4(fl).applyMatrix4(R);
  return elbow.add(hand);
};
export const solveArm = (target: THREE.Vector3) => {
  let p = [0.5, 0.15, 1.0];
  const cost = (q: number[]) => tip(q[0], q[1], q[2]).distanceToSquared(target) + 0.002 * ((q[1] - 0.15) ** 2 + (q[0] - 0.5) ** 2);
  let step = 0.5;
  for (let it = 0; it < 60; it++) {
    for (let k = 0; k < 3; k++) {
      for (const d of [step, -step]) {
        const q = p.slice();
        q[k] += d;
        if (cost(q) < cost(p)) p = q;
      }
    }
    step *= 0.88;
  }
  return { f: p[0], o: p[1], e: Math.max(0.05, Math.min(2.6, p[2])) };
};

import * as THREE from "three";

// An ink line lying on an ellipsoid (for mouths on round heads).
// s∈[-1,1] → azimuth around y from +x, elevation from the horizon.
export const ellipsoidLine = (
  r: [number, number, number],
  az: (s: number) => number,
  el: (s: number) => number,
  thick = 0.02,
  n = 21,
) => {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < n; i++) {
    const s = (i / (n - 1)) * 2 - 1;
    const a = az(s);
    const e = el(s);
    pts.push(
      new THREE.Vector3(
        r[0] * Math.cos(e) * Math.cos(a) * 1.01,
        r[1] * Math.sin(e) * 1.01,
        r[2] * Math.cos(e) * Math.sin(a) * 1.01,
      ),
    );
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, thick, 6, false);
};

import { random } from "remotion";
import { Pose } from "./School";

// --- Mill: the perfect silver spiral (scene 1 opening) -----------------------
export type MillSlot = { R: number; y: number; th0: number; s: number; ph: number };

export const millSlots = (): MillSlot[] => {
  const out: MillSlot[] = [];
  for (let k = 0; k < 6; k++) {
    const R = 4.2 + k * 1.05;
    for (let j = 0; j < 4; j++) {
      const n = Math.floor((2 * Math.PI * R) / 2.5);
      for (let i = 0; i < n; i++) {
        const id = `${k}-${j}-${i}`;
        out.push({
          R: R + (random(`mr${id}`) - 0.5) * 0.35,
          y: (j - 1.5) * 0.95 + (random(`my${id}`) - 0.5) * 0.25,
          th0: (i / n) * Math.PI * 2 + j * 0.37 + random(`mt${id}`) * 0.2,
          s: 0.85 + random(`ms${id}`) * 0.25,
          ph: random(`mp${id}`) * 6.28,
        });
      }
    }
  }
  return out;
};

export const millPose = (sl: MillSlot, t: number, cx: number, cy: number, cz: number): Pose => {
  const v = 1.5;
  const th = sl.th0 + (v / sl.R) * t;
  // the helix: each ring rises and falls as it turns, which reads as a spiral
  const y = cy + sl.y + 1.5 * Math.sin(th + sl.R * 0.6);
  return {
    x: cx + sl.R * Math.cos(th),
    y,
    z: cz + sl.R * Math.sin(th),
    yaw: -th - Math.PI / 2, // tangent, counter-clockwise seen from above
    pitch: Math.atan(1.5 * Math.cos(th + sl.R * 0.6) / sl.R),
    roll: 0.25,
    glint: Math.max(0, Math.sin(th * 1 + 1.2)) ** 6 * 0.6,
    s: sl.s,
  };
};

// --- Stream: travelling school, with the left turn as a wave -----------------
export type StreamSlot = { ox: number; oy: number; oz: number; s: number; ph: number };

export const streamSlots = (exclude: [number, number, number][], count = 300): StreamSlot[] => {
  const out: StreamSlot[] = [];
  let tries = 0;
  while (out.length < count && tries < 20000) {
    tries++;
    const ox = (random(`sx${tries}`) - 0.5) * 22;
    const oy = (random(`sy${tries}`) - 0.5) * 4.2;
    const oz = (random(`sz${tries}`) - 0.5) * 9 - 2.5;
    // ellipsoid cloud
    if ((ox / 11) ** 2 + (oy / 2.1) ** 2 + ((oz + 2.5) / 4.5) ** 2 > 1) continue;
    let ok = true;
    for (const p of out) {
      if ((p.ox - ox) ** 2 / 4 + ((p.oy - oy) / 0.7) ** 2 + ((p.oz - oz) / 0.75) ** 2 < 1) {
        ok = false;
        break;
      }
    }
    for (const e of exclude) {
      if ((e[0] - ox) ** 2 / 6 + ((e[1] - oy) / 1.1) ** 2 + ((e[2] - oz) / 1.2) ** 2 < 1) ok = false;
    }
    if (!ok) continue;
    out.push({ ox, oy, oz, s: 0.88 + random(`ss${tries}`) * 0.24, ph: random(`sp${tries}`) * 6.28 });
  }
  return out;
};

// turnAt: time (s) the wave starts at the school's front; the turn sweeps backwards.
export const streamPose = (
  sl: StreamSlot,
  t: number,
  origin: [number, number, number],
  speed: number,
  turnAt: number | null,
): Pose => {
  const wob = Math.sin(t * 1.3 + sl.ph) * 0.12;
  let x = origin[0] + speed * t + sl.ox;
  let z = origin[2] + sl.oz + wob;
  const y = origin[1] + sl.oy + Math.sin(t * 0.9 + sl.ph * 1.3) * 0.1;
  let yaw = Math.sin(t * 1.3 + sl.ph) * 0.06;
  let glint = 0;
  let roll = 0;
  if (turnAt !== null) {
    const ts = turnAt + (11 - sl.ox) * 0.055; // the front turns first: a wave down the school
    const dt = t - ts;
    if (dt > 0) {
      const Rt = 5;
      const phiMax = 2.2;
      const s = speed * 1.25 * dt;
      const phi = Math.min(s / Rt, phiMax);
      // arc to the left (−z), then straight
      const ax = Rt * Math.sin(phi);
      const az = -Rt * (1 - Math.cos(phi));
      const rest = Math.max(0, s - Rt * phiMax);
      x = origin[0] + speed * ts + sl.ox + ax + rest * Math.cos(phiMax);
      z = origin[2] + sl.oz + wob + az - rest * Math.sin(phiMax);
      yaw += phi;
      roll = -0.5 * Math.sin(Math.min(1, phi / 0.8) * Math.PI) ;
      glint = Math.max(0, Math.sin((phi / 1.4) * Math.PI)) ** 2 * 1.3;
    }
  }
  return { x, y, z, yaw, pitch: 0, roll, glint, s: sl.s };
};

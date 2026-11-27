import React, { useMemo } from "react";
import * as THREE from "three";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { CameraRig, Cam, V3 as v3, lerpCam } from "./cam";
import { Street } from "../world/Street";
import { Elias, Rita } from "../characters/cast";
import { Bike, Entregador, Extra, Lenco, Menino, Pai, walkPose } from "../characters/extras";
import { Pose } from "../characters/Human";
import { PixelPoints, Spr, auraSprites, burstSprites, chestSprites, threadSprites, AURA_COLOR } from "../fx/Pixels";
import { Grade } from "../fx/Grade";
import { solveArm } from "../lib/ik";
import { PEDS, RITA_X, exAt, kf, lerp, pedX, phAt, sense, setMorning, smooth, walkFactor } from "./mundo";

const FOV_PX = (h: number, fov: number) => h / (2 * Math.tan((fov * Math.PI) / 360));

/* ------------------------------------------------------------ câmera */
export const camAt = (f: number): Cam => {
  const ex = exAt(f);
  // seguimento suave (média móvel da posição de Elias)
  let sx = 0;
  for (let i = 0; i < 24; i++) sx += exAt(f - i * 2);
  sx /= 24;
  const track: Cam = { pos: v3(sx + 1.2, 2.8, 13), target: v3(sx + 2.4, 2.7, 0.3), fov: 32 };
  // two-shot de Rita: aproxima
  const k = smooth(120, 235, f) * (1 - smooth(300, 360, f));
  const two: Cam = { pos: v3(RITA_X - 1.2, 3.0, 9.2), target: v3(RITA_X - 0.8, 2.75, 0.3), fov: 30 };
  let cam = lerpCam(track, two, k);
  // entregador: câmera estável e um pouco recuada
  const kd = smooth(540, 585, f) * (1 - smooth(640, 690, f));
  const ent: Cam = { pos: v3(exAt(580) + 3, 3.1, 14.5), target: v3(exAt(580) + 4, 2.1, 1.5), fov: 34 };
  cam = lerpCam(cam, ent, kd);
  // menino
  const km = smooth(735, 780, f) * (1 - smooth(880, 940, f));
  const men: Cam = { pos: v3(exAt(760) + 2.5, 2.9, 12.5), target: v3(exAt(760) + 4.2, 2.5, 0.8), fov: 32 };
  cam = lerpCam(cam, men, km);
  // plano geral
  const wide: Cam = { pos: v3(ex + 0, 6.2, 27), target: v3(ex + 0, 3.6, 0), fov: 36 };
  cam = lerpCam(cam, wide, smooth(985, 1070, f));
  // push lento
  const push: Cam = { pos: v3(ex, 4.6, 19), target: v3(ex, 3.0, 0), fov: 34 };
  cam = lerpCam(cam, push, smooth(1130, 1240, f));
  // mergulho no peito
  const chest = v3(ex + 0.02, 2.6, 0.3);
  const dive: Cam = { pos: v3(ex, 2.75, 3.4), target: chest, fov: 30 };
  cam = lerpCam(cam, dive, smooth(1235, 1335, f));
  return cam;
};

/* ------------------------------------------------------------ Elias */
const CHEST_ARM = { f: 0.45, o: -0.28, e: 2.15, t: 0.0 };
export const rampDown = (f: number, a: number, b: number) => 1 - smooth(a, b, f);

const eliasState = (f: number) => {
  const ex = exAt(f);
  const wf = walkFactor(f);
  const ph = phAt(f);
  const s = sense(f);
  const base = walkPose(ph, wf);
  // yaw: segue +x; vira p/ Rita e p/ câmera
  const toRita = smooth(140, 170, f) * (1 - smooth(335, 365, f));
  const toCam = smooth(1000, 1050, f);
  const yaw = lerp(Math.PI / 2, 1.2, toRita) * (1 - toCam) + toCam * 0.0;
  const rightWalk = base.rArm!;
  // entrega do lenço (f 238–305)
  const give = smooth(236, 270, f) * (1 - smooth(296, 330, f));
  const rightArm = {
    f: lerp(rightWalk.f ?? 0, CHEST_ARM.f, s),
    o: lerp(rightWalk.o ?? 0.07, CHEST_ARM.o, s),
    e: lerp(rightWalk.e ?? 0.3, CHEST_ARM.e, s),
    t: 0,
  };
  const pos: [number, number, number] = [ex, 0, 0.3];
  // alvo da mão (IK) no lenço sobre a caixa
  const sh = new THREE.Vector3(pos[0] + Math.cos(yaw) * -0.37 * 0.98, 1.75 + 0.93, pos[2] - Math.sin(yaw) * -0.37 * 0.98);
  const tgt = new THREE.Vector3(RITA_X - 0.58, 2.7, 0.42).sub(sh);
  const lx = Math.cos(yaw) * tgt.x - Math.sin(yaw) * tgt.z;
  const lz = Math.sin(yaw) * tgt.x + Math.cos(yaw) * tgt.z;
  const ik = solveArm(new THREE.Vector3(-lx, tgt.y, lz));
  const ra = {
    f: lerp(rightArm.f, ik.f, give),
    o: lerp(rightArm.o, ik.o, give),
    e: lerp(rightArm.e, ik.e, give),
    t: 0,
  };
  const head: [number, number, number] = [0.06 + 0.12 * kf(f, [[0, 0], [150, 0], [170, 1], [335, 1], [360, 0]]), 0.18 * toRita - 0.1 * sense(f) * smooth(550, 590, f) * (1 - smooth(640, 670, f)), 0];
  let expr = "calma";
  let mouth: Pose["mouth"] = "closed";
  if (f > 160 && f < 350) { expr = "triste"; mouth = "closed"; }
  else if (f > 300 && f < 380) { expr = "ternura"; mouth = "smile"; }
  else if (f > 560 && f < 680) { expr = "curioso"; }
  else if (f > 740 && f < 900) { expr = "alegria"; mouth = "smile"; }
  else if (f > 1000) { expr = "calma"; mouth = "closed"; }
  const pose: Pose = {
    ...base,
    lean: (base.lean ?? 0) + 0.02,
    head,
    expr,
    mouth,
    rArm: ra,
    lArm: base.lArm,
  };
  return { pos, yaw, pose, give, chest: new THREE.Vector3(pos[0] + Math.sin(yaw) * 0.26, 2.6, pos[2] + Math.cos(yaw) * 0.26) };
};

/* ------------------------------------------------------------ cena */
const BOX_LID: [number, number, number] = [RITA_X - 0.5, 2.63, 0.34];

export const Cena1Scene: React.FC<{ f: number; w: number; h: number; k?: number }> = ({ f, w, h, k = 1 }) => {
  setMorning();
  const cam = camAt(f);
  const el = eliasState(f);
  const ex = el.pos[0];
  const camDist = cam.pos.distanceTo(new THREE.Vector3(ex, 2.6, 0.3));
  const px = FOV_PX(h, cam.fov);

  /* Rita */
  const ritaPose: Pose = useMemo(() => ({}), []);
  const lookUp = smooth(298, 318, f);
  const rp: Pose = {
    lean: 0.03,
    head: [0.14 - 0.14 * lookUp + 0.05 * (1 - smooth(120, 160, f)) , -0.35 * smooth(150, 180, f) + 0.0, 0.0],
    expr: f < 300 ? "choro" : f < 330 ? "curioso" : f < 420 ? "ternura" : "triste",
    mouth: f < 300 ? "sad" : f < 420 ? "smile" : "closed",
    lArm: { f: 0.78, o: -0.1, e: 1.5 }, rArm: { f: 0.78, o: -0.1, e: 1.5 },
  };
  void ritaPose;

  /* entregador */
  const ent = exAt(580) + 0.3 * (f - 590);
  const entOn = f > 480 && f < 720;
  /* menino & pai */
  const mx0 = exAt(760) + 3.6;
  const mRide = Math.max(0, f - 775);
  const mx = mx0 + mRide * 0.052;
  const wobble = Math.sin(mRide * 0.22) * 0.1 * (1 - smooth(775, 850, f) * 0.7);
  const boyOn = f > 600 && f < 1320;
  const dadX = mx0 - 1.2 + Math.min(mRide, 40) * 0.04;
  const dadWalk = smooth(768, 780, f) * (1 - smooth(800, 815, f));

  /* ---- sprites ---- */
  const spr: Spr[] = [];
  const amtRita = smooth(40, 110, f) * (1 - 0.55 * smooth(300, 420, f)) * (1 - smooth(1380, 1400, f));
  const ritaAura = auraSprites("tristeza", [RITA_X, 2.5, 0.2], f, "rita", amtRita);
  spr.push(...ritaAura);
  const ritaFio = threadSprites([RITA_X - 0.4, 2.9, 0.4], [el.chest.x, el.chest.y, el.chest.z], AURA_COLOR.tristeza, f, smooth(165, 200, f) * (1 - smooth(300, 345, f)), "fr", 34);
  spr.push(...ritaFio);
  if (entOn) {
    const pos: [number, number, number] = [ent + 0.2, 4.1, 3.6];
    const amtE = smooth(500, 540, f) * (1 - smooth(660, 700, f));
    spr.push(...auraSprites("pressa", pos, f, "ent", amtE, 1.3));
    spr.push(...threadSprites([pos[0], pos[1] - 0.2, pos[2]], [el.chest.x, el.chest.y, el.chest.z], AURA_COLOR.pressa, f, smooth(560, 600, f) * (1 - smooth(630, 665, f)), "fe", 34));
  }
  if (boyOn) {
    const pos: [number, number, number] = [mx, 2.4, 0.9];
    const amtM = smooth(735, 760, f) * (1 - 0.25 * smooth(900, 990, f)) * (1 - smooth(1250, 1300, f));
    spr.push(...auraSprites("alegria", pos, f, "boy", amtM));
    spr.push(...burstSprites([mx0 + 0.2, 2.2, 0.9], f, 770, "#FFD23F"));
    spr.push(...threadSprites([pos[0], pos[1], pos[2]], [el.chest.x, el.chest.y, el.chest.z], AURA_COLOR.alegria, f, smooth(755, 795, f) * (1 - smooth(830, 860, f)), "fm", 34));
  }
  // multidão (plano geral)
  const wideK = smooth(990, 1050, f);
  const crowd = PEDS.map((p) => {
    const x = pedX(p, f);
    return { p, x, pos: [x, 3.0, p.z] as [number, number, number] };
  });
  if (wideK > 0.01) {
    crowd.forEach(({ p, pos }) => {
      spr.push(...auraSprites(p.kind, pos, f, `c${p.idx}`, wideK * (1 - smooth(1290, 1330, f)), 1.15));
      spr.push(...threadSprites([pos[0], pos[1] - 0.3, pos[2]], [el.chest.x, el.chest.y, el.chest.z], AURA_COLOR[p.kind], f + p.idx * 7, smooth(1040 + p.idx * 4, 1100 + p.idx * 4, f) * (1 - smooth(1280, 1320, f)), `ft${p.idx}`, 22));
    });
  }
  // pixels acumulados no peito
  const cols = [AURA_COLOR.tristeza, AURA_COLOR.pressa, AURA_COLOR.alegria];
  const pool = [...cols, ...PEDS.map((p) => AURA_COLOR[p.kind])];
  const accum = smooth(330, 360, f) * 0.18 + smooth(660, 690, f) * 0.18 + smooth(850, 880, f) * 0.2 + smooth(1060, 1230, f) * 0.9;
  spr.push(...chestSprites([el.chest.x, el.chest.y, el.chest.z], f, f < 640 ? [cols[0]] : f < 830 ? cols.slice(0, 2) : f < 1050 ? cols : pool, Math.min(1, accum)));

  const walkAmp = (ph: number, a: number) => walkPose(ph, a);

  return (
    <>
      <CameraRig cam={cam} />
      <Street camX={cam.pos.x} range={Math.max(34, cam.pos.z * 1.2)} />
      <Elias position={el.pos} rotation={[0, el.yaw, 0]} pose={el.pose} />
      <group position={[0, 0, 0]}>
        <Rita position={[RITA_X, 0, 0.1]} rotation={[0, -1.1, 0]} pose={rp} box />
      </group>
      {f > 300 ? (
        <Lenco position={[BOX_LID[0], BOX_LID[1] + 0.03 * Math.max(0, 1 - (f - 300) / 10), BOX_LID[2]]} rotation={[0, -0.3, 0.02]} scale={1.1} />
      ) : f > 240 ? (
        <Lenco position={[el.pos[0] + Math.sin(el.yaw) * 0.3 + (RITA_X - 0.6 - el.pos[0]) * el.give, 2.6 + 0.1 * el.give, 0.3 + (0.42 - 0.3) * el.give]} rotation={[0, 0, 0.1]} scale={1.1} />
      ) : null}

      {entOn ? <Entregador position={[ent, 0, 3.6]} roll={ent * 0.55} look={-0.2} /> : null}

      {boyOn ? (
        <>
          <group position={[mx, 0, 0.9]} scale={0.7}><Bike position={[0, 0, 0]} roll={mRide * 0.052 / 0.6} rotation={[wobble * 0.4, 0, wobble * 0.5]} /></group>
          <Menino
            position={[mx - 0.02, 0.75, 0.9]}
            rotation={[0, Math.PI / 2, 0]}
            pose={{
              lean: 0.18, head: [0, 0, 0.0], expr: "alegria", mouth: "grin",
              lLeg: { h: 1.2 + 0.4 * Math.sin(mRide * 0.3), k: 1.5 }, rLeg: { h: 1.2 - 0.4 * Math.sin(mRide * 0.3), k: 1.5 },
              lArm: { f: 1.2, o: 0.2, e: 0.5 }, rArm: { f: 1.2, o: 0.2, e: 0.5 },
            }}
          />
          <Pai
            position={[dadX, 0, 1.5]}
            rotation={[0, 1.0, 0]}
            pose={{
              ...walkAmp(phAt(f) * 0 + f * 0.19, dadWalk),
              expr: "alegria", mouth: "smile",
              rArm: { f: 2.5 * smooth(780, 800, f) * (1 - smooth(900, 930, f)), o: 0.4, e: 0.3 },
            }}
          />
        </>
      ) : null}

      {PEDS.map((p) => {
        const x = pedX(p, f);
        if (Math.abs(x - cam.pos.x) > Math.max(34, cam.pos.z * 1.2)) return null;
        const wv = 0.8;
        return (
          <Extra
            key={p.idx}
            idx={p.idx}
            position={[x, 0, p.z]}
            rotation={[0, p.dir > 0 ? Math.PI / 2 - 0.2 : -Math.PI / 2 + 0.2, 0]}
            pose={{ ...walkPose(f * 0.1 * wv * (p.v / 0.02) + p.idx, 0.8), expr: "neutro", mouth: "closed" }}
          />
        );
      })}

      <PixelPoints sprites={spr} px={px} k={Math.min(4.2, Math.max(1, camDist / 11))} />
    </>
  );
};

const SKY = "linear-gradient(180deg,#8FB8DD 0%,#BFD7EA 45%,#F6E3C6 100%)";

export const Cena1: React.FC = () => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const div = f >= 1347 ? 8 : f >= 1344 ? 6 : f >= 1341 ? 4 : f >= 1338 ? 2 : 1;
  const w = Math.round(width / div), h = Math.round(height / div);
  const dive = smooth(1235, 1335, f);
  return (
    <AbsoluteFill style={{ background: SKY }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, transform: `scale(${div})`, transformOrigin: "0 0", imageRendering: "pixelated" }}>
        <ThreeCanvas width={w} height={h} flat linear={false} camera={{ fov: 32, near: 0.05, far: 400, position: [0, 3, 13] }} gl={{ antialias: div === 1, alpha: true, preserveDrawingBuffer: true }}>
          <Cena1Scene f={f} w={w} h={h} />
        </ThreeCanvas>
      </div>
      <Grade vignette={0.3 + 0.1 * dive} grain={0.045} vc="40,28,50" />
    </AbsoluteFill>
  );
};

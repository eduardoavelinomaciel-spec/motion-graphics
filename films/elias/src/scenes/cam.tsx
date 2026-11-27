import React from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";

export type Cam = { pos: THREE.Vector3; target: THREE.Vector3; fov: number; roll?: number };

// Frame-driven camera: sets the default R3F camera every render (no useFrame).
export const CameraRig: React.FC<{ cam: Cam }> = ({ cam }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  camera.position.copy(cam.pos);
  camera.up.set(Math.sin(cam.roll ?? 0), Math.cos(cam.roll ?? 0), 0);
  camera.lookAt(cam.target);
  if (camera.fov !== cam.fov) {
    camera.fov = cam.fov;
  }
  camera.near = 0.05;
  camera.far = 400;
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  return null;
};

// Project a world point to screen pixels for 2D overlays (anime FX, iris).
export const project = (p: THREE.Vector3, cam: Cam, w: number, h: number) => {
  const c = new THREE.PerspectiveCamera(cam.fov, w / h, 0.05, 400);
  c.position.copy(cam.pos);
  c.up.set(Math.sin(cam.roll ?? 0), Math.cos(cam.roll ?? 0), 0);
  c.lookAt(cam.target);
  c.updateMatrixWorld();
  c.updateProjectionMatrix();
  const v = p.clone().project(c);
  return { x: (v.x * 0.5 + 0.5) * w, y: (-v.y * 0.5 + 0.5) * h, behind: v.z > 1 };
};

export const V3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export const lerpCam = (a: Cam, b: Cam, t: number): Cam => ({
  pos: a.pos.clone().lerp(b.pos, t),
  target: a.target.clone().lerp(b.target, t),
  fov: a.fov + (b.fov - a.fov) * t,
  roll: (a.roll ?? 0) + ((b.roll ?? 0) - (a.roll ?? 0)) * t,
});

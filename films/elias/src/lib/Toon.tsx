import React from "react";
import * as THREE from "three";

// A mesh with its inverted-hull ink outline (guide §2, 3D row).
export const Toon: React.FC<{
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  outline?: THREE.Material | null;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  renderOrder?: number;
}> = ({ geometry, material, outline, position, rotation, scale, renderOrder }) => (
  <group position={position} rotation={rotation} scale={scale}>
    <mesh geometry={geometry} material={material} renderOrder={renderOrder} />
    {outline ? <mesh geometry={geometry} material={outline} /> : null}
  </group>
);

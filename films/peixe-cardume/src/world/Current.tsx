import React, { useMemo } from "react";
import * as THREE from "three";
import { random } from "remotion";
import { sceneUniforms } from "../lib/materials";

// The current: plankton all drifting the same way, softly glowing (Points, additive).
const VERT = /* glsl */ `
attribute float aSize;
attribute float aPh;
uniform float uTime;
uniform float uSpeed;
uniform vec3 uDir;
uniform float uLen;
uniform float uPx;
varying float vA;
void main() {
  vec3 p = position;
  float s = mod(dot(p, uDir) + uTime * uSpeed + uLen * 0.5, uLen) - uLen * 0.5;
  p += uDir * (s - dot(p, uDir));
  p.y += sin(uTime * 1.3 + aPh) * 0.06;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aSize * uPx / -mv.z;
  vA = 0.55 + 0.45 * sin(uTime * 2.0 + aPh * 3.0);
}
`;
const FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uIntensity;
varying float vA;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float a = smoothstep(0.5, 0.05, d);
  a = a * (0.6 + 0.4 * a) + smoothstep(0.18, 0.0, d);
  gl_FragColor = vec4(uColor * a * vA * uIntensity, 1.0);
  #include <colorspace_fragment>
}
`;

export const CurrentField: React.FC<{
  time: number;
  center: [number, number, number];
  size: [number, number, number];
  dir?: [number, number, number];
  speed?: number;
  count?: number;
  intensity?: number;
  pxScale?: number;
}> = ({ time, center, size, dir = [1, 0, 0], speed = 2.2, count = 900, intensity = 1, pxScale = 540 }) => {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    const ph = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (random(`cx${i}`) - 0.5) * size[0];
      pos[i * 3 + 1] = (random(`cy${i}`) - 0.5) * size[1];
      pos[i * 3 + 2] = (random(`cz${i}`) - 0.5) * size[2];
      sz[i] = 0.18 + random(`cs${i}`) * 0.3;
      ph[i] = random(`cp${i}`) * 6.28;
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(sz, 1));
    g.setAttribute("aPh", new THREE.BufferAttribute(ph, 1));
    return g;
  }, [count, size]);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uSpeed: { value: speed },
          uDir: { value: new THREE.Vector3(...dir).normalize() },
          uLen: { value: size[0] },
          uPx: { value: pxScale },
          uColor: { value: new THREE.Color("#dffcff") },
          uIntensity: { value: intensity },
        },
      }),
    [speed, dir, size, pxScale, intensity],
  );
  mat.uniforms.uTime.value = time;
  mat.uniforms.uIntensity.value = intensity;
  void sceneUniforms;
  return <points geometry={geo} material={mat} position={center} frustumCulled={false} />;
};

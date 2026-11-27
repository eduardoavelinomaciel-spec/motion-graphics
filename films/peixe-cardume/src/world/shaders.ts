import { CAUSTIC_GLSL } from "../lib/glsl";

export const SKY_VERT = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww;
}
`;
export const SKY_FRAG = /* glsl */ `
uniform vec3 uTop;
uniform vec3 uMid;
uniform vec3 uDeep;
uniform vec3 uSun;
uniform float uSunAmt;
varying vec3 vDir;
void main() {
  vec3 d = normalize(vDir);
  vec3 col = mix(uDeep, uMid, smoothstep(-0.5, 0.05, d.y));
  col = mix(col, uTop, smoothstep(0.05, 0.85, d.y));
  float sun = pow(max(dot(d, normalize(vec3(0.25, 1.0, 0.2))), 0.0), 12.0);
  col += uSun * sun * uSunAmt;
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`;

export const SAND_VERT = /* glsl */ `
varying vec3 vW;
varying vec3 vN;
float ripple(vec2 p) {
  float w = p.x * 1.6 + 0.9 * sin(p.y * 0.35) + 0.5 * sin(p.y * 0.9 + p.x * 0.2);
  return 0.07 * sin(w) + 0.25 * sin(p.x * 0.08 + p.y * 0.05) + 0.18 * sin(p.y * 0.11 - p.x * 0.03);
}
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  float e = 0.05;
  float h = ripple(w.xz);
  float hx = ripple(w.xz + vec2(e, 0.0));
  float hz = ripple(w.xz + vec2(0.0, e));
  vN = normalize(vec3(-(hx - h) / e, 1.0, -(hz - h) / e));
  w.y += h;
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;
export const SAND_FRAG = /* glsl */ `
${CAUSTIC_GLSL}
uniform vec3 uSand;
uniform vec3 uShadow;
uniform vec3 uLightDir;
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform float uTime;
uniform float uCausticAmt;
uniform vec3 uCausticColor;
varying vec3 vW;
varying vec3 vN;
void main() {
  float d = dot(normalize(vN), normalize(uLightDir));
  vec3 col = mix(uShadow, uSand, smoothstep(0.78, 0.82, d));
  float c = caustic(vW.xz, uTime);
  col += uCausticColor * c * uCausticAmt;
  float dist = length(cameraPosition - vW);
  float fog = 1.0 - exp(-uFogDensity * uFogDensity * dist * dist);
  col = mix(col, uFogColor, fog);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`;

export const RAY_VERT = /* glsl */ `
varying vec2 vUv;
varying vec3 vW;
void main() {
  vUv = uv;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;
export const RAY_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uIntensity;
varying vec2 vUv;
varying vec3 vW;
void main() {
  float across = pow(sin(3.14159 * vUv.x), 2.0);
  float along = smoothstep(0.0, 0.55, vUv.y) * (0.6 + 0.4 * vUv.y);
  float a = across * along * uIntensity;
  gl_FragColor = vec4(uColor * a, 1.0);
  #include <colorspace_fragment>
}
`;

// Bubble: transparent rim + highlight; iridescent mode tints the rim with a rainbow.
export const BUBBLE_VERT = /* glsl */ `
varying vec3 vN;
varying vec3 vW;
void main() {
  mat4 m = modelMatrix;
  #ifdef USE_INSTANCING
  m = modelMatrix * instanceMatrix;
  #endif
  vec4 w = m * vec4(position, 1.0);
  vW = w.xyz;
  vN = normalize(mat3(m) * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;
export const BUBBLE_FRAG = /* glsl */ `
uniform float uIri;
uniform float uTime;
uniform float uOpacity;
uniform vec3 uFogColor;
uniform float uFogDensity;
varying vec3 vN;
varying vec3 vW;
vec3 hue(float h) {
  return clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
}
void main() {
  vec3 N = normalize(vN);
  vec3 V = normalize(cameraPosition - vW);
  float f = 1.0 - max(dot(N, V), 0.0);
  float rim = smoothstep(0.55, 0.95, f);
  vec3 col = mix(vec3(0.8, 0.97, 1.0), hue(f * 1.6 + uTime * 0.25 + vW.y * 0.2) * 1.2, uIri);
  float a = 0.06 + rim * 0.85;
  // ink-blue edge so the bubble reads on bright water (HQ outline)
  float edge = smoothstep(0.86, 0.97, f);
  col = mix(col, vec3(0.08, 0.42, 0.62), edge * 0.55);
  // highlights: a big window and a small dot
  vec3 L = normalize(vec3(-0.45, 0.7, 0.55));
  float h = smoothstep(0.9, 0.93, dot(N, L));
  float h2 = smoothstep(0.95, 0.97, dot(N, normalize(vec3(0.5, -0.4, 0.75))));
  col = mix(col, vec3(1.0), max(h, h2 * 0.8));
  a = max(a, max(h, h2 * 0.8));
  if (uIri > 0.0) {
    // thin-film swirl across the face of the bubble
    float sw = sin((N.x * 5.0 + N.y * 3.0) + uTime * 1.5) * 0.5 + 0.5;
    col = mix(col, hue(sw + f), 0.35 * uIri * (1.0 - h));
    a = max(a, 0.18 * uIri);
  }
  float dist = length(cameraPosition - vW);
  float fog = 1.0 - exp(-uFogDensity * uFogDensity * dist * dist);
  col = mix(col, uFogColor, fog);
  gl_FragColor = vec4(col, a * uOpacity * (1.0 - fog));
  #include <colorspace_fragment>
}
`;

// School fish: instanced toon with a painted dot-eye and a per-instance glint (the "wave of shine").
export const SCHOOL_VERT = /* glsl */ `
attribute float aPhase;
attribute float aGlint;
uniform float uTime;
uniform float uThick;
varying vec3 vN;
varying vec3 vW;
varying vec3 vL;
varying float vGlint;
void main() {
  vec3 p = position + normal * uThick;
  float k = max(0.15 - p.x, 0.0);
  p.z += 0.28 * k * k * sin(uTime * 9.0 + aPhase - p.x * 3.2);
  vL = position;
  vGlint = aGlint;
  mat4 m = modelMatrix * instanceMatrix;
  vec4 w = m * vec4(p, 1.0);
  vW = w.xyz;
  vN = normalize(mat3(m) * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;
export const SCHOOL_FRAG = /* glsl */ `
${CAUSTIC_GLSL}
uniform vec3 uColor;
uniform vec3 uBelly;
uniform vec3 uShadowTint;
uniform vec3 uLightDir;
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform float uTime;
uniform float uCaustic;
uniform float uOutline;
uniform vec3 uInk;
uniform float uEyeX;
uniform float uEyeY;
varying vec3 vN;
varying vec3 vW;
varying vec3 vL;
varying float vGlint;
void main() {
  float dist = length(cameraPosition - vW);
  float fog = 1.0 - exp(-uFogDensity * uFogDensity * dist * dist);
  if (uOutline > 0.5) {
    gl_FragColor = vec4(mix(uInk, uFogColor, fog), 1.0);
    #include <colorspace_fragment>
    return;
  }
  vec3 N = normalize(vN);
  vec3 V = normalize(cameraPosition - vW);
  vec3 Ld = normalize(uLightDir);
  vec3 base = mix(uColor, uBelly, smoothstep(-0.02, 0.06, -vL.y));
  float d = dot(N, Ld);
  float t1 = smoothstep(-0.14, -0.1, d);
  float t2 = smoothstep(0.44, 0.48, d);
  vec3 col = mix(mix(base * 0.58 * uShadowTint, base * 0.85, t1), base * 1.04, t2);
  // painted eye
  float e = length(vec2(vL.x - uEyeX, vL.y - uEyeY));
  col = mix(col, vec3(1.0), 1.0 - smoothstep(0.085, 0.095, e));
  col = mix(col, uInk, 1.0 - smoothstep(0.06, 0.07, e));
  col = mix(col, vec3(1.0), 1.0 - smoothstep(0.016, 0.024, length(vec2(vL.x - uEyeX + 0.02, vL.y - uEyeY - 0.025))));
  // glint: the flank flashes when the fish turns into the light
  float rim = 1.0 - max(dot(N, V), 0.0);
  col += vec3(0.75, 0.95, 1.0) * (vGlint * (0.5 + 0.5 * t2) + smoothstep(0.62, 0.68, rim) * 0.35);
  col += uCaustic * caustic(vW.xz, uTime) * t1 * vec3(0.5, 0.58, 0.55);
  col = mix(col, uFogColor, fog);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`;

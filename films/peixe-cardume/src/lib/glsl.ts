// Shared GLSL chunks for the toon look (guide §2: 3-tone cel, rim light, ink outline).

export const WAVE_GLSL = /* glsl */ `
uniform float uWaveAmp;
uniform float uWavePhase;
uniform float uWaveFreq;
uniform float uWaveStart;
vec3 applyWave(vec3 p) {
  float k = max(uWaveStart - p.x, 0.0);
  p.z += uWaveAmp * k * k * sin(uWavePhase - p.x * uWaveFreq);
  return p;
}
`;

export const VORONOI_GLSL = /* glsl */ `
vec3 hash3(vec3 p) {
  p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6)));
  return fract(sin(p) * 43758.5453123);
}
// returns F1, F2, cell id hash
vec3 voronoi(vec3 x) {
  vec3 n = floor(x);
  vec3 f = fract(x);
  float f1 = 8.0;
  float f2 = 8.0;
  float id = 0.0;
  for (int k = -1; k <= 1; k++)
  for (int j = -1; j <= 1; j++)
  for (int i = -1; i <= 1; i++) {
    vec3 g = vec3(float(i), float(j), float(k));
    vec3 o = hash3(n + g);
    vec3 r = g + o - f;
    float d = dot(r, r);
    if (d < f1) { f2 = f1; f1 = d; id = o.x; }
    else if (d < f2) { f2 = d; }
  }
  return vec3(sqrt(f1), sqrt(f2), id);
}
`;

export const CAUSTIC_GLSL = /* glsl */ `
vec2 chash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}
float cedge(vec2 p, float t) {
  vec2 n = floor(p);
  vec2 f = fract(p);
  float f1 = 8.0;
  float f2 = 8.0;
  for (int j = -1; j <= 1; j++)
  for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j));
    vec2 o = chash2(n + g);
    o = 0.5 + 0.42 * sin(t + 6.2831 * o);
    vec2 r = g + o - f;
    float d = dot(r, r);
    if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) { f2 = d; }
  }
  return sqrt(f2) - sqrt(f1);
}
// crisp, anime-style caustic network (two drifting layers)
float caustic(vec2 p, float t) {
  float a = cedge(p * 1.15, t * 0.9);
  float b = cedge(p * 1.7 + vec2(3.1, 1.7), t * 1.2 + 2.0);
  return smoothstep(0.09, 0.035, a) * 0.65 + smoothstep(0.08, 0.03, b) * 0.4;
}
`;

export const TOON_VERT = /* glsl */ `
${WAVE_GLSL}
varying vec3 vN;
varying vec3 vW;
varying vec3 vL;
void main() {
  vec3 p = applyWave(position);
  vL = position;
  vec4 w = modelMatrix * vec4(p, 1.0);
  vW = w.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

export const TOON_FRAG = /* glsl */ `
${VORONOI_GLSL}
${CAUSTIC_GLSL}
uniform float uCaustic;
uniform vec3 uColor;
uniform vec3 uTip;
uniform vec3 uTipAxis;
uniform float uTipStart;
uniform float uTipSoft;
uniform vec3 uShadowTint;
uniform vec3 uLightDir;
uniform vec3 uRimColor;
uniform float uRim;
uniform float uSpec;
uniform int uPattern;
uniform vec3 uPatternColor;
uniform float uPatternScale;
uniform float uPatternAmt;
uniform vec3 uPatternOrigin;
uniform float uTime;
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform float uSilhouette;
uniform float uOpacity;
varying vec3 vN;
varying vec3 vW;
varying vec3 vL;

void main() {
  vec3 N = normalize(vN);
  if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vW);
  vec3 Ld = normalize(uLightDir);

  vec3 base = uColor;
  float tipT = dot(vL, uTipAxis);
  base = mix(base, uTip, smoothstep(uTipStart - uTipSoft, uTipStart + uTipSoft, tipT));

  if (uPattern == 1) {
    // shell plates: dark seams between voronoi cells, slight per-plate variation
    vec3 v = voronoi(vL * uPatternScale);
    float edge = v.y - v.x;
    base *= 0.9 + 0.22 * v.z;
    base = mix(uPatternColor, base, smoothstep(0.06, 0.14, edge));
  } else if (uPattern == 2) {
    // chromatophores: spots that grow and shrink over time
    vec3 v = voronoi(vL * uPatternScale + vec3(0.0, 0.0, uTime * 0.15));
    float r = 0.22 + 0.16 * sin(uTime * 2.0 + v.z * 6.2831);
    float spot = 1.0 - smoothstep(r - 0.04, r, v.x);
    base = mix(base, uPatternColor, spot * uPatternAmt);
  } else if (uPattern == 3) {
    // fish scales: offset rows of arcs
    vec2 q = vec2(vL.x, vL.y) * uPatternScale;
    float row = floor(q.y);
    q.x += mod(row, 2.0) * 0.5;
    vec2 c = fract(q) - vec2(0.5, 0.0);
    float d = length(c);
    float arc = smoothstep(0.03, 0.0, abs(d - 0.5)) * step(0.0, c.y);
    base = mix(base, base * uPatternColor, arc * uPatternAmt);
  } else if (uPattern == 4) {
    // fin rays: thin lines fanning out from an origin point at the fin root
    float a = atan(vL.y - uPatternOrigin.y, vL.x - uPatternOrigin.x);
    float ray = abs(sin(a * uPatternScale));
    float line = smoothstep(0.16, 0.0, ray);
    base = mix(base, base * uPatternColor, line * uPatternAmt);
  }

  float d = dot(N, Ld);
  float t1 = smoothstep(-0.14, -0.10, d);
  float t2 = smoothstep(0.44, 0.48, d);
  vec3 shadowC = base * 0.58 * uShadowTint;
  vec3 midC = base * mix(vec3(0.84), uShadowTint, 0.25);
  vec3 lightC = base * 1.04;
  vec3 col = mix(mix(shadowC, midC, t1), lightC, t2);

  col += uCaustic * caustic(vW.xz, uTime) * t1 * vec3(0.55, 0.62, 0.6);

  vec3 H = normalize(Ld + V);
  col += uSpec * smoothstep(0.955, 0.965, dot(N, H)) * vec3(1.0);

  float rim = 1.0 - max(dot(N, V), 0.0);
  col += uRimColor * smoothstep(0.62, 0.68, rim) * uRim;

  float dist = length(cameraPosition - vW);
  float fog = 1.0 - exp(-uFogDensity * uFogDensity * dist * dist);
  col = mix(col, uFogColor, fog);
  col = mix(col, vec3(0.0), uSilhouette);

  gl_FragColor = vec4(col, uOpacity);
  #include <colorspace_fragment>
}
`;

export const OUTLINE_VERT = /* glsl */ `
${WAVE_GLSL}
uniform float uThick;
varying vec3 vW;
void main() {
  vec3 p = applyWave(position + normal * uThick);
  vec4 w = modelMatrix * vec4(p, 1.0);
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

export const OUTLINE_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform float uOpacity;
varying vec3 vW;
void main() {
  float dist = length(cameraPosition - vW);
  float fog = 1.0 - exp(-uFogDensity * uFogDensity * dist * dist);
  gl_FragColor = vec4(mix(uColor, uFogColor, fog), uOpacity);
  #include <colorspace_fragment>
}
`;

// Anime eye drawn procedurally on a flattened sphere (local xy in -1..1).
export const EYE_VERT = /* glsl */ `
${WAVE_GLSL}
varying vec3 vL;
void main() {
  vL = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const EYE_FRAG = /* glsl */ `
uniform vec3 uIris;
uniform vec3 uIrisDark;
uniform vec3 uSkin;
uniform vec3 uLine;
uniform vec2 uLook;
uniform float uIrisScale;
uniform float uPupil;
uniform float uLidTop;
uniform float uLidBot;
uniform float uTilt;
uniform float uSide;
uniform float uMode;   // 0 normal, 1 star, 2 happy arc, 3 swirl-free tiny
uniform float uShine;  // extra wet shine (tears)
uniform float uWrinkle;
uniform float uLash;
uniform float uSilhouette;
varying vec3 vL;

float sdStar(vec2 p, float r, float rf) {
  const vec2 k1 = vec2(0.809016994, -0.587785252);
  const vec2 k2 = vec2(-k1.x, k1.y);
  p.x = abs(p.x);
  p -= 2.0 * max(dot(k1, p), 0.0) * k1;
  p -= 2.0 * max(dot(k2, p), 0.0) * k2;
  p.x = abs(p.x);
  p.y -= r;
  vec2 ba = rf * vec2(-k1.y, k1.x) - vec2(0.0, 1.0);
  float h = clamp(dot(p, ba) / dot(ba, ba), 0.0, r);
  return length(p - ba * h) * sign(p.y * ba.x - p.x * ba.y);
}

void main() {
  vec2 p = vL.xy;
  p.x *= uSide;
  float aa = fwidth(p.y) * 1.2 + 0.004;
  float r = length(p);

  vec3 col = vec3(0.97, 0.98, 1.0);
  // soft shade at top of the sclera (anime look)
  col = mix(col, vec3(0.78, 0.84, 0.93), smoothstep(0.35, 0.8, p.y) * 0.6);

  vec2 ip = p - uLook;
  float ir = 0.66 * uIrisScale;
  float iris = 1.0 - smoothstep(-aa, aa, length(ip) - ir);
  vec3 irisCol = mix(uIris * 1.25, uIrisDark, smoothstep(-0.6 * ir, 0.7 * ir, ip.y));
  // lighter crescent at the bottom of the iris
  irisCol = mix(irisCol, uIris * 1.6 + 0.1, smoothstep(-0.35 * ir, -0.85 * ir, ip.y) * 0.6);
  col = mix(col, irisCol, iris);
  // iris ring
  col = mix(col, uLine, (1.0 - smoothstep(0.0, aa * 2.0, abs(length(ip) - ir))) * iris * 0.8);

  float pr = ir * uPupil;
  col = mix(col, uLine, 1.0 - smoothstep(-aa, aa, length(ip) - pr));

  if (uMode > 0.5 && uMode < 1.5) {
    float s = sdStar(ip * vec2(1.0, -1.0) * -1.0, 0.52 * uIrisScale, 0.45);
    float star = 1.0 - smoothstep(-aa, aa, s);
    col = mix(col, vec3(1.0, 0.88, 0.35), star);
    col = mix(col, vec3(1.0, 0.99, 0.9), (1.0 - smoothstep(-aa, aa, s + 0.12)));
  }

  // highlights (two, fixed in eye space, drift a bit with gaze)
  vec2 hl = uLook * 0.55;
  float h1 = 1.0 - smoothstep(-aa, aa, length(p - vec2(-0.26, 0.30) - hl) - 0.19 * (1.0 + 0.35 * uShine));
  float h2 = 1.0 - smoothstep(-aa, aa, length(p - vec2(0.24, -0.26) - hl) - 0.085 * (1.0 + 0.5 * uShine));
  col = mix(col, vec3(1.0), max(h1, h2));
  // wet shine line along the bottom when teary
  col = mix(col, vec3(0.85, 0.95, 1.0), uShine * (1.0 - smoothstep(0.0, aa * 3.0, abs(r - 0.72))) * step(p.y, -0.15));

  // eye outline
  col = mix(col, uLine, smoothstep(0.85 - aa, 0.85 + aa, r));

  // lids
  float topY = 0.95 - 1.9 * uLidTop + uTilt * p.x - 0.28 * uLidTop * p.x * p.x;
  float topMask = smoothstep(topY - aa, topY + aa, p.y);
  float topLine = 1.0 - smoothstep(0.045, 0.045 + aa * 2.0, abs(p.y - topY));
  float botY = -0.95 + 1.9 * uLidBot + 0.35 * uLidBot * (1.0 - p.x * p.x);
  float botMask = 1.0 - smoothstep(botY - aa, botY + aa, p.y);
  float botLine = 1.0 - smoothstep(0.03, 0.03 + aa * 2.0, abs(p.y - botY));
  if (uLidTop > 0.01) col = mix(col, uLine, topLine * step(r, 0.86));
  col = mix(col, uSkin, topMask * step(0.001, uLidTop));
  if (uLidBot > 0.01) col = mix(col, uLine, botLine * step(r, 0.86) * 0.8);
  col = mix(col, uSkin, botMask * step(0.001, uLidBot));
  if (uLidTop > 0.01 || uLidBot > 0.01) {
    // the outline must stay on the lids' skin as well, but softer
    col = mix(col, uLine, smoothstep(0.85 - aa, 0.85 + aa, r) * 0.0);
  }

  // eyelashes: two short ink flicks at the outer top corner
  if (uLash > 0.0) {
    for (int i = 0; i < 2; i++) {
      float fi = float(i);
      vec2 a = vec2(0.5 + 0.1 * fi, 0.6 - 0.2 * fi - 0.9 * uLidTop);
      vec2 b = a + vec2(0.2, 0.12 - 0.05 * fi);
      vec2 pa = p - a;
      vec2 ba = b - a;
      float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
      float dl = length(pa - ba * h) - 0.05 * (1.0 - h);
      col = mix(col, uLine, (1.0 - smoothstep(-aa, aa, dl)) * uLash);
    }
  }

  if (uMode > 1.5 && uMode < 2.5) {
    // happy ^ ^ : skin with a thick dark arc
    col = uSkin;
    float y = 0.05 + 0.55 * (1.0 - p.x * p.x * 1.6);
    float arc = 1.0 - smoothstep(0.09, 0.09 + aa * 2.0, abs(p.y - y + 0.25));
    col = mix(col, uLine, arc * step(abs(p.x), 0.72));
  }

  // wrinkles (old turtle): two soft arcs below the eye
  if (uWrinkle > 0.0) {
    float w1 = 1.0 - smoothstep(0.02, 0.02 + aa * 2.0, abs(length(p - vec2(0.0, 0.35)) - 1.12));
    col = mix(col, uSkin * 0.6, w1 * step(r, 0.99) * step(0.86, r) * uWrinkle);
  }

  col = mix(col, vec3(0.0), uSilhouette);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`;

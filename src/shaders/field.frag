#version 300 es
precision highp float;

out vec4 fragColor;

uniform vec2  uRes;
uniform float uTime;

// A woven field, not a wallpaper.
//
// The old version was one tiling at one scale across the whole frame -- which is
// why it read as dull however good the tile was. Real Kuba and bogolan cloth is
// built in REGISTERS: horizontal bands, each with its own scale, density, weight
// and family, separated by rules and occasionally interrupted. The interest is
// in the composition of bands, not in the tile.
uniform float uBands;      // how many registers across the frame
uniform float uScale;      // base cell size
uniform float uShape;      // base family
uniform float uVariance;   // how far bands depart from the base
uniform float uWeight;
uniform float uInk;        // opacity of the pattern against the ground
uniform float uBreak;      // chance a cell is left empty
uniform float uRule;       // weight of the lines between bands
uniform float uDrift;      // bands slide against each other
uniform vec3  uGroundA;
uniform vec3  uGroundB;
uniform vec3  uInkA;
uniform vec3  uInkB;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
vec2 hash22(vec2 p) { return vec2(hash21(p), hash21(p + 17.13)); }
float hash11(float p) { return fract(sin(p * 78.233) * 43758.5453); }

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i),              hash21(i + vec2(1, 0)), f.x),
             mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) {
  return noise(p) * 0.6 + noise(p * 2.7 + 3.1) * 0.3 + noise(p * 6.1 - 1.7) * 0.1;
}

float seg(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0));
}

const int NP = 7;
const vec2 PA[28] = vec2[28](
  vec2(-0.5000, 0.0000), vec2(-0.3706, 0.0170), vec2(-0.2500, 0.0670),
  vec2(-0.1464, 0.1464), vec2(-0.0670, 0.2500), vec2(-0.0170, 0.3706),
  vec2( 0.0000, 0.5000),
  vec2(-0.5000, 0.0000), vec2(-0.4167, 0.0833), vec2(-0.3333, 0.1667),
  vec2(-0.2500, 0.2500), vec2(-0.1667, 0.3333), vec2(-0.0833, 0.4167),
  vec2( 0.0000, 0.5000),
  vec2(-0.5000, 0.0000), vec2(-0.3333, 0.0000), vec2(-0.1667, 0.0000),
  vec2( 0.0000, 0.0000), vec2( 0.0000, 0.1667), vec2( 0.0000, 0.3333),
  vec2( 0.0000, 0.5000),
  vec2(-0.5000, 0.0000), vec2(-0.3333, 0.0000), vec2(-0.2500, 0.0833),
  vec2(-0.2500, 0.2500), vec2(-0.0833, 0.2500), vec2( 0.0000, 0.3333),
  vec2( 0.0000, 0.5000)
);
const vec2 PB[28] = vec2[28](
  vec2( 0.5000, 0.0000), vec2( 0.3706,-0.0170), vec2( 0.2500,-0.0670),
  vec2( 0.1464,-0.1464), vec2( 0.0670,-0.2500), vec2( 0.0170,-0.3706),
  vec2( 0.0000,-0.5000),
  vec2( 0.5000, 0.0000), vec2( 0.4167,-0.0833), vec2( 0.3333,-0.1667),
  vec2( 0.2500,-0.2500), vec2( 0.1667,-0.3333), vec2( 0.0833,-0.4167),
  vec2( 0.0000,-0.5000),
  vec2( 0.5000, 0.0000), vec2( 0.5000,-0.1667), vec2( 0.5000,-0.3333),
  vec2( 0.5000,-0.5000), vec2( 0.3333,-0.5000), vec2( 0.1667,-0.5000),
  vec2( 0.0000,-0.5000),
  vec2( 0.5000, 0.0000), vec2( 0.3333, 0.0000), vec2( 0.2500,-0.0833),
  vec2( 0.2500,-0.2500), vec2( 0.0833,-0.2500), vec2( 0.0000,-0.3333),
  vec2( 0.0000,-0.5000)
);

float poly(vec2 p, int i0, int i1, float t, bool second) {
  vec2 a = second ? mix(PB[i0*NP], PB[i1*NP], t) : mix(PA[i0*NP], PA[i1*NP], t);
  float d = 1e9;
  for (int k = 1; k < NP; k++) {
    vec2 b = second ? mix(PB[i0*NP+k], PB[i1*NP+k], t) : mix(PA[i0*NP+k], PA[i1*NP+k], t);
    d = min(d, seg(p, a, b)); a = b;
  }
  return d;
}
float cell(vec2 p, float h, float shape) {
  if (h < 0.5) p.x = -p.x;
  float s = clamp(shape, 0.0, 2.999);
  int i0 = int(floor(s));
  float t = smoothstep(0.0, 1.0, fract(s));
  return min(poly(p, i0, i0+1, t, false), poly(p, i0, i0+1, t, true));
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);

  // --- registers ---------------------------------------------------------
  // bands of unequal height: a uniform stack reads as a grid, and the whole
  // point is that the cloth is composed rather than tiled.
  float bandF = uv.y * uBands;
  float bi    = floor(bandF);
  float warp  = (hash11(bi * 3.1) - 0.5) * 0.45;      // uneven band heights
  bandF = (uv.y + warp / uBands) * uBands;
  bi    = floor(bandF);
  float bf = fract(bandF);

  float s0 = hash11(bi * 1.7);
  float s1 = hash11(bi * 5.3 + 9.1);
  float s2 = hash11(bi * 2.9 - 4.4);

  // each register gets its own scale, family, weight and density
  float scale  = uScale * mix(0.45, 2.1, pow(s0, 1.4)) * mix(1.0, 1.0 + uVariance, 1.0);
  float shape  = mod(uShape + s1 * 3.0 * uVariance, 3.0);
  float weight = uWeight * mix(0.6, 1.7, s2);

  // bands slide against one another -- weaving, not scrolling
  float slide = (s1 - 0.5) * uDrift * uTime * 0.02;

  vec2 g  = vec2(uv.x + slide, uv.y) * scale;
  vec2 id = floor(g);
  vec2 f  = fract(g) - 0.5;

  vec2  cellUV = (id + 0.5) / max(scale, 1e-4);
  float hsel = noise(cellUV * 26.0 + bi * 7.7);

  // continuous morph, tiny -- the field is never quite still
  float breath = sin(uTime * 0.067 + bi) * 0.03 + sin(uTime * 0.041 + 4.1) * 0.02;
  float d = cell(f, hsel, clamp(shape + breath, 0.0, 2.999));

  float aa  = fwidth(d) * 1.1;
  float ink = 1.0 - smoothstep(weight - aa, weight + aa, d);

  // deliberate breaks: cells left empty. this is the rule the cloth breaks.
  float gap = hash21(id * 1.31 + bi * 13.0);
  ink *= step(uBreak, gap);

  // hand-stamped: uneven impression
  ink *= 0.62 + 0.38 * fbm(g * 2.4 + bi);

  // --- rules between registers -------------------------------------------
  float edge = min(bf, 1.0 - bf);
  float rule = 1.0 - smoothstep(0.0, 0.012 + fwidth(bf) * 2.0, edge - 0.004);
  ink = max(ink, rule * uRule);

  // --- composite ---------------------------------------------------------
  float gy = clamp(0.5 + uv.y * 0.7, 0.0, 1.0);
  vec3 ground = mix(uGroundB, uGroundA, gy);

  // ink shifts temperature across the frame so it is never one flat colour
  float sheen = clamp(0.5 + uv.x * 0.6 + uv.y * 0.35, 0.0, 1.0);
  vec3 inkC = mix(uInkA, uInkB, sheen);

  vec3 col = mix(ground, inkC, clamp(ink, 0.0, 1.0) * uInk);
  col += (hash21(gl_FragCoord.xy + floor(uTime * 8.0)) - 0.5) * 0.02;

  fragColor = vec4(col, 1.0);
}

#version 300 es
precision highp float;

out vec4 fragColor;

uniform vec2  uRes;
uniform float uTime;

// ground -- one dark field, unchanging. ink sits a few values above it so the
// pattern is present but ambient, which is what lets type sit anywhere.
uniform vec3  uGroundA;
uniform vec3  uGroundB;
uniform vec3  uGroundInk;
uniform float uGroundShape;
uniform float uGroundScale;

// halo -- the event. one saturated pigment, full contrast inside.
uniform vec2  uPos;
uniform float uHaloR;
uniform float uHaloForm;   // 0 circle -> 1 n-gon -> 2 star, continuous
uniform float uHaloN;
uniform vec3  uHaloA;
uniform vec3  uHaloB;
uniform vec3  uHaloInk;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
vec2 hash22(vec2 p) { return vec2(hash21(p), hash21(p + 17.13)); }

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i),              hash21(i + vec2(1, 0)), f.x),
             mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), f.x), f.y);
}

float fbm(vec2 p) {
  return noise(p) * 0.6 + noise(p * 2.7 + 3.1) * 0.3 + noise(p * 6.1 - 1.7) * 0.1;
}

// curl of a scalar noise field -> divergence-free flow. advecting the figure
// along it reads as liquid rather than as a wobble.
vec2 curl(vec2 p) {
  float e = 0.08;
  float n1 = fbm(p + vec2(0.0, e)), n2 = fbm(p - vec2(0.0, e));
  float n3 = fbm(p + vec2(e, 0.0)), n4 = fbm(p - vec2(e, 0.0));
  return vec2(n1 - n2, n4 - n3) / (2.0 * e);
}

float seg(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0));
}

// ---------------------------------------------------------------------------
// four tile families. each is a pair of 7-point polylines: PA runs left-edge
// midpoint -> top-edge midpoint, PB runs right -> bottom. every family shares
// those four contact points, so tiles chain across borders in any family.
//
// morphing happens on the CONTROL POINTS, not on finished distance fields.
// mixing two SDFs interpolates the field and the contour pinches off mid-blend;
// mixing points keeps one continuous path with its ends nailed to the edges,
// so the sweep stays connected at every intermediate value of uShape.
//
// PB is the point-reflection of PA for every family except ELBOW, where PA
// turns at the cell centre and PB hugs the far corner. that asymmetry is what
// makes the greek key read as a meander instead of a lattice of loops.
//
// 0 ARC    quarter circle            -- flowing maze
// 1 CHORD  straight corner-to-corner -- blocky diamond lattice
// 2 ELBOW  single right angle        -- greek key / meander
// 3 STEP   two-tread staircase       -- densest, circuit-like
// ---------------------------------------------------------------------------

const int NP = 7;

const vec2 PA[28] = vec2[28](
  vec2(-0.5000, 0.0000), vec2(-0.3706, 0.0170), vec2(-0.2500, 0.0670), vec2(-0.1464, 0.1464), vec2(-0.0670, 0.2500), vec2(-0.0170, 0.3706), vec2( 0.0000, 0.5000),
  vec2(-0.5000, 0.0000), vec2(-0.4167, 0.0833), vec2(-0.3333, 0.1667), vec2(-0.2500, 0.2500), vec2(-0.1667, 0.3333), vec2(-0.0833, 0.4167), vec2( 0.0000, 0.5000),
  vec2(-0.5000, 0.0000), vec2(-0.3333, 0.0000), vec2(-0.1667, 0.0000), vec2( 0.0000, 0.0000), vec2( 0.0000, 0.1667), vec2( 0.0000, 0.3333), vec2( 0.0000, 0.5000),
  vec2(-0.5000, 0.0000), vec2(-0.3333, 0.0000), vec2(-0.2500, 0.0833), vec2(-0.2500, 0.2500), vec2(-0.0833, 0.2500), vec2( 0.0000, 0.3333), vec2( 0.0000, 0.5000)
);

const vec2 PB[28] = vec2[28](
  vec2( 0.5000,-0.0000), vec2( 0.3706,-0.0170), vec2( 0.2500,-0.0670), vec2( 0.1464,-0.1464), vec2( 0.0670,-0.2500), vec2( 0.0170,-0.3706), vec2(-0.0000,-0.5000),
  vec2( 0.5000,-0.0000), vec2( 0.4167,-0.0833), vec2( 0.3333,-0.1667), vec2( 0.2500,-0.2500), vec2( 0.1667,-0.3333), vec2( 0.0833,-0.4167), vec2(-0.0000,-0.5000),
  vec2( 0.5000, 0.0000), vec2( 0.5000,-0.1667), vec2( 0.5000,-0.3333), vec2( 0.5000,-0.5000), vec2( 0.3333,-0.5000), vec2( 0.1667,-0.5000), vec2( 0.0000,-0.5000),
  vec2( 0.5000,-0.0000), vec2( 0.3333,-0.0000), vec2( 0.2500,-0.0833), vec2( 0.2500,-0.2500), vec2( 0.0833,-0.2500), vec2(-0.0000,-0.3333), vec2(-0.0000,-0.5000)
);

float polyDist(vec2 p, int i0, int i1, float t, bool second) {
  vec2 a = second ? mix(PB[i0 * NP], PB[i1 * NP], t)
                  : mix(PA[i0 * NP], PA[i1 * NP], t);
  float d = 1e9;
  for (int k = 1; k < NP; k++) {
    vec2 b = second ? mix(PB[i0 * NP + k], PB[i1 * NP + k], t)
                    : mix(PA[i0 * NP + k], PA[i1 * NP + k], t);
    d = min(d, seg(p, a, b));
    a = b;
  }
  return d;
}

float cell(vec2 p, float h, float shape) {
  if (h < 0.5) p.x = -p.x;
  float s  = clamp(shape, 0.0, 2.999);
  int   i0 = int(floor(s));
  float t  = smoothstep(0.0, 1.0, fract(s));
  return min(polyDist(p, i0, i0 + 1, t, false),
             polyDist(p, i0, i0 + 1, t, true));
}



// polar radius of the halo. one function covers circle, polygon and star, so
// the silhouette can tween between looks like any other parameter.
float haloRadius(float th, float form, float sides) {
  float k = 6.28318530718 / max(sides, 3.0);
  float a = mod(th, k) - k * 0.5;
  float poly = cos(k * 0.5) / max(cos(a), 1e-4);
  float star = 1.0 - 0.55 * abs(a) / (k * 0.5);
  float f = clamp(form, 0.0, 2.0);
  return f < 1.0 ? mix(1.0, poly, f) : mix(poly, star, f - 1.0);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);

  vec2  dv   = uv - uPos;
  float dRad = length(dv);
  float th   = atan(dv.y, dv.x);

  // the edge is irregular. a mathematically clean circle reads as a UI element;
  // break it with low-frequency noise and it reads as printed -- an object.
  float edge = uHaloR * haloRadius(th, uHaloForm, uHaloN);
  edge *= 1.0 + (fbm(dv * 5.0 + uTime * 0.03) - 0.5) * 0.045;

  float soft = 0.0016 + uHaloR * 0.004;
  float mask = 1.0 - smoothstep(edge - soft, edge + soft, dRad);

  // --- field -----------------------------------------------------------
  float breath = sin(uTime * 0.067 + 1.3) * 0.35;
  float scale  = uGroundScale * (1.0 + sin(uTime * 0.11) * 0.06);
  float shape  = uGroundShape;

  vec2 g  = uv * scale;
  vec2 id = floor(g);
  vec2 f  = fract(g) - 0.5;
  f += (hash22(id) - 0.5) * 0.028;

  // tile chosen from smooth noise at the cell's world position -- a hash of the
  // cell index re-rolls the whole field the moment scale animates
  vec2  cellUV = (id + 0.5) / max(scale, 1e-4);
  float h = noise(cellUV * 26.0);

  float d = cell(f, h, clamp(shape + breath, 0.0, 2.999));

  vec2 dr = vec2(uTime * 0.05, uTime * -0.03);
  d += (fbm(g * 11.0 + dr * 2.0) - 0.5) * 0.062;
  float w = 0.085 * (1.0 + (fbm(g * 1.6 - dr) - 0.5) * 0.5);

  float aa  = fwidth(d) * 1.1;
  float ink = 1.0 - smoothstep(w - aa, w + aa, d);

  float brush = fbm(g * 6.5 + dr) * 0.65 + fbm(g * 17.0 - dr * 1.6) * 0.35;
  ink *= mix(1.0, smoothstep(0.24, 0.68, brush), 0.5);

  // --- composite -------------------------------------------------------
  float gy = clamp(0.5 + uv.y * 0.75, 0.0, 1.0);
  vec3 ground = mix(uGroundB, uGroundA, gy);

  // the halo gradient seats the pigment: lit at the top, deep at the bottom,
  // with a slight radial fall so it is a body of colour and not a flat plate
  float hy = clamp(0.5 + dv.y / max(edge * 2.0, 1e-4), 0.0, 1.0);
  vec3  halo = mix(uHaloB, uHaloA, hy);
  halo *= 1.0 - 0.14 * smoothstep(0.3, 1.0, dRad / max(edge, 1e-4));

  vec3 field = mix(ground, halo, mask);
  vec3 inkC  = mix(uGroundInk, uHaloInk, mask);

  vec3 col = mix(field, inkC, clamp(ink, 0.0, 1.0));

  // grain, always. it is the one print artefact that costs nothing.
  col += (hash21(gl_FragCoord.xy + floor(uTime * 8.0)) - 0.5) * 0.028;

  fragColor = vec4(col, 1.0);
}

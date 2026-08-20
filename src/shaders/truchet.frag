#version 300 es
precision highp float;

out vec4 fragColor;

uniform vec2  uRes;
uniform float uTime;
uniform float uScale;      // cells across the short axis
uniform float uThickness;  // stroke weight (cell units)
uniform float uShape;      // 0..3 -- morphs continuously through four tile families
uniform float uWarp;       // low-freq domain warp -> hand-drawn feel
uniform float uJitter;     // per-cell positional wobble
uniform float uRewire;     // advances the hash -> maze reroutes
uniform float uBreath;     // slow modulation of scale / shape / warp / drift
uniform float uRough;      // ragged contour -- eaten edges
uniform float uBreakup;    // dry-brush holes inside the stroke
uniform float uDensity;    // how opaque the ink sits at its fullest
uniform float uDrift;      // how fast the breakup field crawls
uniform float uGrain;
uniform vec3  uInk;
uniform vec3  uGround;

// --- disc -------------------------------------------------------------
// a circular region running a SECOND parameter set. it is not an overlay:
// inside it the pattern itself changes family, scale and colour, and the two
// states cross-fade across the edge. because the family morph is continuous,
// the boundary stays connected -- paths run out of one state and into the other.
// at halo scale it frames the figure; grown past the viewport it becomes the
// transition to the next character.
uniform vec2  uDiscPos;
uniform float uDiscR;
uniform float uDiscSoft;
uniform float uDiscShape;
uniform float uDiscScale;
uniform vec3  uDiscInk;
uniform vec3  uDiscA;      // gradient, top
uniform vec3  uDiscB;      // gradient, bottom

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

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);

  // four slow periods, mutually prime, so the loop never lands back on itself
  float scaleNow = uScale * (1.0 + sin(uTime * 0.11)       * 0.14 * uBreath);
  float shapeNow = uShape +        sin(uTime * 0.067 + 1.3) * 0.55 * uBreath;
  float warpNow  = uWarp  * (1.0 + sin(uTime * 0.13 + 1.7) * 0.45 * uBreath);
  float driftNow = uDrift * (1.0 + sin(uTime * 0.05 + 3.1) * 0.60 * uBreath);

  // disc mask taken before the warp, so the circle itself stays a true circle
  vec2  dv   = uv - uDiscPos;
  float dRad = length(dv);
  float mask = 1.0 - smoothstep(uDiscR - uDiscSoft, uDiscR + uDiscSoft, dRad);

  // the disc carries its own gradient, with a little radial fall to seat the
  // figure against it rather than leaving a flat plate
  float gy    = clamp(0.5 + dv.y / max(uDiscR * 2.0, 1e-4), 0.0, 1.0);
  vec3  disc  = mix(uDiscB, uDiscA, gy);
  disc *= 1.0 - 0.18 * smoothstep(0.35, 1.0, dRad / max(uDiscR, 1e-4));

  vec3  groundNow = mix(uGround, disc,      mask);
  vec3  inkNow    = mix(uInk,    uDiscInk,  mask);
  scaleNow = mix(scaleNow, scaleNow * uDiscScale, mask);
  shapeNow = mix(shapeNow, uDiscShape,            mask);

  uv += warpNow * 0.06 * vec2(noise(uv * 2.3 + 11.0), noise(uv * 2.1 - 7.0));

  vec2 g  = uv * scaleNow;
  vec2 id = floor(g);
  vec2 f  = fract(g) - 0.5;
  f += (hash22(id) - 0.5) * uJitter * 0.18;

  float h     = hash21(id + floor(uRewire) * 31.7);
  float hNext = hash21(id + (floor(uRewire) + 1.0) * 31.7);
  float t     = smoothstep(0.0, 1.0, fract(uRewire));
  float stag  = smoothstep(0.0, 1.0, clamp(t * 2.0 - hash21(id + 3.3), 0.0, 1.0));
  h = mix(h, hNext, stag);

  float d = cell(f, h, shapeNow);

  // the breakup field crawls slowly -- the ink is unstable, the screen is not
  vec2 dr = vec2(uTime * driftNow * 0.05, uTime * driftNow * -0.03);

  // ragged contour: chew the field before thresholding, so the edge is eaten
  d += (fbm(g * 11.0 + dr * 2.0) - 0.5) * 0.075 * uRough;

  // weight wanders along the path -- some runs starved, some loaded
  float w = uThickness * (1.0 + (fbm(g * 1.6 - dr) - 0.5) * 0.55 * uRough);

  float aa  = fwidth(d) * 1.1;
  float ink = 1.0 - smoothstep(w - aa, w + aa, d);

  // dry brush: the interior never fills to 100%
  float brush = fbm(g * 6.5 + dr) * 0.65 + fbm(g * 17.0 - dr * 1.6) * 0.35;
  float load  = mix(1.0, smoothstep(0.24, 0.68, brush), uBreakup);
  float holes = 1.0 - step(0.72, fbm(g * 24.0 + dr * 2.4)) * uBreakup * 0.85;

  float alpha = ink * load * holes * uDensity;

  vec3 col = mix(groundNow, inkNow, clamp(alpha, 0.0, 1.0));
  col += (hash21(gl_FragCoord.xy + floor(uTime * 8.0)) - 0.5) * uGrain * 0.06;

  fragColor = vec4(col, 1.0);
}

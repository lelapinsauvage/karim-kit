#version 300 es
precision highp float;

out vec4 fragColor;

uniform vec2  uRes;
uniform float uTime;
uniform float uThickness;  // stroke weight (cell units)
// two complete character states. every one of these is mixed PER PIXEL by the
// changeover front, so the new world arrives along the field's own structure
// rather than behind a moving shape.
uniform vec4  uAv1;        // shape, scale, haloForm, haloN
uniform vec4  uAv2;        // haloR, discShape, discScale, -
uniform vec4  uBv1;
uniform vec4  uBv2;
uniform vec3  uAGround; uniform vec3 uAInk; uniform vec3 uADiscInk;
uniform vec3  uADiscA;  uniform vec3 uADiscB;
uniform vec3  uBGround; uniform vec3 uBInk; uniform vec3 uBDiscInk;
uniform vec3  uBDiscA;  uniform vec3 uBDiscB;
uniform float uGrow;       // halo swell during the changeover
uniform float uWarp;       // low-freq domain warp -> hand-drawn feel
uniform float uJitter;     // per-cell positional wobble
uniform float uRewire;     // advances the hash -> maze reroutes
uniform float uBreath;     // slow modulation of scale / shape / warp / drift
uniform float uRough;      // ragged contour -- eaten edges
uniform float uBreakup;    // dry-brush holes inside the stroke
uniform float uDensity;    // how opaque the ink sits at its fullest
uniform float uDrift;      // how fast the breakup field crawls
uniform float uGrain;

// --- disc -------------------------------------------------------------
// a circular region running a SECOND parameter set. it is not an overlay:
// inside it the pattern itself changes family, scale and colour, and the two
// states cross-fade across the edge. because the family morph is continuous,
// the boundary stays connected -- paths run out of one state and into the other.
// at halo scale it frames the figure; grown past the viewport it becomes the
// transition to the next character.
uniform vec2  uDiscPos;
uniform float uHaloRot;
uniform float uDiscSoft;
uniform sampler2D uTexA;   // outgoing figure
uniform sampler2D uTexB;   // incoming figure
uniform vec4  uFigA;       // aspect, height (uv units), y offset, unused
uniform vec4  uFigB;
uniform vec4  uRectA;      // alpha bounding box of the cutout, texture coords
uniform vec4  uRectB;
uniform float uTrans;      // 0..1 changeover progress
uniform float uFigWarp;    // figure rides the same warp field as the pattern
uniform float uFigFlow;    // slow curl advection -- the figure moves like liquid
uniform float uFigEdge;    // the cutout edge is eaten by the same noise as the ink
uniform float uFigTone;    // pull the figure toward the character's own palette

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

// figures are sampled in the shader, not stacked as DOM images: same warp
// field, same halo mask, one composite. that is what makes them read as part
// of the field instead of a picture sitting on top of it.
vec4 figure(sampler2D t, vec4 cfg, vec4 rect, vec2 uv, vec2 warpOff) {
  float aspect = cfg.x, h = cfg.y, yOff = cfg.z;
  vec2 p  = (uv - vec2(0.0, yOff) + warpOff) / h;
  vec2 lc = vec2(p.x / aspect + 0.5, 0.5 - p.y);       // 0..1 across the CONTENT
  if (lc.x < 0.0 || lc.x > 1.0 || lc.y < 0.0 || lc.y > 1.0) return vec4(0.0);
  return texture(t, rect.xy + lc * rect.zw);           // remap into the padded canvas
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);
  vec2 uv0 = uv;

  // the changeover front. a value field built from the same ingredients as the
  // pattern -- low-frequency noise, per-cell hash, and distance from the halo --
  // so the new state floods in along the structure instead of behind a circle.
  float field = clamp(fbm(uv * 2.2 + 4.0) * 0.55
                    + hash21(floor(uv * 9.0)) * 0.22
                    + clamp(length(uv - uDiscPos) / 1.15, 0.0, 1.0) * 0.30, 0.0, 1.0);
  float front  = uTrans * 1.4 - 0.18;
  float reveal = 1.0 - smoothstep(front - 0.06, front + 0.06, field);

  vec4  v1 = mix(uAv1, uBv1, reveal);
  vec4  v2 = mix(uAv2, uBv2, reveal);
  float pShape = v1.x, pScaleBase = v1.y, pHaloForm = v1.z, pHaloN = v1.w;
  float pHaloR = v2.x, pDiscShape = v2.y, pDiscScale = v2.z;
  vec3  pGround  = mix(uAGround,  uBGround,  reveal);
  vec3  pInk     = mix(uAInk,     uBInk,     reveal);
  vec3  pDiscInk = mix(uADiscInk, uBDiscInk, reveal);
  vec3  pDiscA   = mix(uADiscA,   uBDiscA,   reveal);
  vec3  pDiscB   = mix(uADiscB,   uBDiscB,   reveal);

  // four slow periods, mutually prime, so the loop never lands back on itself
  float scaleNow = pScaleBase * (1.0 + sin(uTime * 0.11)       * 0.14 * uBreath);
  float shapeNow = pShape +        sin(uTime * 0.067 + 1.3) * 0.55 * uBreath;
  float warpNow  = uWarp  * (1.0 + sin(uTime * 0.13 + 1.7) * 0.45 * uBreath);
  float driftNow = uDrift * (1.0 + sin(uTime * 0.05 + 3.1) * 0.60 * uBreath);

  // disc mask taken before the warp, so the circle itself stays a true circle
  vec2  dv   = uv - uDiscPos;
  float dRad = length(dv);

  // the halo is a form, not a circle: each character gets its own. one polar
  // radius function sweeps circle -> regular polygon -> spiked star, so the
  // silhouette can tween between characters like any other parameter.
  float th = atan(dv.y, dv.x) + uHaloRot;
  float k  = 6.28318530718 / max(pHaloN, 3.0);
  float a  = mod(th, k) - k * 0.5;
  float rPoly = cos(k * 0.5) / max(cos(a), 1e-4);
  float rStar = 1.0 - 0.55 * abs(a) / (k * 0.5);
  float fm    = clamp(pHaloForm, 0.0, 2.0);
  float rad   = fm < 1.0 ? mix(1.0, rPoly, fm) : mix(rPoly, rStar, fm - 1.0);

  float edge = (pHaloR + uGrow) * rad;
  float mask = 1.0 - smoothstep(edge - uDiscSoft, edge + uDiscSoft, dRad);

  // the disc carries its own gradient, with a little radial fall to seat the
  // figure against it rather than leaving a flat plate
  float gy    = clamp(0.5 + dv.y / max(edge * 2.0, 1e-4), 0.0, 1.0);
  vec3  disc  = mix(pDiscB, pDiscA, gy);
  disc *= 1.0 - 0.18 * smoothstep(0.35, 1.0, dRad / max(edge, 1e-4));

  vec3  groundNow = mix(pGround, disc,      mask);
  vec3  inkNow    = mix(pInk,    pDiscInk,  mask);
  scaleNow = mix(scaleNow, scaleNow * pDiscScale, mask);
  shapeNow = mix(shapeNow, pDiscShape,            mask);

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
  // --- figures ---------------------------------------------------------
  // the figure tears along the same front that repaints the field, and the
  // torn edge is dragged sideways -- the outgoing character is pulled apart by
  // the pattern rather than faded out under it.
  float tear = exp(-pow((field - front) * 7.0, 2.0)) * uTrans;
  vec2 flow  = curl(uv0 * 1.6 + vec2(uTime * 0.035, uTime * -0.021));
  vec2 figWarp = uFigWarp * 0.02 * vec2(noise(uv * 2.3 + 11.0) - 0.5,
                                        noise(uv * 2.1 -  7.0) - 0.5)
               + uFigFlow * 0.012 * flow
               + tear * 0.11 * vec2(noise(uv * 5.0 + 21.0) - 0.5, 0.0);

  vec4 fa  = figure(uTexA, uFigA, uRectA, uv0, figWarp);
  vec4 fb  = figure(uTexB, uFigB, uRectB, uv0, figWarp);
  vec4 fig = mix(fa, fb, reveal);

  // eat the cutout edge with the same field that chews the ink. kills the hard
  // matte line -- and the rectangular seams the background remover leaves.
  float bite = fbm(uv0 * 14.0 + dr * 1.5) * 0.6 + fbm(uv0 * 34.0 - dr) * 0.4;
  fig.a   *= smoothstep(0.0, 0.55, fig.a - (bite - 0.5) * 0.5 * uFigEdge);
  fig.rgb *= step(0.001, fig.a);

  // and pull it toward the character's own two colours, so the figure is made
  // of the same material as the field instead of sitting on top of it
  float lum  = dot(fig.rgb / max(fig.a, 1e-3), vec3(0.299, 0.587, 0.114));
  vec3  duo  = mix(groundNow * 0.35, inkNow, smoothstep(0.05, 0.75, lum));
  fig.rgb    = mix(fig.rgb, duo * fig.a, uFigTone);

  col = col * (1.0 - fig.a) + fig.rgb;   // premultiplied

  col += (hash21(gl_FragCoord.xy + floor(uTime * 8.0)) - 0.5) * uGrain * 0.06;

  fragColor = vec4(col, 1.0);
}

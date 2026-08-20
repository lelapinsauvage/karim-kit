#version 300 es
precision highp float;

out vec4 fragColor;

uniform vec2  uRes;
uniform float uTime;
uniform float uThickness;  // stroke weight (cell units)
uniform float uShape;      // 0..3 -- morphs continuously through four tile families
uniform float uScale;      // cells across the short axis
uniform vec3  uGroundA;    // ground gradient, top
uniform vec3  uGroundB;    // ground gradient, bottom
uniform vec3  uInk;
uniform float uHaloForm;   // 0 circle -> 1 polygon -> 2 star, continuous
uniform float uHaloN;
uniform float uDiscR;
uniform float uDiscRef;    // the disc's resting radius -- the zoom reference
uniform float uDiscShape;
uniform float uDiscScale;
uniform vec3  uDiscInk;
uniform vec3  uDiscA;
uniform vec3  uDiscB;
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
uniform vec4  uFigA;       // aspect, height (uv units), y offset, unused
uniform vec4  uRectA;      // alpha bounding box of the cutout, texture coords
uniform float uFigWarp;    // figure rides the same warp field as the pattern
uniform float uFigFlow;    // slow curl advection -- the figure moves like liquid
uniform float uFigEdge;    // the cutout edge is eaten by the same noise as the ink
uniform float uFigTone;    // pull the figure toward the character's own palette
uniform float uFigShow;    // 0 hides the figures entirely

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

  // four slow periods, mutually prime, so the loop never lands back on itself
  float scaleNow = uScale * (1.0 + sin(uTime * 0.11)       * 0.14 * uBreath);
  float shapeNow = uShape +        sin(uTime * 0.067 + 1.3) * 0.55 * uBreath;
  float warpNow  = uWarp  * (1.0 + sin(uTime * 0.13 + 1.7) * 0.45 * uBreath);
  float driftNow = uDrift * (1.0 + sin(uTime * 0.05 + 3.1) * 0.60 * uBreath);

  // disc mask taken before the warp, so the circle itself stays a true circle
  vec2  dv   = uv - uDiscPos;
  float dRad = length(dv);

  // the halo is a form, not a circle: each character gets its own. one polar
  // radius function sweeps circle -> regular polygon -> spiked star, so the
  // silhouette can tween between characters like any other parameter.
  float th = atan(dv.y, dv.x) + uHaloRot;
  float k  = 6.28318530718 / max(uHaloN, 3.0);
  float a  = mod(th, k) - k * 0.5;
  float rPoly = cos(k * 0.5) / max(cos(a), 1e-4);
  float rStar = 1.0 - 0.55 * abs(a) / (k * 0.5);
  float fm    = clamp(uHaloForm, 0.0, 2.0);
  float rad   = fm < 1.0 ? mix(1.0, rPoly, fm) : mix(rPoly, rStar, fm - 1.0);

  float edge = uDiscR * rad;
  float mask = 1.0 - smoothstep(edge - uDiscSoft, edge + uDiscSoft, dRad);

  // --- the field moves with the shape ----------------------------------
  // a mask that scales over a static pattern reads as a stencil sliding across
  // a still image. so the disc's contents are locked to the disc: as it grows,
  // its pattern grows with it. and the ground is shoved radially outward by the
  // expansion, hardest near the edge, so nothing in frame is standing still.
  float zoom = clamp(uDiscRef / max(uDiscR, 1e-4), 0.12, 5.0);
  vec2  uvIn = uDiscPos + dv * zoom;

  float push  = (uDiscR - uDiscRef) * 0.55;
  vec2  dir   = dv / max(dRad, 1e-4);
  vec2  uvOut = uv - dir * push / (1.0 + dRad * 2.2);

  // blending the two coordinate fields across the mask bends the pattern
  // through the boundary -- the edge refracts instead of cutting
  uv = mix(uvOut, uvIn, mask);

  // the disc carries its own gradient, with a little radial fall to seat the
  // figure against it rather than leaving a flat plate
  float gy    = clamp(0.5 + dv.y / max(edge * 2.0, 1e-4), 0.0, 1.0);
  vec3  disc  = mix(uDiscB, uDiscA, gy);
  disc *= 1.0 - 0.18 * smoothstep(0.35, 1.0, dRad / max(edge, 1e-4));

  // the ground is a gradient too, so a disc that has grown to fill the frame
  // reads identically to the next character's ground -- which is what lets the
  // changeover run forward without ever travelling back.
  float ggy    = clamp(0.5 + uv.y * 0.9, 0.0, 1.0);
  vec3  ground = mix(uGroundB, uGroundA, ggy);

  vec3  groundNow = mix(ground, disc,     mask);
  vec3  inkNow    = mix(uInk,   uDiscInk, mask);
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
  // --- figure ----------------------------------------------------------
  // gated on a uniform: curl() alone is four fbm evaluations per pixel, and it
  // was being paid for every frame even with the figures hidden.
  if (uFigShow > 0.5) {
    vec2 figWarp = uFigWarp * 0.02 * vec2(noise(uv * 2.3 + 11.0) - 0.5,
                                          noise(uv * 2.1 -  7.0) - 0.5);
    if (uFigFlow > 0.0) {
      figWarp += uFigFlow * 0.012 * curl(uv0 * 1.6 + vec2(uTime * 0.035, uTime * -0.021));
    }

    vec4 fig = figure(uTexA, uFigA, uRectA, uv0, figWarp);

    if (uFigEdge > 0.0) {
      float bite = fbm(uv0 * 14.0 + dr * 1.5) * 0.6 + fbm(uv0 * 34.0 - dr) * 0.4;
      fig.a   *= smoothstep(0.0, 0.55, fig.a - (bite - 0.5) * 0.5 * uFigEdge);
      fig.rgb *= step(0.001, fig.a);
    }
    if (uFigTone > 0.0) {
      float lum = dot(fig.rgb / max(fig.a, 1e-3), vec3(0.299, 0.587, 0.114));
      fig.rgb   = mix(fig.rgb, mix(groundNow * 0.35, inkNow, smoothstep(0.05, 0.75, lum)) * fig.a, uFigTone);
    }
    col = col * (1.0 - fig.a) + fig.rgb;
  }

  col += (hash21(gl_FragCoord.xy + floor(uTime * 8.0)) - 0.5) * uGrain * 0.06;

  fragColor = vec4(col, 1.0);
}

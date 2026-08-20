#version 300 es
precision highp float;

out vec4 fragColor;

uniform vec2  uRes;
uniform float uTime;
// Three zones, nested. The ground, the OUTER disc, and the INNER disc -- which
// is the next character, already born and growing while the outer one is still
// clearing the frame. Nothing ever waits for a full-cover moment: at any instant
// two shapes are expanding and the ground is receding.
uniform float uShape;      // ground
uniform float uScale;
uniform vec3  uGroundA;
uniform vec3  uGroundB;
uniform vec3  uInkA;
uniform vec3  uInkB;
uniform float uGZoom;      // ground recedes while the discs expand

uniform vec4  uOuter;      // radius, form, sides, shape
uniform vec3  uOuterX;     // scaleMul, -, -
uniform vec3  uOInkA; uniform vec3 uOInkB; uniform vec3 uOA; uniform vec3 uOB;

uniform float uThickness;
uniform float uWarp;
uniform float uJitter;
uniform float uRewire;
uniform float uBreath;
uniform float uRough;
uniform float uBreakup;
uniform float uDensity;
uniform float uDrift;
uniform float uGrain;
uniform vec2  uDiscPos;
uniform float uDiscSoft;
uniform float uHaloRot;

uniform vec4  uInner;
uniform vec3  uInnerX;
uniform vec3  uIInkA; uniform vec3 uIInkB; uniform vec3 uIA; uniform vec3 uIB;

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

// polar radius of a halo: circle -> polygon -> star, continuous in `form`
float haloRadius(float th, float form, float sides) {
  float k = 6.28318530718 / max(sides, 3.0);
  float a = mod(th, k) - k * 0.5;
  float rPoly = cos(k * 0.5) / max(cos(a), 1e-4);
  float rStar = 1.0 - 0.55 * abs(a) / (k * 0.5);
  float fm = clamp(form, 0.0, 2.0);
  return fm < 1.0 ? mix(1.0, rPoly, fm) : mix(rPoly, rStar, fm - 1.0);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);
  vec2 uv0 = uv;

  // four slow periods, mutually prime, so the loop never lands back on itself
  float scaleNow = uScale * (1.0 + sin(uTime * 0.11)       * 0.14 * uBreath);
  float shapeBreath =              sin(uTime * 0.067 + 1.3) * 0.55 * uBreath;
  float shapeNow = uShape;
  float warpNow  = uWarp  * (1.0 + sin(uTime * 0.13 + 1.7) * 0.45 * uBreath);
  float driftNow = uDrift * (1.0 + sin(uTime * 0.05 + 3.1) * 0.60 * uBreath);

  vec2  dv   = uv - uDiscPos;
  float dRad = length(dv);
  float th   = atan(dv.y, dv.x) + uHaloRot;

  float eO = uOuter.x * haloRadius(th, uOuter.y, uOuter.z);
  float eI = uInner.x * haloRadius(th, uInner.y, uInner.z);
  float mO = 1.0 - smoothstep(eO - uDiscSoft, eO + uDiscSoft, dRad);
  float mI = 1.0 - smoothstep(eI - uDiscSoft, eI + uDiscSoft, dRad);

  // gradients, each seated on its own shape
  float gyG = clamp(0.5 + uv.y * 0.9, 0.0, 1.0);
  float gyI = clamp(0.5 + dv.y / max(eI * 2.0, 1e-4), 0.0, 1.0);

  // A disc's gradient is seated on its own radius, so once it is much larger
  // than the frame that gradient goes nearly flat -- while the ground's is
  // mapped to screen height. At the handover the two mappings swapped and the
  // colour jumped. Converge the outer one onto the ground's as it grows, so by
  // full cover they are identical and the swap is invisible.
  float gyOwn = clamp(0.5 + dv.y / max(eO * 2.0, 1e-4), 0.0, 1.0);
  float gyO   = mix(gyOwn, gyG, smoothstep(0.7, 1.8, uOuter.x));

  vec3 fieldCol = mix(uGroundB, uGroundA, gyG);
  fieldCol = mix(fieldCol, mix(uOB, uOA, gyO) * (1.0 - 0.16 * smoothstep(0.35, 1.0, dRad / max(eO, 1e-4))), mO);
  fieldCol = mix(fieldCol, mix(uIB, uIA, gyI) * (1.0 - 0.16 * smoothstep(0.35, 1.0, dRad / max(eI, 1e-4))), mI);

  // Ink is a gradient, not a flat colour. A metallic runs cool on one axis and
  // warm on the other; that shift along the stroke is what reads as anodised
  // rather than printed. Swept on a diagonal so it never aligns with the halo.
  float sheen = clamp(0.5 + uv.x * 0.55 + uv.y * 0.42, 0.0, 1.0);
  sheen = mix(sheen, 1.0 - sheen, 0.5 - 0.5 * cos(uTime * 0.09));   // it drifts

  vec3 inkG = mix(uInkA,  uInkB,  sheen);
  vec3 inkO = mix(uOInkA, uOInkB, sheen);
  vec3 inkI = mix(uIInkA, uIInkB, sheen);
  vec3 inkCol = mix(mix(inkG, inkO, mO), inkI, mI);

  // the ground recedes while the discs grow -- counter-motion, and because the
  // outer disc has left the frame by the end, resetting it is never seen
  uv = mix(uv * uGZoom, uv, mO);

  // breath is added AFTER the zone mixes. applying it only to the ground meant
  // a disc rendered its family raw while the ground rendered family + breath --
  // up to +-0.55 of tile family, jumping in one frame at the handover.
  shapeNow = mix(mix(shapeNow, uOuter.w, mO), uInner.w, mI) + shapeBreath;
  scaleNow = mix(mix(scaleNow, scaleNow * uOuterX.x, mO), scaleNow * uInnerX.x, mI);

  uv += warpNow * 0.06 * vec2(noise(uv * 2.3 + 11.0), noise(uv * 2.1 - 7.0));

  vec2 g  = uv * scaleNow;
  vec2 id = floor(g);
  vec2 f  = fract(g) - 0.5;
  f += (hash22(id) - 0.5) * uJitter * 0.18;

  // Tile choice is sampled from SMOOTH noise at the cell's position in world
  // space -- not from a hash of the cell index.
  //
  // hash21(id) makes the pattern boil whenever scale animates: floor(uv*scale)
  // re-indexes, every cell draws a fresh random number, and the whole maze
  // re-rolls. Sampling continuous noise at (id + 0.5) / scale means a cell
  // asks "what is the value HERE", which barely changes as cell boundaries
  // sweep past. Tiles then flip one at a time as they cross the threshold,
  // instead of the field re-rolling wholesale.
  vec2  cellUV = (id + 0.5) / max(scaleNow, 1e-4);
  float h      = noise(cellUV * 26.0 + floor(uRewire) * 13.1);
  float hNext  = noise(cellUV * 26.0 + (floor(uRewire) + 1.0) * 13.1);
  float t      = smoothstep(0.0, 1.0, fract(uRewire));
  float stag   = smoothstep(0.0, 1.0, clamp(t * 2.0 - hash21(id + 3.3), 0.0, 1.0));
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

  vec3 col = mix(fieldCol, inkCol, clamp(alpha, 0.0, 1.0));
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
      fig.rgb   = mix(fig.rgb, mix(fieldCol * 0.35, inkCol, smoothstep(0.05, 0.75, lum)) * fig.a, uFigTone);
    }
    col = col * (1.0 - fig.a) + fig.rgb;
  }

  col += (hash21(gl_FragCoord.xy + floor(uTime * 8.0)) - 0.5) * uGrain * 0.06;

  fragColor = vec4(col, 1.0);
}

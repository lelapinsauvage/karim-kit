#version 300 es
precision highp float;

out vec4 fragColor;

uniform vec2  uRes;
uniform float uTime;

// --- the halo: two coincident discs -----------------------------------------
// BACK  a blurred disc -- the bloom. large gaussian falloff, low opacity.
// FRONT a disc at 80% carrying a glass refraction: the pattern behind it is
//       resampled through a lens, split per channel, and frosted.
// Same radius, same pigment. The bloom is what makes it read as lit rather
// than drawn; the refraction is what makes it read as a body rather than a fill.
uniform vec2  uPos;
uniform float uR;
uniform vec3  uPigment;
uniform float uBloom;
uniform float uBloomOp;
uniform float uFrontOp;
uniform float uIntensity;

// real refraction, not an offset. the disc is treated as a glass hemisphere:
// build its surface normal, refract the view ray through it with GLSL's own
// refract(), march to a virtual back plane and sample the field THERE. that is
// why depth now does something -- it is the distance the ray travels inside.
// The halo is a SUN, not a lens. A solid body with a granular, convecting
// surface and light leaving it -- not a window onto the pattern behind.
uniform float uGrain;      // size of the surface granulation
uniform float uChurn;      // how fast the surface convects
uniform float uGlitter;    // bright speckle riding the granulation
uniform float uLimb;       // limb darkening -- edge darker than centre
uniform float uFlare;      // long rays
uniform vec3  uHot;        // colour of the hottest part

uniform vec3  uGroundA;
uniform vec3  uGroundB;
uniform vec3  uGlyphInk;
uniform float uGlyphScale;
uniform float uGroundShape;
uniform float uFieldOp;    // pattern opacity against the ground
uniform vec2  uMouse;
uniform float uMouseR;
uniform float uMouseAmt;
uniform float uGridAmt;    // cursor grid: quantise the field into cells
uniform float uGridN;

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



// the ground: the same truchet field as the slider, at ambient contrast
vec3 field(vec2 uv) {
  float gy = clamp(0.5 + uv.y * 0.7, 0.0, 1.0);
  vec3 base = mix(uGroundB, uGroundA, gy);

  // the whole field is displaced around the cursor -- a lens in the pattern
  // itself, so the pattern is always moving where you are looking
  vec2  md = uv - uMouse;
  float mr = length(md) / max(uMouseR, 1e-4);
  if (mr < 1.0) {
    float fall = pow(1.0 - mr, 2.0);

    // the cursor snaps the field onto a coarse grid and pushes each cell out
    // along its own axis -- a readout resolving, not a blur
    vec2 q = floor(uv * uGridN) / uGridN + 0.5 / uGridN;
    uv = mix(uv, q, fall * uGridAmt);
    uv += normalize(md + 1e-6) * fall * uMouseAmt * 0.06;
  }

  float scale = uGlyphScale;
  vec2 g  = uv * scale;
  vec2 id = floor(g);
  vec2 f  = fract(g) - 0.5;
  f += (hash22(id) - 0.5) * 0.028;

  vec2  cellUV = (id + 0.5) / max(scale, 1e-4);
  float hsel = noise(cellUV * 26.0);

  // continuous morph. two slow periods, mutually prime, so tiles are always
  // crossing between families somewhere -- the field never sits still, but no
  // single cell changes fast enough to read as movement.
  float breath = sin(uTime * 0.067 + 1.3) * 0.022
               + sin(uTime * 0.041 + 4.1) * 0.014;
  float d = cell(f, hsel, clamp(uGroundShape + breath, 0.0, 2.999));

  vec2 dr = vec2(uTime * 0.05, uTime * -0.03);
  d += (fbm(g * 11.0 + dr * 2.0) - 0.5) * 0.062;
  float w = 0.085 * (1.0 + (fbm(g * 1.6 - dr) - 0.5) * 0.5);

  float aa  = fwidth(d) * 1.1;
  float ink = 1.0 - smoothstep(w - aa, w + aa, d);
  float brush = fbm(g * 6.5 + dr) * 0.65 + fbm(g * 17.0 - dr * 1.6) * 0.35;
  ink *= mix(1.0, smoothstep(0.24, 0.68, brush), 0.5);

  return mix(base, uGlyphInk, clamp(ink, 0.0, 1.0) * uFieldOp);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);
  vec2 dv = uv - uPos;
  float r = length(dv) / max(uR, 1e-4);          // 0 at centre, 1 at the rim

  vec3 col = field(uv);

  // --- THE BODY --------------------------------------------------------
  // Solid. Its interior is generated, not sampled -- domain-warped noise that
  // convects slowly, the way a granulating surface does. Nothing behind it
  // shows through, so it reads as a body rather than a window.
  {
    vec2 p = dv / max(uR, 1e-4);
    float t = uTime * uChurn * 0.06;

    // domain warp: noise displaced by noise. one fold is enough to stop it
    // reading as a texture and start it reading as motion in a fluid.
    vec2 w = vec2(fbm(p * uGrain + vec2(t, -t * 0.7)),
                  fbm(p * uGrain + vec2(5.2 - t * 0.8, 1.3 + t)));
    float cellsz = fbm(p * uGrain * 1.6 + w * 1.4 + t * 0.5);

    // glitter: sparse bright points riding the granulation, blinking on their
    // own clock so the surface never settles
    float sp = hash21(floor(p * uGrain * 9.0) + floor(t * 3.0));
    float glit = pow(max(sp - 0.86, 0.0) / 0.14, 3.0) * step(0.55, cellsz);

    // limb darkening -- a real star is brighter in the middle
    float h = sqrt(max(1.0 - r * r, 0.0));
    float limb = mix(1.0, pow(h, 0.55), uLimb);

    vec3 body = mix(uPigment * 0.42, uPigment, cellsz);
    body = mix(body, uHot, pow(cellsz, 2.4) * 0.7);
    body *= limb;
    body += uHot * glit * uGlitter;

    float aaR = fwidth(r) * 1.5;
    float disc = 1.0 - smoothstep(1.0 - aaR, 1.0 + aaR, r);
    col = mix(col, body, disc * uIntensity);
  }

  // --- CORONA ------------------------------------------------------------
  // light leaving the body. added, never mixed. two skirts -- a tight one that
  // sits on the rim and a wide one that sets the mood of the whole frame.
  float out_ = max(r - 1.0, 0.0);
  float near = exp(-out_ / max(uBloom * 0.28, 1e-4));
  float far  = exp(-out_ / max(uBloom * 1.6,  1e-4));
  vec3  glow = uPigment * (near * 0.85 + far * 0.5) * uBloomOp;

  // flares: a few long rays, drifting. keeps the edge from reading as a circle
  // cut out of paper.
  float th2 = atan(dv.y, dv.x);
  // broad and few, and only outside the body -- sharp spokes read as a lens
  // flare, which is the cheapest thing a light can do
  float ray = pow(abs(sin(th2 * 1.5 + uTime * 0.021)), 3.0) * 0.6
            + pow(abs(sin(th2 * 2.5 - uTime * 0.013 + 1.9)), 5.0) * 0.4;
  ray *= smoothstep(0.0, 0.25, out_);
  glow += uPigment * ray * exp(-out_ / max(uBloom * 2.2, 1e-4)) * uFlare * 0.28;

  col += glow;

  col += (hash21(gl_FragCoord.xy + floor(uTime * 8.0)) - 0.5) * 0.022;
  fragColor = vec4(col, 1.0);
}

#version 300 es
precision highp float;

out vec4 fragColor;

uniform vec2  uRes;
uniform float uTime;

// A body of light. Not a lens, not a surface -- a radial gradient with an
// off-centre core, a colour that cools toward the rim, heavy fine grain, and a
// glow that only exists just outside the edge.
//
// The three things that make it read: the core is OFF-CENTRE (a centred one
// looks like a button), the hue TRAVELS across the body rather than the value
// alone, and the grain is fine and dense enough to break every band.

uniform vec2  uPos;
uniform float uR;
uniform float uEdge;       // how soft the rim is
uniform vec2  uCore;       // offset of the hot spot, in radii
uniform float uCoreSize;

// TWO colours. Everything else is derived, so a look is two hex codes and a
// spread -- not six swatches to balance by hand.
uniform vec3  uPigment;    // the body
uniform vec3  uBg;         // the ground
uniform float uBgFall;     // how fast the ground falls away from the body
uniform float uBgFloor;    // how dark the corners get. the ground colour is
                           // only seen where this leaves it visible.
uniform float uSpread;     // brightness/saturation travel from core to rim
uniform float uWarmth;     // hue travel. 0 keeps the pigment's exact hue.
uniform float uPurity;     // how much of the body is the pigment itself

uniform float uRimBand;
uniform float uGlow;
uniform float uGlowSize;
// On a dark ground, light ADDS. On paper it cannot -- you cannot brighten white,
// so an additive glow simply vanishes. A real emitter on paper stains it toward
// its own colour instead. uGlowMode blends between the two: 0 add, 1 tint.
uniform float uGlowMode;
// The rim: a band sitting on the edge itself, separate from the skirt. This is
// what reads as "emitting" -- the outline is where a body of light is brightest.
uniform float uRimW;
uniform float uRimStr;
uniform float uRimIn;      // how far it bleeds inward

uniform float uGrain;      // fine, dense
uniform float uGrainSize;
uniform float uGrainMask;  // 1 = grain only on the body, 0 = across the frame
uniform float uDrift;      // the body breathes

uniform float uWobble;     // low-frequency breathing on the rim

// --- the cloth --------------------------------------------------------------
// A Truchet field standing in for woven pattern. It lives where the light does
// NOT: washed out as the glow rises, so cloth and sun are one lit scene rather
// than two stacked layers. Ancient object, modern light.
uniform float uCloth;      // opacity in the darkest part of the frame
uniform float uClothScale;
uniform float uClothShape; // 0 arc, 1 chord, 2 elbow, 3 step -- continuous
uniform float uClothMorph; // how far the family drifts on its own
uniform float uClothWave;  // spatial: how tight the family wave travels
uniform float uClothSpeed; // temporal: how fast it crosses
uniform float uClothWeight;
uniform vec3  uClothInk;

// Charge. Waves travel along the field toward the body and brighten the ink as
// they pass, so the pattern reads as circuitry feeding the light rather than
// wallpaper behind it. Radial, because everything here is measured from the sun.
uniform float uCharge;     // strength
uniform float uChargeSpd;
uniform float uChargeLen;  // wavelength

// --- the body as a light ----------------------------------------------------
// The halo stops being a graphic and becomes the scene's only light source.
// The cloth is given a surface normal derived from its own distance field --
// each stroke bulges like a cord -- and is then lit by the body: diffuse from
// the direction of the light, plus a grazing specular that only catches where
// the weave turns toward it. Rake the light low and the fabric shows its
// structure, which is exactly what a garment needs to do.
uniform float uLight;      // how hard the halo lights the cloth
uniform float uRake;       // 0 = light sits at the halo, 1 = grazing
uniform float uSheen;      // specular strength
uniform float uCord;       // how much each stroke bulges

// --- the figure -------------------------------------------------------------
// Composited in the shader, not stacked as a DOM image: it sits in the same
// exposure as the light, gets the same grain, and is occluded by nothing.
uniform sampler2D uFigTex0;
uniform sampler2D uFigTex1;
uniform sampler2D uFigTex2;
uniform sampler2D uFigTex3;
uniform int   uFigA;       // which unit the outgoing figure is on
uniform int   uFigB;       // and the incoming one
uniform vec4  uFigRectB;
uniform vec4  uFigPosB;
uniform float uFigMix;     // 0 outgoing, 1 incoming
uniform float uTear;       // how far the weave eats into her
uniform float uThread;     // scale of the threads she comes apart along

// A ring leaving the body on a switch. uWave is where the front is, uWaveAmt is
// how strong -- separating them means the wave travels instead of the whole
// field pulsing in place.
uniform float uWave;
uniform float uWaveAmt;

// The cloth is UNCOVERED by a front leaving the body, not faded up. An opacity
// ramp makes the pattern appear everywhere at once, which has no relationship to
// the circle it is supposed to be coming from. A radius does.
uniform float uClothFront;   // -1 = fully hidden, large = fully shown
uniform float uFlipA;
uniform float uFlipB;
// --- loader -----------------------------------------------------------------
// uLoad runs 0..1 across the whole opening. Two bodies arrive from opposite
// sides, cross into eclipse, and the occluder withdraws to leave the sun. The
// ground stays paper until the eclipse breaks, then floods to the look's own
// colour -- so the page arrives WITH the first character rather than before it.
uniform float uLoad;
uniform float uLoadCover;  // how much the loader owns the frame, 1 -> 0
uniform vec2  uEclA;
uniform vec2  uEclB;
uniform float uEclR;
uniform vec3  uPaper;
uniform float uEclWhite;   // black -> white
uniform float uEclFill;    // white -> pigment
uniform float uEclSeam;    // flare at the moment of joining

uniform int   uFigMode;    // 0 stamp, 1 plate, 2 page, 3 weave
uniform vec4  uFigRect;    // alpha bounding box of the cutout
uniform vec4  uFigPos;     // aspect, height (uv units), x, y
uniform float uFigShow;
uniform float uFigFade;    // the figure resolves in on its own clock
uniform float uFigDark;    // pull toward silhouette
uniform float uFigTint;    // how far the figure takes the pigment's colour
uniform float uFigLift;    // light spilling onto her from the body

// --- the wordmark -----------------------------------------------------------
// Drawn to a 2D canvas and sampled here, BEFORE the figure is composited, so she
// physically interrupts it. Type beside an image is a caption; type behind one
// is part of the same space.
uniform sampler2D uType;
uniform float uTypeShow;
uniform float uTypeInk;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

// per-pixel white noise. hash21 above is fine for value noise but its
// distribution is poor at pixel frequency -- it produced visible vertical
// streaks. this one decorrelates the axes properly.
float white(vec2 p, float seed) {
  vec3 q = fract(vec3(p.xyx) * 0.1031 + seed * 0.0973);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i),              hash21(i + vec2(1, 0)), f.x),
             mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) {
  return noise(p) * 0.6 + noise(p * 2.3 + 3.1) * 0.28 + noise(p * 5.7 - 1.7) * 0.12;
}

// curl of a scalar field -> divergence-free flow. nothing bunches or thins,
// which is exactly why it reads as a fluid rather than as a wobble.
vec2 curl(vec2 p) {
  const float e = 0.06;
  float a = fbm(p + vec2(0.0, e)), b = fbm(p - vec2(0.0, e));
  float c = fbm(p + vec2(e, 0.0)), d = fbm(p - vec2(e, 0.0));
  return vec2(a - b, d - c) / (2.0 * e);
}

float seg(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0));
}

// Four tile families as 7-point polylines, L->T and R->B. Morphing happens on
// the CONTROL POINTS, never on the finished distance fields: mixing two SDFs
// interpolates the field rather than the path and the contour pinches off
// mid-blend. Mixing points keeps one continuous path with its ends nailed to
// the edge midpoints, so tiles chain at every family and every value between.
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

float polyD(vec2 p, int i0, int i1, float t, bool second) {
  vec2 a = second ? mix(PB[i0*NP], PB[i1*NP], t) : mix(PA[i0*NP], PA[i1*NP], t);
  float d = 1e9;
  for (int k = 1; k < NP; k++) {
    vec2 b = second ? mix(PB[i0*NP+k], PB[i1*NP+k], t) : mix(PA[i0*NP+k], PA[i1*NP+k], t);
    d = min(d, seg(p, a, b)); a = b;
  }
  return d;
}
float tile(vec2 p, float h, float shape) {
  if (h < 0.5) p.x = -p.x;
  float sh = clamp(shape, 0.0, 2.999);
  int i0 = int(floor(sh));
  float t = smoothstep(0.0, 1.0, fract(sh));
  return min(polyD(p, i0, i0+1, t, false), polyD(p, i0, i0+1, t, true));
}

vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0/3.0, 2.0/3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + 1e-10)), d / (q.x + 1e-10), q.x);
}
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// The formula. A hot body does not just get lighter toward its core -- it
// climbs the spectrum toward yellow and loses saturation, and cools and
// saturates toward the rim. Driving both off ONE pigment keeps them in the same
// family automatically, which is what hand-picking three swatches never does.
// Hue travel is SEPARATE from brightness travel. They were one control, which
// meant you could not brighten the core without also pushing it toward yellow --
// and desaturating a red always reads as orange, so the pigment stopped being
// the pigment. uWarmth = 0 keeps the exact hue you typed at every radius.
vec3 core(vec3 pigment, float k, float w) {
  vec3 h = rgb2hsv(pigment);
  h.x = fract(h.x + 0.055 * k * w);
  h.y = clamp(h.y * (1.0 - 0.42 * k * mix(0.25, 1.0, w)), 0.0, 1.0);
  h.z = clamp(h.z * (1.0 + 0.55 * k), 0.0, 1.0);
  return hsv2rgb(h);
}
vec3 edgeOf(vec3 pigment, float k, float w) {
  vec3 h = rgb2hsv(pigment);
  h.x = fract(h.x - 0.022 * k * w);
  h.y = clamp(h.y * (1.0 + 0.16 * k), 0.0, 1.0);
  h.z = clamp(h.z * (1.0 - 0.34 * k), 0.0, 1.0);
  return hsv2rgb(h);
}

// sampler arrays need a constant index in GLSL ES, so this is a branch rather
// than a lookup. Four figures is the whole set; more would want a texture array.
// A circle whose perimeter is warped by harmonics of the polar angle. A plain
// expanding disc reads as a wipe; three harmonics at different frequencies make
// an edge that is organic without ever looking like noise.
float warpedField(vec2 p, vec2 c, float time) {
  vec2  d = p - c;
  float a = atan(d.y, d.x);
  float w = (cos(a * 3.0 + time) + 1.0) * 0.5
          + (sin(a * 5.0 - time * 0.7) + 1.0) * 0.5
          + (cos(a * 8.0 + time * 1.3) + 1.0) * 0.5;
  return length(d) * (1.0 + (w / 3.0 - 0.5) * 0.34);
}

vec4 figSample(int which, vec2 tc) {
  if (which == 0) return texture(uFigTex0, tc);
  if (which == 1) return texture(uFigTex1, tc);
  if (which == 2) return texture(uFigTex2, tc);
  return texture(uFigTex3, tc);
}

// One figure, sampled through its own rect and placement, bottom-anchored.
// `flip` mirrors horizontally. Generated figures face whichever way the model
// decided, and a set where subjects look in different directions has no
// collective gaze -- they stop being a series and become four unrelated photos.
vec4 figAt(int which, vec4 rect, vec4 pos, vec2 uv, vec2 res, float shift, float flip) {
  float aspect = pos.x, fh = pos.y;
  float frameBottom = -0.5 * res.y / min(res.x, res.y);
  float cy = frameBottom + fh * 0.5 - pos.w;
  vec2  q  = (uv - vec2(pos.z + shift, cy)) / fh;
  vec2  lc = vec2(q.x / aspect + 0.5, 0.5 - q.y);
  if (lc.x < 0.0 || lc.x > 1.0 || lc.y < 0.0 || lc.y > 1.0) return vec4(0.0);
  // mirror in the CONTENT rect, after the bounds test, so the flip cannot push
  // the sample outside the cutout's own box
  lc.x = mix(lc.x, 1.0 - lc.x, flip);
  vec4 t = figSample(which, rect.xy + lc * rect.zw);
  t.a = smoothstep(0.55, 0.88, t.a);
  return t;
}



void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);
  vec2 dv = uv - uPos;

  // the rim is not a perfect circle -- a very slight low-frequency wobble,
  // barely a percent, is the difference between a body and a vector shape
  // A sub-percent low-frequency breathing on the rim. The circle stays a
  // circle -- this is only enough to stop it reading as a vector shape.
  float wob = 1.0 + (fbm(normalize(dv + 1e-6) * 2.2 + uTime * uDrift * 0.05) - 0.5)
                    * 0.014 * uWobble;
  float R = uR * wob;
  float r = length(dv) / max(R, 1e-4);

  // --- the body ----------------------------------------------------------
  // distance from the OFF-CENTRE core, not from the geometric centre. this is
  // what stops it reading as a button and starts it reading as lit from one side.
  float cr = length(dv - uCore * R) / max(R * uCoreSize, 1e-4);

  vec3 hot = core(uPigment, uSpread, uWarmth);
  vec3 rim = edgeOf(uPigment, uSpread, uWarmth);

  // uPurity biases the body toward the pigment itself. At 1 the centre is the
  // derived core; at 0 the pigment holds everywhere and the core only tints it.
  // Previously the centre was 100% core and 0% pigment, so most of what you saw
  // was never the colour you typed.
  float mixC = pow(smoothstep(0.0, 1.0, clamp(cr, 0.0, 4.0)), mix(0.35, 1.0, uPurity));
  vec3 body = mix(hot, uPigment, mixC);
  body = mix(body, rim, smoothstep(1.0 - uRimBand, 1.0, r) * uPurity);

  // --- edge --------------------------------------------------------------
  float soft = uEdge * 0.5 + fwidth(r) * 1.5;
  float disc = 1.0 - smoothstep(1.0 - soft, 1.0 + soft * 0.35, r);

  // --- glow --------------------------------------------------------------
  // only just outside the body. two skirts: a tight one that hugs the rim and
  // a wide one that lights the ground. added, never mixed.
  float out_ = max(r - 1.0, 0.0);
  float near = exp(-out_ / max(uGlowSize * 0.16, 1e-4));
  float wide = exp(-out_ / max(uGlowSize * 0.85, 1e-4));

  // The ground is always a gradient, and always radial from the body -- a flat
  // ground kills the depth the light is creating, and a linear ramp behind a
  // round light never lines up and reads as a seam. It falls off slowly and
  // never reaches pure black, so the frame keeps air in the corners.
  float bgr = smoothstep(0.0, 1.0, clamp(r * uBgFall, 0.0, 1.0));
  vec3 col = mix(uBg, uBg * uBgFloor, bgr);
  float halo = (near * 1.0 + wide * 0.45) * uGlow;

  // the rim, both sides of the edge. narrow and outside, softer and inside.
  // Two decays that both PEAK at the edge and fall away from it -- outward at
  // uRimW, inward at uRimIn.
  //
  // The previous inward term was exp(-max(1.0 - r, 0.0) / uRimIn), and
  // max(1 - r, 0) is zero for every pixel OUTSIDE the body: exp(0) = 1. So it
  // contributed a constant 0.6 * uRimStr across the whole frame, and in tint
  // mode that stains the ground. At the default rimStr a paper ground rendered
  // as terracotta -- the art-directed colour was simply not on screen, with no
  // error and nothing in the panel to suggest why.
  // Each side must be zeroed on the other side explicitly. Clamping the
  // argument to 0 does not do it: exp(0) is 1, so the term stays at full
  // strength across the entire half-plane it was meant to be absent from. That
  // is the bug twice over -- once in the original, once in the first fix.
  float outer = (r >= 1.0) ? exp(-pow((r - 1.0) / max(uRimW,  1e-4), 1.5)) : 1.0;
  float inner = (r <= 1.0) ? exp(-pow((1.0 - r) / max(uRimIn, 1e-4), 1.2)) : 0.0;
  halo += max(outer * step(1.0, r), inner) * uRimStr;

  vec3 lightCol = core(uPigment, uSpread * 1.5, 1.0);

  // In tint mode the falloff has to be squared. A skirt that is merely small far
  // from the body still stains a light ground everywhere, because tinting has no
  // threshold the way adding does -- 2% of a saturated pigment over the whole
  // frame is a colour cast, not a glow.
  float tintAmt = clamp(halo * halo * 1.6, 0.0, 1.0);
  col = mix(col + lightCol * halo,               // add
            mix(col, lightCol, tintAmt),         // tint
            uGlowMode);

  // --- cloth --------------------------------------------------------------
  // drawn before the body, and only where the light is weak
  {
    float shade = 1.0 - clamp(near * 1.0 + wide * 0.45, 0.0, 1.0) * uGlow;
    shade *= smoothstep(1.0, 1.35, r);          // never under the body itself

    if (uCloth > 0.001 && shade > 0.003) {
      // the wave: a narrow ring expanding from the body, pushing the weave
      // outward ahead of it and letting it settle behind
      float ringR = uWave * 2.2;
      float dRing = length(uv - uPos) - ringR;
      float ring  = exp(-pow(dRing / 0.18, 2.0)) * uWaveAmt;
      vec2  outward = normalize(uv - uPos + 1e-5);

      // uncovered from the body outward, with the edge of the front burning as
      // it passes -- the same gesture the slider uses, so the two rhyme
      float dFront = length(uv - uPos);
      float uncover = smoothstep(uClothFront + 0.22, uClothFront - 0.22, dFront);
      float crest   = exp(-pow((dFront - uClothFront) / 0.20, 2.0))
                    * step(0.0, uClothFront) * (1.0 - step(2.6, uClothFront));

      vec2 g  = (uv + outward * ring * 0.10) * uClothScale;
      vec2 id = floor(g);
      vec2 f  = fract(g) - 0.5;

      // tile chosen from smooth noise at the cell's WORLD position. a hash of
      // the cell index re-rolls the whole field the instant scale animates.
      vec2  cellUV = (id + 0.5) / max(uClothScale, 1e-4);
      float h = noise(cellUV * 26.0);

      // Two slow mutually prime periods. Tiles are always crossing between
      // families somewhere in the frame, but no single cell moves fast enough
      // to be caught doing it -- felt, never seen.
      // The family change TRAVELS. A phase built from position means the wave
      // crosses the frame rather than the whole field pulsing at once -- one
      // region resolving into arcs while another is still stepping. Two
      // directions at mutually prime frequencies so the sweep never repeats,
      // and a per-cell offset so the wavefront is never a straight line.
      // cellUV spans about -0.7..0.7, so uClothWave has to be large enough to
      // fit several cycles across the frame. Too low and every cell is in phase
      // -- the field pulses as one instead of a front travelling over it.
      float ph = dot(cellUV, vec2(0.62, 0.41)) * uClothWave * 2.2
               + dot(cellUV, vec2(-0.37, 0.55)) * uClothWave * 1.3
               + noise(cellUV * 3.1 + 19.0) * 2.4;

      float drift = sin(uTime * uClothSpeed * 0.20 + ph) * 0.80
                  + sin(uTime * uClothSpeed * 0.115 + ph * 1.7 + 2.2) * 0.46;

      // wrap rather than clamp -- the family cycles arc -> step -> arc forever
      float sh = mod(uClothShape + drift * uClothMorph + 3.0, 3.0);

      float d  = tile(f, h, sh);
      float aa = fwidth(d) * 1.2;
      float ink = 1.0 - smoothstep(uClothWeight - aa, uClothWeight + aa, d);

      // --- surface -------------------------------------------------------
      // The gradient of the distance field points across the stroke, so it is
      // the surface normal of a cord lying on the cloth. Height is highest at
      // the centre of the stroke and falls to nothing at its edge.
      float e = 0.004;
      vec2  grad = vec2(tile(f + vec2(e, 0.0), h, sh) - tile(f - vec2(e, 0.0), h, sh),
                        tile(f + vec2(0.0, e), h, sh) - tile(f - vec2(0.0, e), h, sh));
      float lift = smoothstep(uClothWeight, 0.0, d);          // 0 at edge, 1 at centre
      vec3  n = normalize(vec3(-grad / (2.0 * e) * uCord * 0.05 * lift, 1.0));

      // --- light ---------------------------------------------------------
      // Direction to the body. uRake pushes the light down toward the surface,
      // which is what makes a weave show: a light from straight on flattens it,
      // a grazing one carves it.
      vec3  toL = normalize(vec3(uPos - uv, mix(0.9, 0.06, uRake)));
      float dist = length(uv - uPos);
      float atten = 1.0 / (1.0 + pow(dist / max(uR * 1.4, 1e-4), 2.0));

      float diff = max(dot(n, toL), 0.0);

      // specular: the halo is a broad source, so a wide lobe rather than a point
      vec3  view = vec3(0.0, 0.0, 1.0);
      vec3  hv   = normalize(toL + view);
      float spec = pow(max(dot(n, hv), 0.0), 22.0);

      vec3 lightCol = core(uPigment, uSpread * 1.6, 1.0);
      vec3 lit = lightCol * (diff * 0.85 + spec * uSheen * 2.4) * atten * uLight;

      // uneven impression -- woven, not printed
      ink *= 0.55 + 0.45 * fbm(g * 2.1);

      // charge travelling inward. the wave is a function of distance from the
      // body, so it arrives at the rim from every direction at once.
      float wave = sin(r * uChargeLen - uTime * uChargeSpd);
      float pulse = pow(max(wave, 0.0), 6.0);

      // it gathers as it nears the light -- brightest just before it lands
      pulse *= smoothstep(2.4, 1.05, r);

      vec3 chargeCol = core(uPigment, uSpread * 2.4, 1.0);
      vec3 inkC = mix(uClothInk, chargeCol, pulse * uCharge);

      // the cloth is its own colour PLUS what the halo puts on it
      inkC += lit;

      // the crest lights up as it passes -- the cloth reacting to the light,
      // not a separate effect drawn on top of it
      inkC += core(uPigment, uSpread * 2.2, 1.0) * ring * 1.4;

      inkC += core(uPigment, uSpread * 2.4, 1.0) * crest * 1.6;

      col = mix(col, inkC,
                ink * uCloth * shade * uncover
                * (1.0 + pulse * uCharge * 1.6 + ring * 2.0 + crest * 2.4));
    }
  }

  col = mix(col, body, disc);

  // --- wordmark (behind her) ---------------------------------------------
  if (uTypeShow > 0.5) {
    vec2 tuv = vec2(gl_FragCoord.x / uRes.x, 1.0 - gl_FragCoord.y / uRes.y);
    vec4 ty = texture(uType, tuv);
    col = mix(col, vec3(uTypeInk), ty.a);
  }

  // --- figure ---------------------------------------------------------------
  // Her coverage is hoisted out of the block: the grain stage below needs to
  // know where she is, and everything about her is scoped inside it.
  float figA = 0.0;
  if (uFigShow > 0.5) {
    // The field is already doing something soft, radial and slow. Whatever the
    // figure does has to CONTRAST with that -- hard, linear, mechanical -- or
    // the two gestures rhyme and you have one motion happening twice.
    float m = clamp(uFigMix, 0.0, 1.0);
    vec4 tex = vec4(0.0);
    vec3 bloom = vec3(0.0);

    if (uFigMode == 0) {
      // FLOW REVEAL.
      //
      // The mask is a circle SDF with a harmonically warped perimeter, expanding
      // from the body. The displacement is the GRADIENT of that mask -- so
      // pixels move perpendicular to the boundary, along it, rather than sliding
      // on an axis. Axis-aligned band shear is the cheapest glitch there is
      // precisely because the grid it moves on has nothing to do with the image.
      //
      // Everything is concentrated in a narrow gaussian around the edge, so the
      // figure is untouched everywhere the front is not.
      float field = warpedField(uv, uPos, uTime * 0.35);
      // The front travels 2.1 units. An edge band of 0.16 is 7.6% of that, so
      // at any single pixel the whole effect lasted about 60ms and read as
      // nothing happening. The band has to be a real fraction of the sweep.
      float front = m * 2.4 - 0.45;
      float sd    = field - front;                 // signed distance to the edge

      // gradient of the field: the direction the boundary is facing
      float e = 0.004;
      vec2 grad = normalize(vec2(
        warpedField(uv + vec2(e, 0.0), uPos, uTime * 0.35) - warpedField(uv - vec2(e, 0.0), uPos, uTime * 0.35),
        warpedField(uv + vec2(0.0, e), uPos, uTime * 0.35) - warpedField(uv - vec2(0.0, e), uPos, uTime * 0.35)
      ) + 1e-5);

      float edge = exp(-pow(sd / 0.42, 2.0));      // wide enough to be seen
      vec2  push = grad * edge * 0.22 * uTear;

      // the outgoing figure is pushed ahead of the front, the incoming one is
      // still catching up -- they move in opposite directions through the edge
      vec4 fa = figAt(uFigA, uFigRect,  uFigPos,  uv - push,       uRes, 0.0, uFlipA);
      vec4 fb = figAt(uFigB, uFigRectB, uFigPosB, uv + push * 0.6, uRes, 0.0, uFlipB);

      // per-channel separation ONLY inside the band, scaled by how fast the edge
      // is moving. dispersion everywhere is an RGB-split filter; dispersion at a
      // moving boundary is refraction.
      float disp = edge * 0.026 * uTear;
      vec4 fbR = figAt(uFigB, uFigRectB, uFigPosB, uv + push * 0.6 + grad * disp,       uRes, 0.0, uFlipB);
      vec4 fbB = figAt(uFigB, uFigRectB, uFigPosB, uv + push * 0.6 - grad * disp * 1.2, uRes, 0.0, uFlipB);
      fb.r = fbR.r; fb.b = fbB.b;

      // the reveal itself is soft over a comparable distance, or the
      // displacement band and the changeover happen at different moments
      float turn = smoothstep(0.26, -0.26, sd);
      vec3 rgb = fa.rgb * fa.a * (1.0 - turn) + fb.rgb * fb.a * turn;
      float al = fa.a * (1.0 - turn) + fb.a * turn;
      tex = vec4(al > 0.001 ? rgb / al : vec3(0.0), al);

      bloom = core(uPigment, uSpread * 2.4, 1.0) * edge * al * 0.7;

    } else if (uFigMode == 1) {
      // PLATE. Three impressions, one per channel, arriving out of register and
      // converging. Real misregistration is DIRECTIONAL and it RESOLVES --
      // that is what separates it from an RGB-split glitch, which is random and
      // never lands.
      float hit = step(0.42, m);
      float set = smoothstep(0.42, 0.90, m);
      float d   = (1.0 - set) * 0.035 * uTear;
      vec2  ax  = vec2(0.94, 0.34);

      vec4 fa = figAt(uFigA, uFigRect, uFigPos, uv, uRes, 0.0, uFlipA);
      vec4 r  = figAt(uFigB, uFigRectB, uFigPosB, uv + ax * d,        uRes, 0.0, uFlipB);
      vec4 g  = figAt(uFigB, uFigRectB, uFigPosB, uv,                 uRes, 0.0, uFlipB);
      vec4 b  = figAt(uFigB, uFigRectB, uFigPosB, uv - ax * d * 1.15, uRes, 0.0, uFlipB);
      vec4 fb = vec4(r.r, g.g, b.b, max(max(r.a, g.a), b.a));
      tex = mix(fa, fb, hit);

    } else if (uFigMode == 2) {
      // PAGE. No dissolve at all: she leaves and the next arrives. Archive
      // logic -- you are turning a page in a catalogue, not watching one image
      // become another.
      float go  = smoothstep(0.0, 0.48, m);
      float in_ = smoothstep(0.40, 1.0, m);
      vec4 fa = figAt(uFigA, uFigRect,  uFigPos,  uv + vec2(-0.55 * go, 0.0), uRes, 0.0, uFlipA);
      vec4 fb = figAt(uFigB, uFigRectB, uFigPosB, uv + vec2(0.55 * (1.0 - in_), 0.0), uRes, 0.0, uFlipB);
      tex = fb.a > 0.004 ? fb : fa;

    } else {
      // WEAVE. Kept for reference: she comes apart along the pattern's own
      // thread lines. Sound technique, but it rhymes with the radial wave.
      vec2 wg  = uv * uClothScale * uThread;
      vec2 wf  = fract(wg) - 0.5;
      float wsel = noise((floor(wg) + 0.5) / max(uClothScale * uThread, 1e-4) * 26.0);
      float thread = smoothstep(0.0, 0.34, tile(wf, wsel, uClothShape));
      float front  = m * 2.1 - 0.35 + (length(uv - uPos) - uR) * 0.22;
      float keepA  = smoothstep(front - 0.22, front + 0.22, thread * 0.8 + 0.30);
      vec2  pull   = normalize(wf + 1e-5) * (1.0 - thread) * uTear * 0.05 * sin(3.14159 * m);

      vec4 fa = figAt(uFigA, uFigRect, uFigPos, uv + pull, uRes, 0.0, uFlipA);
      vec4 fb = figAt(uFigB, uFigRectB, uFigPosB, uv - pull, uRes, 0.0, uFlipB);
      vec3 rgb = fa.rgb * fa.a * keepA + fb.rgb * fb.a * (1.0 - keepA);
      float al = fa.a * keepA + fb.a * (1.0 - keepA);
      tex = vec4(al > 0.001 ? rgb / al : vec3(0.0), al);
    }

    if (tex.a > 0.01) {
      vec3 fig = tex.rgb * (1.0 - uFigDark);
      if (uFigTint > 0.0) {
        float lum = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
        fig = mix(fig, uPigment * lum * 0.8, uFigTint);
      }
      if (uFigLift > 0.0) {
        float sp = exp(-max(length(uv - uPos) - uR, 0.0) / max(uGlowSize * 0.7, 1e-4));
        fig += core(uPigment, uSpread * 1.6, 1.0) * sp * uFigLift * 0.5;
      }
      figA = tex.a * uFigFade;
      col = mix(col, fig, figA);
    }
    col += bloom;
  }

  // --- grain -------------------------------------------------------------
  // fine and dense, at device resolution, and strongest in the mid-tones --
  // that is where banding lives, and it is what makes the gradient feel deep
  // two octaves of white noise: a fine one at pixel scale and a coarser one
  // just above it. the pair is what reads as emulsion rather than as dither.
  float t12 = floor(uTime * 12.0);
  float g = (white(gl_FragCoord.xy * uGrainSize, t12) - 0.5) * 0.75
          + (white(floor(gl_FragCoord.xy * uGrainSize * 0.34), t12 * 1.7) - 0.5) * 0.45;
  float lum = dot(col, vec3(0.299, 0.587, 0.114));

  // grain belongs to the body, not to the screen. confine it to the disc and
  // the tight part of the glow, so the ground stays clean and the light reads
  // as emulsion rather than as a filter over the whole frame.
  //
  // The figure counts as body. She is a photograph -- the one element in the
  // frame that genuinely came off a sensor -- so leaving her out of the mask
  // makes her the only clean thing in a grained image, and she reads as a
  // sticker laid on top of it. Grain is what puts her in the same room.
  float onBody = max(max(disc, near * 0.55), figA);
  float where  = mix(1.0, onBody, uGrainMask);

  col += g * uGrain * where * (0.35 + 0.65 * (1.0 - abs(lum - 0.5) * 2.0));

  // The ground always gets a floor of dither, even with grain masked to the
  // body. Without it an 8-bit radial ramp quantises into visible contour rings
  // -- the curved banding across the background.
  col += (white(gl_FragCoord.xy, t12 * 2.3) - 0.5) * 0.010;

  // --- loader ---------------------------------------------------------------
  if (uLoadCover > 0.001) {
    // Two bodies genuinely merge. smin is a polynomial smooth minimum, so as
    // they approach they bulge toward one another and grow a neck before they
    // touch -- that is what two masses joining actually does. A cross-fade or a
    // scale would be the fake version of the same beat.
    float d1 = length(uv - uEclA) - uEclR;
    float d2 = length(uv - uEclB) - uEclR;
    float k  = 0.16;
    float h  = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
    float d  = mix(d2, d1, h) - k * h * (1.0 - h);

    float aa = fwidth(d) * 1.4;
    float inside = 1.0 - smoothstep(-aa, aa, d);

    // black -> white -> pigment. the body has no light of its own until the two
    // halves are one, and then it lights from the inside out.
    vec3 fill = mix(vec3(0.06), vec3(1.0), uEclWhite);
    fill = mix(fill, mix(core(uPigment, uSpread * 1.4, 1.0), uPigment,
                         smoothstep(0.0, 1.0, length(uv - uPos) / max(uEclR, 1e-4))),
               uEclFill);

    // the rim only exists once there is light in it
    float rim = exp(-pow(abs(d) / 0.055, 1.5)) * uEclFill;

    vec3 lc = uPaper;
    lc = mix(lc, fill, inside);
    lc += core(uPigment, uSpread * 2.0, 1.0) * rim * 0.9;

    // the seam flares at the instant the two become one
    lc += vec3(1.0) * uEclSeam * exp(-pow(abs(d + 0.02) / 0.03, 2.0));

    lc += (white(gl_FragCoord.xy * uGrainSize, floor(uTime * 12.0)) - 0.5) * 0.03;

    col = mix(col, lc, uLoadCover);
  }

  fragColor = vec4(col, 1.0);
}

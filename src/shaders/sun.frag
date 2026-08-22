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

uniform float uGrain;      // fine, dense
uniform float uGrainSize;
uniform float uGrainMask;  // 1 = grain only on the body, 0 = across the frame
uniform float uDrift;      // the body breathes

uniform float uWobble;     // low-frequency breathing on the rim

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
  col += uPigment * (near * 1.0 + wide * 0.45) * uGlow;

  col = mix(col, body, disc);

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
  float onBody = max(disc, near * 0.55);
  float where  = mix(1.0, onBody, uGrainMask);

  col += g * uGrain * where * (0.35 + 0.65 * (1.0 - abs(lum - 0.5) * 2.0));

  // The ground always gets a floor of dither, even with grain masked to the
  // body. Without it an 8-bit radial ramp quantises into visible contour rings
  // -- the curved banding across the background.
  col += (white(gl_FragCoord.xy, t12 * 2.3) - 0.5) * 0.010;

  fragColor = vec4(col, 1.0);
}

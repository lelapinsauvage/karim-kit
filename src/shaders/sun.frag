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

uniform vec3  uHot;        // centre
uniform vec3  uMid;        // body
uniform vec3  uRim;        // just inside the edge -- where the hue travels to
uniform float uRimBand;    // how far in the rim colour reaches

uniform float uGlow;       // light outside the body
uniform float uGlowSize;
uniform vec3  uGlowCol;

uniform float uGrain;      // fine, dense
uniform float uGrainSize;
uniform float uGrainMask;  // 1 = grain only on the body, 0 = across the frame
uniform float uDrift;      // the body breathes

uniform vec3  uBgA;        // ground behind
uniform vec3  uBgB;

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

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);
  vec2 dv = uv - uPos;

  // the rim is not a perfect circle -- a very slight low-frequency wobble,
  // barely a percent, is the difference between a body and a vector shape
  float wob = 1.0 + (fbm(normalize(dv + 1e-6) * 2.2 + uTime * uDrift * 0.05) - 0.5) * 0.018;
  float R = uR * wob;
  float r = length(dv) / max(R, 1e-4);

  // --- the body ----------------------------------------------------------
  // distance from the OFF-CENTRE core, not from the geometric centre. this is
  // what stops it reading as a button and starts it reading as lit from one side.
  float cr = length(dv - uCore * R) / max(R * uCoreSize, 1e-4);

  vec3 body = mix(uHot, uMid, smoothstep(0.0, 1.0, cr));
  // the hue travels to the rim colour near the edge -- a value ramp alone
  // reads as a shadow; a hue shift reads as emission
  body = mix(body, uRim, smoothstep(1.0 - uRimBand, 1.0, r));

  // --- edge --------------------------------------------------------------
  float soft = uEdge * 0.5 + fwidth(r) * 1.5;
  float disc = 1.0 - smoothstep(1.0 - soft, 1.0 + soft * 0.35, r);

  // --- glow --------------------------------------------------------------
  // only just outside the body. two skirts: a tight one that hugs the rim and
  // a wide one that lights the ground. added, never mixed.
  float out_ = max(r - 1.0, 0.0);
  float near = exp(-out_ / max(uGlowSize * 0.16, 1e-4));
  float wide = exp(-out_ / max(uGlowSize * 0.85, 1e-4));

  float gy = clamp(0.5 + uv.y * 0.6, 0.0, 1.0);
  vec3 col = mix(uBgB, uBgA, gy);
  col += uGlowCol * (near * 1.0 + wide * 0.45) * uGlow;

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

  fragColor = vec4(col, 1.0);
}

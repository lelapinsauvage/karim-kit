# Mechanisms

Each entry is one idea: what it does, what to say out loud, what to ask for, and
the minimum that makes it work. No palettes, no copy, no brief-specific values —
those get decided live.

Rule of thumb: ask for the MECHANISM, tune the NUMBERS by hand. Never paste a
prompt that specifies both.

---

## 1 · HALO

A shape behind the subject that frames it and separates it from the field.

**Say it:** "The halo is a lit shape, not a drawn one — its edge does the work."

**Ask for:**
> A fullscreen fragment shader. One shape in the centre, defined by a polar
> radius function so it can be a circle, an n-gon or a star from one uniform.
> The edge should be slightly soft and irregular, not a clean vector edge.

**Why it works (say this if asked):** a perfectly clean circle reads as a UI
element. Break the edge with a little low-frequency noise and it reads as
printed or lit — as an object rather than a mask.

**The essential part:**

```glsl
float haloRadius(float th, float form, float sides) {
  float k = 6.283185 / max(sides, 3.0);
  float a = mod(th, k) - k * 0.5;
  float poly = cos(k * 0.5) / max(cos(a), 1e-4);   // regular n-gon
  float star = 1.0 - 0.55 * abs(a) / (k * 0.5);    // spiked
  return form < 1.0 ? mix(1.0, poly, form) : mix(poly, star, form - 1.0);
}

float th   = atan(dv.y, dv.x) + rot;
float edge = radius * haloRadius(th, form, sides);
edge *= 1.0 + (fbm(dv * 6.0) - 0.5) * 0.05;        // imperfect edge
float mask = 1.0 - smoothstep(edge - soft, edge + soft, length(dv));
```

`form`: 0 circle · 1 polygon · 2 star. Continuous, so it tweens.
Numbers to tune live: radius, soft, the 0.05 irregularity.

**Bright and imperfect:** put the saturated colour INSIDE and keep the field
dark. A slight radial falloff inside the shape stops it reading as a flat plate.

---

## 2 · PATTERN FIELD

A procedural pattern covering the page. Ambient in the ground, sharp inside the
halo.

**Say it:** "It's a Truchet tiling — each cell picks one of two connectors, and
because they meet at the edges the paths chain into a continuous maze."

**Ask for:**
> A Truchet pattern in a fragment shader. Each cell draws one of two mirrored
> connectors joining the midpoints of its edges. Give me a uniform that morphs
> the connector between quarter-arcs, straight chords, right-angle elbows and
> a staircase.

**Two things that must be said, or it breaks:**

1. **Morph the control points, never the distance fields.** Mixing two SDFs
   interpolates the field rather than the path — the shape pinches off mid-blend
   and the pattern falls apart. Each family is a polyline; mix the points.
2. **Pick the tile from smooth noise at the cell's world position, not from a
   hash of the cell index.** `hash(id)` makes the whole pattern re-roll the
   instant the scale animates, because `floor(uv*scale)` re-indexes.

```glsl
vec2  cellUV = (id + 0.5) / scale;          // scale-invariant
float h = noise(cellUV * 26.0);             // NOT hash21(id)
```

**Ambient vs sharp:** same pattern, different contrast. On the dark ground put
the ink a few values above the background. Inside the halo, full contrast. That
single decision is what lets type sit anywhere.

---

## 3 · HALO DRIVES THE BACKGROUND

Switching subject = the halo grows until it is the whole field, then the next
one is born from zero.

**Say it:** "The halo isn't decoration, it's the navigation. It grows until it
becomes the background, and the next one is born inside it."

**Ask for:**
> Two zones in one shader: a ground and a disc, each with its own colours and
> pattern parameters, blended by the halo mask. Animate the disc's radius past
> the viewport, swap the ground underneath while covered, then grow the next
> disc from zero.

**Three traps — every one of these cost an hour:**

1. **Everything must be one-way.** A value that returns to where it started
   reads as a round trip whatever the easing. If a zoom must end where it began,
   fold it into the sequence so the next resting state EXPECTS it.
2. **Never drive a continuous effect off the radius.** Radius jumps from
   full-cover to zero at the handover — anything derived from it snaps there.
   Drive it from transition time instead.
3. **Everything the eye can see must match exactly across the handover.** Not
   approximately. `1 - 2^(-kt)` never reaches 1, which left the pattern at 103%
   scale — invisible as size, but the cells re-index and the whole field
   re-rolls. Normalise your easing.

**Debug it, don't guess:** freeze the transition at an exact progress and diff
the two frames pixel for pixel. Three rounds of reasoning gave three wrong
answers; one diff gave the right one in two minutes.

---

## 4 · LOADER

**Say it:** "The loader is the same shape as the site, so the site is already
introducing itself before it exists."

**Ask for:**
> Track real asset progress. The halo scales from 0 to its resting size as
> progress goes 0 to 1, with a counter set in the page's own type. On complete,
> hand straight into the first section — no fade.

**The rule:** a loader that isn't tracking anything is a lie, and it always
looks like one. Tie it to actual decoded images.

```js
let loaded = 0;
const imgs = [...assets].map(src => {
  const i = new Image();
  i.onload = () => { loaded++; };
  i.src = src;
  return i;
});
// progress = loaded / imgs.length, damped
```

---

## 5 · THINGS THAT ALWAYS READ CHEAP

Say no to these fast, live:

- Screen glitch: scanlines, RGB split, chromatic aberration, row tears. The
  display is not the subject. If something should look imperfect, break the
  INK — chew the distance field before you threshold it.
- Neon for its own sake. It has no material, so it reads as an effect. One
  saturated pigment against darkness beats it every time.
- Cross-fading two images. Have one thing reveal the other instead.
- Warping a face. Almost never works.

---

## 6 · WORKING FAST

- Ask for one mechanism at a time. Stacking three effects at once means you
  can't tell which one is wrong.
- Judge motion by watching it, not by describing it. Change one number, look.
- When a change doesn't appear, check you're running it before debugging the
  logic. Verify the served file, not the file on disk.
- When something looks wrong for a fraction of a second, dump the numbers on
  both sides of that moment.

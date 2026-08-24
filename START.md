# Start here

Read this file only. The others are reference — open one when you hit the thing
it covers, not before.

## What is in the kit

| import | what it does |
|---|---|
| `quad(canvas, frag)` | WebGL2 fullscreen-quad harness. Returns `{set, draw, texture, canvasTexture, bind}`. Sizing handled. |
| `hexToRgb(hex)` | hex string → `[r,g,b]` 0..1 |
| `paletteFrom(img)` | palette off an image → `{swatches, roles}`. `roles` is `{pigment,bg,clothInk}`, ready to use. |
| `swatchStrip(el, sw, cb)` | those swatches as clickable chips, sized by coverage |
| `panel({...})` | **The control panel.** Generated from a table — do not write sliders by hand. |
| `SUN_RANGE` | min/max/step for every uniform. Already decided; do not re-pick them. |
| `SUN_GROUPS` | how the controls are grouped in the panel |
| `SUN_NEUTRAL` | **the starting state.** Grey ground, red pigment, everything mid-range, every gate off. Obvious placeholders on purpose. |
| `SUN_OFF` | the uniforms with no slider that still have to be set, at their safe off values |
| `SUN_UNIFORM` | state key → uniform name (`r` → `uR`). Guessing this wrong fails **silently**: setting an unknown uniform is a no-op, so the control just does nothing. |
| `src/shaders/sun.frag` | Everything visual: light body, pattern field, figure compositing, wordmark layer, eclipse loader. One shader. Import with `?raw`. |

`src/sun.js` is **a reference implementation to read, not a module to import.** It
is the finished brand piece — it owns a preset table, specific figures and one
particular wordmark geometry. Read it to see how something is wired; import
`quad` and `panel`.

## The shader is gated

`sun.frag` holds four subsystems and each sits behind a single scalar. Set the
gate and the whole block is skipped — you do not need to neutralise its interior:

| gate | set to | switches off |
|---|---|---|
| `uLoadCover` | `0` | the eclipse loader |
| `uFigShow` | `0` | the figure and its transition |
| `uCloth` | `0` | the pattern field |
| `uTypeShow` | `0` | the wordmark layer |

Two values are **not** safe at zero, because they are divisors or have a
non-zero "off" state: `uThread` must be `1`, and `uClothFront` hidden is `-1`.
| `scripts/generate.mjs` | `node scripts/generate.mjs <name> "<prompt>"` → generates an image, cuts out the background, writes `src/figures/<name>.png` |
| `scripts/batch.mjs` | Same, for a list in `scripts/models.mjs` |

**Do not write:** a WebGL harness, a Truchet tiling, a radial light body, a
loader, an image generator. They exist. Import or copy them.

## Start neutral

Spread `SUN_NEUTRAL` into your state and `SUN_OFF` onto the shader and you have a
flat ground with one light body and nothing else. Bring subsystems up one gate at
a time.

**Do not pre-tune it.** Grey and pure red are placeholders nobody ships, which is
the point: replacing them is the work, and it happens on camera. A default that
already looks good removes the only visible evidence that a decision was made.

## The four rules

1. **One mechanism per instruction.** Never stack effects — you cannot tell which
   one is wrong.
2. **Every visual decision is a uniform on a panel.** Values are dragged, not
   edited. `src/sun.js` generates its panel from the uniform tables; add a
   uniform there and a slider appears.
3. **Anything measured from an asset goes in the render loop**, never in setup —
   texture aspect, alpha bounds, font metrics. Setup runs before they exist.
4. **Verify the edit landed.** A string replace that matches nothing fails
   silently. If a fix changes nothing, check it applied before theorising.

## Two things that will bite you

- **`document.fonts.ready` is not enough for a canvas-only face.** A font no DOM
  node uses is never fetched, so `ready` resolves and the canvas rasterises the
  fallback. Call `document.fonts.load('1em YourFace')` first.
- **`bayard.woff2` has no composed accented glyphs.** `Á` draws as a broken box.
  Keep display text ASCII, or check before committing to a name.

## When to open the others

- `MECHANISMS.md` — you are about to build a transition, a loader, a dissolve, or
  type behind a subject. Has the traps.
- `FIGURE.md` — **you are about to put the model in the frame.** Placement is
  packed into one vec4 and two of its values are measured, not chosen; a `figH`
  slider written the obvious way is a silent no-op. Read it before wiring her.
- `PROMPTING.md` — you are about to generate a figure.
- `PRINCIPLES.md` — you are choosing colour, type or motion yourself.
- `LIVE.md` — you want the kit/live split.

## What you do NOT decide

Composition, palette, type scale, copy, and which pigment. Those are the
designer's, live. Wire the mechanism, expose the controls, stop.

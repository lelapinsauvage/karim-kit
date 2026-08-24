# Start here

Read this file only. The others are reference — open one when you hit the thing
it covers, not before.

## What is in the kit

| import | what it does |
|---|---|
| `quad(canvas, frag)` from `@karimsaab/kit` | WebGL2 fullscreen-quad harness. Returns `{set, draw, texture, canvasTexture, bind}`. Sizing is handled. |
| `hexToRgb(hex)` | hex string → `[r,g,b]` 0..1 |
| `src/shaders/sun.frag` | Everything visual: light body, pattern field, figure compositing, wordmark layer, eclipse loader. One shader. |
| `src/sun.js` | Wires all of it. Presets, transitions, the control panel. |
| `scripts/generate.mjs` | `node scripts/generate.mjs <name> "<prompt>"` → generates an image, cuts out the background, writes `src/figures/<name>.png` |
| `scripts/batch.mjs` | Same, for a list in `scripts/models.mjs` |

**Do not write:** a WebGL harness, a Truchet tiling, a radial light body, a
loader, an image generator. They exist. Import or copy them.

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

## When to open the others

- `MECHANISMS.md` — you are about to build a transition, a loader, a dissolve, or
  type behind a subject. Has the traps.
- `PROMPTING.md` — you are about to generate a figure.
- `PRINCIPLES.md` — you are choosing colour, type or motion yourself.
- `LIVE.md` — you want the kit/live split.

## What you do NOT decide

Composition, palette, type scale, copy, and which pigment. Those are the
designer's, live. Wire the mechanism, expose the controls, stop.

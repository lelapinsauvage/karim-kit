# karim-kit

**Read `START.md` first.** This file is background; `START.md` is the contract.

Reusable creative-dev modules. Generic by design: nothing here is tied to a
brief. Import it, then art-direct on top.

## Conventions

- **No runtime deps.** Vite + raw WebGL2. The shader is the artifact; the
  wrapper stays boring.
- **Every visual decision is a uniform**, exposed on the panel. Tuning happens
  live, by dragging, not by editing constants.
- **`src/gl.js` is the harness for every shader.** `quad(canvas, frag)` returns
  `{set, draw, texture, canvasTexture, bind}`. Don't reimplement it. The control
  panel is `panel()` from `src/panel.js` — also don't reimplement that.
- Canvas sizing is checked **every frame** inside `draw()`, never driven by
  `resize` events or `ResizeObserver` — both have silently failed here, leaving
  the canvas stuck at its load-time size.

## Modules

### truchet (inside `src/shaders/sun.frag`)

Procedural Truchet pattern, gated by `uCloth`. Four tile families with a **continuous** morph
between them.

| `uShape` | family | reads as |
|---|---|---|
| 0 | arc — Smith quarter circles | flowing maze |
| 1 | chord — straight corner-to-corner | blocky diamond lattice |
| 2 | elbow — single right angle | greek key / meander |
| 3 | step — two-tread staircase | dense, circuit-like |

**How the morph works, and why it must stay this way:**

- Each family is a pair of 7-point polylines: `PA` runs left-edge midpoint →
  top-edge midpoint, `PB` runs right → bottom. All families share those four
  contact points, so tiles chain across borders in any family.
- Morph the **control points**, never the finished distance fields. Mixing two
  SDFs interpolates the field, not the path — the contour pinches off mid-blend
  and the pattern falls apart into disconnected blobs. Mixing points keeps one
  continuous path with its ends nailed to the edge midpoints, so the sweep stays
  connected at every intermediate value.
- `PB` is the point-reflection of `PA` for every family **except elbow**, where
  `PA` turns at the cell centre and `PB` hugs the far corner. Reflecting the
  elbow makes both connectors pass through the centre, they merge, and the
  meander collapses into a lattice of loops. The asymmetry *is* the greek key.

**Ink behaviour — imperfection belongs to the stroke, not the screen.** Applied
before thresholding so the line itself is unstable:

- `uRough` chews the distance field pre-threshold (eaten contour) and wanders
  the weight along the path (starved and loaded runs).
- `uBreakup` stops the interior filling to 100% — mid-frequency fbm thins the
  load, high-frequency speckle punches holes.
- `uDensity` is the ceiling opacity; ink mixes translucently over the ground, so
  thin passages read lighter, like a marker.
- `uDrift` crawls the breakup field. Slow. Nothing snaps.

Never reach for scanlines, chromatic aberration, RGB split, or row tears. They
read as cheap and they're the wrong object — the display is not the subject.

**Motion:**

- `uBreath` modulates scale / shape / warp / drift on four mutually prime
  periods (0.11, 0.067, 0.13, 0.05 Hz) so the loop never lands back on itself.
  Shape drift crosses family boundaries on its own.
- `uRewire` walks the per-cell hash with a **staggered** flip, so cells reroute
  in a wave rather than snapping in unison. Damp it (~0.07 lerp) so it feels
  like matter, not a slider. Drive it from wheel or scroll.

## Type

Display: **Bayard** (Vocal Type Co.). Three or four moments maximum, huge. It is
not interchangeable with a grotesque — it is the only element carrying meaning in
the letterforms, so sizes bend to the face, never the reverse.

Data: **IBM Plex Mono**, semibold labels and regular values, with
`font-variant-numeric: tabular-nums`. Mono is right for a record; it says
catalogue without decoration.

One loud face, one quiet one, never two loud ones. The scale jump is where the
weight lives — 230px against 16px — not in the letterforms.

## Motion defaults

Long, eased, damped. Nothing linear. Nothing that snaps unless it's meant to.

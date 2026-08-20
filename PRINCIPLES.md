# Design principles — Karim Saab

House style. Applies to any brief. Read this before proposing anything.

## How to work with me

- I art-direct, you build. Propose the mechanism, I'll set the values.
- Every visual decision becomes a tunable uniform or variable, exposed on a
  panel. I tune by dragging, not by asking you to edit constants.
- One idea executed at 80% beats four at 95%. When you have to cut, cut the
  fourth idea, never the finish on the first.
- If something looks wrong, say what's wrong with it before offering a fix.
- Don't hand me finished things when I'm learning a mechanism — narrate what
  you're doing so I can rebuild it myself.
- When a change doesn't show up, verify I'm running it before debugging the
  logic. Check the served file, not the file on disk.

## Concept

- The structure should mean something. A page shaped like a document, a
  manifest, a schedule, a signal readout carries an idea; a hero-plus-grid
  carries none.
- Reference the source, not the aesthetic. Take an idea from the material and
  name it. Never mine a culture for texture.
- One signature gesture per page. Everything else supports it.

## Colour

- Two colours carry the page. A third is an accent used once.
- Ground and ink, not background and foreground — ink mixes translucently over
  the ground so thin passages read lighter.
- Flat. No gradients except a single iridescent moment, held back.
- Hard edges. Brutalism keeps saturated palettes from going cute.

## Type

- Monument Extended for display. Three or four moments maximum, huge.
- New Montreal for everything else, including tabular data, with
  `font-variant-numeric: tabular-nums`.
- No monospace. It signals "technical" and reads cheap.
- Type sits flat on colour. No shadows, no outlines.
- Rigid type against unstable imagery is the contrast I want, not the reverse.

## Motion

- Long, eased, damped. Nothing linear. Nothing snaps unless it's meant to.
- Damp scroll-driven values (~0.07 lerp) so they feel like matter, not sliders.
- Modulate on several mutually prime periods so a loop never lands back on
  itself. Things should breathe, not cycle.
- Imperfection belongs to the subject, not to the display. Chew the geometry or
  the ink before it's drawn.
- Never: scanlines, chromatic aberration, RGB split, row tears, screen glitch.
  Cheap, and the wrong object.

## Layout

- Dense over airy. Tabular over centred.
- Structure slots first — hero, index, one product moment, outro — then fill.
- Full bleed. Canvas sizing synced per frame, never on resize events.

## Delivery

- Build the whole thing, then cut. Don't scope down on my behalf.
- Tell me what's still unfinished. Don't report done when it isn't.

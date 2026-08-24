# How we work here

This is a live build. It happens on camera, in front of an audience, on a clock.

## Division of labour

**You wire mechanisms and expose controls. I make every design decision.**

That line is the whole contract. Everything below follows from it.

## Do not

- **Do not summarise this file back to me.** Do not confirm you understood. Do
  not ask what to build next. Build what I asked, then say one line: what you
  built and whether it renders.
- **Do not design.** No layout, no typography, no copy, no colour choices, no
  nav, no wordmarks, no buttons, no sections, no content. If I did not ask for it
  in that message, it does not exist.
- **Do not pre-tune.** The starting state is grey and red on purpose. Making it
  look good before I touch it removes the only visible evidence that a decision
  was made.
- **Do not build ahead.** One mechanism per message. Then stop.
- **Do not rebuild what the kit has.** No WebGL harness, no control panel, no
  Truchet tiling, no light body, no loader, no image generator.

If you hand me something I did not ask for, I will say *"remove the layout, keep
the mechanism"* — and that round trip is time neither of us has.

## The kit

Installed as `@karimsaab/kit`. Read `node_modules/@karimsaab/kit/START.md`
**once**, at the start, and nothing else unless it points you at a specific file
for a problem you have actually hit.

Import: `quad`, `panel`, `hexToRgb`, `SUN_NEUTRAL`, `SUN_OFF`, `SUN_RANGE`,
`SUN_GROUPS`, `SUN_UNIFORM`. Shader at `@karimsaab/kit/shaders/sun.frag?raw`.

`src/sun.js` inside the kit is a **reference implementation to read**, not a
module to import.

## Rules that save minutes

- Every value is a slider on `panel()`. Never a constant I have to ask you to
  edit.
- Anything measured from an asset — texture aspect, alpha bounds, font metrics —
  is set in the **render loop**, never in setup. Setup runs before those exist.
- `SUN_UNIFORM` maps state keys to uniform names. A wrong key is a **silent
  no-op**, not an error: the slider moves and nothing happens. Verify a new
  control actually changes the frame.
- `document.fonts.load('1em Face')` before rasterising type to a canvas.
  `fonts.ready` does not fetch a face no DOM node uses.
- If a fix changes nothing, **check the edit applied** before theorising about
  why. A string replace that matches nothing fails silently.
- When something looks wrong for a fraction of a second, print the values on both
  sides of that moment. Do not reason about easing first.

## Verify before you report

Say in one line what you built and whether it renders. Then stop.

**I look, not you.** The browser is open on my other screen. Do not screenshot,
do not open Puppeteer, do not drive a headless browser, do not navigate anywhere
to "check your work." It costs a minute every time and it tells me something I
am already looking at.

The one exception is **measuring**. If I ask how far off something is, or what
colour a pixel actually is, or what the real canvas size is — screenshot it and
measure. That is a number I cannot get by looking. Everything else is a look, and
looking is my job.

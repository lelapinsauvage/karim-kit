# What I say, what you run

A lookup, not a tutorial. Find the line, run it, report one line back. If what I
said is not here, do the smallest thing that could be what I meant and let me
correct it — asking costs more than being wrong.

**Never write a shader, a harness, a panel, a tiling, a loader or a colour
extractor. All of it exists. `scene()` is two lines. Building is fifty.**

## Setup

| I say | you run |
|---|---|
| "sun", "get a light up", "start" | `const s = scene(document.querySelector('canvas'))` |
| "panel", "give me controls" | already there — press **H** |

## The model

"Model" means the person in the frame, cutout, no background.

| I say | you run |
|---|---|
| "put her in", "bring the model in" | `await s.figure('/figures/<name>.png')` |
| "bigger", "smaller" | `figH` slider |
| "move her left/right" | `figX` slider |
| "push her off the bottom" | `figBleed` slider |
| "flip her" | `view.set('uFlipA', 1)` |
| "second model" | `s.figure(url, 1)`, then drive `uFigMix` 0→1 |

## Colour

| I say | you run |
|---|---|
| "take the colours from her", "get inspired by the model", "match it to her" | `await s.palette()` |
| "not that one, the <x>" | click a chip in the strip at the top of the panel |
| "make the sun <colour>" | `s.set('pigment', '<hex>')` |
| "the ground too" | `s.set('bg', '<hex>')` |

`s.palette()` sets the light, the ground and the pattern ink together, so
changing model changes the whole picture. It does not need explaining and it
does not take arguments.

## Pattern

| I say | you run |
|---|---|
| "patterns", "cloth on" | `s.cloth(1)` |
| "bigger/smaller pattern" | `clothScale` |
| "different pattern" | `clothShape` 0–3 — arc, chord, elbow, step; it morphs |
| "heavier/lighter line" | `clothWeight` |
| "make it move" | `clothSpeed`, `clothWave` |
| "uncover it from the sun" | `s.cloth(1, r)` and animate `r` outward from 0 |

## New models

| I say | you run |
|---|---|
| "generate me a <description>" | `node scripts/generate.mjs <name> "<prompt>"` |
| "four of them" | edit `scripts/models.mjs`, `node scripts/batch.mjs` |

Read `PROMPTING.md` before writing the prompt. Generation is slow — start it,
then keep working while it runs. Never sit and wait for it.

## The whole opening, for reference

```js
const s = scene(document.querySelector('canvas'));
await s.figure('/figures/n01.png');
await s.palette();
s.cloth(1);
```

That is the entire setup. Everything after it is me on sliders.

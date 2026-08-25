# How we work here

Live build. On camera, on a clock. Everything you need is in this file.

**You wire mechanisms and expose controls. I make every design decision.**

## Do not read the kit

`node_modules/@karimsaab/kit` is a dependency, not reading material. Do not open
its source, its shaders, or its markdown. The full API is below — if it is not
here, you do not need it yet.

Reading `sun.js` costs four minutes and teaches you something this file already
told you. On a thirty-minute clock that is an eighth of the build, spent
learning instead of building.

The one exception: I name a file and tell you to open it.

## The API, complete

```js
import { scene } from '@karimsaab/kit';

const s = scene(document.querySelector('canvas'));  // running, neutral, panel on H
await s.figure('/figures/n01.png');   // cutout into frame, bottom-anchored
await s.palette();                    // light + ground + ink, taken off the figure
s.cloth(1);                           // pattern field up
s.set('pigment', '#A8531F');          // or s.set({ r: 0.4, glow: 1.2 })
s.fade(0.5);                          // the figure's own reveal, 0..1
```

`s.state` is the live state object. `s.view` is the raw harness — `s.view.set(u, v)`
for uniforms with no wrapper (`uFlipA`, `uFigMix`, `uTypeShow`).

Second figure: `s.figure(url, 1)`, then drive `uFigMix` 0→1. `uFigMode` picks the
transition: 0 stamp, 1 plate, 2 page, 3 weave.

New model, run from the project root:

```bash
node node_modules/@karimsaab/kit/scripts/generate.mjs \
  n05 "<prompt>" n06 "<prompt>"        # name/prompt pairs, as many as you like
```

Writes `src/figures/<name>.png`, background already cut out. Needs
`REPLICATE_API_TOKEN` in `.env.local` **in this folder**. Slow — start it, keep
working, never wait on it.

## What I say → what you run

| I say | you run |
|---|---|
| "sun", "start" | `scene(canvas)` |
| "put her in" | `s.figure(url)` |
| "take the colours from her", "match it to her" | `await s.palette()` |
| "not that one" | I click a chip in the panel — do nothing |
| "make the sun \<colour\>" | `s.set('pigment', hex)` |
| "patterns", "cloth" | `s.cloth(1)` |
| "bigger/smaller pattern" | `clothScale` |
| "different pattern" | `clothShape` 0–3, it morphs |
| "bigger", "move her", "off the bottom" | `figH`, `figX`, `figBleed` |
| "flip her" | `s.view.set('uFlipA', 1)` |

Anything not on this list: do the smallest thing that could be what I meant.
Asking costs more than being wrong.

## If I gave you a role

Three of us are in this folder at once, on one dev server. We divide by **the
files we own**, never by subject. Two agents in one file is a merge conflict on
camera.

| role | owns | never touches |
|---|---|---|
| **shaders** | `index.html`, `src/main.js` | `src/sections/*`, `src/figures/*` |
| **images** | `src/figures/*` — PNGs only | any `.js`, `.html`, `.json` |
| **ux** | `src/sections/*` | `index.html`, `src/main.js` |

**Only shaders runs the dev server** — http://localhost:5199. If you are not
shaders: never run `npm run dev`, never start vite, never kill it. A second
server binds another port while the browser keeps showing the first, and you
spend ten minutes editing code nobody is looking at.

Nobody edits `package.json`. If you are about to touch a file you do not own,
stop and tell me instead.

### shaders — `index.html`, `src/main.js`

The order is fixed. Do not run ahead of it.

1. `scene(canvas)`. Nothing else. Red light on grey ground is **correct** — it is
   the unresolved state I tune from, live, on camera.
2. I tune on the panel. **When I paste you a `s.set({...})`, write those values
   into `src/main.js`** so they survive a reload. That is the whole loop: I
   decide in the GUI, you make it permanent. Paste it in as one call at setup,
   do not scatter the values through the file.
3. `s.cloth(1)` when I ask. The ink starts black. **Correct.**
4. `s.figure(url)` when I ask, and only with a file I name.
5. `await s.palette()` **only when I say to take the colours from her.**

**Never propose values unless I ask for them**, and never call `s.palette()` on
your own. Colour-matching on figure load makes the decision for me and deletes
the moment. If I do ask for a starting point, give one and say plainly that it
is a guess.

### images — `src/figures/*`

**Always generate. Never reuse a figure that already exists**, never copy one in,
never point me at one on disk. If I ask for a subject, it gets made.

1. I give you references. Study them — shape, material, how the thing sits.
2. Read `PROMPTING.md` in the kit. That file only. It covers people, objects and
   objects worn by people; use the part that matches what I asked for.
3. Generate with `generate.mjs`. Report the filenames and stop. Do not load them
   into the page — that is the shaders agent's file.

People are **turned away from the lens, 45° or 90° to the left**, never square
to camera. Whatever the subject, the lighting clause is byte-identical across
every image in a set, or they cannot share a frame.

### ux — `src/sections/*`

Sitemap, structure, copy. Sections mounted and scrolling, sized correctly.

Write copy when I ask for copy — that is your job, not design. Do not choose
type, colour or layout treatment. Empty containers at the right size beat
decorated ones I have to strip.

## Do not

- **Do not design.** No layout, type, copy, colour choices, nav, wordmarks,
  buttons, sections. If I did not ask for it in that message, it does not exist.
- **Do not pre-tune.** Grey ground and red light are correct until I change them.
  A default that already looks good removes the evidence a decision was made.
- **Do not build ahead.** One mechanism per message, then stop.
- **Do not rebuild what the kit has.** No shader, harness, panel, tiling, loader,
  colour extractor, image generator. `scene()` is two lines; building is fifty.
- **Do not summarise this file back to me.** Build, then one line: what you built
  and whether it renders.

## Things that fail silently

Every one of these looks like a broken mechanism and is not.

- An unknown uniform name is a **no-op**. The slider moves, nothing happens.
- Figure placement is packed into `uFigPos`; there is no `uFigH`. Use `s.set`.
- Anything measured from an asset — aspect, alpha bounds, font metrics — is only
  valid **in the render loop**. `scene()` handles this. Hand-rolled code does not.
- `document.fonts.load('1em Face')` before rasterising type to canvas.
  `fonts.ready` does not fetch a face no DOM node uses.
- If a fix changes nothing, **check the edit applied** before theorising.

## Verify

One line back: what you built, whether it renders. **I look, not you.** No
screenshots, no Puppeteer — the browser is open on my screen and it costs a
minute to tell me what I can already see.

Exception: measuring. Pixel offsets, actual colours, real canvas size. A number
I cannot get by looking.

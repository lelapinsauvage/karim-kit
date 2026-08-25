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
import { scene, HOUSE, CHARACTERS } from '@karimsaab/kit';

const s = scene(document.querySelector('canvas'));  // running, neutral, panel on H
await s.figure('/figures/n01.png');   // cutout into frame, bottom-anchored
await s.palette();                    // light + ground + ink, taken off the figure
s.cloth(1);                           // pattern field up
s.set('pigment', '#A8531F');          // or s.set({ r: 0.4, glow: 1.2 })
s.fade(0.5);                          // the figure's own reveal, 0..1
```

`HOUSE` is the settled look — 46 values. `s.set(HOUSE)` when I ask for it and
**never before**: the frame starting unresolved is the point. `CHARACTERS`
carries the four figures with their pigment, ground, ink and provenance.

Placement: `figX` left/right, `figY` up/down, `figScale` size, `figRot` turn.

`s.state` is the live state object. `s.view` is the raw harness — `s.view.set(u, v)`
for uniforms with no wrapper (`uFlipA`, `uFigMix`, `uTypeShow`).

The opening:

```js
await s.load(['/figures/a01.png', '/figures/a02.png'], {
  onProgress: (p) => count.textContent = String(Math.round(p * 100)).padStart(3, '0'),
});
```

Two bodies cross into eclipse, join, ignite, hand the frame over. Progress is
real — the slower of "everything decoded" and a minimum duration. There is no
pause at the end, deliberately.

A set of models with a slider — **one call, when I ask for it**:

```js
await s.models([a, b, c, d], { palette: true, mode: 3 });
s.next(); s.prev(); s.go(-1);        // arrow keys already wired
```

`palette: true` gives each character its own light, ground and ink, carried
through the move in HSV so nothing goes grey at the midpoint. Leave it off and
the colours stay as I set them.

`mode`: 0 stamp, 1 plate, 2 page, 3 weave, **4 slip** — the glitch. It tears
along the pattern's own cell grid, rows sliding by whole cells and crossing over
at their own moments. Eight figures.

The move is not a crossfade. The halo swells, the ground dips and recovers, and
a ring leaves the body and crosses the pattern — the light reacts to the change
instead of the palette sliding underneath it. All of that is automatic; the only
thing to pick is `mode`.

`figRot` rotates her, radians, about her own middle. Keep it small: past about
0.2 her feet leave the bottom edge and she stops standing on anything.

Two figures without a slider: `s.figure(url, 1)`, then drive `uFigMix` 0→1.

New model, run from the project root:

```bash
node node_modules/@karimsaab/kit/scripts/generate.mjs \
  n05 "<prompt>" n06 "<prompt>"        # name/prompt pairs, as many as you like
```

Writes `src/figures/<name>.png`, background already cut out. Needs
`REPLICATE_API_TOKEN` in `.env.local` **in this folder**. Slow — start it, keep
working, never wait on it.

## Type

The three faces are already on disk and already declared. Do not author
`@font-face`, do not reach for Google Fonts, do not report that fonts are
missing — they are in `/public/fonts` and wired in `src/type.css`.

```html
<link rel="stylesheet" href="/src/type.css">
```

| family | is | for |
|---|---|---|
| `Disp` | Bayard | display only. three or four moments, huge |
| `Mono` | IBM Plex Mono | data, labels, specs. `tabular-nums` already on |
| `Grot` | Neue Haas Grotesk | everything else. 400 / 500 / 700 |

`1rem` is 16px on a 1920 artboard and scales with the viewport. Helper classes
`.disp` and `.mono` exist.

Before rasterising ANY of them into a canvas:
`await document.fonts.load('1em Disp')`. `fonts.ready` does not fetch a face no
DOM node is using, so it resolves and the canvas draws Times.

## The page furniture

`src/chrome.css` and `src/chrome.html` are the nav, rail, CTA, slider ticker,
arrows and corner count, lifted from the finished piece. Proportions, weights
and spacing are already decided.

**Start from them.** When I send a Figma screenshot: change the text, the labels
and the colours to match it, and leave the geometry alone unless I say
otherwise. Do not rebuild a nav from nothing — the one you have is the one I
drew.

Keep the ids. `s-prev`, `s-next`, `s-now`, `s-bar`, `s-all` and `pct` are what
the slider and the loader are wired to.

## What I say → what you run

| I say | you run |
|---|---|
| "start" | `scene(canvas)` -- white, empty |
| "sun", "put the light up" | `s.sun()` |
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

**My first message will be two words: your role.** That is the whole
instruction. Read `BRIEF.md`, do your role's first move below, report one line,
and stop. Do not ask me what to build — the answer is in `BRIEF.md`, and if it
is not there, do the smallest sensible version and let me correct it.

After that first move, nothing happens unless I ask for it.

Three of us are in this folder at once, on one dev server. We divide by **the
files we own**, never by subject. Two agents in one file is a merge conflict on
camera.

| role | owns | never touches |
|---|---|---|
| **shaders** | `index.html`, `src/main.js` | `src/sections/*`, `src/figures/*` |
| **images** | `src/figures/*` — PNGs only | any `.js`, `.html`, `.json` |
| **ux** | `src/sections/*` | `index.html`, `src/main.js` |
| **layout** | `index.html`, `src/chrome.css` | `src/main.js`, `src/figures/*` |

**Only shaders runs the dev server** — http://localhost:5199. If you are not
shaders: never run `npm run dev`, never start vite, never kill it. A second
server binds another port while the browser keeps showing the first, and you
spend ten minutes editing code nobody is looking at.

Nobody edits `package.json`.

**If I ask you for something directly, you do it. The ownership table stops you
wandering into another agent's file on your own — it is not permission to refuse
me.** If I ask the shaders agent to lay out a page, it lays out the page. Telling
me it belongs to another agent is telling me a thing I already know and did not
ask about, and it costs the round trip.

If a direct request means editing a file you do not own, edit it and say which
file in your one line, so the other agent knows to reload.

### shaders — `index.html`, `src/main.js`

**First move, on being named:** start the dev server, write `index.html` as a
bare full-bleed canvas and `src/main.js` as `scene(canvas)` and nothing else,
put `s` on `window`, report the URL. Then stop.

**The first frame is a WHITE, EMPTY canvas.** No sun, no loader, no counter, no
numbers. `scene()` starts blank on purpose: the light arriving is something the
room watches happen, and it cannot happen if it was already there when the page
appeared. Do not call `sun()`, `load()` or anything else until I ask.

The order after that is fixed. Do not run ahead of it.

1. Done above. Red light on grey ground is **correct** — it is the unresolved
   state I tune from, live, on camera.
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

**First move, on being named:** read `BRIEF.md`, then `PROMPTING.md` in the kit
— that file only. Generate what the brief's figures section asks for. Report the
filenames and stop. Do not wait to be told twice; generation is slow and it is
the only thing here that genuinely runs in parallel.

**Always generate. Never reuse a figure that already exists**, never copy one in,
never point me at one on disk.

`PROMPTING.md` covers people, objects, and objects worn by people — use the part
matching what the brief describes. Do not load anything into the page; that is
the shaders agent's file.

People are **turned away from the lens, 45° or 90° to the left**, never square
to camera. Whatever the subject, the lighting clause is byte-identical across
every image in a set, or they cannot share a frame.

### layout — `index.html`, `src/chrome.css`

**First move, on being named:** read `BRIEF.md`. Mount the page shell from
`src/chrome.html` and `src/chrome.css`, with `src/type.css` linked. Report, stop.

Then I send screenshots. **Change the text, the labels and the colours to match
them. Do not rebuild the geometry** — the proportions, weights and spacing are
already mine and already right. A nav rebuilt from nothing is the most expensive
way to arrive somewhere worse.

Keep the ids: `s-prev`, `s-next`, `s-now`, `s-bar`, `s-all`, `pct`.

### ux — `src/sections/*`

**First move, on being named:** read `BRIEF.md` and give me a sitemap — the
sections of the page, in order, and one line on what each is for. No code, no
copy yet. Then stop.

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
- **No preamble and no commentary.** Never open with your role. Never write "as
  the shaders agent", "I'll go ahead and", "let me". Never list what you chose
  not to do. Never suggest a next step or offer me options. Never tell me what to
  try. I know what I want next; hearing it back costs me the seconds I am on
  camera. Say what you built. Stop talking.
- **If something I asked for does not exist, say that in one sentence and build
  the rest.** Do not stop, do not ask, do not explain the architecture.

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

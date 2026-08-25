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

## The piece already exists — copy it, do not rebuild it

`node_modules/@karimsaab/kit/templates/piece/` holds `index.html` and `sun.js`:
the finished work, verbatim. Loader, switch, wave, scramble, reveal, panel, all
of it, all correct.

```bash
cp node_modules/@karimsaab/kit/templates/piece/index.html .
cp node_modules/@karimsaab/kit/templates/piece/sun.js     src/
cp node_modules/@karimsaab/kit/src/gl.js                  src/
cp node_modules/@karimsaab/kit/src/shaders/sun.frag       src/shaders/
```

Then edit **`LOOKS` only** — four entries, each a figure plus the colours and
provenance that travel with it.

**When I ask for the loader, the transition, the slider or the reveal, this is
the answer.** Do not assemble an equivalent out of `scene()` and its parts. The
numbers in here were arrived at by watching them fail and none of them are
derivable: the approach is `p ** 5`, ignition is `smoothstep(0.90, 1.00, p)`,
the cover releases across 17 thousandths of the reveal, the figure resolves on
`expoOut(seg(0.115, 0.78))`. A rebuild lands close and is wrong in a dozen small
ways at once — and each one costs a round trip to find.

`scene()` is for building something NEW. The template is for reproducing what
exists. Reach for the template first.

### Then change it

Copying is the floor, not the finish. The piece is where we start and then I
direct it — new copy, a different rail, another section, a heading that arrives
differently, a colour I decide on camera.

| safe to change on request | do not touch unless I say so |
|---|---|
| `LOOKS` — figures, colours, provenance | the loader's curves and timings |
| copy, labels, nav, the rail's fields | the switch: `DUR`, `DIP`, the wave |
| CSS: type, spacing, colour, layout | the scramble's stagger |
| reveal delays and easings | `send()`, `frame()`, the panel wiring |
| new sections and new elements | `sun.frag` |

Two heading lines in the DOM get `.t-a` and `.t-b` — they rise out of their own
box on a clip-path 160ms apart, which is what makes two lines read as one
sentence arriving rather than a block appearing.

**If I ask for something the piece does not do, build it — on top, not
instead.** Add to `sun.js` or a new file; do not rewrite what is already
working to make room for it.

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

**Placement is per model, not global.** Figures come back at different scales
sitting at different heights in their own frame, so one shared set of values
means fixing model three breaks model one — and the way that shows up is I tune
one, move on, come back, and the first has moved.

| | |
|---|---|
| `s.current()` | which model is in frame, its url, its placement, its colours |
| `s.place(2)` | read model 2's placement |
| `s.place(2, {figY:-0.04})` | set it |
| `s.places()` | every model's, copied to the clipboard as one runnable line |

Dragging a placement slider edits **whichever model is on screen**. Moving to
the next one saves what I just did and loads that model's own values, so the
panel always shows the figure I am looking at.

When I ask what a model is set to, run `s.current()` and tell me — do not guess
from `s.state`, which only mirrors the current one.

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

Colour per character, two ways — and **both carry through the move in HSV**, so
nothing snaps and nothing goes grey at the midpoint:

```js
s.models(urls, { palette: true })            // taken off each photograph
s.models(urls, { looks: [                    // or set by hand
  { pigment:'#A8531F', bg:'#E2DBD1', clothInk:'#967154' }, ...
]})
```

Hand-set colour is not a lesser case. Do **not** write your own crossfade — if
colour is snapping between figures, `looks` is missing, not broken.

`intensity` scales the whole reaction — swell, dip, wave, tear — on one
envelope. `onSwitch({from,to})` fires as a move begins, for a rail or a counter
that has to land with it. Neither needs `s.go` replaced.

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

## Text that resolves

```js
import { scramble, scrambleAll } from '@karimsaab/kit';

scramble(document.querySelector('.mark'), 'MAISON NOIR');
scrambleAll({ 'r-pig': 'Indigo, third dip', 'r-org': 'Abeokuta' }, { duration: 1450 });
```

Each letter churns through glyphs and locks, staggered left to right, so the
word arrives in order like something decoded. Run it at **1450ms, the same clock
as a figure switch**, so the record and the picture land together.

Never write a CSS keyframe glitch for this. Letters locking together read as one
flicker, which is a cheaper effect entirely, and it is what a CSS animation
gives you.

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

**My first message will be two words: your role. That is not an instruction to
do anything.** It assigns you a role and nothing else.

Read `BRIEF.md` silently. Reply with exactly one word:

```
listening
```

Nothing else. No summary of the brief, no sitemap, no plan, no questions, no
list of what you could do next. **Then wait.**

Naming you is me picking up a tool, not using it. Everything that follows
happens because I asked for it in a later message.

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

### shaders — `index.html`, `src/main.js`, `src/sun.js`

**Start from the piece. Never rebuild it.**

`node_modules/@karimsaab/kit/templates/piece/` is the finished work: the loader,
the switch, the wave, the scramble, the lockup reveal, the panel. Copy all four
files — `index.html`, `sun.js`, `text.js`, and the kit's `gl.js` and
`shaders/sun.frag` — then edit `LOOKS`, which is four entries of figure plus the
colours and provenance that travel with it.

When I ask for the loader, the transition, the slider or the reveal, that is the
answer. Do not assemble an equivalent from `scene()`. Every number in there was
arrived at by watching it fail and none are derivable at speed: the approach is
`p ** 5`, ignition is `smoothstep(0.90, 1.00, p)`, the cover releases across 17
thousandths of the reveal, the figure resolves on `expoOut(seg(0.115, 0.78))`.

`scene()` is for building something NEW, on top. Never instead.

#### If a mechanism looks broken, say so — do not route around it

This is the rule that matters most, and it is the one that cost a whole evening.

Everything that went wrong last time looked from the outside like the mechanism
being broken, because it was: three uniforms missing from a table so every
transition collapsed to a crossfade; a callback read at the wrong scope so no
switch ever fired; figures mipmapped so a dark rectangle framed every cutout.

Faced with those, the reasonable move was taken — patch `gl.generateMipmap`,
intercept `view.set`, replace `go()`, run a second animation loop. All four
worked. All four hid a real bug, and every one of them had to be found again
later underneath the workaround.

**So: if something does not behave, tell me in one line and stop.** Do not
monkey-patch the kit, do not shadow its functions, do not reimplement its
maths. A bug I know about takes minutes. A bug wearing a workaround takes an
evening.

#### Live

Naming you does nothing. Everything below happens because I asked for it.

| I say | you run |
|---|---|
| "start" | copy the piece, dev server, report the URL |
| "house" / "the look" | `s.set(HOUSE)` — 46 tuned values |
| "sun" | `s.sun()` — grey ground, red disc, **both correct** |
| "patterns" / "cloth" | `s.cloth(1)` — ink starts black, **correct** |
| "put her in" | `s.figure(url)`, only a file I name |
| "take the colours from her" | `await s.palette()` — **only when I say this** |
| "slider with these" | `s.models(urls, { looks, mode, intensity, onSwitch })` |
| "what is she set to" | `s.current()` — never guess from `s.state` |

**The panel is always up, and it is how I decide.** I drag, I hit copy, I paste
the `s.set({...})` back to you, and you write those values into the file so they
survive a reload. That loop is the whole job. Never propose values unless I ask;
if I do, say plainly that it is a guess.

Placement is **per figure**: `figX` left/right, `figY` up/down, `figScale` size,
`figRot` turn. `s.place(2, {figY:-0.04})`, `s.places()` to copy them all.

The move's four multipliers are `MOVES` in `sun.js` — `mid` is the one. Tune
from the console with `move({tear: 4})`, never by editing and reloading, because
the only way to judge a switch is to watch it twice with one number different.
`tear` is how hard she deforms; `wave` is how hard the ring answers. The wave at
rest is `BASE.charge` and is not in there.

#### Safe to change on request / not without being asked

| yours on request | mine unless I say so |
|---|---|
| `LOOKS`, copy, labels, the rail | the loader's curves and timings |
| CSS: type, spacing, colour, layout | `DUR`, `DIP`, the wave envelope |
| reveal delays and easings | the scramble's stagger |
| new sections, new elements | `sun.frag`, `send()`, `frame()` |

### images — `src/figures/*`

**Always generate. Never reuse a figure that already exists**, never copy one in,
never point me at one on disk.

`PROMPTING.md` covers people, objects, and objects worn by people — use the part
matching what the brief describes. Do not load anything into the page; that is
the shaders agent's file.

People are **turned away from the lens, 45° or 90° to the left**, never square
to camera. Whatever the subject, the lighting clause is byte-identical across
every image in a set, or they cannot share a frame.

### layout — `index.html`, `src/chrome.css`

Then I send screenshots. **Change the text, the labels and the colours to match
them. Do not rebuild the geometry** — the proportions, weights and spacing are
already mine and already right. A nav rebuilt from nothing is the most expensive
way to arrive somewhere worse.

Keep the ids: `s-prev`, `s-next`, `s-now`, `s-bar`, `s-all`, `pct`.

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

# shaders

You own `index.html`, `src/sun.js`. You run the dev server.

## Setup — do this on being named, without being asked

```bash
mkdir -p src/shaders
cp node_modules/@karimsaab/kit/templates/piece/index.html .
cp node_modules/@karimsaab/kit/templates/piece/sun.js     src/
cp node_modules/@karimsaab/kit/templates/piece/text.js    src/
cp node_modules/@karimsaab/kit/templates/piece/palette.js src/
cp node_modules/@karimsaab/kit/src/gl.js                  src/
cp node_modules/@karimsaab/kit/src/shaders/sun.frag       src/shaders/
npm run dev
```

Report: `up on 5173`. Nothing else. Not what you copied, not what is available,
not what I might want next.

**What I must see: a white, empty page.** No sun, no word, no nav, no counter,
no loader, and **an empty panel** behind `H`.

The panel grows on its own. It shows controls only for what is actually on
screen: bring the sun up and body, light, ground, grain and the two colours
appear; bring the cloth up and its group and the ink appear. A control for
something that is not there reads as broken the moment I drag it, so it is not
there either.

You never do anything to the panel. It is built from `LOOKS` every time the page
reloads, which is every time you write a value.

**Everything in `index.html` is hidden by CSS until the thing that owns it
arrives.** The nav, rail, CTA and slider wait for `body.reveal`; the counter
waits for `body.loading`, which only the loader adds. Nothing is removed from
the markup and nothing needs to be.

So if something IS on that screen at the start, it is a missing CSS rule, not
something to delete. Say which element in one line and stop — deleting it from
the page would hide the bug and take it out of the reveal it belongs to.

That has happened: the counter had no rule and sat in the corner of an empty
page reading `000`.

## There is ONE mechanism

Everything already exists — the loader, the switch, the wave, the scramble, the
reveal, the panel. Nothing is built, nothing is invented, no file is created.

**To make something appear, you write its value into `LOOKS` in `src/sun.js`.**

That is the whole job. The page reloads and it is there.

```js
const LOOKS = [
  { id:'l1', name:'', fig:'a01' },              // nothing decided yet
  { id:'l1', name:'', fig:'a01', r:0.33, glow:0.5 },   // the sun, up
];
```

| I say | you write into the look |
|---|---|
| sun · halo · light · the disc · the glow | `r: 0.33, glow: 0.5` |
| patterns · afro patterns · kuba · cloth · the weave | `cloth: 0.2, charge: 0.8` |
| models · characters · figures · her | `figShow: true, fig: 'a02'` |
| her colours · take them off her · one colour each | `palette: true` |
| slider · arrows · buttons · switch between them | `figShow: true` on two or more |
| word · title · wordmark · type · the big text | `typeInk: 0.07` |
| the colours · take them off her · match it to her | `palette: true` |
| loader · intro · opening · the count · the eclipse | `const LOADER = true` |

Nav, rail and the counter belong to `layout`. **The lockup and the loader are
not yours to bring up either** — the big word arrives with the opening, and the
opening is asked for by name, last.

### figures

`fig` is a filename in `src/figures` without the extension. **Check it exists
before writing it** — a missing file loads transparent and looks exactly like a
bug in the figure code. If I ask for four and there are three, say which slot
has nothing.

Placement is per figure and lives on the panel once she is up: `figH` size,
`figX` left/right, `figBleed` how far she sinks below the edge. Drag on one
figure, step to the next with the arrows, drag again — each keeps its own,
because each is a different look in the same array.

### colour per figure

`palette: true` reads the light, the ground and the ink off that figure's own
photograph. It takes the pigment from the garment rather than the skin, and
derives the ground and the ink from the pigment's hue so the whole frame stays
in one family — so every character arrives with its own personality instead of
wearing the last one's colour.

It writes the result into the look, so it survives, shows on the panel, and
travels in the copy block like anything I set by hand. Once I start tuning a
colour by hand, take `palette` back out of that look or it will be re-read on
the next reload and overwrite me.

### the loader

`const LOADER = true` near the top of `sun.js`. It already does this: the count
runs 0 to 100 bottom left while two small black bodies drift in from the sides,
accelerate all the way, merge, ignite at the moment they touch and open out into
the sun. There is nothing to build.

It stays off while the frame is empty — an eclipse resolving onto a blank page
is just a delay — so switch it on once there is something to open onto.

`LOAD_MIN` is how long the count takes, `REVEAL_MS` the opening after contact.

### the slider

Two or more figures and the arrows appear bottom-right on their own. Left and
right on the keyboard work too. The move itself is `MOVES` in `sun.js`, `mid` is
live, and `figMode` picks the transition — **4 is the tear along the pattern
grid**.

**Never say "not on the list".** Never ask me which I meant. I am describing
something I want on screen; work out which it is.

The list is where to look first, not a gate. If what I described is in the
piece — and it almost always is, because the piece contains a loader, a switch,
a wave, a scramble, a reveal and a full panel — **use it.**

If it genuinely is not there, **build the smallest thing that does what I
described**, and say in one line that you built it rather than found it. That
distinction is all I need. What I cannot use is a question thrown back at me
while the clock runs.

## Never

- **Create a file.** No new `.frag`, no `.js`, no second shader, no helper. You
  edit `index.html` and `src/sun.js`. That is all.
- **Invent a value.** If I have not said what size or colour, put it up at the
  placeholder and let me drag it. Red on white is correct.
- **Tell me to run something.** I am not typing commands. You write the file.
- **Take a screenshot or open a browser.** I am looking at it; you are not.
- **Say a thing is visible.** You know what you wrote. Report that:
  `wrote r:0.33 glow:0.5 into l1` — not "the sun is up".
- **Clear or rewrite `LOOKS`** to fix something. That is every decision I have
  made so far.

## The panel is how I decide

`H` toggles it. I drag, I hit **copy**, and I paste you a block:

```js
const LOOKS = [ { "id": "l1", "pigment": "#C97A24", "r": 0.41, ... }, ... ];
```

**Replace the `LOOKS` array with it. Verbatim. Then say `saved`.**

Not reformatted, not merged, not partially applied, not confirmed back to me.
Those numbers came off my hands thirty seconds ago and exist nowhere else.

Read it before you write it. If a look I did not touch has come through with
`r: 0` or `glow: 0`, or more than one look is `#FF0000`, **stop and say which** —
that is the blank state exported by mistake and writing it would erase a
character. Never repair the block yourself; tell me and I will copy it again.

Writing the file reloads the page. That is normal.

## Where the dials are

Go straight to the value. Do not explore, do not read the file first.

- **the sun** — panel: `r` size, `edge` softness, `glow`/`glowSize`, `rimW`/`rimStr`/`rimIn`, `spread`/`warmth`/`purity`, `coreX`/`coreY`, `wobble`/`drift`, `bgFall`/`bgFloor`
- **the pattern** — panel: `cloth` density, `clothScale` size, `clothShape` 0–3 family, `clothWeight`, `clothWave`/`clothSpeed`, `charge`/`chargeSpd`/`chargeLen` (the waves travelling in)
- **the switch** — `MOVES` in `sun.js`, `mid` is live. Console: `move({tear:4})` more of her, `move({wave:1.5})` more ring. `DUR = 1450` length. `figMode` 0–4, **4 is the tear**
- **the loader** — `LOAD_MIN` the count, `REVEAL_MS` the opening, `SEED` body size. Each element has its own window: sun `seg(0,0.26)`, cloth front `seg(0,0.70)`, lockup `seg(0.07,0.86)`, **she arrives last** `seg(0.115,0.78)`
- **the text** — `scramble` duration in `text.js`, `t-tear` keyframes in `index.html`
- **the page arriving** — `index.html`, `body.reveal`: top `.52s`, rail from `.95s`, slider `1.60s`, CTA `1.95s`

## A reference is values, never code

I hand you an image: read the colour off it, set `pigment`, and `bg` only if I
say the ground too. Nothing else — not the radius, not the glow, not "the
overall feel". The pattern in that image is our pattern at a different scale and
ink; the sun in it is our sun at a different colour.

## If something does not work

Say it in one line and wait. Do not diagnose out loud, do not offer options, do
not work around it. A bug I know about takes a minute; a bug wearing a
workaround takes an evening.

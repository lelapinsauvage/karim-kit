# shaders

You own `index.html`, `src/main.js`, `src/sun.js`. You run the dev server.

## Setup — do this on being named, without being asked

```bash
mkdir -p src/shaders
cp node_modules/@karimsaab/kit/templates/piece/index.html .
cp node_modules/@karimsaab/kit/templates/piece/sun.js     src/
cp node_modules/@karimsaab/kit/templates/piece/text.js    src/
cp node_modules/@karimsaab/kit/src/gl.js                  src/
cp node_modules/@karimsaab/kit/src/shaders/sun.frag       src/shaders/
npm run dev
```

Report: `up on 5173`. Nothing else. Not what you copied, not what is available,
not what I might want next.

**What I must see: a white, empty canvas.** Nothing on it at all.

No sun. No word. No nav, no lot number, no cart, no "Maison Noir". No rail, no
CTA, no slider, no counter, no loader. Not faint, not faded, not "just the
placeholder" — **nothing.**

The page ships with copy already written into it, and none of it belongs on
screen until I ask for the thing that carries it. If any of it is visible after
setup, that is a bug: one line, and stop. I should never have to ask you to
remove something. Asking for something to be taken away is a live second spent
undoing work I did not want done, in front of people watching me work.

## Why it is empty

Everything is present and correct; nothing is resolved. The mechanisms — the
loader's curves, the transition envelope, the scramble's stagger — cannot be
re-derived at speed, so they are there. The look — colour, radius, pattern
scale, placement — is the work, and work that arrives already done is not work.

## One step, one thing

| I say | you run |
|---|---|
| "sun" | `up('sun')` |
| "patterns", "the African pattern" | `up('cloth')` |
| "the word", "type" | `up('type')` |
| "put the models in" | `up('figures')` |
| "slider", "transition" | `up('slider')` |
| "the page", "chrome", "nav" | `up('chrome')` |
| "loader" | `up('loader')`, then I reload |

`up('sun')` puts a light on an empty ground and **nothing else**. If the word or
the nav or a counter arrives with it, that is a bug — one line, and stop.

**Never run `up('all')` unless I say those words.** It ends the build.

`up()` invents nothing. It restores values already in the file and decides only
when they are allowed on screen. Everything it brings up is on the panel
afterwards.

## The panel is how I decide

`H` toggles it. Groups appear as subsystems come up.

I drag, I hit copy, I paste you a `s.set({...})`. **You write those values into
the file** so they survive a reload. That loop is the job.

**Never propose values.** If I ask for a starting point, give one and say plainly
that it is a guess.

Placement is per figure: `figX` left/right, `figY` up/down, `figScale` size,
`figRot` turn. `s.place(2, {figY:-0.04})`. `s.places()` copies them all.
`s.current()` tells me which figure is in frame — never guess from `s.state`.

The move's four multipliers are `MOVES` in `sun.js`; `mid` is live. Tune from
the console: `move({tear: 4})`. `tear` is how hard she deforms, `wave` how hard
the ring answers. The wave at rest is `BASE.charge` and is not in there.

## Mine unless I ask

| yours on request | not without me saying so |
|---|---|
| `LOOKS` — figures, colours, provenance | the loader's curves and timings |
| CSS: type, spacing, colour | `DUR`, `DIP`, the wave envelope |
| reveal delays and easings | the scramble's stagger |
| new elements I asked for | `sun.frag`, `send()`, `frame()` |

If I ask for something the piece does not do, build it **on top**. Never rewrite
something that works to make room for it.

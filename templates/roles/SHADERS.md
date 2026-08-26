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

## When I say something is on screen that I did not ask for

**Find out why it is there. Do not just take it away.**

The files you copied can be wrong. They have been. A line at the bottom of
`sun.js` once brought the sun up on load by itself, and deleting the sun from
the page would have hidden that — leaving a file that does it again on the next
copy, and me believing you had done it.

So: read the file, find what put it there, and tell me in one line — *"sun.js
calls up('sun') on load, line 922."* Then I decide.

If you cannot find the cause in about a minute, remove it, say you removed the
symptom and not the cause, and move on. Live, working beats correct — but I have
to know which one I have.

**And never take the blame for something you did not do.** If the page came up
wrong out of the box, say so plainly. I need to know whether the problem is you
or the kit, because they get fixed in different places and only one of them is
fixable during a battle.

## Why it is empty

Everything is present and correct; nothing is resolved. The mechanisms — the
loader's curves, the transition envelope, the scramble's stagger — cannot be
re-derived at speed, so they are there. The look — colour, radius, pattern
scale, placement — is the work, and work that arrives already done is not work.

## The vocabulary is CLOSED

Everything I ask for is already built. There is nothing to invent, nothing to
write from scratch, and no situation where a new file is the answer.

Whatever I call it, it maps to one of these:

| what I might say | you run |
|---|---|
| sun · halo · light · the disc · the circle · the body · the glow | `up('sun')` |
| patterns · afro patterns · african patterns · kuba · cloth · the weave · texture · the tiling | `up('cloth')` |
| models · characters · figures · the girls · the people · her | `up('figures')` |
| slider · carousel · the switch · transition · arrows | `up('slider')` |
| loader · intro · opening · the eclipse · preloader | `up('loader')` |
| word · title · wordmark · type · the big text · lockup | `up('type')` |
| nav · chrome · the page · furniture · rail · header | `up('chrome')` |

Say it in any tense, any language, half a sentence, with a swear in it — if it
points at one of those seven things, run that call.

**If what I said does not point at any of them, do not build anything.** Say so
in one line and give me the two closest:

    not on the list — sun or cloth?

Asking costs three seconds. Inventing costs the segment.

## NEVER create a file

No new `.frag`. No new `.js`. No second shader, no second harness, no helper
module, no "cleaner version alongside".

It has happened: asked for a *halo sun*, the build got an 81-line `halo.frag`
and a 155-line `halo.js` that nothing loaded. The word was not on the list, so a
whole second sun was written and sat in the folder doing nothing.

You may edit exactly three files: `index.html`, `src/sun.js`, `src/main.js`.
That is all. If something seems to need a new file, it does not — say what you
were about to make and stop.

## A reference is values, never code

When I hand you an image — for the sun, the pattern, anything — it changes
**numbers and colours on the existing thing.** Read what it needs, set it,
report it.

It never means write a new shader. It never means a new approach. The pattern in
that image is the pattern we already have at a different scale, weight and ink;
the sun in that image is our sun at a different colour and radius.

## One step, one thing

## The panel is only what is on screen

`H` toggles it. **It rebuilds every time something comes up, and it only ever
shows controls for what is actually on screen.**

Ask for the sun and the panel is the sun: body, light, ground, grain, and the
two colours that make it. No cloth controls, no figure controls, no ink for a
pattern that is not there. `up('cloth')` adds the cloth and its surface;
`up('figures')` adds placement.

A control for something that is not on screen is worse than a missing one —
dragging it does nothing, which reads as broken, and finding that out costs the
time the control was meant to save.

I drag, I hit **copy**, I paste you a block that looks like this:

```js
const LOOKS = [
  { "id": "l1", "pigment": "#C97A24", "r": 0.41, "figX": 0.03, ... },
  ...
];
```

**Replace the `LOOKS` array in `src/sun.js` with it. Verbatim. Immediately.**

Not "I'll apply the colour and leave the rest". Not reformatted, not merged,
not commented on, not confirmed back to me. It is the whole array and it
replaces the whole array.

Those numbers came off my hands on a slider thirty seconds ago. They are the
only part of this that is not reproducible: everything else in the repo can be
rebuilt from the files, and these exist nowhere except that block until you
write them down. Losing one is losing the decision, and I will not notice until
the next reload — by which time I cannot remember what it was.

Then say `saved`. One word.

If the block will not paste cleanly — a key you do not recognise, a shape that
does not match — **say so and paste nothing.** A half-applied block is worse
than none, because the frame then disagrees with the panel and neither of us
knows which is right.

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

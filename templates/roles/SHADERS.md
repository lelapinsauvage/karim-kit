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

## After every step, read the value back

You cannot see the screen, but you can see what reached the shader. Run this
after every `up()` and after applying any values I paste:

```js
await check()
// { cloth: 0.205, front: 99, figFade: 1, type: 1, pigment: '#C97A24', shown: [...] }
```

It waits a frame and then reads the uniforms out of the GPU program, which is
the only place that tells the truth. Setting a value and having something else
put it back before the next draw is the failure this build keeps producing, and
it is invisible everywhere else: no error, no warning, correct code.

**What the numbers mean when a step "did nothing":**

| you see | it means |
|---|---|
| `front: -1` | the pattern is hidden however high `cloth` is |
| `figFade: 0` | she is loaded and fully transparent |
| `type: 0` | the lockup is drawn and not composited |
| the value is not what you set | something is re-setting it every frame — say so |

That last row is the important one. If `check()` disagrees with what you just
set, **do not set it again.** Say which value, what you set, and what came back.
Something in the file is fighting you, and running the same call twice cannot win.

## You cannot see the screen. Never say a thing is visible.

You know what you ran and what the state object says. You do not know what came
out the other end — a value can be set correctly and the thing still not be on
screen, because a gate somewhere else is closed.

That has happened: `up('cloth')` restored the pattern's density while the front
that uncovers it sat at the origin. Every value was right, nothing was visible,
and *"pattern's up"* was a false report made in good faith.

So report the **fact**, not the outcome:

    ran up('cloth')

not *"the African pattern is up"*. If I say it is not there, you have not made a
mistake — something in the file is wrong, and we go and find it. Do not
apologise and re-run the same call.

## A reference changes the colour. Nothing else.

When I send you an image and say make the sun like this: **read the colour off
it and set the colour.** `pigment`, and `bg` if I say the ground too.

Not the radius. Not the glow, the rim, the spread, the warmth, the position.
Not "matching the overall feel". The reference is a colour reference unless I
say otherwise, and every other value in that frame is one I already set by hand
or am about to.

If the reference makes you want to change something else, say which in one line
and leave it alone.

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

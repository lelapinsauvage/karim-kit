# The Arena — run sheet

## Before the clock

1. Open `BRIEF.md`, put Josh's actual brief in it. Style, subject, scope, name,
   and what the figures should be. **This is the only typing that matters.**
2. Four Claude Code sessions, all in `~/Desktop/arena`.
3. Browser on `localhost:5173`, panel side or on the second screen.

## The first thing you say, out loud

> "I've had the theme a week, so I built a shader library — it's public, it's
> dated, it's on my GitHub. Nothing in it knows about this brief. The page gets
> built here."

Say it once, in the first minute, and never mention it again. It costs ten
seconds and it removes the only question anyone can ask afterwards.

## Naming the agents

Four messages, two words each. Send **shaders first and alone** — it starts the
server the others assume is running.

    You are shaders.
    You are layout.
    You are images.
    You are ux.

Each replies `listening` and does nothing. That is correct.

## The order

Roughly, on a thirty-minute clock:

| min | you | why here |
|---|---|---|
| 0–1 | brief in, four agents named | |
| 1 | **images**: "Generate." | slowest thing, runs the whole time |
| 1 | **ux**: "Sitemap." | costs you nothing, runs in parallel |
| 2 | **shaders**: "Start." | white empty canvas |
| 2–6 | **shaders**: "Sun." then tune | the first thing they watch appear |
| 6–10 | **shaders**: "African patterns." then tune | |
| 10–12 | **layout**: "Page shell." | while you are still on the panel |
| 12–18 | **shaders**: "Put the models in." then place each | figures have landed by now |
| 18–22 | **shaders**: "Slider." then tune the move | |
| 22–26 | **layout**: send the Figma shot, "Match this." | |
| 26–29 | **shaders**: "Loader." reload, watch it | last, because it is the payoff |
| 29–30 | reload once, let it play | |

**If you fall behind, drop the loader and the sections. Never drop the tuning** —
the tuning is the performance.

## How to talk to them

**Short. One thing. No please.**

    Sun.
    Bigger.
    Warmer.
    African patterns.
    Smaller pattern.
    Put the models in.
    Second one is too low.
    Slider.
    Too much wave, more of her.
    Loader.

Every one of those maps to something it already has. You are not describing
what you want built; you are naming what comes next.

**When it does too much:** "Remove the loader. Nothing but the sun."
**When it explains:** ignore it and say the next thing.
**When it asks a question:** answer in three words or say "your call."

## The panel loop — this is the actual work

`H` toggles the panel. Everything on screen has controls; groups appear as
subsystems come up.

1. You drag until it looks right.
2. Hit **copy**.
3. Paste the `s.set({...})` into the shaders chat.
4. It writes those values into the file so they survive a reload.

Do that after every section you finish. **Values that only exist in the panel
are lost on the next reload**, and a reload will happen.

## The console, for the two things the panel cannot do

    move()               how hard a switch lands
    move({ tear: 4 })    more of her deforming
    move({ wave: 1.5 })  more ring, more cloth reacting
    move.save()          copies the line — paste it to shaders

    s.current()          which figure is in frame and what it is set to
    s.places()           every figure's placement, copied as one line

## If something looks broken

Say so plainly and move on: **"the pattern isn't showing."** The agent is told
not to work around a broken mechanism but to report it — because every workaround
last time hid a real bug that had to be found again underneath it.

If it is still wrong after one exchange, **leave it and go to the next thing.**
The frame does not need every subsystem. It needs to look finished.

## The two rules for you

**Say what you see, not what you want built.** "Too dark" beats "reduce the
background floor by fifteen percent."

**Never let a session go quiet.** If an agent is working, talk to the room about
the decision you just made. The tuning is the show; the typing is not.

# How we work here

Live build. On camera, on a clock. **Read your role's file and nothing else:**

| I say | you read |
|---|---|
| You are shaders. | `SHADERS.md` |
| You are images. | `IMAGES.md` |
| You are layout. | `LAYOUT.md` |
| You are ux. | `UX.md` |

Read `BRIEF.md` too, then do your role's **setup** — the section headed
*Setup*, if your file has one — and report one line.

Setup is plumbing: a server, a folder, a blank page. It is not a decision, so it
does not need asking for. If your file has no Setup section, reply with exactly
one word — `listening` — and wait.

Either way: no summary, no plan, no questions, no offering what comes next.

---

## The rule

**Only what I asked for appears. Nothing else. Ever.**

I ask for the sun: a sun appears. Not the sun and the word. Not the sun and the
loader. Not the sun and a nav bar and four lines of placeholder copy. The sun.

This is not a style preference. Every element on that screen is a decision I am
making in front of an audience, one at a time, and the order I make them in is
the thing being watched. Anything that arrives on its own has taken a decision
away from me, and I have to spend live seconds asking for it to be removed.

If something appears that I did not name, **that is a bug.** Tell me in one line.

The same rule downward: I ask for one thing, you do that one thing, you stop.
Not the obvious next step. Not the thing that would clearly help. Not tidying up
while you are in there. **Stop.**

## Never tell me where it came from

Not "piece copied". Not "imported from the kit". Not "reused the template". Not
"pulled that in".

How something arrived on screen is my business and nobody else's. Those words
are also the only ones in the room that could not possibly interest anyone.

Say what is on screen now:

    sun's up

That is the whole report. One line, present tense, what I can see.

## Nothing is invented here

Everything I ask for already exists. Your job is to find the thing I named and
bring it up — never to write a version of it.

If what I said does not match something you have, **say so and name the two
closest.** One line. Do not build the nearest thing, do not build both, do not
build a "starting point we can refine". A word I used that you do not recognise
is a question, not a brief.

## Never

- **Create a file I did not ask for.** No new shader, module, stylesheet or
  component. If it seems to need one, it does not — say what you were about to
  make and stop.
- **Design.** No layout, type, copy, colour, nav, wordmarks, sections — unless
  I asked for exactly that.
- **Pre-tune.** Grey ground and red light are correct until I change them.
  Anything that already looks good removes the evidence a decision was made.
- **Explain.** No preamble, no "I'll go ahead and", no listing what you chose
  not to do, no suggesting what to try next. I know what I want next.
- **Work around a broken mechanism.** If it does not behave, say so and stop.
  A bug I know about takes a minute; a bug wearing a workaround takes an evening.
- **Summarise this file back to me.**

## Files

| role | owns | never touches |
|---|---|---|
| shaders | `index.html`, `src/main.js`, `src/sun.js` | `src/sections/*`, `src/figures/*` |
| images | `src/figures/*` — PNGs only | any `.js`, `.html`, `.json` |
| layout | `src/chrome.css`, `src/type.css` | `src/main.js`, `src/sun.js` |
| ux | `src/sections/*` | `index.html`, `src/main.js` |

**Only shaders runs the dev server.** A second one binds another port while the
browser keeps showing the first.

Nobody edits `package.json`. If I ask you directly for something in another
agent's file, do it and name the file — the table stops you wandering, it is not
permission to refuse me.

## If something looks wrong

Say it in one line and wait. Do not diagnose out loud, do not offer three
options, do not start fixing something adjacent.

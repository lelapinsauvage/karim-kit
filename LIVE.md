# Working live

## The split

The test is unchanged: **could this exist before the theme was known?** If yes it
is kit, it gets imported, and you say so. If no, it happens on camera.

### Imported — mechanisms

| | what |
|---|---|
| `src/gl.js` | WebGL2 harness. Textures, alpha-bounds framing, canvas textures, per-frame sizing. |
| sun / body | Radial light: two colours and a formula, off-centre core, grain on the body. |
| truchet field | Four tile families, continuous morph, scale-invariant tile choice. |
| eclipse loader | Two masses accelerate together, heat on approach, contact detonates. |
| wavefront tear | Figure turns over as a front crosses it. |
| type occlusion | Wordmark rasterised to a canvas texture, composited behind the subject. |
| control panel | Generated from the uniform tables. |
| `scripts/` | Image generation + cutout, batched. |

None of it mentions a pigment, a garment, a culture or a layout. `import` lines
are a flex, not a liability.

### Live — everything that decides what it IS

- **Which pigment.** The hex, and the reason for it.
- **The values.** Radius, glow, rim, grain, figure placement. Dragged on camera.
- **The composition.** Where the body sits, how big, what the crop is.
- **The type.** Scale, tracking, the lockup, where it breaks.
- **The copy.** Every word.
- **The figure prompt.** Written on camera, one generation.
- **The sections.** Structure and content below the hero.

That is 25 of the 30 minutes and it is the half that gets judged.

## Say it once, at minute zero

> "Everything I reach for is my own library — it's on GitHub. Shader modules, a
> loader, a transition. What I'm making with it happens here."

Eight seconds. After that every shortcut reads as craft rather than a question.

## The 30 minutes

| min | what |
|---|---|
| 0–2 | Name the concept. Scaffold from the kit. |
| 2–6 | Write the figure prompt on camera, fire ONE generation, keep building while it runs. |
| 6–12 | Composition — placement, radius, crop. Sliders. |
| 12–18 | Colour. Pigment, ground, rim, glow. The most watchable minutes you have. |
| 18–24 | Type — lockup, scale, the record. |
| 24–28 | Second look, prove the switch. |
| 28–30 | Stop. Scroll it. Say what it is in ninety seconds. |

**Kill order if behind at 20:** the cloth field, the charge, the fourth look, the
loader. **Never cut:** figure, body, colour, type.

## Briefing the agent

Three messages, in this order. Short on purpose — describing a mechanism in your
own words is the work; pasting a spec is not.

**1. Orient it.**

> Read `CLAUDE.md`, `PRINCIPLES.md` and `MECHANISMS.md` in karim-kit. Import the
> kit. Do not rebuild anything that is already in it.

**2. State the piece.**

> Single landing page. [Concept in one sentence.] A body of light behind a
> figure, a pattern field, four looks. Ground [hex], pigment [hex].

**3. Then direct one thing at a time.**

> Give me the body at 0.35 with a soft edge and the core up and left.
> Now put the wordmark behind her, split across the frame on a broken baseline.
> Now the record: mono, bold labels, four rows, ranged left.

**Rules that save minutes**

- **One mechanism per instruction.** Stacking three effects means you cannot tell
  which one is wrong.
- **Judge by watching, not describing.** Change one number, look. Two rounds of
  describing motion costs more than ten slider drags.
- **When a change does not appear, check you are running it** before debugging
  the logic. Verify the served file, and verify the edit landed at all — a
  string replace that matches nothing is the quietest failure there is.
- **When something looks wrong for a fraction of a second, dump the numbers on
  both sides of that moment.** Do not reason about easing until you have.
- **Ask for the mechanism, tune the numbers yourself.** Never paste a prompt that
  specifies both.

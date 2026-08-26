# images

You own `src/figures/`. PNGs only. You never touch page code.

## When I say generate

```bash
REFS="$HOME/Desktop/afro models,$HOME/Desktop/afro clothes" \
  node node_modules/@karimsaab/kit/scripts/batch.mjs
```

**The whole set at once.** Ten in parallel is four and a half minutes; one at a
time is fifteen, and on this clock that is the difference between having models
and not.

Report the filenames. Stop. **Do not open them. Do not describe them.** I will
tell you which are wrong.

## Never reuse an old figure

`src/figures/` already has images from an earlier brief. **They are not yours.**
Do not load one, offer one, point me at one, or fall back to one because a
generation failed or is slow. An old figure means the set no longer matches what
we are building, and nobody watching can see why it looks slightly wrong.

If a batch fails: one line, and wait. Do not substitute.

**The exception is mine:** if I say *use the old ones*, use them. That is me
deciding we are out of time. Never your decision.

## The prompts

`scripts/models.mjs`, the `MODELS` table only. `WHO`, `LIGHT`, `CAMERA`, `SKIN`,
`FRAME` and `POSE` are settled — do not touch them because one image came back
wrong. Change the garment.

Read `node_modules/@karimsaab/kit/PROMPTING.md` once. That file only.

Five things decide whether a figure is usable:

1. **Name the person before the garment.** Skip it and the face comes back
   racially indeterminate.
2. **Flat, soft, frontal light.** No backlight. Looks less impressive alone and
   it is what the references are.
3. **A saturated coloured seamless**, never grey. The drama is the backdrop and
   the styling, never the lighting.
4. **Sides and top clear, bottom running off frame.** A body that stops inside
   the frame has been amputated; one that runs off it has been cropped.
5. **Streetwear cut from heritage textile.** Summer pieces, no outerwear. The
   pattern woven or dyed INTO the cloth — printed across a panel comes back
   looking like clip art on fabric.

`a02` is the standard. When something is wrong, it is wrong relative to `a02`.

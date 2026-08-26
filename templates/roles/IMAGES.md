# images

You own `src/figures/`. PNGs only. You never touch page code.

## Everything runs on Replicate

`batch.mjs` calls `generate.mjs`, which calls **Replicate** — nano-banana-pro for
the image, then a background remover for the cutout. That is the only way
figures get made here.

You do not have an image model of your own. You cannot draw one, describe one
into being, or produce a placeholder. If the script does not run, no figure
exists, and the honest report is that it did not run.

Needs `REPLICATE_API_TOKEN` in `.env.local` **in this folder**. If it is missing
or the account is out of credit, say exactly that in one line — those are two
different problems and I fix them differently.

## When I say generate

**Run it detached, and never in the foreground.**

```bash
REFS="$HOME/Desktop/karim-kit/refs/models,$HOME/Desktop/karim-kit/refs/clothes" \
  nohup node node_modules/@karimsaab/kit/scripts/batch.mjs > /tmp/gen.log 2>&1 &
```

Then report `generating` and stop. Check on it only when I ask:

```bash
tail -3 /tmp/gen.log; ls src/figures/*.png | wc -l
```

A batch takes about five minutes. Held in the foreground it blocks you for all
five, and anything that interrupts the terminal in that window kills it —
which has already cost two runs. Detached, it survives whatever happens to the
session, and I can still talk to you while it works.

## When it fails, it is almost always the same thing

`ModelRateLimitError: Service is currently unavailable due to high demand`.

Google's model, under load. Not the token, not the account, not the prompt.
Intermittent — the same account succeeds and fails minutes apart.

It is already handled three ways and you do not need to do anything about it:
requests are staggered a second apart, transient failures back off
exponentially with jitter across eight attempts, and `allow_fallback_model` lets
Replicate rerun the prompt on Seedream when Google will not take it. A fallback
image reports `resolution: fallback` instead of `2K`.

**So do not "fix" it.** Do not lower the count, do not switch models, do not
retry by hand, do not rewrite the script. Report what the log says and carry on.

If figures are still missing when the batch ends, the log names them and prints
the command to rerun exactly those. Run that.

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

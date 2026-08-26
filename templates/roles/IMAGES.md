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

## When something is clipped, name the OUTERMOST thing

This is the mistake that keeps costing a batch, and it is always the same shape.

The frame clause required both hands inside the frame. They were — resting at
the collarbone, nowhere near an edge. Both arms were still cut clean off at the
sides, because raising a forearm to show a watch puts the **elbow** further out
than anything else in the picture, and nothing in the prompt had ever mentioned
an elbow.

**A frame set to the second-outermost point crops the outermost one.**

So when I say something is clipped:

1. Look at the image and find **what is actually touching the edge.** Not what
   the subject is; what the geometry is. Elbow, hair, an earring, a sleeve, a
   raised heel.
2. Check whether the prompt names that thing. It usually does not — it names
   the thing you were thinking about instead.
3. Add it, **outermost first**, and say it is the widest thing in the picture.
4. Finish with an instruction, not a description: *"pull the camera back until
   this is true."* A described state gets averaged into the result; an
   instruction gets acted on.

Then regenerate only the ones that were wrong:

```bash
REFS="..." nohup node node_modules/@karimsaab/kit/scripts/batch.mjs j02 j06 j08 \
  > /tmp/gen.log 2>&1 &
```

**Never regenerate the whole set to fix three.** The good ones are good, they
cost money, and a rerun rolls a different face.

## Never widen a rule you have not tested

If a fix does not work twice, the clause is aimed at the wrong thing — say so
and let me look at the image. Do not keep adding sentences. A prompt with four
clauses about framing is a prompt where none of them is doing the work.

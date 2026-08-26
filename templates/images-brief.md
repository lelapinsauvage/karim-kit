# images — the brief

You generate figures. You never touch page code. Report filenames, stop.

## Speed is the whole job

**Always fire the entire set at once.** `scripts/batch.mjs` runs them in
parallel. Ten images take 4½ minutes together and 15 minutes one at a time, and
on a thirty-minute clock that difference is the difference between having models
and not.

```bash
REFS="$HOME/Desktop/karim-kit/refs/models,$HOME/Desktop/karim-kit/refs/clothes" node scripts/batch.mjs
```

Never generate one to check it first. Generate all ten, hand me the filenames,
and I will tell you which are wrong. **Do not look at them yourself. Do not
describe them to me.** Fire, report, wait.

## Never reuse an old figure

`src/figures/` already has images in it. **They are not yours to use.** Do not
load one, do not offer one, do not point me at one, do not fall back to one
because a generation failed or is slow. If I ask for figures, figures get made.

An old figure is from an old brief. Using one live means the set no longer
matches what we are building and nobody can see why it looks slightly wrong.

**The one exception:** if I say — out loud, in words — *use the old ones*, then
use them. That is me deciding we are out of time, and it is a decision I make,
never one you make for me. Until I say it, the answer is generate.

If a batch fails, say so in one line and wait. Do not substitute.

## REFS is the biggest lever you have

nano-banana-pro takes **14 reference images**. A moodboard beats any paragraph:
words select from an average of everything the model has seen, a reference
selects from a picture. Always pass `REFS`. It is never optional.

## The five things that decide whether a figure is usable

**1. Name the person, first, before the garment.**
Describing only the clothes leaves the face to the model's default, which comes
back racially indeterminate. Every figure opens with a `WHO` clause: skin,
features, and hair, specifically. Naming the hair matters as much as naming the
skin.

**2. Flat, soft, frontal light. Never a backlight.**
One very large source close and slightly above, white bounce under the chin,
shadows open and weak. This looks less impressive in isolation and it is what
the references are. A cinematic backlit key was tried and it was wrong.

**3. A saturated coloured seamless, never grey.**
Oxblood, olive, mint, terracotta, cobalt. The drama lives in the backdrop and
the styling, never in the lighting. Always include the no-spill clause — a
saturated backdrop bounces its colour into hair and the matte keeps it. If a
fringe survives anyway: `node scripts/despill.mjs <file> <#backdrop-hex> 14`.

**4. Sides and top clear, bottom running off.**
Nothing touches the left or right edge — the figure gets knocked out and stood
in an empty scene, and a sleeve cut by an edge that no longer exists reads as
damage. The body continues past the *bottom* edge and is cropped by it. A body
that stops inside the frame has been amputated; one that runs off it has been
cropped.

**5. Streetwear silhouettes cut from heritage textile.**
A plate carrier made of antique kilim. A puffer in bandana paisley. A camp
collar in Dutch wax. That register is a clothing line. "Ceremonial", "tribal"
and "inspired by" produce a costume department.

Two more that cost a regeneration each:

- **The pattern must be IN the cloth** — woven, resist-dyed, stitched. Printed
  over the top comes back looking like clip art laid on fabric.
- **Outerwear goes over a garment**, never over a bare chest. A vest on skin is
  a costume piece; a vest over a work shirt is an outfit.

## Two poses. Only two.

`POSE.left` and `POSE.centre`. A set is a series or it is unrelated
photographs. Both carry "a held, deliberate stance directed by a photographer" —
without it the model returns something that looks like a phone snap of someone
standing there.

## The standard, and why

Kept: **a01, a02, a03, a05, a10.** `a02` is the best of them and `a05` the
second. Passable: `a04`. The rest missed. They were all generated in one run,
under the same light, on the same two poses — so the difference is entirely in
how the garment was written.

**The five that worked, and the four that did not, split on four things.**

**1. A real garment type, named.**
Camp-collar shirt. Knitted jacquard polo. Plate-carrier vest. Boxy jacket.
Rugby shirt. Every keeper is a garment you could buy. The misses include a
"cropped raffia-woven shoulder piece" — which is not a garment, it is a prop,
and it comes back looking like one.

**2. The pattern runs through the cloth, not across a part of it.**
Wax print, jacquard knit, woven kilim, resist-dyed adire, woven rugby bands —
in every keeper the pattern IS the textile. The misses applied it: a mud-cloth
*panel across the chest*, shibori *sleeves*, a kente *stripe*. A panel is
decoration stuck onto a blank, and it reads as exactly that.

**3. Two layers, visibly.**
Wax shirt open over a black ribbed vest. Kilim vest over a cream work shirt.
Rugby shirt under a tan leather utility vest. Polo with a contrast ribbed
collar. The eye needs one garment interrupting another; a single garment on
a body is a product shot.

**4. One accessory. One.**
Gold hoops. A carved bone ear cuff. A brass chain. A gold nose ring. A cowrie
choker. The worst of the set had dense seed-bead strands at both ears *and* a
beaded skullcap — two accessories is styling, three is costume.

Colour, across all five keepers: **two or three colours in the garment, all
saturated, and a backdrop that opposes them.** Cobalt-and-ochre on oxblood.
Cream-and-vermilion-on-green against olive. Acid green against slate.

## The template

Fill this in. Change the garment and the colours; leave everything else.

```
['aNN', POSE.left, '<saturated backdrop, opposing the garment>', WHO.w1,
  'Wearing <a real garment type> in <textile with the pattern woven or dyed
   into it>, <two or three saturated colours>, <worn over / under a second
   garment>. <One accessory, metal or shell.> <Hair.>'],
```

Three of the five keepers are women in long fine box braids. That is not a rule,
but if you are choosing and have no reason to prefer something else, choose
that.

## What you edit

`scripts/models.mjs` — the `MODELS` table only. `WHO`, `LIGHT`, `CAMERA`,
`SKIN`, `FRAME` and `POSE` are settled. Do not tune them because a single image
came back wrong; change the garment.

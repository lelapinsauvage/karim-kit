# Generating figures

For `google/nano-banana-pro` on Replicate, via `scripts/generate.mjs`. Everything
here is about producing an image a shader can *use*, which is a different problem
from producing a nice picture.

```bash
node scripts/generate.mjs <name> "<prompt>"
```

Generates, removes the background, writes `src/figures/<name>.png`.

---

## Making it look like a photograph

The first batch on this project came back reading unmistakably as AI. Four
causes, four fixes, in order of how much each one buys you:

**1. Name a film stock.** This is the strongest single instruction available.
`Kodak Portra 400` carries an entire tonal signature — grain, contrast curve,
how it renders skin — where adjectives like "realistic" carry almost nothing.

**2. Name a focal length and a body.** `85mm`, `135mm`, `Hasselblad`. Longer
lenses compress the face and trigger denser texture rendering. This is doing
real work, not decoration.

**3. Ask for imperfection explicitly, and forbid perfection.**
> visible skin pores, natural skin texture, faint specular sheen, catchlight in
> the eyes, fine film grain, slight asymmetry in the face.
> No beauty retouch, no smooth skin filter, no plastic skin, no symmetrical face.

The negative half matters as much as the positive half.

**4. Describe an action, not a pose.** "Chin level, shoulders square, gaze
direct" is a passport photo, and it is why AI figures look posed. Real editorial
catches someone mid-movement: *looking away past the lens*, *hand flat against
the jaw*, *turning into the lens as if caught mid-movement*, *chin lifted, eyes
closed*.

**And for garments: describe the shape and the material, never the culture.**
"African-inspired" returns the model's average of everything, which is precisely
why it looks like nothing. `A stiff triangular chest panel in tan barkcloth
edged with a dense row of cowrie shells` returns a garment.

---

## The rule that matters most

**Generate the ALBEDO, not the photograph.**

A dramatic, moody, rim-lit figure is finished. It cannot be re-lit, cannot sit on
a new background, and its baked shadows will fight every light you add. What you
want is a flat, evenly lit object with all its detail intact — then the drama is
yours to add, live, and it can change with the palette.

So: **ask for boring light and interesting material.**

| ask for | never ask for |
|---|---|
| even flat studio lighting, soft frontal | dramatic / moody / cinematic lighting |
| no strong shadows, no rim light | rim light, backlit, silhouette |
| neutral white balance, low contrast | golden hour, neon, colour grade |
| plain flat mid-grey seamless backdrop | environment, set, location |

Mid-grey backdrop specifically: white blows out the cutout edge and black eats
dark hair.

---

## The six things a figure prompt needs

Write them in this order. Each one is doing a job.

1. **Format** — `Editorial fashion photograph.` Sets the whole register. "Photo"
   gets you stock; "editorial fashion photograph" gets you a lookbook.
2. **Subject and framing** — `A dark-skinned woman, waist-up, three-quarter turn,
   head slightly lifted.` Be specific about the crop, because a full-body figure
   at halo scale is a smudge.
3. **Pose, in terms of the silhouette** — the outline is what reads against a
   disc. `strict side profile`, `shoulders square to camera`, `one arm raised`.
4. **Garment, with material named** — this is the fashion brief and it is where
   most prompts go thin. `A structured coat in raw woven raffia and wool, visible
   weave, raised collar, brass hardware.` Name the fibre, the construction, the
   fastening.
5. **Light** — the boring paragraph above. Non-negotiable.
6. **Capture** — `Sharp focus, fine fabric detail visible, medium format.`
   "Medium format" is the single most effective phrase for detail and depth.

---

## Framing for a halo

The composition only works if the head sits on the disc, so ask for it:

- **waist-up or chest-up.** Full-body puts the head at 15% of the frame.
- **head near the top third**, with room above it.
- **turned, not straight on.** A frontal stare fights a circle; a three-quarter
  or profile lets the disc read as a halo behind rather than a plate.

---

## Working example

> Editorial fashion photograph. A dark-skinned woman, waist-up, three-quarter
> turn, head slightly lifted, hair cropped close. Wearing a structured coat in
> raw woven raffia and wool — visible open weave, raised funnel collar, aged
> brass toggle fastenings. Even flat studio lighting, soft frontal light, no
> strong shadows, no rim light, neutral white balance, low contrast. Plain flat
> mid-grey seamless backdrop, nothing else in frame. Sharp focus, fine fabric
> detail visible, medium format, fashion editorial.

---

## Practical

- **Aspect `3:4`, resolution `2K`.** Portrait, and 2K is plenty once it is
  downscaled to ~1400px. 4K costs time for nothing.
- **Downscale after cutout**: `sips -Z 1400 file.png --out file.png`. A 9MB PNG
  in a texture is wasted bandwidth.
- **The model rate-limits under load.** `generate.mjs` retries with backoff. Live,
  budget one call and keep a fallback image ready — a failed generation on stream
  is a dead minute.
- **One call live, not four.** Write the prompt on camera, hit it once, keep
  building while it runs. Never stand and watch the spinner.

## Failure modes

| what you get | why | fix |
|---|---|---|
| looks like stock | prompt led with "photo of a woman" | lead with the format |
| flat, no material | garment described by colour only | name fibre and construction |
| can't be re-lit | asked for dramatic light | ask for flat light |
| head too small | no crop specified | say waist-up |
| ragged cutout | white or black backdrop | mid-grey |
| face looks generic | too many adjectives about beauty | describe pose and gaze instead |

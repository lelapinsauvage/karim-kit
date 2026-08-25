# Generating figures

For `google/nano-banana-pro` on Replicate, via `scripts/generate.mjs`. Everything
here is about producing an image a shader can *use*, which is a different problem
from producing a nice picture.

```bash
node scripts/generate.mjs <name> "<prompt>"
```

Generates, removes the background, writes `src/figures/<name>.png`.

---

## Two looks, and why the default was wrong

```bash
node scripts/batch.mjs cinema n02 n04     # writes n02-cinema.png, n04-cinema.png
node scripts/batch.mjs                    # flat, the original
```

**`flat`** — one soft source front-on, even, relightable. It exists so the
shader can supply all the drama.

**`cinema`** — backlit, deep shadow side, halation.

The flat look was chosen for a real reason and it is still the wrong default.
Soft front-on light **is e-commerce lighting**: it is the light you use to
*describe* a garment, and describing is the opposite of what a cinematic frame
does. It also uses Portra 400, a low-contrast negative built to be kind to skin,
and kindness is not what this is for.

What `cinema` changes, in order of how much each is worth:

1. **The lead phrase.** `Film still.` instead of `Editorial fashion
   photograph.` This decides what the model thinks it is making before any other
   word lands — one implies a shoot, the other implies a scene the camera
   happened to be present for.
2. **Backlight.** A single hard source behind and slightly to one side; the edge
   of the head and shoulders burns, the front falls away, one weak bounce keeps
   the shadow side from going solid.
3. **A motion picture stock.** Kodak Vision3 500T — tungsten-balanced, coarse
   grain, and it haloes around a hot edge. Halation is the single most cinematic
   artefact available and no adjective produces it.
4. **A wider lens, closer.** 40mm wide open instead of 85mm. Portrait lengths
   flatter and stand back; a wide lens at short distance puts the viewer in the
   room.

### The backlight is not a style choice

The figure stands in front of a sun. A frame where the brightest thing is behind
the subject is the honest version as well as the better-looking one — the light
in the photograph and the light in the composition become the same light.

### Keep the backdrop mid grey

Not black, however much better black looks in the raw generation. A rim-lit
subject on a dark backdrop mattes badly: the cutter takes the haze and the
halation out with the background, and what is left is a hard bright outline
around a hole. Let the shader put the atmosphere back — `figLift` exists for
exactly this.

---

## What the subject is

The brief decides this and it can change late. Three cases, one discipline. The
**lighting clause never changes between them** — a ring lit differently from the
woman wearing it cannot appear in the same frame, and by the time that is
obvious you have generated the whole set.

### A person

The rules below. Body rotated away from the lens, action not pose, film stock
named.

### An object on its own — jewellery, a garment, a mask

Same stock, same light, three things different:

- **Give it scale.** An object photographed against nothing reads as either a
  toy or a monument, and the shader cannot fix that. Name what it rests on or
  hangs from — "hung on a taut wire", "laid on raw linen" — then let the cutout
  remove it.
- **Metal needs a shape to reflect.** Specular highlight is the only thing that
  says brass rather than orange plastic, and a highlight is a picture of the
  light source. "One large softbox" gives it a clean rectangular catch; a
  featureless environment gives it nothing and it comes back looking printed.
- **Name the making.** "Hand-hammered, uneven planishing marks, edges worn
  bright" is what separates an object with a history from a render. Same
  principle as skin pores.

Negative constraints that matter here: `no floating, no drop shadow, no
reflective floor, no gradient backdrop, no studio reflected in the metal.`

### An object worn by a person

Frame **tight** — hands, throat, ear, the turn of a wrist. The person is context
and should be cropped, not posed; the moment the whole face is in frame the
object stops being the subject.

The body still turns away. A hand at the jaw, a head turned so an ear comes
forward, a throat exposed by a raised chin — these exist to present the object
on a diagonal, which is the same reason the body rotates in the portraits.

---

## Where the body faces — the rule that decides most of it

**The subject is turned away from the lens: 45 degrees or 90 degrees to the
left. Never square to camera.**

This is not a stylistic preference, it is what the frame needs. The figure
stands against a disc. Square-on shoulders give the silhouette a flat rectangle
that fights the circle behind it; rotated shoulders give it a diagonal and a
clean profile edge, and the cutout starts reading as a shape rather than as a
photograph pasted on a background.

Of ten figures generated for this project, the four that got used were `n02`,
`n04`, `n06` and `n10`. Read them in `scripts/models.mjs`. What they share is
the only thing they share:

| | body | head |
|---|---|---|
| `n02` | three-quarters away | looking back over the shoulder |
| `n04` | strict profile, facing left | chin raised, eyes closed |
| `n06` | shoulders turned away | face back toward the lens |
| `n10` | angled, seen from slightly below | looking off past the frame edge |

The six that were not used — `n01`, `n03`, `n05`, `n07`, `n08`, `n09` — are all
square to the camera or turned to the right.

So the body rotates away and the head does one of two things: **follows into
profile**, or **counter-turns back**. The counter-turn is the stronger of the
two, because the twist between shoulders and head is what stops a portrait
looking posed.

Say it in the prompt as an action, never as an angle. "Turned three-quarters
away and looking back over his shoulder" works. "45 degree angle" returns a
passport photo taken slightly wrong.

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

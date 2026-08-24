# Putting a figure in the frame

Open this when you are asked to add the model. Placement is packed, measured,
and bottom-anchored — three things you will not guess from the shader.

## The trap first

**There is no `uFigH`, `uFigX` or `uFigBleed`.** Placement is one packed vec4:

```js
view.set('uFigPos', [aspect, figH, figX, figBleed]);
```

Adding `figH` to a uniform table gives you a slider that reaches nothing.
Setting an unknown uniform is a silent no-op, so it drags smoothly and the frame
never changes — and it looks like the shader is ignoring you. Everything about
placement goes through `uFigPos`, rebuilt from state every frame.

| slot | is | range |
|---|---|---|
| `.x` | `aspect` — **measured from the texture, not chosen** | — |
| `.y` | `figH` — drawn height, viewport short axis = 1.0 | 0.4 – 2.5 |
| `.z` | `figX` — horizontal shift, 0 is centre | −0.8 – 0.8 |
| `.w` | `figBleed` — how far she sinks below the bottom edge | −0.4 – 0.6 |

## She is anchored to the bottom, so there is no Y

`figAt` computes `cy` from `frameBottom`, not from the centre. Her feet sit on
the bottom edge of the frame at any height or viewport, and `figBleed` pushes
her *down* out of it. To raise her, use a negative bleed.

This is why a Y control is wrong rather than missing: a figure standing in a
frame is standing on something. Free Y makes her float, and the first thing that
goes when she floats is the sense that the light and the ground are the same
place.

## Two values are measured, not decided

`quad()`'s `texture(url)` returns a record that fills in **when the image
loads**:

```js
const fig = view.texture('/figures/a.png');   // { rect, aspect, ready, onready }
```

- `rect` — the alpha bounding box of the cutout, `[x, y, w, h]` in 0..1
- `aspect` — the *content's* aspect, from the box, not the file's

Both are `undefined` for the first frames. **Set them in the render loop**, never
in setup:

`applySun` does this for you — hand it the texture record and it reads `rect`
and `aspect` fresh every frame:

```js
function frame(t) {
  applySun(view, s, { fig, time: t });   // fig placement + colours + clock
  view.draw();
  requestAnimationFrame(frame);
}
```

By hand, it is:

```js
if (fig.ready) {
  view.set('uFigRect', fig.rect);
  view.set('uFigPos', [fig.aspect, s.figH, s.figX, s.figBleed]);
}
```

Skipping `rect` stretches her to the file's aspect and reintroduces the
transparent margin the cutout removed — she comes out small, floating, and
slightly squashed, which is the usual symptom of this being wrong.

## Wiring the minimum

```js
view.bind({ uFigTex0: fig });          // sampler -> unit
s.figShow = true;                      // the gate, via applySun
view.set('uFigA', 0); view.set('uFigB', 0);   // both point at unit 0
view.set('uFigMix', 0);                // no transition yet
view.set('uFigFade', 1);               // her own reveal clock, 0..1
```

`uFigA`/`uFigB`/`uFigMode`/`uFigTex*` are **integers** — `uniform1i`. `set()`
handles it; hand-rolled uniform calls do not.

For a second figure, pass it as `figB` and `applySun` fills `uFigRectB` and
`uFigPosB`, taking `figHB`/`figXB`/`figBleedB` from state where they exist and
falling back to the first figure's placement where they do not.

For a second figure, bind `uFigTex1`, point `uFigB` at it, give it its own
`uFigRectB`/`uFigPosB`, and drive `uFigMix` 0→1. `uFigMode` picks the transition
(0 stamp, 1 plate, 2 page, 3 weave). `uFlipA`/`uFlipB` mirror horizontally —
generated figures face whichever way the model decided, and a set looking in
different directions stops being a series.

## Treatment

These are what make her belong to the picture instead of sitting on it. All are
sliders; none should be left at zero without a reason.

| uniform | does |
|---|---|
| `uFigDark` | pulls her toward silhouette |
| `uFigTint` | how far she takes the pigment's colour |
| `uFigLift` | light from the body spilling onto her, falling off with distance |

**Grain reaches her automatically.** `uGrainMask` at 1 means "grain on the body",
and the figure counts as body — she is the one element that genuinely came off a
sensor, so leaving her clean in a grained frame is what makes her read as a
sticker. If she looks pasted on, check grain before you touch anything else.

## Colour from the figure

`paletteFrom` reads the palette off the cutout so the light, the ground and the
pattern belong to whoever is currently in frame.

```js
import { paletteFrom, swatchStrip } from '@karimsaab/kit/palette';

const { swatches, roles } = await paletteFrom('/figures/a.png');
Object.assign(state, roles);        // { pigment, bg, clothInk }
swatchStrip(el, swatches, (hex) => { state.pigment = hex; send(state); });
```

Only `pigment` is taken from the image; `bg` and `clothInk` are derived from its
hue. Three colours lifted from one photograph are three colours that merely
co-occurred — skin, denim and a shadow are an accident of what the model wore,
not a palette. Deriving the other two keeps the frame in one family.

It picks the **garment, not the skin**: skin wins on coverage in nearly every
figure, so the score weights chroma over area. Clustering is in Lab and seeded
deterministically — the same figure gives the same palette on every load, or a
look tuned on one run is gone on the next.

`roles` is a proposal, not an answer. Put the strip on the panel and let it be
overruled in one click.

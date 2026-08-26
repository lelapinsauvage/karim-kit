# layout

You own `src/chrome.css` and `src/type.css`.

## The furniture already exists

`src/chrome.html` and `src/chrome.css` are the nav, rail, CTA, slider ticker and
counter, with the proportions, weights and spacing already decided.

**Start from them.** When I send a screenshot: change the text, the labels and
the colours to match it. **Do not rebuild the geometry.** A nav rebuilt from
nothing is the most expensive way to arrive somewhere worse.

Keep the ids — `s-prev`, `s-next`, `s-now`, `s-bar`, `s-all`, `pct`, `r-lot`,
`r-pig`, `r-org`, `r-cloth`, `r-ed`. The slider and the loader are wired to them.

## Type

Three faces, already on disk and already declared in `src/type.css`. Do not
write `@font-face`, do not reach for Google Fonts, do not tell me a font is
missing.

| family | is | for |
|---|---|---|
| `Disp` | Bayard | display only, three or four moments, huge |
| `Mono` | IBM Plex Mono | data, labels, specs |
| `Grot` | Neue Haas Grotesk | everything else |

`1rem` is 16px on a 1920 artboard and scales with the viewport.

Before rasterising any of them into a canvas: `await document.fonts.load('1em Disp')`.
`fonts.ready` does not fetch a face no DOM node uses.

## Nothing appears until I ask

Mounting the shell puts the whole page furniture on screen. That is one of my
steps, not something to do while you are in there.

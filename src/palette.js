// Pull a palette off an image, and propose the three colours the shader needs.
//
// The extraction is mechanical. Which swatch becomes the light is not — so this
// returns the whole ordered set as well as a proposal, and the proposal is meant
// to be overridden. `roles` exists so a new figure is never worse than
// serviceable on first load; `swatches` exists so it can be made right.

const clamp01 = (x) => Math.min(1, Math.max(0, x));

export function rgb2hsv(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d > 1e-6) {
    if (mx === r)      h = ((g - b) / d) % 6;
    else if (mx === g) h = (b - r) / d + 2;
    else               h = (r - g) / d + 4;
    h /= 6; if (h < 0) h += 1;
  }
  return [h, mx < 1e-6 ? 0 : d / mx, mx];
}

export function hsv2rgb(h, s, v) {
  const i = Math.floor(h * 6), f = h * 6 - i;
  const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
  const r = [[v,t,p],[q,v,p],[p,v,t],[p,q,v],[t,p,v],[v,p,q]][i % 6];
  return r;
}

export const toHex = ([r, g, b]) =>
  '#' + [r, g, b].map((c) => Math.round(clamp01(c) * 255).toString(16).padStart(2, '0')).join('').toUpperCase();

// Clustering happens in Lab, not RGB. RGB distance does not match seen
// distance: a navy and a black sit closer together in RGB than two obviously
// different mid greens, so an RGB k-means folds the darks into one cluster and
// splits the greens. Lab is roughly uniform, so the clusters come back as the
// colours a person would have pointed at.
function toLab(r, g, b) {
  const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  r = lin(r); g = lin(g); b = lin(b);
  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  const y = (r * 0.2126 + g * 0.7152 + b * 0.0722);
  const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(x), fy = f(y), fz = f(z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

function loadImage(src) {
  if (typeof src !== 'string') return Promise.resolve(src);
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => res(img);
    img.onerror = () => rej(new Error('palette: could not load ' + src));
    img.src = src;
  });
}

/**
 * paletteFrom(src) -> { swatches, roles, medianLum }
 *
 * swatches: [{ hex, rgb, hsv, weight }] ordered by how much of the subject they
 *           cover. weight sums to 1.
 * roles:    { pigment, bg, clothInk } hex strings, ready to drop into state.
 */
export async function paletteFrom(src, opts = {}) {
  const { count = 6, size = 160, alphaMin = 200, iterations = 14 } = opts;
  const img = await loadImage(src);

  const W = size, H = Math.max(1, Math.round(size * img.height / img.width));
  const cv = Object.assign(document.createElement('canvas'), { width: W, height: H });
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, W, H);
  const { data } = ctx.getImageData(0, 0, W, H);

  // alphaMin is high on purpose. A cutout keeps a fringe of semi-transparent,
  // near-black pixels along the original photo edge; sampled, they invent a
  // dark neutral that was never in the picture and it wins on coverage.
  const px = [], lab = [];
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < alphaMin) continue;
    const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
    px.push([r, g, b]); lab.push(toLab(r, g, b));
  }
  if (!px.length) throw new Error('palette: image is fully transparent');

  // Seeded farthest-first, not at random: the same figure must give the same
  // palette every time it loads, or a look tuned on one run is gone on the next.
  const cen = [lab[0]];
  while (cen.length < Math.min(count, px.length)) {
    let best = 0, bestD = -1;
    for (let i = 0; i < lab.length; i++) {
      let d = Infinity;
      for (const c of cen) {
        const dd = (lab[i][0]-c[0])**2 + (lab[i][1]-c[1])**2 + (lab[i][2]-c[2])**2;
        if (dd < d) d = dd;
      }
      if (d > bestD) { bestD = d; best = i; }
    }
    cen.push(lab[best]);
  }

  const owner = new Int32Array(lab.length);
  for (let it = 0; it < iterations; it++) {
    for (let i = 0; i < lab.length; i++) {
      let b = 0, bd = Infinity;
      for (let c = 0; c < cen.length; c++) {
        const dd = (lab[i][0]-cen[c][0])**2 + (lab[i][1]-cen[c][1])**2 + (lab[i][2]-cen[c][2])**2;
        if (dd < bd) { bd = dd; b = c; }
      }
      owner[i] = b;
    }
    const sum = cen.map(() => [0, 0, 0, 0]);
    for (let i = 0; i < lab.length; i++) {
      const s = sum[owner[i]];
      s[0] += lab[i][0]; s[1] += lab[i][1]; s[2] += lab[i][2]; s[3]++;
    }
    for (let c = 0; c < cen.length; c++)
      if (sum[c][3]) cen[c] = [sum[c][0]/sum[c][3], sum[c][1]/sum[c][3], sum[c][2]/sum[c][3]];
  }

  // Average each cluster in RGB for the swatch itself — the Lab centroid is for
  // grouping; converting it back would drift off the colours actually present.
  const acc = cen.map(() => [0, 0, 0, 0]);
  for (let i = 0; i < px.length; i++) {
    const a = acc[owner[i]];
    a[0] += px[i][0]; a[1] += px[i][1]; a[2] += px[i][2]; a[3]++;
  }
  const swatches = acc.filter((a) => a[3] > 0).map((a) => {
    const rgb = [a[0]/a[3], a[1]/a[3], a[2]/a[3]];
    return { hex: toHex(rgb), rgb, hsv: rgb2hsv(...rgb), weight: a[3] / px.length };
  }).sort((x, y) => y.weight - x.weight);

  const lums = px.map(([r, g, b]) => 0.299*r + 0.587*g + 0.114*b).sort((a, b) => a - b);
  const medianLum = lums[lums.length >> 1];

  return { swatches, roles: rolesFrom(swatches, medianLum), medianLum };
}

/**
 * The proposal. Only the pigment's hue and saturation come from the image; every
 * lightness is retargeted, and the other two colours are derived.
 *
 * Extracting three independent colours from one photograph gives three colours
 * that merely co-occurred -- skin, denim and a shadow are not a palette, they
 * are an accident of what the model wore. Deriving the other two from the
 * pigment's own hue puts the whole frame in one family, so the light looks like
 * it is lighting the room rather than sitting in front of it.
 *
 * The target ranges are measured off the kit's four presets rather than picked:
 *
 *   pigment   v 0.40-0.66   s 0.10-0.82
 *   ground    v 0.86-0.89   s 0.02-0.08   pigment's hue
 *   ink       v 0.52-0.59   s about half the pigment's, pigment's hue
 *
 * Two of those are worth stating out loud, because the obvious guess is wrong
 * in both cases. A pigment is not bright: it drives a light BODY, and a
 * photograph's darkest chromatic region lands near v 0.25, which renders as a
 * brown hole rather than as a light. And the ink is not black -- it is a
 * mid-tone carrying the pigment's hue, so pattern sits on the ground as a tone
 * instead of cutting into it.
 */
export function rolesFrom(swatches, medianLum = 0.5) {
  // The light wants the garment, not the skin. Skin dominates coverage in
  // almost every figure, so weight alone picks it every time; chroma is what
  // separates a dyed cloth from a body. Weight still breaks ties, damped so a
  // large dull region cannot outvote a small vivid one.
  const score = (s) => s.hsv[1] ** 1.6 * (0.30 + 0.70 * Math.sqrt(s.weight)) * (s.hsv[2] > 0.18 ? 1 : 0.15);
  const pick = swatches.slice().sort((a, b) => score(b) - score(a))[0] ?? swatches[0];
  const [h, s0, v0] = pick.hsv;

  const sat = Math.min(s0, 0.85);
  // Compressed, not clamped, so a vivid figure still reads brighter than a
  // muted one instead of both landing on the same value.
  const v = 0.38 + 0.30 * v0;

  return {
    pigment:  toHex(hsv2rgb(h, sat, v)),
    bg:       toHex(hsv2rgb(h, Math.min(sat * 0.10, 0.08), medianLum < 0.42 ? 0.89 : 0.87)),
    clothInk: toHex(hsv2rgb(h, sat * 0.50, 0.55)),
  };
}

/**
 * Render the swatches as clickable chips. Extraction proposes; this is how the
 * proposal gets overruled in one click instead of by typing a hex.
 *
 *   swatchStrip(el, res.swatches, (hex) => { state.pigment = hex; send(state); });
 */
export function swatchStrip(el, swatches, onPick) {
  el.innerHTML = '';
  el.style.cssText = 'display:flex;gap:2px;margin:4px 0';
  for (const s of swatches) {
    const b = document.createElement('button');
    b.type = 'button';
    b.title = `${s.hex}  ${(s.weight * 100).toFixed(0)}%`;
    // Chips are sized by coverage: the strip then reads as the picture's
    // proportions, which is the information you actually choose on.
    b.style.cssText =
      `flex:${Math.max(s.weight, 0.04)};height:22px;border:1px solid #0003;` +
      `cursor:pointer;padding:0;background:${s.hex}`;
    b.onclick = () => onPick(s.hex, s);
    el.appendChild(b);
  }
  return el;
}

// One call that puts a running scene on screen.
//
// This exists because of a measured failure: told "build me a sun", an agent
// with the pieces available still wrote its own shader. Importing cost fifteen
// lines of ceremony -- harness, gates, neutral state, colour conversion, panel,
// render loop -- and writing something from scratch felt shorter than assembling
// something correct. So the ceremony is gone. If importing is two lines and
// building is fifty, nobody builds.
//
// Nothing here is tied to a subject. It draws a light, a ground, a pattern field
// and a cutout figure. Whether that cutout is wearing clothes, jewellery or
// nothing is not something this file knows about.

import { quad } from './gl.js';
import { panel, applySun, SUN_NEUTRAL, SUN_OFF, SUN_COLOUR, SUN_GROUPS } from './panel.js';
import { paletteFrom, swatchStrip, rgb2hsv, hsv2rgb, toHex } from './palette.js';
import frag from './shaders/sun.frag?raw';

/**
 * scene(canvas, opts) -> { view, state, figure, palette, cloth, set, panel }
 *
 *   const s = scene(document.querySelector('canvas'));
 *   await s.figure('/figures/a.png');
 *   await s.palette();
 *   s.cloth(1);
 *
 * Starts neutral -- grey ground, red light -- and stays that way until someone
 * decides otherwise. That is deliberate: a default that already looks good
 * removes the only visible evidence that a decision was made.
 */
export function scene(canvas, opts = {}) {
  const view = quad(canvas, frag);
  const state = { ...SUN_NEUTRAL, ...(opts.state || {}) };
  for (const [k, v] of Object.entries(SUN_OFF)) view.set(k, v);

  const slots = [null, null, null, null];
  let lastURL = null;

  // --- the set -------------------------------------------------------------
  const models = [];          // { url, tex, roles }
  let ix = 0, tween = null;

  // Pigments interpolate in HSV, the short way round the hue circle. An RGB
  // lerp between two saturated colours passes through grey -- measured on
  // indigo to brass, saturation falls from 0.79 to 0.13 at the midpoint. That
  // dead middle is what reads as the frame dropping out halfway through a
  // switch and snapping back.
  const mixHex = (A, B, t) => {
    const a = rgb2hsv(...hexArr(A)), b = rgb2hsv(...hexArr(B));
    let dh = b[0] - a[0];
    if (dh >  0.5) dh -= 1;
    if (dh < -0.5) dh += 1;
    return toHex(hsv2rgb((a[0] + dh * t + 1) % 1,
                         a[1] + (b[1] - a[1]) * t,
                         a[2] + (b[2] - a[2]) * t));
  };
  const hexArr = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const easeOut = (t) => 1 - Math.pow(2, -10 * t);   // normalised below

  const api = {
    view,
    state,

    /** set one or many values: set('r', 0.4) or set({ r: 0.4, glow: 1 }) */
    set(k, v) {
      if (typeof k === 'object') Object.assign(state, k);
      else state[k] = v;
      api.panel?.sync();
      return api;
    },

    /**
     * Put a cutout in the frame. Resolves when the image has loaded, because
     * its alpha box and aspect are measured from the pixels -- until then the
     * placement has nothing to work with.
     */
    figure(url, slot = 0) {
      const t = view.texture(url, slot);
      slots[slot] = t;
      view.bind({ ['uFigTex' + slot]: t });
      view.set('uFigA', 0); view.set('uFigB', slots[1] ? 1 : 0);
      view.set('uFigMix', 0); view.set('uFigMode', 0); view.set('uFigFade', 1);
      state.figShow = true;
      if (slot === 0) lastURL = url;
      if (!live.figure) { live.figure = true; buildPanel(); }
      return t.ready ? Promise.resolve(t)
                     : new Promise((res) => { t.onready = () => res(t); });
    },

    /**
     * Take the palette off whoever is currently in frame. Sets pigment, ground
     * and ink together, so changing figure changes the whole picture rather
     * than leaving a light from the last one.
     *
     * Returns the swatches too. They are the override: the proposal is only a
     * starting point and is meant to be argued with.
     */
    async palette(url = lastURL) {
      if (!url) throw new Error('scene.palette: no figure loaded yet');
      const { swatches, roles, medianLum } = await paletteFrom(url);
      api.set(roles);
      lastSwatches = swatches;
      if (api.panel && opts.panel !== false) mountSwatches(swatches);
      return { swatches, roles, medianLum };
    },

    /**
     * Pattern field on/off, 0..1.
     *
     * Also moves uClothFront, which is the reason a bare cloth(1) shows
     * nothing: the field is UNCOVERED by a front travelling out from the body,
     * not faded up, and its off state is -1 rather than 0. Setting the density
     * without the front leaves a fully-formed pattern hidden behind a radius
     * that never left the origin -- no error, no pattern, and the obvious
     * conclusion is that the mechanism is broken.
     *
     * Pass a radius to place the front by hand and animate the uncovering.
     */
    cloth(v = 1, front = v > 0 ? 99 : -1) {
      view.set('uClothFront', front);
      if (!live.cloth) { live.cloth = true; buildPanel(); }
      return api.set('cloth', +v);
    },

    /** the figure's own reveal, 0..1 -- drive it from a transition */
    fade(v = 1) { view.set('uFigFade', v); return api; },

    /**
     * models(urls, opts) -- a set you can move between.
     *
     * Loads every figure, binds each to its own sampler, and gives you next /
     * prev / go with the shader's own transition. Arrow keys are wired unless
     * you turn them off.
     *
     * opts.palette: extract a palette per figure and carry the colours through
     * the move, so each character brings its own light, ground and ink. OFF by
     * default -- colour is a decision, and nothing here takes one unasked.
     *
     * Capped at FOUR. The shader has uFigTex0..3; a fifth needs a texture
     * array, which is a real change, not a bigger number.
     */
    async models(urls, { palette = false, duration = 900, mode = 0, keys = true } = {}) {
      if (urls.length > 4) throw new Error(`scene.models: ${urls.length} given, 4 is the limit (uFigTex0..3)`);
      models.length = 0;
      urls.forEach((url, i) => {
        const tex = view.texture(url, i);
        view.bind({ ['uFigTex' + i]: tex });
        models.push({ url, tex, roles: null });
      });
      await Promise.all(models.map((m) =>
        m.tex.ready ? null : new Promise((r) => { m.tex.onready = r; })));

      if (palette)
        for (const m of models) m.roles = (await paletteFrom(m.url)).roles;

      state.figShow = true;
      state.figMode = mode;
      view.set('uFigMode', mode);
      view.set('uFigFade', 1);
      ix = 0;
      if (models[0].roles) api.set(models[0].roles);
      if (!live.figure) { live.figure = true; buildPanel(); }

      if (keys) addEventListener('keydown', (e) => {
        const d = /Right|Down/.test(e.key) ? 1 : /Left|Up/.test(e.key) ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        api.go(d);
      });
      return api;
    },

    /** step through the set. Input during a move is ignored, not queued. */
    go(dir = 1, duration = 900) {
      if (tween || !models.length || !dir) return api;
      const from = ix;
      ix = (ix + dir + models.length) % models.length;
      tween = { from, to: ix, t0: null, duration,
                a: models[from].roles, b: models[ix].roles };
      return api;
    },
    next() { return api.go(1); },
    prev() { return api.go(-1); },
    at()   { return ix; },
  };

  // Which groups are live. A control for something that is not on screen is
  // worse than a missing one: it reads as broken when dragging it does nothing,
  // and it costs the time it takes to find that out.
  const live = { cloth: false, figure: false, type: false };
  let panelOpen = opts.open ?? false;

  function buildPanel() {
    if (opts.panel === false) return;
    if (api.panel) { panelOpen = api.panel.el.style.display !== 'none'; api.panel.el.remove(); }
    // 'surface' is the cloth's own shading -- rake, sheen, cord -- so it
    // arrives with the cloth rather than sitting there doing nothing.
    const on = { ...live, surface: live.cloth };
    const groups = SUN_GROUPS.filter(([name]) => on[name] ?? true);
    api.panel = panel({
      state, groups,
      colors: Object.keys(SUN_COLOUR).filter((k) =>
        k !== 'clothInk' || live.cloth),
      open: panelOpen,
      note: opts.note ?? '',
      copyAs: opts.copyAs,
    });
    if (lastSwatches) mountSwatches(lastSwatches);
  }
  let lastSwatches = null;
  buildPanel();

  // The strip goes at the top of the panel, above the sliders: it is the first
  // decision made after a figure lands, not a footnote to the tuning.
  function mountSwatches(swatches) {
    let host = api.panel.el.querySelector('#pal-strip');
    if (!host) {
      host = document.createElement('div');
      host.id = 'pal-strip';
      api.panel.el.prepend(host);
    }
    swatchStrip(host, swatches, (hex) => { api.set('pigment', hex); });
  }

  function loop(t) {
    let fig = slots[0], figB = slots[1];

    if (models.length) {
      let m = 1, A = ix, B = ix;
      if (tween) {
        if (tween.t0 === null) tween.t0 = t;
        const raw = Math.min((t - tween.t0) / tween.duration, 1);
        // normalised, so it actually REACHES 1. An un-normalised expo-out
        // stops at 0.999 and the last thousandth arrives as a snap.
        m = raw >= 1 ? 1 : easeOut(raw) / easeOut(1);
        A = tween.from; B = tween.to;
        if (tween.a && tween.b)
          api.set({ pigment:  mixHex(tween.a.pigment,  tween.b.pigment,  m),
                    bg:       mixHex(tween.a.bg,       tween.b.bg,       m),
                    clothInk: mixHex(tween.a.clothInk, tween.b.clothInk, m) });
        if (raw >= 1) tween = null;
      }
      fig = models[A].tex; figB = models[B].tex;
      view.set('uFigA', A);
      view.set('uFigB', B);
      view.set('uFigMix', m);
    }

    applySun(view, state, { fig, figB, time: t });
    view.draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  return api;
}

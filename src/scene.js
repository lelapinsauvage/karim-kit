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
import { panel, applySun, SUN_BLANK, SUN_NEUTRAL, SUN_OFF, SUN_COLOUR, SUN_GROUPS } from './panel.js';
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
  // blank by default: white, empty. sun() brings the body up when asked.
  const state = { ...SUN_BLANK, ...(opts.state || {}) };
  for (const [k, v] of Object.entries(SUN_OFF)) view.set(k, v);

  const slots = new Array(8).fill(null);
  let lastURL = null;

  // --- the set -------------------------------------------------------------
  // { url, tex, roles, place }
  //
  // place is PER MODEL. Figures come back from generation at different scales
  // and sitting at different heights in their own frame, so one shared set of
  // placement values means fixing model three breaks model one -- and the way
  // that shows up is you tune a figure, move to the next, come back, and the
  // first one has moved.
  const PLACE = ['figScale', 'figX', 'figY', 'figRot'];
  const models = [];
  let ix = 0, tween = null, loaderStep = null;

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
  const easeOut = (t) => 1 - Math.pow(1 - t, 4);

  // The reaction curve. Peaks EARLY and decays with a vanishing derivative:
  // 0.05 at 90% of the move, 0.001 at 99%, exactly 0 at the end. A symmetric
  // sin(pi*t) is still at 0.44 at 90% and then drops to zero, and that last
  // fall is a cliff -- it is what reads as the ground snapping from deep to
  // pale at the moment you are watching it land. Grow fast, return slowly.
  const DIP_PK = Math.pow(0.35 / 2.05, 0.35) * Math.pow(1 - 0.35 / 2.05, 1.7);
  const DIP = (t) => Math.pow(t, 0.35) * Math.pow(1 - t, 1.7) / DIP_PK;

  const api = {
    view,
    state,

    /**
     * set one or many values: set('r', 0.4) or set({ r: 0.4, glow: 1 })
     *
     * figY and figScale are aliases. The uniforms are figBleed -- which sinks
     * her, so up is a NEGATIVE bleed -- and figH. Both are correct and neither
     * survives being said out loud at speed.
     */
    set(k, v) {
      if (typeof k === 'object') Object.assign(state, k);
      else state[k] = v;
      if (state.figY !== undefined)     { state.figBleed = -state.figY; delete state.figY; }
      if (state.figScale !== undefined) { state.figH = state.figScale; delete state.figScale; }
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
     * load(assets, opts) -- the opening. Two bodies cross into eclipse, join,
     * ignite, and hand the frame over to the scene. Resolves when the reveal is
     * finished.
     *
     * Progress is REAL: it is the slower of "every asset has decoded" and a
     * minimum duration. A loader on a timer alone is a lie and always looks
     * like one -- it completes while the page is still blank. A loader on
     * decode alone flashes past on a warm cache.
     *
     * opts.onProgress(p) fires every frame with 0..1, for a counter in the
     * corner.
     */
    load(assets = [], { min = 1500, reveal = 3200, onProgress } = {}) {
      let decoded = 0;
      const total = Math.max(assets.length, 1);
      for (const url of assets) {
        const im = new Image();
        im.onload = im.onerror = () => { decoded++; };
        im.src = url;
      }

      const t0 = performance.now();
      let revealT = -1;
      const seed = state.r ?? 0.30;
      view.set('uLoadCover', 1);
      view.set('uClothFront', -1);
      view.set('uFigFade', 0);
      view.set('uEclR', seed);

      return new Promise((done) => {
        loaderStep = (now) => {
          if (revealT < 0) {
            const p = Math.min(decoded / total, (now - t0) / min);
            onProgress?.(Math.max(0, Math.min(p, 1)));

            // accelerating all the way in. any easing that flattens near the
            // end puts a plateau right before contact, and a pause before an
            // impact reads as a stall rather than as anticipation.
            const close = Math.pow(Math.max(p, 0), 5);
            view.set('uEclA', [-0.42 * (1 - close), 0]);
            view.set('uEclB', [ 0.42 * (1 - close), 0]);
            view.set('uEclR', seed);

            // it ignites BEFORE they touch. light arriving after contact is
            // light reporting the event; arriving just before, it causes it.
            const heat = smooth(0.88, 1.0, p);
            view.set('uEclWhite', heat);
            view.set('uEclFill',  smooth(0.94, 1.0, p));
            view.set('uEclSeam',  Math.exp(-Math.pow((p - 0.985) / 0.014, 2)));

            // NO BEAT. A hold here is the single thing that made this feel
            // like a loading screen rather than an opening shot.
            if (p >= 1) revealT = now;
            return;
          }

          const rt = Math.min((now - revealT) / reveal, 1);
          const seg = (a, b) => Math.max(0, Math.min((rt - a) / (b - a), 1));
          const expo = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -9 * x));

          // Each element on its OWN curve at its own offset. One curve across
          // everything is a single gesture repeated; different curves at
          // different offsets is choreography.
          view.set('uLoadCover', 1 - expo(seg(0.00, 0.26)));
          view.set('uFigFade',       expo(seg(0.10, 0.72)));

          if (rt >= 1) { loaderStep = null; done(api); }
        };
      });
    },

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
     * Eight figures. Past that the shader wants a sampler2DArray.
     */
    async models(urls, { palette = false, duration = 1450, mode = 0, keys = true } = {}) {
      if (urls.length > 8) throw new Error(`scene.models: ${urls.length} given, 8 samplers exist`);
      models.length = 0;
      urls.forEach((url, i) => {
        const tex = view.texture(url, i);
        view.bind({ ['uFigTex' + i]: tex });
        models.push({ url, tex, roles: null, place: readPlace() });
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
      api.set({ ...models[0].place });
      if (!live.figure) { live.figure = true; buildPanel(); }

      if (keys) addEventListener('keydown', (e) => {
        const d = /Right|Down/.test(e.key) ? 1 : /Left|Up/.test(e.key) ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        api.go(d);
      });
      return api;
    },

    /**
     * Placement for one model, or read it back.
     *
     *   s.place(2)                    -> { figScale, figX, figY, figRot }
     *   s.place(2, { figY: -0.04 })   -> set it
     *   s.places()                    -> every model's, copied as a runnable line
     *   s.current()                   -> which one is in frame and what it is set to
     */
    place(i, vals) {
      if (!models[i]) return null;
      if (!vals) return { ...models[i].place };
      Object.assign(models[i].place, vals);
      if (i === ix) api.set({ ...models[i].place });
      return api;
    },

    places() {
      const o = {};
      models.forEach((m, i) => { o[i] = { ...m.place }; });
      const txt = `s.setPlaces(${JSON.stringify(o, null, 2)})`;
      navigator.clipboard?.writeText(txt);
      console.log(txt);
      return o;
    },

    setPlaces(o) {
      for (const [i, v] of Object.entries(o)) api.place(+i, v);
      return api;
    },

    current() {
      const m = models[ix];
      return m ? { index: ix, url: m.url, place: { ...m.place }, roles: m.roles } : null;
    },

    /** step through the set. Input during a move is ignored, not queued. */
    go(dir = 1, duration = 1450) {
      if (tween || !models.length || !dir) return api;
      const from = ix;
      // whatever I have just been dragging belongs to the model I was looking
      // at, not to the next one
      models[from].place = readPlace();
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

  // state carries the CURRENT model's placement; each model keeps its own copy
  const readPlace = () => ({
    figScale: state.figH ?? 1, figX: state.figX ?? 0,
    figY: -(state.figBleed ?? 0), figRot: state.figRot ?? 0,
  });

  const smooth = (a, b, x) => {
    const t = Math.max(0, Math.min((x - a) / (b - a), 1));
    return t * t * (3 - 2 * t);
  };

  function loop(t) {
    loaderStep?.(t);
    let fig = slots[0], figB = slots[1];

    if (models.length) {
      let m = 1, A = ix, B = ix;
      if (tween) {
        if (tween.t0 === null) tween.t0 = t;
        const raw = Math.min((t - tween.t0) / tween.duration, 1);
        m = easeOut(raw);
        tween.raw = raw; tween.m = m;
        A = tween.from; B = tween.to;
        if (tween.a && tween.b)
          api.set({ pigment:  mixHex(tween.a.pigment,  tween.b.pigment,  m),
                    bg:       mixHex(tween.a.bg,       tween.b.bg,       m),
                    clothInk: mixHex(tween.a.clothInk, tween.b.clothInk, m) });
        if (raw >= 1) { tween = null; api.set({ ...models[ix].place }); }
      }
      fig = models[A].tex; figB = models[B].tex;
      view.set('uFigA', A);
      view.set('uFigB', B);
      view.set('uFigMix', m);
    }

    applySun(view, state, { fig, figB, time: t });

    // The light REACTS to the change instead of the palette sliding under it.
    // Applied over applySun rather than into state, so the panel does not
    // twitch through the move and the values it shows stay the ones I set.
    if (tween && tween.raw !== undefined) {
      const k = DIP(tween.raw);
      view.set('uR',       (state.r ?? 0.3)      * (1 + 0.20 * k));
      view.set('uRimStr',  (state.rimStr ?? 0.5) * (1 + 1.40 * k));
      view.set('uBgFloor', (state.bgFloor ?? 1)  * (1 - 0.62 * k));
      view.set('uGlow',    (state.glow ?? 0.5)   * (1 + 0.55 * k));

      // A ring leaves the body and crosses the cloth. It is a POSITION, not an
      // amount, so the wave travels rather than the whole field pulsing at
      // once -- and it is the transition's clock, so it sweeps the full frame
      // within the move rather than peaking halfway.
      view.set('uWave',    tween.m);
      view.set('uWaveAmt', k);
    } else {
      view.set('uWave', 0);
      view.set('uWaveAmt', 0);
    }

    view.draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  return api;
}

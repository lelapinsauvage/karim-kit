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

import { quad, hexToRgb } from './gl.js';
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
  // Set by models(), not by scene(): a switch is a property of the SET, and
  // reading it here meant every onSwitch passed to models() was silently
  // dropped -- the rail never scrambled and nothing reported a problem.
  let onSwitch = opts.onSwitch ?? null;
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
  let moveIntensity = 1;
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
      view.set('uFigMix', 0); view.set('uFigMode', 0);
      if (!loaderStep) view.set('uFigFade', 1);
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
     * load(assets, opts) -- the opening, ported from the finished piece.
     *
     * Two small BLACK bodies drift in, accelerate, merge, ignite, and open into
     * the scene. Every number here was arrived at by watching it fail.
     *
     * Nothing decelerates. Three separate mechanisms once did, and they
     * compounded into a pause before contact: a damped follower whose last two
     * percent took 835ms, an ease-in-out whose slope at the end is zero, and a
     * held gap in the approach. All shaping lives in ONE curve now, and that
     * curve accelerates.
     *
     * opts.look  the state to reveal INTO -- its r, bg and figTint. Without it
     *            the frame opens onto whatever was already set, which is the
     *            loader finishing onto a scene rather than becoming one.
     */
    load(assets = [], { min = 1500, reveal = 3200, onProgress, look = null } = {}) {
      let decoded = 0;
      const total = Math.max(assets.length, 1);
      for (const url of assets) {
        const im = new Image();
        im.onload = im.onerror = () => { decoded++; };
        im.src = url;
      }

      const PAPER = '#F5F5F5';
      const SEED  = 0.085;          // the bodies stay SMALL through the load
      const START = 0.46;
      const target = { r: 0.35, bg: '#E2DBD1', figTint: 0, ...(look || {}) };

      const t0 = performance.now();
      let p = 0, revealT = -1, announced = false;

      view.set('uPaper', hexToRgb(PAPER));
      view.set('uLoadCover', 1);
      view.set('uClothFront', -1);
      view.set('uFigFade', 0);

      return new Promise((done) => {
        loaderStep = (now) => {
          // Progress is real, and the follower only exists while assets are
          // still arriving. Once they are in, the clock is already smooth, so
          // the count runs at constant speed with no lag at all.
          const real  = assets.length ? decoded / total : 1;
          const clock = Math.min((now - t0) / min, 1);
          if (real >= clock) p = clock;
          else p = Math.min(clock, p + (real - p) * 0.12);
          if (p > 0.999) p = 1;
          onProgress?.(p);

          if (revealT < 0) {
            // p^5: they drift at the start and are moving five times average
            // speed at contact. No hold, no ease-out -- the gap shrinks faster
            // on every frame right up to the collision, so the merged black
            // shape is on screen about 60ms and never settles.
            const close = p ** 5;
            const seam  = Math.exp(-(((p - 0.985) / 0.018) ** 2));
            // Ignition starts BEFORE contact, driven by how close they are
            // rather than by a timer that begins after. Two masses closing
            // compress and heat, so by the time they touch they are already
            // becoming the sun and there is nothing to wait for at impact.
            const heat  = smooth(0.90, 1.00, p);

            view.set('uEclA', [-START * (1 - close), 0.02]);
            view.set('uEclB', [ START * (1 - close), 0.02]);
            view.set('uEclR', SEED);
            view.set('uEclSeam', seam * 0.85);
            view.set('uLoad', p);
            view.set('uEclWhite', heat ** 1.6);
            view.set('uEclFill',  heat ** 4);
            view.set('uLoadCover', 1);
            view.set('uWave', 0); view.set('uWaveAmt', 0);

            // the scene's own sun matches the seed exactly, so the handover has
            // nothing to reveal
            state.bg = PAPER; state.figTint = 0; state.r = SEED;

            // NO BEAT. Contact is the trigger and the reveal starts on the same
            // frame. A pause here shows the one thing the eye must never settle
            // on: a lit sun on white paper with the counter reading 100.
            if (p >= 1) revealT = now;
            return;
          }

          const rt  = Math.min((now - revealT) / reveal, 1);
          const seg = (a2, b2) => Math.max(0, Math.min((rt - a2) / (b2 - a2), 1));
          const expoOut  = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -9 * x));
          const quartOut = (x) => 1 - Math.pow(1 - x, 4);
          const sineOut  = (x) => Math.sin((x * Math.PI) / 2);

          // Pinned, not re-eased. These reach 1 at contact, and re-easing from
          // a lower value steps BACKWARDS at the exact moment of impact, which
          // reads as a stall.
          view.set('uEclWhite', 1);
          view.set('uEclFill', 1);

          // the sun opens on expo -- released, not driven. Everything expands
          // out of the circle, so the circle is the thing that expands.
          const e = expoOut(seg(0.00, 0.26));
          state.r = SEED + (target.r - SEED) * e;
          view.set('uEclR', state.r);

          // The front leaves AT ONCE and then takes its time. An ease-in here
          // spends its first third barely moving, so the front has not left the
          // body while the sun is already open -- and that gap is an orange
          // disc sitting on white paper.
          const wv = quartOut(seg(0.00, 0.70));
          view.set('uClothFront', rt >= 1 ? 99.0 : SEED + wv * 2.9);
          view.set('uWave', wv);
          view.set('uWaveAmt', Math.pow(Math.sin(Math.PI * wv), 0.55));

          // She is the slowest thing on screen and the last to finish. A 240ms
          // beat before she starts, then a long tail: everything else is
          // already moving, so she arrives INTO a scene rather than alongside
          // its parts. Everything else can be seen arriving; she should only be
          // seen to have arrived.
          view.set('uFigFade', expoOut(seg(0.115, 0.78)));

          // ~55ms. The loader's job ended on contact and every extra frame is
          // white paper still under a sun that has already ignited.
          view.set('uLoadCover', 1 - smooth(0.0, 0.017, rt));

          // the ground travels WITH the sun. Anything easing in here leaves the
          // frame white underneath an already-open sun.
          state.bg = mixHex(PAPER, target.bg, expoOut(seg(0.00, 0.30)));
          state.figTint = (target.figTint ?? 0) * sineOut(seg(0.135, 0.80));

          if (!announced) { announced = true; opts.onReveal?.(); }
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
    async models(urls, { palette = false, duration = 1450, mode = 0, keys = true,
                         looks = null, intensity = 1, onSwitch: onSw = null } = {}) {
      if (urls.length > 8) throw new Error(`scene.models: ${urls.length} given, 8 samplers exist`);
      models.length = 0;
      moveIntensity = intensity;
      if (onSw) onSwitch = onSw;
      urls.forEach((url, i) => {
        const tex = view.texture(url, i);
        view.bind({ ['uFigTex' + i]: tex });
        // `looks` is colour set by hand, per figure. It goes in the same slot
        // the extracted palette uses, so everything downstream -- the HSV
        // hand-off through a move, most of all -- works the same whether the
        // colour was measured off the photograph or chosen.
        models.push({ url, tex, roles: looks?.[i] ?? null, place: readPlace() });
      });
      await Promise.all(models.map((m) =>
        m.tex.ready ? null : new Promise((r) => { m.tex.onready = r; })));

      if (palette)
        for (const m of models) m.roles = (await paletteFrom(m.url)).roles;

      state.figShow = true;
      state.figMode = mode;
      view.set('uFigMode', mode);
      // Do NOT force her visible if an opening is running. The loader owns
      // uFigFade -- she is the last thing to arrive and she arrives on its
      // clock. Setting it here made her fade up behind the eclipse, which is
      // the scene assembling itself in front of the thing built to hide it.
      if (!loaderStep) view.set('uFigFade', 1);
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
      // fired at the START of the move, so anything hung off it -- a rail, a
      // counter, a tear on the type -- lands with the move rather than after it
      onSwitch?.({ from, to: (from + dir + models.length) % models.length });
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
      // Direction matters and it flips.
      //
      // At rest the PANEL owns placement: whatever I just dragged is the truth,
      // and it is recorded against the figure on screen. Pushing the stored
      // place into state here instead would overwrite every drag on the next
      // frame, so the sliders look dead and the position only ever changes when
      // a move ends.
      //
      // During a move the RECORD owns it, both sides independently, so two
      // differently-framed figures do not shove each other through the wrong
      // position on the way past.
      if (!tween) {
        models[ix].place = readPlace();
        const p0 = models[ix].place;
        state.figHB = p0.figScale; state.figXB = p0.figX;
        state.figBleedB = -p0.figY; state.figRotB = p0.figRot;
      } else {
        const pa = models[A].place, pb = models[B].place;
        state.figH  = pa.figScale; state.figX  = pa.figX;
        state.figBleed = -pa.figY; state.figRot = pa.figRot;
        state.figHB = pb.figScale; state.figXB = pb.figX;
        state.figBleedB = -pb.figY; state.figRotB = pb.figRot;
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
      const k = DIP(tween.raw) * moveIntensity;
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

      // uTear scales the displacement band that pushes her out of shape and the
      // channel separation trailing it. It rides the same envelope as
      // everything else, so the whole move is one gesture rather than several
      // arriving on their own clocks. Grain is deliberately NOT on this list --
      // grain on a moving edge is noise laid over the thing you are watching.
      view.set('uTear', (state.tear ?? 1) * (1 + 3.4 * k));   // applySun set the base; this rides it
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

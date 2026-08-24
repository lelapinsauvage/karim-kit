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
import { panel, applySun, SUN_NEUTRAL, SUN_OFF, SUN_COLOUR } from './panel.js';
import { paletteFrom, swatchStrip } from './palette.js';
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
      return api.set('cloth', +v);
    },

    /** the figure's own reveal, 0..1 -- drive it from a transition */
    fade(v = 1) { view.set('uFigFade', v); return api; },
  };

  if (opts.panel !== false) {
    api.panel = panel({
      state,
      colors: Object.keys(SUN_COLOUR),
      open: opts.open ?? false,
      note: opts.note ?? '',
    });
  }

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
    applySun(view, state, { fig: slots[0], figB: slots[1], time: t });
    view.draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  return api;
}

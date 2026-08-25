// Text that resolves rather than swapping.
//
// Each letter holds a run of random glyphs and then locks, staggered left to
// right, so the word arrives in order like something being decoded. Letters
// must lock at DIFFERENT times: lock them together and the whole thing reads as
// one flicker, which is a completely different and much cheaper effect.

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\\|<>#*+=';

/**
 * scramble(el, text, opts) -> Promise
 *
 *   scramble(document.querySelector('.mark'), 'MAISON NOIR')
 *
 * opts.duration  total, ms (default 1450 — the same clock as a figure switch,
 *                so the word and the picture land together)
 * opts.stagger   how much of the run is spent starting letters (0..1, default
 *                0.45). Higher reads as a wave, lower as a single event.
 * opts.glyphs    the alphabet to churn through
 * opts.hold      keep spaces as spaces (default true) — scrambling the gaps
 *                turns a two-word name into one long smear
 */
export function scramble(el, text, opts = {}) {
  const { duration = 1450, stagger = 0.45, glyphs = GLYPHS, hold = true } = opts;
  if (!el) return Promise.resolve();

  const from = el.textContent ?? '';
  const n = Math.max(text.length, from.length);
  const t0 = performance.now();

  // one run per element, or two calls fight over the same textContent and the
  // word tears between two alphabets
  el.__scrambleId = (el.__scrambleId ?? 0) + 1;
  const id = el.__scrambleId;

  return new Promise((done) => {
    (function step(now) {
      if (el.__scrambleId !== id) return done();
      const raw = Math.min((now - t0) / duration, 1);
      let out = '';
      for (let i = 0; i < n; i++) {
        const ch = text[i] ?? '';
        if (hold && ch === ' ') { out += ' '; continue; }
        const start = (i / n) * stagger;
        const p = (raw - start) / (1 - stagger);
        if (p >= 1) out += ch;
        else if (p <= 0) out += from[i] ?? glyphs[(i * 7) % glyphs.length];
        else out += glyphs[(Math.floor(now / 45) + i * 13) % glyphs.length];
      }
      el.textContent = out;
      if (raw >= 1) { el.textContent = text; return done(); }
      requestAnimationFrame(step);
    })(t0);
  });
}

/**
 * scrambleAll({ 'r-pig': 'Indigo, third dip', ... })
 *
 * Ids to text, all on one clock. This is what a rail of specs wants: the whole
 * record turning over at once rather than four fields racing.
 */
export function scrambleAll(map, opts = {}) {
  return Promise.all(Object.entries(map).map(([id, text]) => {
    const el = typeof id === 'string' ? document.getElementById(id) : id;
    return scramble(el, String(text ?? ''), opts);
  }));
}

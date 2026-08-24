// Control panel, generated from a uniform table rather than written in HTML.
// Add a key to the table and the control appears; rename a uniform and nothing
// drifts, because there is only one list. A hand-written panel goes stale the
// first time a uniform is renamed, silently.
//
// Generic on purpose: it knows about ranges and groups, never about a pigment,
// a look or a brief. Those are passed in.

// Ranges for sun.frag. These describe the SHADER, not any piece made with it,
// so they live in the kit.
// state key -> uniform name. Every consumer was retyping this because it lived
// inside a page rather than beside the ranges it belongs with. `r` is `uR`,
// `rimW` is `uRimW`, and guessing the convention wrong fails silently: setting
// an unknown uniform is a no-op, so the control simply does nothing.
export const SUN_UNIFORM = { r:'uR', edge:'uEdge', coreSize:'uCoreSize', rimBand:'uRimBand', drift:'uDrift',
  glow:'uGlow', glowSize:'uGlowSize', glowMode:'uGlowMode',
  rimW:'uRimW', rimStr:'uRimStr', rimIn:'uRimIn', grain:'uGrain', grainSize:'uGrainSize',
  grainMask:'uGrainMask', spread:'uSpread', bgFall:'uBgFall', bgFloor:'uBgFloor', warmth:'uWarmth', purity:'uPurity',
  wobble:'uWobble', cloth:'uCloth', clothScale:'uClothScale',
  clothShape:'uClothShape', clothMorph:'uClothMorph', clothWeight:'uClothWeight', clothWave:'uClothWave', clothSpeed:'uClothSpeed',
  light:'uLight', rake:'uRake', sheen:'uSheen', cord:'uCord',
  figDark:'uFigDark', figTint:'uFigTint', figLift:'uFigLift',
  charge:'uCharge', chargeSpd:'uChargeSpd', chargeLen:'uChargeLen' };

export const SUN_RANGE = {
  r:[0.05,0.9,0.005], edge:[0.001,0.8,0.001], coreSize:[0.2,3,0.01],
  rimBand:[0,1,0.01], drift:[0,4,0.01], glow:[0,2,0.01], glowSize:[0.02,1.2,0.005],
  grain:[0,0.6,0.005], grainSize:[0.2,3,0.01], grainMask:[0,1,0.01],
  glowMode:[0,1,0.01], rimW:[0.002,0.2,0.002], rimStr:[0,3,0.01], rimIn:[0.005,0.4,0.005],
  spread:[0,2,0.01], bgFall:[0.05,1.2,0.01], bgFloor:[0,1,0.01],
  warmth:[0,1,0.01], purity:[0,1,0.01], wobble:[0,2,0.01],
  cloth:[0,1,0.005], clothScale:[4,60,0.5], clothShape:[0,2.999,0.001],
  clothMorph:[0,3,0.01], clothWeight:[0.02,0.3,0.005], clothWave:[0,20,0.05],
  clothSpeed:[0,5,0.01], light:[0,4,0.01], rake:[0,1,0.01], sheen:[0,3,0.01],
  cord:[0,4,0.01], figDark:[0,1,0.01], figTint:[0,1,0.01], figLift:[0,3,0.01],
  charge:[0,2,0.01], chargeSpd:[0,3,0.01], chargeLen:[1,30,0.1],
  tear:[0,3,0.01], thread:[0.2,3,0.01], figMode:[0,3,1],
  figH:[0.4,2.5,0.005], figX:[-0.8,0.8,0.005], figY:[-1.4,0.6,0.005], figBleed:[-0.4,0.6,0.005],
  coreX:[-1,1,0.005], coreY:[-1,1,0.005], typeInk:[0,1,0.01],
};

// The scene's own anatomy, in the order you actually dial it: shape, then
// light, then ground, then cloth, then the figure, then finish.
export const SUN_GROUPS = [
  ['body',    ['r','edge','coreX','coreY','coreSize','rimBand','drift','wobble']],
  ['light',   ['glow','glowSize','glowMode','rimW','rimStr','rimIn','spread','warmth','purity']],
  ['ground',  ['bgFall','bgFloor']],
  ['cloth',   ['cloth','clothScale','clothShape','clothMorph','clothWave','clothSpeed','clothWeight','charge','chargeSpd','chargeLen']],
  ['surface', ['light','rake','sheen','cord']],
  ['figure',  ['figH','figX','figBleed','figDark','figTint','figLift']],
  ['grain',   ['grain','grainSize','grainMask']],
  ['type',    ['typeInk']],
];

/**
 * panel({ state, groups, ranges, colors, onChange })
 *
 * `state` is mutated in place and handed back to `onChange` on every input, so
 * the caller keeps ONE object as the source of truth and never has to mirror
 * values between the panel and the scene.
 *
 * Returns { el, sync, toggle }. Call sync() after changing `state` from outside
 * (a preset switch, a keyboard shortcut) so the controls follow.
 */
export function panel({
  state,
  groups = SUN_GROUPS,
  ranges = SUN_RANGE,
  colors = [],
  onChange = () => {},
  accent = '#ff3b1e',
  hotkey = 'h',
  open = false,
  note = '',
} = {}) {
  const keys = groups.flatMap(([, k]) => k);

  const el = document.createElement('aside');
  el.style.cssText = `position:fixed;top:0;right:0;bottom:0;z-index:40;width:236px;
    padding:14px;overflow:auto;background:#0a0708ee;backdrop-filter:blur(10px);
    border-left:1px solid #ffffff1c;font:10px ui-monospace,monospace;color:#eee;
    letter-spacing:.08em`;

  const row = (k) => {
    const [lo, hi, st] = ranges[k] ?? [0, 1, 0.01];
    return `<label style="display:grid;gap:3px;margin-bottom:7px">
      <span style="display:flex;justify-content:space-between;text-transform:uppercase;opacity:.5">
        ${k}<b id="v-${k}" style="font-weight:400;opacity:.8"></b></span>
      <input id="p-${k}" type="range" min="${lo}" max="${hi}" step="${st}"
        style="width:100%;accent-color:${accent};height:12px"></label>`;
  };
  const head = (t) => `<div style="opacity:.35;text-transform:uppercase;
    letter-spacing:.2em;margin:12px 0 6px">${t}</div>`;

  el.innerHTML =
    groups.map(([t, ks]) => head(t) + ks.map(row).join('')).join('') +
    (colors.length ? head('colour') : '') +
    // the swatch is for FINDING a colour, the hex field is for PASTING one.
    // both are needed; neither replaces the other.
    colors.map((k) => `<div style="display:grid;
      grid-template-columns:52px 26px 1fr;gap:6px;align-items:center;margin-bottom:6px">
      <span style="opacity:.5;text-transform:uppercase">${k}</span>
      <input id="s-${k}" type="color" style="width:100%;height:20px;padding:0;
        border:1px solid #ffffff1f;background:none;cursor:pointer">
      <input id="c-${k}" type="text" spellcheck="false" style="background:#ffffff10;
        border:1px solid #ffffff1f;color:#eee;font:10px ui-monospace,monospace;
        padding:3px 5px;width:100%;min-width:0"></div>`).join('') +
    `<button id="p-copy" style="width:100%;margin-top:10px;background:#ffffff12;
      border:1px solid #ffffff26;color:#eee;font:10px ui-monospace,monospace;
      letter-spacing:.14em;text-transform:uppercase;padding:7px;cursor:pointer">
      copy values</button>
     <div style="opacity:.3;margin-top:8px;line-height:1.6">${hotkey.toUpperCase()} hide${note ? ' · ' + note : ''}</div>`;

  // hidden by default -- the panel is a tool, and the piece has to be judged
  // without it in frame.
  el.style.display = open ? 'block' : 'none';
  document.body.appendChild(el);

  const $ = (id) => el.querySelector('#' + CSS.escape(id));

  const sync = () => {
    for (const k of keys) {
      const i = $('p-' + k); if (!i) continue;
      i.value = state[k] ?? 0;
      $('v-' + k).textContent = (+(state[k] ?? 0)).toFixed(3);
    }
    for (const k of colors) {
      const hex = $('c-' + k), sw = $('s-' + k);
      if (!hex) continue;
      hex.value = state[k] ?? '';
      sw.value  = state[k] ?? '#000000';
    }
  };

  for (const k of keys) {
    const i = $('p-' + k); if (!i) continue;
    i.addEventListener('input', (e) => {
      state[k] = parseFloat(e.target.value);
      $('v-' + k).textContent = state[k].toFixed(3);
      onChange(state, k);
    });
  }
  for (const k of colors) {
    const hex = $('c-' + k), sw = $('s-' + k);
    if (!hex) continue;
    sw.addEventListener('input', () => {
      state[k] = sw.value; hex.value = sw.value; onChange(state, k);
    });
    hex.addEventListener('input', () => {
      let v = hex.value.trim(); if (v[0] !== '#') v = '#' + v;
      if (/^#[0-9a-fA-F]{6}$/.test(v)) { state[k] = v; sw.value = v; onChange(state, k); }
    });
  }

  $('p-copy').onclick = () => {
    const o = {};
    for (const k of [...keys, ...colors]) if (state[k] !== undefined) o[k] = state[k];
    const txt = JSON.stringify(o, null, 2);
    navigator.clipboard?.writeText(txt);
    console.log(txt);
    $('p-copy').textContent = 'copied';
    setTimeout(() => { $('p-copy').textContent = 'copy values'; }, 1100);
  };

  const toggle = () => { el.style.display = el.style.display === 'none' ? 'block' : 'none'; };
  addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;          // typing a hex is not a hotkey
    if (e.key.toLowerCase() === hotkey) toggle();
  });

  queueMicrotask(sync);
  return { el, sync, toggle };
}

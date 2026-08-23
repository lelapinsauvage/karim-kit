import { quad, hexToRgb } from './gl.js';
import frag from './shaders/sun.frag?raw';

const view = quad(document.getElementById('c'), frag);
const gl0 = view.gl;
const $ = (id) => document.getElementById(id);
// hero.html renders the same scene with no control panel, so every lookup has
// to tolerate a missing element and fall back to the preset value
const HAS_PANEL = !!document.getElementById('r');

// Two locked looks. Switch with the buttons or 1 / 2 -- so a direction can be
// compared instantly instead of re-dialled, which is the only way to judge two
// options fairly.
// Ten looks. Each is a figure and the pigment taken from what that figure is
// actually wearing -- the beaded cap, the jersey, the barkcloth, the brass. The
// ground is a neutral tuned a few points toward the pigment.
//
// The treatment is shared: light ground, glow TINTING rather than adding (you
// cannot brighten paper), the rim doing the emitting, and the figure left almost
// undarkened so she stays a photograph rather than a silhouette.
const BASE = {
  r:0.350, edge:0.146, coreSize:0.99, rimBand:0.75, drift:1.18,
  glow:0.22, glowSize:0.34, glowMode:1, rimW:0.045, rimStr:0.9, rimIn:0.06,
  grain:0.15, grainSize:1.45, grainMask:0.75, spread:0.30,
  bgFall:0.62, bgFloor:0.88, warmth:0.40, purity:0.62, wobble:1.42,
  cloth:0.32, clothScale:33, clothShape:2.729, clothMorph:2, clothWeight:0.095,
  clothWave:7.5, clothSpeed:1.9, charge:0.18, chargeSpd:0.55, chargeLen:9,
  light:0.85, rake:0.82, sheen:0.4, cord:1.3,
  tear:1.0, thread:0.7, figH:1.05, figX:0.055, figBleed:0.06, figDark:0.07, figTint:0.18, figLift:0,
  coreX:0.19, coreY:-0.110, typeInk:0.07,
};

// Four looks. Chosen for spread rather than preference: four pigments that sit
// far apart on the wheel, and four different relationships to the lens -- chin
// lifted, hand at the jaw, strict profile, looking off frame. Ten was a library;
// four is an edit.
//
// To swap one out, change `fig` to any other generated figure. Everything else
// -- pigment, ground, provenance -- travels with the entry.
const LOOKS = [
  { id:'l1', name:'Cowrie',  fig:'n01',
    pigment:'#1F3A93', bg:'#D6D8DC', clothInk:'#6E7A94', purity:0.70,
    figH:1.05, figX:0.055, figBleed:0.06,
    pig:'Indigo · cassava resist', origin:'Abeokuta, Nigeria',
    material:'Cowrie, seed bead' },

  { id:'l2', name:'Brass',   fig:'n03',
    pigment:'#A07414', bg:'#E0DCD2', clothInk:'#8C7A52',
    glow:0.30, rimStr:1.25, warmth:0.62,
    figH:1.05, figX:0.055, figBleed:0.06,
    pig:'Cast brass · lost wax', origin:'Kumasi, Ghana',
    material:'Gold chain, brass' },

  { id:'l3', name:'Otjize',  fig:'n04',
    pigment:'#B8321B', bg:'#DEDAD6', clothInk:'#9A6B5E', warmth:0.55,
    figH:1.05, figX:0.055, figBleed:0.06,
    pig:'Red ochre · butterfat', origin:'Kunene, Namibia',
    material:'Seed bead, cowrie' },

  { id:'l4', name:'Raffia',  fig:'n10',
    pigment:'#5E6B2F', bg:'#DEDCD0', clothInk:'#7E8560', warmth:0.45,
    figH:1.05, figX:0.055, figBleed:0.06,
    pig:'Raffia palm · undyed', origin:'Kasai, DR Congo',
    material:'Open-weave raffia' },
];

const PRESETS = Object.fromEntries(LOOKS.map((l) => [l.id, { ...BASE, ...l }]));

const NUM = { r:'uR', edge:'uEdge', coreSize:'uCoreSize', rimBand:'uRimBand', drift:'uDrift',
  glow:'uGlow', glowSize:'uGlowSize', glowMode:'uGlowMode',
  rimW:'uRimW', rimStr:'uRimStr', rimIn:'uRimIn', grain:'uGrain', grainSize:'uGrainSize',
  grainMask:'uGrainMask', spread:'uSpread', bgFall:'uBgFall', bgFloor:'uBgFloor', warmth:'uWarmth', purity:'uPurity',
  wobble:'uWobble', cloth:'uCloth', clothScale:'uClothScale',
  clothShape:'uClothShape', clothMorph:'uClothMorph', clothWeight:'uClothWeight', clothWave:'uClothWave', clothSpeed:'uClothSpeed',
  light:'uLight', rake:'uRake', sheen:'uSheen', cord:'uCord',
  figDark:'uFigDark', figTint:'uFigTint', figLift:'uFigLift',
  charge:'uCharge', chargeSpd:'uChargeSpd', chargeLen:'uChargeLen' };
// one texture unit per figure. unit 3 is the wordmark, so figures start at 4.
const FIGTEX = Object.fromEntries(
  LOOKS.map((l, i) => [l.id, view.texture(`/src/figures/${l.fig}.png`, 4 + i)]));
let figTex = FIGTEX[LOOKS[0].id];

// --- wordmark ---------------------------------------------------------------
// Rasterised by the browser onto a 2D canvas, then handed to the shader as a
// texture so it can be drawn BEFORE the figure and therefore be occluded by her.
const typeCv = document.createElement('canvas');
const typeCtx = typeCv.getContext('2d');
let typeTex = null;

export function setWordmark(text, opts = {}) {
  const dpr = Math.min(devicePixelRatio, 2);
  const w = Math.round(innerWidth * dpr), h = Math.round(innerHeight * dpr);
  if (typeCv.width !== w || typeCv.height !== h) { typeCv.width = w; typeCv.height = h; }
  typeCtx.setTransform(1, 0, 0, 1, 0, 0);
  typeCtx.clearRect(0, 0, w, h);

  const size = (opts.size ?? 0.15) * w;          // fraction of viewport width
  typeCtx.font = `${size}px Bayard, Impact, sans-serif`;
  typeCtx.textAlign = opts.align ?? 'center';
  typeCtx.textBaseline = 'middle';
  typeCtx.fillStyle = '#fff';                     // alpha is what matters
  typeCtx.letterSpacing = opts.tracking ?? '-0.02em';
  typeCtx.fillText(text, (opts.x ?? 0.5) * w, (opts.y ?? 0.5) * h);

  if (!typeTex) typeTex = view.canvasTexture(typeCv, 3);
  else typeTex.upload();
}

// The wordmark resolves rather than swapping. Each letter holds a run of random
// glyphs, then locks -- staggered left to right, so the word arrives in order
// like something being decoded. Letters lock at different times or it reads as
// a single flicker.
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\\|<>#*+=';
let wm = { from: '', to: '', t0: -1, dur: 820, opts: {} };

export function scrambleTo(text, opts) {
  wm = { from: wm.to || text, to: text, t0: performance.now(), dur: DUR,
         opts: opts ?? wm.opts };
}

function stepWordmark(now) {
  if (wm.t0 < 0) return;
  const raw = Math.min((now - wm.t0) / wm.dur, 1);
  const n = Math.max(wm.to.length, wm.from.length);
  let out = '';
  for (let i = 0; i < n; i++) {
    // each letter gets its own window: starts later, finishes later
    const start = (i / n) * 0.45;
    const p = (raw - start) / 0.55;
    if (p >= 1) out += wm.to[i] ?? '';
    else if (p <= 0) out += wm.from[i] ?? GLYPHS[(i * 7) % GLYPHS.length];
    else out += GLYPHS[(Math.floor(now / 45) + i * 13) % GLYPHS.length];
  }
  setWordmark(out, wm.opts);
  if (raw >= 1) { wm.t0 = -1; setWordmark(wm.to, wm.opts); }
}

document.fonts?.ready.then(() => {
  if (!window.__wordmark) return;
  wm.opts = window.__wordmark[1];
  // start on the look that is actually showing -- hero.html's literal is only a
  // placeholder for the font-loading window
  const first = PRESETS[ORDER[lookIx]]?.name?.toUpperCase() ?? window.__wordmark[0];
  wm.to = first;
  setWordmark(first, wm.opts);
});

// Declared here because the panel below builds its look switcher from it.
// Arrows rather than number keys: the digits sit behind Shift on AZERTY, so a
// plain keypress never reaches them.
const ORDER = LOOKS.map((l) => l.id);
let lookIx = 0, lookIxPrev = 0;

// Full control panel, generated from the uniform tables rather than written in
// HTML. Any control added to NUM or COL appears here automatically and stays in
// sync -- a hand-written panel drifts the moment a uniform is renamed.
if (!HAS_PANEL) {
  const RANGE = {
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
    tear:[0,3,0.01], thread:[0.2,3,0.01], figH:[0.4,2.5,0.005], figX:[-0.8,0.8,0.005], figY:[-1.4,0.6,0.005],
    coreX:[-1,1,0.005], coreY:[-1,1,0.005], typeInk:[0,1,0.01],
  };
  const GROUPS = [
    ['body',   ['r','edge','coreX','coreY','coreSize','rimBand','drift','wobble']],
    ['light',  ['glow','glowSize','glowMode','rimW','rimStr','rimIn','spread','warmth','purity']],
    ['ground', ['bgFall','bgFloor']],
    ['cloth',  ['cloth','clothScale','clothShape','clothMorph','clothWave','clothSpeed','clothWeight','charge','chargeSpd','chargeLen']],
    ['surface',['light','rake','sheen','cord']],
    ['figure', ['figH','figX','figBleed','figDark','figTint','figLift','tear','thread']],
    ['grain',  ['grain','grainSize','grainMask']],
    ['type',   ['typeInk']],
  ];
  const COLKEYS = ['pigment','bg','clothInk'];

  const el = document.createElement('aside');
  el.style.cssText = `position:fixed;top:0;right:0;bottom:0;z-index:40;width:236px;
    padding:14px;overflow:auto;background:#0a0708ee;backdrop-filter:blur(10px);
    border-left:1px solid #ffffff1c;font:10px ui-monospace,monospace;color:#eee;
    letter-spacing:.08em`;

  const row = (k) => {
    const [lo, hi, st] = RANGE[k] ?? [0, 1, 0.01];
    return `<label style="display:grid;gap:3px;margin-bottom:7px">
      <span style="display:flex;justify-content:space-between;text-transform:uppercase;opacity:.5">
        ${k}<b id="v-${k}" style="font-weight:400;opacity:.8"></b></span>
      <input id="p-${k}" type="range" min="${lo}" max="${hi}" step="${st}"
        style="width:100%;accent-color:#ff3b1e;height:12px"></label>`;
  };
  const head = (t) => `<div style="opacity:.35;text-transform:uppercase;
    letter-spacing:.2em;margin:12px 0 6px">${t}</div>`;

  el.innerHTML =
    `<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:8px">` +
    ORDER.map((n) => `<button data-look="${n}" style="background:#ffffff10;
      border:1px solid #ffffff1f;color:#eee;font:9px ui-monospace,monospace;
      letter-spacing:.12em;text-transform:uppercase;padding:6px 2px;cursor:pointer">
      ${n}</button>`).join('') + `</div>` +
    GROUPS.map(([t, keys]) => head(t) + keys.map(row).join('')).join('') +
    head('colour') +
    COLKEYS.map((k) => `<div style="display:grid;
      grid-template-columns:48px 26px 1fr;gap:6px;align-items:center;margin-bottom:6px">
      <span style="opacity:.5;text-transform:uppercase">${k}</span>
      <input id="s-${k}" type="color" style="width:100%;height:20px;padding:0;
        border:1px solid #ffffff1f;background:none;cursor:pointer">
      <input id="c-${k}" type="text" spellcheck="false" style="background:#ffffff10;
        border:1px solid #ffffff1f;color:#eee;font:10px ui-monospace,monospace;
        padding:3px 5px;width:100%"></div>`).join('') +
    `<button id="p-copy" style="width:100%;margin-top:10px;background:#ffffff12;
      border:1px solid #ffffff26;color:#eee;font:10px ui-monospace,monospace;
      letter-spacing:.14em;text-transform:uppercase;padding:7px;cursor:pointer">
      copy settings</button>
     <div style="opacity:.3;margin-top:8px;line-height:1.6">H hide · ←→ look</div>`;
  document.body.appendChild(el);

  const ALLNUM = GROUPS.flatMap(([, k]) => k);
  const sync = () => {
    for (const k of ALLNUM) {
      const i = document.getElementById('p-' + k); if (!i) continue;
      i.value = state[k] ?? 0;
      document.getElementById('v-' + k).textContent = (+(state[k] ?? 0)).toFixed(3);
    }
    for (const k of COLKEYS) {
      document.getElementById('c-' + k).value = state[k] ?? '';
      document.getElementById('s-' + k).value = state[k] ?? '#000000';
    }
  };
  window.__syncPanel = sync;

  // Edits persist into the ACTIVE look, not just into the live state. Otherwise
  // placing one figure and switching away throws the work out, which is exactly
  // the thing that forces you to copy values by hand.
  const commit = (k, v) => {
    state[k] = v;
    const look = PRESETS[ORDER[lookIx]];
    if (look) look[k] = v;
  };
  for (const k of ALLNUM) {
    const i = document.getElementById('p-' + k); if (!i) continue;
    i.addEventListener('input', (e) => {
      commit(k, parseFloat(e.target.value));
      document.getElementById('v-' + k).textContent = state[k].toFixed(3);
      send(state);
    });
  }
  // swatch and hex field drive each other. the picker is for finding a colour,
  // the field is for pasting one -- both are needed and neither replaces the other
  for (const k of COLKEYS) {
    const hex = document.getElementById('c-' + k);
    const sw  = document.getElementById('s-' + k);
    const set = (v) => { commit(k, v); hex.value = v; sw.value = v; send(state); };
    sw.addEventListener('input', () => set(sw.value));
    hex.addEventListener('input', () => {
      let v = hex.value.trim(); if (v[0] !== '#') v = '#' + v;
      if (/^#[0-9a-fA-F]{6}$/.test(v)) { commit(k, v); sw.value = v; send(state); }
    });
  }
  for (const b of el.querySelectorAll('[data-look]'))
    b.onclick = () => { lookIx = ORDER.indexOf(b.dataset.look); apply(b.dataset.look); };

  // Dump ALL looks, formatted as the LOOKS array. Copying the live state alone
  // only ever captures one look, which is why placing four figures meant four
  // round trips.
  document.getElementById('p-copy').onclick = () => {
    const KEEP = ['id','name','fig','pigment','bg','clothInk','figH','figX','figY',
                  'glow','rimStr','rimW','warmth','purity','pig','origin','material'];
    const out = ORDER.map((id) => {
      const l = PRESETS[id], o = {};
      for (const k of KEEP) if (l[k] !== undefined && l[k] !== BASE[k]) o[k] = l[k];
      return o;
    });
    const txt = 'const LOOKS = ' + JSON.stringify(out, null, 2) + ';';
    navigator.clipboard.writeText(txt);
    console.log(txt);
    document.getElementById('p-copy').textContent = 'copied all looks';
    setTimeout(() => document.getElementById('p-copy').textContent = 'copy settings', 1200);
  };

  addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'h')
      el.style.display = (el.style.display === 'none') ? 'block' : 'none';
  });
  queueMicrotask(sync);
}

// Live placement without a panel. In the console:
//   fig({ h: 1.05, x: 0.14, y: -0.42 })
// h is drawn height in uv units (viewport short axis = 1.0), x/y shift her.
// Logs the values back so a placement you like can be pasted into the preset.
window.fig = (o = {}) => {
  Object.assign(state, {
    figH: o.h ?? state.figH,
    figX: o.x ?? state.figX,
    figY: o.y ?? state.figY,
  });
  send(state);
  console.log(`figH:${state.figH}, figX:${state.figX}, figY:${state.figY}`);
  return { h: state.figH, x: state.figX, y: state.figY };
};
window.halo = (o = {}) => {
  Object.assign(state, { r: o.r ?? state.r, coreY: o.cy ?? state.coreY });
  send(state);
  console.log(`r:${state.r}, coreY:${state.coreY}`);
};

// two colours. core and rim are derived in the shader.
const COL = { pigment:'uPigment', bg:'uBg', clothInk:'uClothInk' };
// One place that pushes a settings object at the shader. The panel writes into
// it when there is a panel; hero.html has none and just sends the preset.
function send(v) {
  for (const [id, u] of Object.entries(NUM)) view.set(u, v[id]);
  for (const [id, u] of Object.entries(COL)) view.set(u, hexToRgb(v[id]));
  view.set('uCore', [v.coreX, v.coreY]);
  view.set('uPos', [0, 0]);
  view.set('uFigShow', v.figShow === false ? 0 : 1);
  // NOTE: rect / aspect are deliberately NOT set here -- see frame()

}

let state = { ...PRESETS[LOOKS[0].id] };

function push() {
  if (!HAS_PANEL) { send(state); return; }

  for (const id of Object.keys(NUM)) {
    state[id] = parseFloat($(id).value);
    const o = $('o-' + id); if (o) o.textContent = state[id].toFixed(3);
  }
  for (const id of ['figH','figX','figY','coreX','coreY']) {
    state[id] = parseFloat($(id).value);
    const o = $('o-' + id); if (o) o.textContent = state[id].toFixed(3);
  }

  // The ground is the pigment by default. One colour to change, and the frame
  // is in the same family as the light -- which is what a lit room looks like.
  const linked = $('linkBg').checked;
  $('bg').disabled = linked;
  $('bg-hex').disabled = linked;
  if (linked) { $('bg').value = $('pigment').value; $('bg-hex').value = $('pigment').value; }
  for (const id of Object.keys(COL)) state[id] = $(id).value;

  state.figShow = $('figShow').checked;
  send(state);
}

if (HAS_PANEL) {
  for (const id of [...Object.keys(NUM), ...Object.keys(COL),
                    'coreX','coreY','linkBg','figShow','figH','figX','figY'])
    $(id).addEventListener('input', push);
}

// hex field <-> swatch, both directions. colours arrive as hex, from a
// reference or from Figma, and typing one is faster than the native picker.
for (const id of (HAS_PANEL ? Object.keys(COL) : [])) {
  const sw = $(id), hx = $(id + '-hex');
  sw.addEventListener('input', () => { hx.value = sw.value; });
  hx.addEventListener('input', () => {
    let v = hx.value.trim();
    if (v[0] !== '#') v = '#' + v;
    if (/^#[0-9a-fA-F]{6}$/.test(v)) { sw.value = v; push(); }
  });
}

// --- transition -------------------------------------------------------------
// Every value tweens: numbers lerp, colours lerp in RGB, and the wordmark
// scrambles through to the new word. Switching a look is one move, not four
// things changing at once -- which is the difference between a slider and a
// system.
// out-quint: most of the distance is covered early, so it feels immediate and
// still settles. in-out spends its first third barely moving, which is the
// easing that was reading as sluggish.
const EASE = (t) => 1 - (1 - t) ** 5;
const NUMKEYS = () => Object.keys(BASE).filter((k) => typeof BASE[k] === 'number');
const HEXKEYS = ['pigment', 'bg', 'clothInk'];

const hex2 = (h) => { const n = parseInt(h.slice(1), 16);
  return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const rgb2 = (a) => '#' + a.map((v) => Math.round(Math.min(255, Math.max(0, v)))
  .toString(16).padStart(2, '0')).join('');

// Pigments interpolate in HSV, taking the SHORT way round the hue circle.
//
// An RGB lerp between two saturated colours passes through grey: measured on
// indigo -> brass, saturation falls from 0.79 to 0.13 at the midpoint. That
// desaturated middle is what reads as the frame going dead halfway through a
// switch and then snapping back. Travelling around the wheel keeps every
// intermediate a real pigment.
function rgb2hsv([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) {
    if (mx === r) h = ((g - b) / d + 6) % 6;
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return [h, mx ? d / mx : 0, mx];
}
function hsv2rgb([h, s, v]) {
  const i = Math.floor(h * 6), f = h * 6 - i;
  const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
  const m = [[v,t,p],[q,v,p],[p,v,t],[p,q,v],[t,p,v],[v,p,q]][i % 6];
  return m.map((c) => c * 255);
}
function mixPigment(A, B, t) {
  const a = rgb2hsv(hex2(A)), b = rgb2hsv(hex2(B));
  let dh = b[0] - a[0];
  if (dh > 0.5) dh -= 1; if (dh < -0.5) dh += 1;   // short way round
  return rgb2(hsv2rgb([(a[0] + dh * t + 1) % 1,
                       a[1] + (b[1] - a[1]) * t,
                       a[2] + (b[2] - a[2]) * t]));
}

// One clock. The values, the wordmark and the rail all run on this, so the move
// lands as a single event -- three durations means three things arriving, which
// is what read as slow even when each part was fast.
// asymmetric dip: rises fast, decays slowly, lands on zero with zero slope
const DIP_PK = Math.pow(0.35 / 2.05, 0.35) * Math.pow(1 - 0.35 / 2.05, 1.7);
const DIP = (t) => Math.pow(t, 0.35) * Math.pow(1 - t, 1.7) / DIP_PK;

// a longer clock: the colour travels a long way round the hue circle, and 620ms
// was not enough room for that to read as a move rather than a cut
const DUR = 820;
let tween = null;

function transitionTo(name) {
  const from = { ...state }, to = PRESETS[name];
  tween = { from, to, name, t0: performance.now(),
            fromIx: ORDER.indexOf(ORDER[lookIxPrev]), toIx: ORDER.indexOf(name), mix: 0 };
  paintCopy(name);                       // the record changes with the move
}

function stepTween(now) {
  if (!tween) return;
  const raw = Math.min((now - tween.t0) / DUR, 1);
  const t = EASE(raw);
  tween.mix = t;

  for (const k of NUMKEYS()) {
    const a = tween.from[k], b = tween.to[k];
    if (typeof a === 'number' && typeof b === 'number') state[k] = a + (b - a) * t;
  }
  for (const k of HEXKEYS) state[k] = mixPigment(tween.from[k], tween.to[k], t);

  // the halo swells through the middle of the move -- the light reacts to the
  // change rather than the palette simply sliding under it
  const swell = Math.sin(Math.PI * raw);
  state.r = state.r * (1 + 0.20 * swell);
  state.rimStr = state.rimStr * (1 + 1.4 * swell);

  // The ground dips dark through the move and comes back up.
  //
  // The curve matters more than the amount. sin(pi*t)^0.7 is symmetric and has
  // FAT tails -- still 0.44 at 90% of the move, then 0 at the end. That last
  // drop is a cliff, and it is what reads as the ground snapping from deep to
  // pale. This one peaks early and decays with a vanishing derivative: 0.05 at
  // 90%, 0.001 at 99%, exactly 0 at the end. Fast fall, long recovery, soft
  // landing -- which is how a light actually behaves.
  const dip = DIP(raw);
  state.bgFloor = state.bgFloor * (1 - 0.62 * dip);
  state.glow    = state.glow * (1 + 0.55 * dip);

  // a ring leaves the body and crosses the cloth. it is a position, not an
  // amount, so the wave travels rather than the whole field pulsing at once.
  view.set('uWave', raw);
  view.set('uWaveAmt', swell);

  send(state);
  if (raw >= 1) {
    // hand over on an exact frame: mix pinned to 1 and sent BEFORE the tween is
    // cleared, so the last transition frame and the first resting frame are the
    // same image. Clearing first left one frame drawn from the outgoing figure,
    // which is the snap at the end of the move.
    tween.mix = 1;
    state = { ...tween.to };
    send(state);
    tween = null;
    send(state);
    window.__syncPanel?.();
  }
}

function apply(name) {
  const p = PRESETS[name];
  state = { ...p };
  // the DOM type layer has to follow the ground, or it disappears on paper
  document.body.classList.add('paper');

  paintCopy(name);
}

// the page copy follows the look, so switching changes the whole record and not
// just the colour
function paintCopy(name) {
  const l = PRESETS[name]; if (!l) return;
  figTex = FIGTEX[name];

  // the rail restates itself row by row -- a stagger reads as a record being
  // rewritten, where all four changing at once reads as a page reload
  const rows = [['#r-pig', l.pig], ['#r-org', l.origin], ['#r-cloth', l.material],
                ['#r-lot', `Lot ${String(ORDER.indexOf(name) + 1).padStart(2, '0')} / ${ORDER.length}`]];
  rows.forEach(([sel, v], i) => {
    const el = document.querySelector(sel); if (!el) return;
    el.style.transition = 'opacity .12s ease';
    el.style.opacity = '0';
    setTimeout(() => { el.textContent = v; el.style.opacity = '1'; }, 70 + i * 45);
  });

  if (window.__wordmark) scrambleTo(l.name.toUpperCase(), window.__wordmark[1]);
  window.__syncPanel?.();
  if (!HAS_PANEL) { push(); return; }
  for (const [k, v] of Object.entries(p)) {
    const el = $(k); if (!el) continue;
    el.value = v;
    const hx = $(k + '-hex'); if (hx) hx.value = v;
  }
  for (const b of document.querySelectorAll('.preset'))
    b.setAttribute('aria-current', String(b.dataset.k === name));
  push();
}
for (const b of document.querySelectorAll('.preset'))
  b.onclick = () => { lookIx = ORDER.indexOf(b.dataset.k); apply(b.dataset.k); };
addEventListener('keydown', (e) => {
  let d = 0;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') d = 1;
  if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   d = -1;
  if (!d) return;
  e.preventDefault();
  if (tween) return;                    // ignore input mid-move
  lookIxPrev = lookIx;
  lookIx = (lookIx + d + ORDER.length) % ORDER.length;
  transitionTo(ORDER[lookIx]);
});

// dump the whole state, so a look you like can be pasted into a character file
if (HAS_PANEL) $('copy').onclick = () => {
  const o = {};
  for (const id of Object.keys(NUM)) o[id] = parseFloat($(id).value);
  o.core = [parseFloat($('coreX').value), parseFloat($('coreY').value)];
  for (const id of Object.keys(COL)) o[id] = $(id).value;
  navigator.clipboard.writeText(JSON.stringify(o, null, 2));
  $('copy').textContent = 'copied';
  setTimeout(() => $('copy').textContent = 'copy settings', 900);
};

apply(LOOKS[0].id);

function frame(t) {
  stepTween(t);
  stepWordmark(t);

  // Anything that depends on an async load is set HERE, not in send().
  //
  // send() runs once on a page with no panel. The figure's aspect and alpha
  // bounding box are only known after the image decodes, and the font only
  // after it loads -- both land after that single call. Setting them once meant
  // the figure rendered with aspect 1 and a full-canvas rect (squashed), and
  // snapped correct the instant any slider forced a second send().
  // every figure stays bound to its own unit; the shader picks by index
  for (const l of LOOKS) view.bind(FIGTEX[l.id], `uFigTex${LOOKS.indexOf(l)}`, 4 + LOOKS.indexOf(l));
  for (let i = 0; i < LOOKS.length; i++) view.set(`uFigTex${i}`, 4 + i);

  const A = tween ? tween.fromIx : lookIx;
  const B = tween ? tween.toIx   : lookIx;
  const ta = FIGTEX[ORDER[A]], tb = FIGTEX[ORDER[B]];
  const pa = PRESETS[ORDER[A]], pb = PRESETS[ORDER[B]];

  view.set('uFigA', A);
  view.set('uFigB', B);
  view.set('uFigRect',  ta.rect);
  view.set('uFigRectB', tb.rect);
  view.set('uFigPos',  [ta.aspect, pa.figH, pa.figX, pa.figBleed ?? 0]);
  view.set('uFigPosB', [tb.aspect, pb.figH, pb.figX, pb.figBleed ?? 0]);
  view.set('uFigMix', tween ? tween.mix : 1);
  view.set('uTear', state.tear ?? 1);
  view.set('uThread', state.thread ?? 0.7);
  if (!tween) { view.set('uWave', 0); view.set('uWaveAmt', 0); }

  if (typeTex) {
    gl0.activeTexture(gl0.TEXTURE0 + 3);
    gl0.bindTexture(gl0.TEXTURE_2D, typeTex.tex);
    view.set('uType', 3);
    view.set('uTypeShow', 1);
    view.set('uTypeInk', state.typeInk ?? 0.95);
  } else {
    view.set('uTypeShow', 0);
  }

  view.set('uTime', t * 0.001);
  view.draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

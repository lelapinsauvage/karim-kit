import { quad, hexToRgb } from './gl.js';
import { scramble } from '@karimsaab/kit';
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
  figMode:0, tear:1.0, thread:0.7, figH:0.85, figX:0.055, figBleed:0.06, figDark:0.07, figTint:0.18, figLift:0,
  coreX:0.19, coreY:-0.110, typeInk:0.07,
};

// Four looks. Chosen for spread rather than preference: four pigments that sit
// far apart on the wheel, and four different relationships to the lens -- chin
// lifted, hand at the jaw, strict profile, looking off frame. Ten was a library;
// four is an edit.
//
// To swap one out, change `fig` to any other generated figure. Everything else
// -- pigment, ground, provenance -- travels with the entry.
// Four looks. Chosen for the figures that hold the camera rather than turning
// away from it -- a subject cropped at the shoulder and looking off frame reads
// as a stock photo, whichever way it is lit.
//
// The pigment is taken from what each one is actually wearing: barkcloth and
// cowrie, white clay and cotton, indigo resist, undyed raffia.
const LOOKS = [
  { id:'l1', name:'Barkcloth', fig:'a01',
    pigment:'#AE7C1A', bg:'#E3DDD2', clothInk:'#8F7950',
    figH:0.850, figX:0.000, figBleed:0.050,
    pig:'Brass, unlacquered', origin:'Lagos · Foundry 4',
    material:'Barkcloth, beaten thin' },

  { id:'l2', name:'Indigo', fig:'a02',
    pigment:'#A43C1E', bg:'#DED1CD', clothInk:'#8F6052',
    figH:0.790, figX:0.025, figBleed:0.000,
    pig:'Indigo, third dip', origin:'Abeokuta · Adire pits',
    material:'Resist cotton, cracked' },

  { id:'l3', name:'Cowrie', fig:'a05',
    pigment:'#15568D', bg:'#D2DBE3', clothInk:'#50728F',
    figH:0.885, figX:0.000, figBleed:0.015,
    pig:'Cowrie, bleached', origin:'Ouidah · Coast trade',
    material:'Raffia, wound wet' },

  { id:'l4', name:'Raffia', fig:'a10',
    pigment:'#939717', bg:'#DDDECD', clothInk:'#8D8F50',
    figH:0.885, figX:0.000, figBleed:0.095,
    pig:'Brass, hammer-marked', origin:'Lagos · Foundry 4',
    material:'Barkcloth on wire' },
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

// The lockup is drawn to a 2D canvas and sampled in the shader BEFORE the figure
// is composited, which is the only way she can pass in front of it. DOM type can
// never sit behind the canvas -- the canvas is opaque.
//
// Geometry is kept in the same units the CSS uses (a rem derived from viewport
// width) so the canvas copy and the layout cannot drift apart.
// 0..1. Below 1 the lockup is UNCOVERED rather than drawn: each letter rises
// out of its own box behind a clip that stops at the baseline, staggered left
// to right. A glitch and a reveal are different events -- the shuffle is right
// for a switch, where the word is being replaced, and wrong for the opening,
// where it is arriving for the first time.
let lockRise = 1;
let checkedWord = null;
export function setRise(v) { lockRise = v; }

export function setLockup(name, num) {
  const dpr = Math.min(devicePixelRatio, 2);
  const w = Math.round(innerWidth * dpr), h = Math.round(innerHeight * dpr);
  if (typeCv.width !== w || typeCv.height !== h) { typeCv.width = w; typeCv.height = h; }

  const rem = Math.min(19, Math.max(10.5, innerWidth / 120)) * dpr;
  const pad = 3 * rem;
  const size = 14.375 * rem;                 // 230px on the 1920 board

  typeCtx.setTransform(1, 0, 0, 1, 0, 0);
  typeCtx.clearRect(0, 0, w, h);
  typeCtx.fillStyle = '#fff';                // only the alpha is read
  typeCtx.textBaseline = 'alphabetic';

  // an empty name clears and returns: the lockup belongs to the reveal, and
  // painting it during the eclipse would mean the page was already finished
  // behind the loader
  if (!name) {
    if (!typeTex) typeTex = view.canvasTexture(typeCv, 3);
    else typeTex.upload();
    return;
  }

  // -4% throughout, straight off the board -- name and number alike
  typeCtx.letterSpacing = '-0.04em';
  typeCtx.font = `${size}px Disp, Impact, sans-serif`;
  typeCtx.textAlign = 'left';
  const NAME = name.toUpperCase();
  const nameY = h * 0.29 + size * 0.78;

  // ONE GLYPH AT A TIME, always -- during the reveal and at rest.
  //
  // Everything before this sliced a rendering of the whole word into columns,
  // and that cannot work here. The lockup is set at -4% tracking, and negative
  // letter-spacing makes glyphs OVERLAP: any vertical boundary between two
  // letters cuts through ink belonging to its neighbour. That orphaned sliver
  // then rides the wrong letter's clock, which is why thin lines appeared to
  // reveal on their own schedule, and only between the pairs that overlap.
  //
  // Drawing a single glyph leaves no neighbour ink to cut, so no horizontal
  // boundary is needed at all. The only clip left is the baseline.
  //
  // EXACT kerned pen position for glyph i, taken out of the real layout:
  //
  //   width(prefix through i) = x_i + advance(c_i) + spacing
  //   measureText(c_i).width  =       advance(c_i) + spacing
  //   so  x_i = width(prefix through i) - measureText(c_i).width
  //
  // The left side includes every kern up to and including the pair (c_i-1, c_i),
  // so the subtraction leaves the true pen position with nothing missing.
  // Measuring the prefix BEFORE the glyph instead -- which is the obvious way
  // and what this did -- omits exactly that last kern, and the error
  // accumulates letter by letter until pairs collide.
  const penX = (i) => pad + typeCtx.measureText(NAME.slice(0, i + 1)).width
                          - typeCtx.measureText(NAME[i]).width;
  const over = size * 0.035;           // round glyphs sit below the baseline

  // Prove the placement matches the real layout instead of assuming it. The
  // last glyph's pen position plus its own advance must equal the width of the
  // whole word; any drift shows up here as a number instead of as letters
  // touching. Runs once per word.
  if (checkedWord !== NAME) {
    checkedWord = NAME;
    const last = NAME.length - 1;
    const mine = (penX(last) - pad) + typeCtx.measureText(NAME[last]).width;
    const real = typeCtx.measureText(NAME).width;
    const off = Math.abs(mine - real);
    if (off > 0.5) console.warn(`lockup: ${NAME} placed ${off.toFixed(2)}px off the real layout`);
  }

  for (let i = 0; i < NAME.length; i++) {
    if (NAME[i] === ' ') continue;
    const x = penX(i);

    if (lockRise >= 1) { typeCtx.fillText(NAME[i], x, nameY); continue; }

    const start = (i / NAME.length) * 0.5;
    const t = Math.max(0, Math.min((lockRise - start) / 0.5, 1));
    const e = t >= 1 ? 1 : 1 - Math.pow(2, -9 * t);
    if (e <= 0) continue;

    typeCtx.save();
    typeCtx.beginPath();
    // full width, cut only at the baseline: the letter climbs out of the line
    typeCtx.rect(0, nameY - size * 1.4, w, size * 1.4 + over);
    typeCtx.clip();
    typeCtx.globalAlpha = e;
    typeCtx.fillText(NAME[i], x, nameY + (1 - e) * size * 0.72);
    typeCtx.restore();
  }
  typeCtx.globalAlpha = 1;

  // right block, low -- deliberately off the left block's baseline
  const numTxt = 'NUM';
  const supTxt = num;
  typeCtx.letterSpacing = '-0.04em';
  typeCtx.textAlign = 'right';
  const supSize = size * 0.30;
  typeCtx.font = `${supSize}px Disp, Impact, sans-serif`;
  const supW = typeCtx.measureText(supTxt).width;
  // the number block follows the word -- it starts at 0.55 of the run, so it
  // reads as the caption to something that has already arrived
  const nt = Math.max(0, Math.min((lockRise - 0.55) / 0.45, 1));
  const ne = nt >= 1 ? 1 : 1 - Math.pow(2, -9 * nt);
  const numY = h * 0.52 + size * 0.78;
  typeCtx.save();
  typeCtx.beginPath();
  typeCtx.rect(0, numY - size * 1.05, w, size * 1.05 + size * 0.035);
  typeCtx.clip();
  typeCtx.globalAlpha = ne;
  typeCtx.fillText(supTxt, w - pad, h * 0.52 + supSize * 0.9 + (1 - ne) * size * 0.72);
  typeCtx.font = `${size}px Disp, Impact, sans-serif`;
  typeCtx.fillText(numTxt, w - pad - supW - size * 0.05, numY + (1 - ne) * size * 0.72);
  typeCtx.restore();
  typeCtx.globalAlpha = 1;

  if (!typeTex) typeTex = view.canvasTexture(typeCv, 3);
  else typeTex.upload();
}

// The wordmark resolves rather than swapping. Each letter holds a run of random
// glyphs, then locks -- staggered left to right, so the word arrives in order
// like something being decoded. Letters lock at different times or it reads as
// a single flicker.
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\\|<>#*+=';
let wm = { from: '', to: '', t0: -1, dur: 1450, opts: {} };

export function scrambleTo(text, num) {
  wm = { from: wm.to || text, to: text, t0: performance.now(), dur: DUR, num };
}

function stepWordmark(now) {
  // The rise owns the lockup while it is running. Both of these write the same
  // canvas, and apply() calls scrambleTo at startup -- so through the whole
  // opening one was painting real letters climbing out and the other was
  // painting random glyphs over them, every frame. The letters looked like they
  // were rearranging because they were.
  if (lockRise < 1) return;
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
  setLockup(out, wm.num ?? '°01');
  if (raw >= 1) { wm.t0 = -1; setLockup(wm.to, wm.num ?? '°01'); }
}

// load(), not ready(). A face that no DOM node uses is never fetched, so
// fonts.ready resolves happily and the canvas rasterises in the fallback -- the
// wordmark silently draws in Impact and nothing reports a problem.
(document.fonts?.load('1em Disp') ?? Promise.resolve())
  .then(() => document.fonts?.ready)
  .then(() => {
  // deliberately NOT drawn yet. The lockup belongs to the reveal; painting it
  // during the eclipse means the page was already finished behind the loader.
  wm.to = '';
  wm.num = '°01';
  setLockup('', wm.num);
});
addEventListener('resize', () => { if (wm.to) setLockup(wm.to, wm.num ?? '°01'); });

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
    tear:[0,3,0.01], thread:[0.2,3,0.01], figMode:[0,3,1], figH:[0.4,2.5,0.005], figX:[-0.8,0.8,0.005], figBleed:[-0.4,0.6,0.005],
    coreX:[-1,1,0.005], coreY:[-1,1,0.005], typeInk:[0,1,0.01],
  };
  const GROUPS = [
    ['body',   ['r','edge','coreX','coreY','coreSize','rimBand','drift','wobble']],
    ['light',  ['glow','glowSize','glowMode','rimW','rimStr','rimIn','spread','warmth','purity']],
    ['ground', ['bgFall','bgFloor']],
    ['cloth',  ['cloth','clothScale','clothShape','clothMorph','clothWave','clothSpeed','clothWeight','charge','chargeSpd','chargeLen']],
    ['surface',['light','rake','sheen','cord']],
    ['figure', ['figH','figX','figBleed','figMode','tear','thread','figDark','figTint','figLift']],
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
  // hidden by default -- the panel is a tool, and the piece has to be seen
  // without it. H toggles.
  el.style.display = 'none';
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
    const KEEP = ['id','name','fig','pigment','bg','clothInk','figH','figX','figBleed',
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
//   fig({ h: 1.05, x: 0.14, bleed: 0.06 })
// h is drawn height in uv units (viewport short axis = 1.0), x shifts her,
// bleed sinks her below the bottom edge. She is anchored to the frame bottom,
// so there is no y: raising her is what bleed does, negatively.
// Logs the values back so a placement you like can be pasted into the preset.
window.fig = (o = {}) => {
  Object.assign(state, {
    figH: o.h ?? state.figH,
    figX: o.x ?? state.figX,
    figBleed: o.bleed ?? state.figBleed,
  });
  send(state);
  console.log(`figH:${state.figH}, figX:${state.figX}, figBleed:${state.figBleed}`);
  return { h: state.figH, x: state.figX, bleed: state.figBleed };
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
  for (const id of ['figH','figX','figBleed','coreX','coreY']) {
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
                    'coreX','coreY','linkBg','figShow','figH','figX','figBleed'])
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
// out-quart rather than out-quint. Over 2.1s a quintic spends its whole tail
// almost stationary, which reads as the move having ended early and then
// creeping. A gentler exponent keeps it moving all the way in.
const EASE = (t) => 1 - (1 - t) ** 4;
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

// A switch moves a pigment round the hue circle, sends a wave across the field
// and replaces the figure -- three events that each need room to be watched.
// 820ms blurred them into a cut; 2100ms left the tail crawling. This is the
// window where the parts read separately and none of them outstays.
const DUR = 1450;
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
  // Everything that swells uses the SAME asymmetric curve as the dip. This was
  // still on sin(pi*t): rim strength was 1.43x at 90% of the move and 1.00x at
  // the end, and since the rim tints the ground in tint mode, that fall is
  // precisely the ground jumping from deep to pale. Grow fast, return slowly --
  // and the return is the half that has to be gentle, because it is the one you
  // watch land.
  const swell = DIP(raw);
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
  // the wave IS the transition clock now -- the figure turns over as it passes,
  // so it has to sweep the full frame within the move, not peak halfway
  view.set('uWave', t);
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
                ['#r-ed', 'Twenty seven of one hundred']];
  rows.forEach(([sel, v], i) => {
    const el = document.querySelector(sel); if (!el) return;
    el.style.transition = 'opacity .20s ease';
    el.style.opacity = '0';
    setTimeout(() => { el.textContent = v; el.style.opacity = '1'; }, 180 + i * 90);
  });

  // the lockup is DOM now: it has to sit either side of her on a shared
  // baseline, which is a layout problem, not a texture one
  const n = ORDER.indexOf(name) + 1;
  const set = (sel, v) => { const el = document.querySelector(sel); if (el) el.textContent = v; };
  set('#r-lot', 'Lot ' + String(n).padStart(2, '0'));
  set('#s-now', String(n).padStart(2, '0'));
  set('#s-all', String(ORDER.length).padStart(2, '0'));
  const bar = document.querySelector('#s-bar');
  if (bar) bar.style.width = (n / ORDER.length * 100) + '%';
  scrambleTo(l.name.toUpperCase(), '°' + String(n).padStart(2, '0'));
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
// ONE navigation entry point. The logic used to live inline inside the keydown
// listener, so the slider buttons had nothing to call -- every new control would
// have had to reimplement the guard and the wrap.
let tearT = null;
function tear() {
  const shell = document.getElementById('shell');
  if (!shell) return;
  shell.classList.remove('tear');
  void shell.offsetWidth;               // restart the animation, do not queue it
  shell.classList.add('tear');
  clearTimeout(tearT);
  tearT = setTimeout(() => shell.classList.remove('tear'), 460);
}

export function go(dir) {
  if (tween || !dir) return;            // ignore input mid-move
  tear();
  lookIxPrev = lookIx;
  lookIx = (lookIx + dir + ORDER.length) % ORDER.length;
  transitionTo(ORDER[lookIx]);
}

addEventListener('keydown', (e) => {
  let d = 0;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') d = 1;
  if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   d = -1;
  if (!d) return;
  e.preventDefault();
  go(d);
});

document.getElementById('s-prev')?.addEventListener('click', () => go(-1));
document.getElementById('s-next')?.addEventListener('click', () => go(1));

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

// --- loader -----------------------------------------------------------------
// Progress is REAL: every figure has to decode before the eclipse can break. A
// loader that runs on a timer is a lie, and it always looks like one -- it
// finishes while the page is still blank, or it sits at 99% with nothing left
// to wait for.
const ASSETS = LOOKS.map((l) => l.fig);
let decoded = 0;
for (const f of ASSETS) {
  const img = new Image();
  img.onload = img.onerror = () => { decoded++; };
  img.src = `/src/figures/${f}.png`;
}

const LOAD_MIN = 1500;      // the count is brisk; the reveal is not              // the opening is a shot, not a wait
const bootAt = performance.now();
let load = 0, loadDone = false, revealed = false;

const easeIO = (x) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2);

// GLSL has smoothstep built in; JavaScript does not. Writing shader code and
// page code in the same file makes this an easy thing to assume.
const smoothstep = (e0, e1, x) => {
  const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1);
  return t * t * (3 - 2 * t);
};
const smoothstep01 = smoothstep;

// TWO PHASES, in order.
//
//   LOAD    the counter climbs to 100 and the eclipse forms the sun. Nothing
//           else moves. The reveal used to fire at 90%, so the page opened
//           before the number it was counting to ever arrived.
//   REVEAL  only once 100 is on screen: the wave leaves the body, uncovers the
//           cloth as it travels, floods the ground, and the frame states itself.
//
// Keeping them separate is what lets the counter mean something. A loader whose
// reveal overlaps its own progress is decoration.
let revealT = -1;
// The sun transition is fast and everything it causes is slow. Those are
// different jobs on one clock: a longer clock with the sun confined to its first
// quarter gives an impact that snaps and consequences you can actually watch.
const REVEAL_MS = 3200;

function stepLoader(now) {
  // NOTHING here may decelerate. Three separate mechanisms used to, and they
  // compounded into the pause before contact:
  //
  //   1. an exponentially damped follower -- the last 2% of it took 835ms
  //   2. easeIO on top, whose slope at the end is 0.00
  //   3. a held gap in the approach curve
  //
  // The follower is only needed while assets are still arriving. Once they are
  // in, the clock is already smooth and load tracks it exactly, so the count
  // runs at constant speed and every bit of shaping lives in one place: the
  // approach curve, which accelerates.
  const real = ASSETS.length ? decoded / ASSETS.length : 1;
  const clock = Math.min((now - bootAt) / LOAD_MIN, 1);
  if (real >= clock) load = clock;                 // assets ready: no lag at all
  else load = Math.min(clock, load + (real - load) * 0.12);
  if (load > 0.999) load = 1;

  const p = load;                                   // linear. no easing here.

  // --- eclipse ---------------------------------------------------------------
  // The body forms but stays SMALL. It used to finish growing to full radius
  // during the load, which left it with nothing to do at the reveal -- the sun
  // was already there and the explosion happened around it instead of out of
  // it. Everything expands from the circle, so the circle has to be the thing
  // that expands.
  // The bodies stay BLACK for the whole load. Lighting them before the counter
  // is finished spends the only event the opening has, and what is left when the
  // reveal arrives is a bright circle getting bigger -- which is why it read as
  // cheap. Black mass, then ignition, in that order.
  const SEED = 0.085;
  // THE APPROACH. One curve, monotonic, accelerating the whole way.
  //
  // p^5 means they drift at the start and are moving five times average speed at
  // the moment of contact. No hold, no ease-out, no plateau -- the gap is
  // shrinking faster on every frame right up to the collision, so the merged
  // black shape is only on screen for about 60ms and never settles.
  const close = p ** 5;
  const seam  = Math.exp(-(((p - 0.985) / 0.018) ** 2));

  // THE HEAT.
  //
  // The ignition starts BEFORE contact, driven by how close they are rather than
  // by a timer that begins afterwards. Two masses closing compress and heat, so
  // by the time they touch they are already turning into the sun -- and there is
  // nothing left to wait for at the moment of collision.
  //
  // Holding them black until impact and only then starting the colour is what
  // read as a hold: the eye sees them meet, then sees nothing for a beat, then
  // sees a light come on.
  const heat = smoothstep(0.90, 1.00, p);

  const start = 0.46;
  view.set('uEclA', [-start * (1 - close), 0.02]);
  view.set('uEclB', [ start * (1 - close), 0.02]);
  view.set('uEclR', SEED);
  view.set('uEclSeam', seam * 0.85);
  view.set('uPaper', hexToRgb('#F5F5F5'));
  view.set('uLoad', p);

  const el = document.getElementById('pct');
  if (el) el.textContent = String(Math.round(load * 100)).padStart(3, '0');

  // --- hold on 100, then reveal --------------------------------------------
  // NO BEAT. Contact is the trigger and the reveal starts on the same frame.
  // A pause here shows exactly what the whole approach was built to hide: a lit
  // sun sitting on white paper with the counter reading 100, which is the
  // finished loader state and the one thing the eye must never settle on.
  if (load >= 1 && revealT < 0) revealT = now;

  if (revealT < 0 || now < revealT) {
    view.set('uEclWhite', heat ** 1.6);   // heating as they close
    view.set('uEclFill', heat ** 4);      // and just catching colour at contact
    view.set('uLoadCover', 1);
    view.set('uClothFront', -1);                        // cloth fully hidden
    view.set('uWave', 0); view.set('uWaveAmt', 0);
    state.bg = '#F5F5F5';
    state.figTint = 0;
    state.r = SEED;                 // the scene's sun matches the seed exactly,
    view.set('uFigFade', 0);        // so the handover has nothing to reveal
    send(state);
    return;
  }

  const rt = Math.min((now - revealT) / REVEAL_MS, 1);

  // Each element gets its OWN easing, not one shared curve. A single curve
  // across eight things is one gesture repeated; different curves at different
  // offsets is choreography.
  const seg = (a, b) => Math.max(0, Math.min((rt - a) / (b - a), 1));
  const expoOut = (x) => (x >= 1 ? 1 : 1 - 2 ** (-9 * x));   // leaves hard, lands soft
  const quartIO = (x) => (x < 0.5 ? 8 * x ** 4 : 1 - (-2 * x + 2) ** 4 / 2);
  const quartOut = (x) => 1 - (1 - x) ** 4;                  // leaves at once
  const sineOut = (x) => Math.sin((x * Math.PI) / 2);        // gentlest of the three

  // the sun opens on expo -- it should feel released, not driven
  const e = expoOut(seg(0.00, 0.26));   // ~830ms: the impact itself

  // THE IGNITION, then the expansion. The mass goes white, catches, and opens.
  // Holding the ignition back until here means the reveal has a moment of its
  // own rather than continuing something the load already did.
  const look = PRESETS[ORDER[lookIx]];
  // Fully lit at contact and it STAYS lit. This used to drop to 0.85 on the
  // first frame of the reveal -- heat reaches 1.0 at contact, so re-easing the
  // fill from a lower value stepped backwards, and a step backwards at the exact
  // moment of impact is read as a stall.
  view.set('uEclWhite', 1);
  view.set('uEclFill', 1);

  state.r = SEED + (look.r - SEED) * e;
  view.set('uEclR', state.r);

  if (!revealed) {
    revealed = true;
    document.body.classList.add('reveal');
    // NOT scrambleTo here. The opening is the word arriving for the first
    // time, and a shuffle says it is being replaced.
    setRise(0);
    wm.t0 = -1;                       // stand the shuffle down; the rise has it
    wm.from = '';
    wm.to = PRESETS[ORDER[lookIx]].name.toUpperCase();
    wm.num = '°01';
    // The mark resolves rather than fading in with the row it sits in. It
    // starts 520ms late, with the top row's own arrival, so the name settles
    // as the frame around it lands rather than before it.
    const markEl = document.querySelector('.mark');
    if (markEl) {
      const MARK = markEl.textContent;
      setTimeout(() => scramble(markEl, MARK, { duration: 1500 }), 520);
    }
    if (el) el.style.transition = '';
  }

  // the front leaves the body and takes the cloth with it
  // parked well past the far corner once open, so the mask is inert for the
  // rest of the session rather than a value the slider has to keep clearing
  // the wave leaves just after the flash, so the ignition reads as its cause,
  // and travels on a slower curve than the sun so the two separate as they go
  // Leaves AT ONCE and then takes its time. quartIO spent its first third
  // barely moving, so the front had not left the body while the sun was already
  // most of the way open -- which is the beat where an orange disc sat on white
  // paper. Departure must be immediate; only the journey is slow.
  const wv = quartOut(seg(0.00, 0.70));
  view.set('uClothFront', rt >= 1 ? 99.0 : SEED + wv * 2.9);
  view.set('uWave', wv);
  view.set('uWaveAmt', Math.sin(Math.PI * wv) ** 0.55);

  // THE FIGURE. The slowest thing on screen and the last to finish: she resolves
  // across nearly the whole reveal on a sine, which has no acceleration to
  // notice. Everything else can be seen arriving; she should only be seen to
  // have arrived.
  // she has attack but a long tail: quickly out of nothing, then a slow settle
  // you can watch. That is different from arriving gradually, which has no
  // moment of arrival at all.
  // A 240ms beat before she starts, and a longer tail to land in. Everything
  // else is already moving by then -- the sun open, the ground down, the front
  // travelling -- so she arrives INTO a scene rather than alongside its parts.
  view.set('uFigFade', expoOut(seg(0.115, 0.78)));

  // The lockup climbs out with the rest of the frame, ahead of the figure.
  // Guarded: stepLoader keeps running after the reveal lands, and redrawing the
  // type canvas every frame means a full-screen texture upload at 60Hz for the
  // rest of the session.
  if (rt < 1 && lockRise < 1) {
    setRise(seg(0.07, 0.86));
    setLockup(wm.to, wm.num ?? '°01');
  } else if (lockRise < 1) {
    setRise(1);
    setLockup(wm.to, wm.num ?? '°01');
  }

  // the loader lets go immediately -- the wave is the reveal, not a curtain
  // hands over almost at once: the loader's job ended on contact, and any
  // lingering is the settled shape the approach was built to hide
  // ~55ms. Every extra frame of this is the white paper from the screenshot
  // still on screen underneath a sun that has already ignited.
  view.set('uLoadCover', 1 - smoothstep(0.0, 0.017, rt));

  // the ground travels with the sun, on the same curve family. Anything that
  // eases IN here leaves the frame white underneath an already-open sun.
  state.bg = mixPigment('#F5F5F5', look.bg, expoOut(seg(0.00, 0.30)));
  state.figTint = look.figTint * sineOut(seg(0.135, 0.80));
  send(state);
}

function frame(t) {
  stepLoader(performance.now());

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
  view.set('uFlipA', pa.flip ? 1 : 0);
  view.set('uFlipB', pb.flip ? 1 : 0);
  view.set('uFigMix', tween ? tween.mix : 1);
  view.set('uTear', state.tear ?? 1);
  view.set('uThread', state.thread ?? 0.7);
  view.set('uFigMode', Math.round(state.figMode ?? 0));
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

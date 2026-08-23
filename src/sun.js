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
const PRESETS = {
  // Same structure as ULTRA -- soft edge, wide glow, a little purity so the
  // body has depth rather than reading as a flat fill. Red carries less
  // luminance than blue at the same value, so it takes slightly more spread and
  // glow to sit at the same weight in the frame.
  EMBER: {
    r:0.320, edge:0.400, coreSize:0.99, rimBand:0.75, drift:1.18, glow:0.92,
    glowSize:0.58, grain:0.235, grainSize:1.45, grainMask:0.55, spread:2.0,
    bgFall:0.70, bgFloor:0, warmth:0.60, purity:0.37, wobble:1.42,
    cloth:0.14, clothScale:33, clothShape:2.729, clothMorph:2, clothWeight:0.095,
    clothWave:7.5, clothSpeed:1.9, charge:0.33, chargeSpd:0.55, chargeLen:9,
    light:1.4, rake:0.82, sheen:0.9, cord:1.3,
    figH:1.125, figX:0.040, figY:-0.170, figDark:0.86, figTint:0.35, figLift:0,
    clothInk:'#ff0000', coreX:0.19, coreY:-0.110, pigment:'#990000', bg:'#333333',
    typeInk:0.95,
  },
  ULTRA: {
    r:0.320, edge:0.400, coreSize:0.99, rimBand:0.75, drift:1.18, glow:0.82,
    glowSize:0.58, grain:0.13, grainSize:1.45, grainMask:0.55, spread:0.28,
    bgFall:0.70, bgFloor:0.35, warmth:0.55, purity:0.24, wobble:1.42,
    cloth:0.14, clothScale:33, clothShape:2.729, clothMorph:2, clothWeight:0.095,
    clothWave:7.5, clothSpeed:1.9, charge:0.33, chargeSpd:0.55, chargeLen:9,
    light:1.4, rake:0.82, sheen:0.9, cord:1.3,
    figH:1.125, figX:0.040, figY:-0.170, figDark:0.86, figTint:0.35, figLift:0,
    clothInk:'#ff0000', coreX:0.19, coreY:-0.110, pigment:'#0805e1', bg:'#333333',
    typeInk:0.95,
  },

  // A light ground changes three things structurally, not just the hex:
  //   - the glow is ADDED, so on near-white it blows straight to paper. Cut it.
  //   - bgFloor has to stay high or the radial fall drags the corners to grey.
  //   - the cloth ink and the type ink have to invert -- dark on light.
  // Everything else is the same machine.
  PAPER: {
    r:0.320, edge:0.400, coreSize:0.99, rimBand:0.75, drift:1.18, glow:0.22,
    glowSize:0.34, grain:0.10, grainSize:1.45, grainMask:0.75, spread:0.30,
    bgFall:0.62, bgFloor:0.88, warmth:0.40, purity:0.62, wobble:1.42,
    cloth:0.32, clothScale:33, clothShape:2.729, clothMorph:2, clothWeight:0.095,
    clothWave:7.5, clothSpeed:1.9, charge:0.18, chargeSpd:0.55, chargeLen:9,
    light:0.6, rake:0.82, sheen:0.4, cord:1.3,
    figH:1.125, figX:0.040, figY:-0.170, figDark:0.94, figTint:0.18, figLift:0,
    clothInk:'#141414', coreX:0.19, coreY:-0.110,
    pigment:'#0A5C3B', bg:'#F5F5F5', typeInk:0.07,
  },
};

const NUM = { r:'uR', edge:'uEdge', coreSize:'uCoreSize', rimBand:'uRimBand', drift:'uDrift',
  glow:'uGlow', glowSize:'uGlowSize', grain:'uGrain', grainSize:'uGrainSize',
  grainMask:'uGrainMask', spread:'uSpread', bgFall:'uBgFall', bgFloor:'uBgFloor', warmth:'uWarmth', purity:'uPurity',
  wobble:'uWobble', cloth:'uCloth', clothScale:'uClothScale',
  clothShape:'uClothShape', clothMorph:'uClothMorph', clothWeight:'uClothWeight', clothWave:'uClothWave', clothSpeed:'uClothSpeed',
  light:'uLight', rake:'uRake', sheen:'uSheen', cord:'uCord',
  figDark:'uFigDark', figTint:'uFigTint', figLift:'uFigLift',
  charge:'uCharge', chargeSpd:'uChargeSpd', chargeLen:'uChargeLen' };
const figTex = view.texture('/src/figures/m3.png', 0);

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

document.fonts?.ready.then(() => { if (window.__wordmark) setWordmark(...window.__wordmark); });

// A minimal placement panel for pages that have no full control panel. Press H
// to hide it -- it is a tool, not part of the design, and you have to be able to
// see the composition without it.
if (!HAS_PANEL) {
  const SPEC = [
    ['figH', 'height',  0.4,  2.5, 0.005],
    ['figX', 'x',      -0.8,  0.8, 0.005],
    ['figY', 'y',      -1.4,  0.6, 0.005],
    ['r',    'disc',    0.05, 0.9, 0.005],
    ['coreY','core y', -1,    1,   0.005],
    ['figDark','darken',0,    1,   0.01],
    ['figTint','tint',  0,    1,   0.01],
  ];
  const el = document.createElement('div');
  el.style.cssText = `position:fixed;bottom:16px;left:50%;transform:translateX(-50%);
    z-index:40;display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:14px;
    padding:12px 16px;background:#0a0708e8;backdrop-filter:blur(10px);
    border:1px solid #ffffff1c;font:10px ui-monospace,monospace;color:#eee;
    letter-spacing:.1em;text-transform:uppercase;width:min(940px,94vw)`;
  el.innerHTML = SPEC.map(([k, label, lo, hi, st]) => `
    <label style="display:grid;gap:5px">
      <span style="opacity:.45;display:flex;justify-content:space-between">
        ${label}<b id="v-${k}" style="font-weight:400;opacity:.7"></b></span>
      <input id="p-${k}" type="range" min="${lo}" max="${hi}" step="${st}"
             style="width:100%;accent-color:#ff3b1e;height:12px">
    </label>`).join('');
  document.body.appendChild(el);

  const sync = () => {
    for (const [k] of SPEC) {
      document.getElementById('p-' + k).value = state[k];
      document.getElementById('v-' + k).textContent = (+state[k]).toFixed(3);
    }
  };
  for (const [k] of SPEC) {
    document.getElementById('p-' + k).addEventListener('input', (e) => {
      state[k] = parseFloat(e.target.value);
      document.getElementById('v-' + k).textContent = state[k].toFixed(3);
      send(state);
    });
  }
  addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'h') el.style.display = el.style.display === 'none' ? 'grid' : 'none';
    if (e.key.toLowerCase() === 'c') {
      const out = Object.fromEntries(SPEC.map(([k]) => [k, +(+state[k]).toFixed(3)]));
      navigator.clipboard.writeText(JSON.stringify(out));
      console.log('copied', out);
    }
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

let state = { ...PRESETS.EMBER };

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

function apply(name) {
  const p = PRESETS[name];
  state = { ...p };
  // the DOM type layer has to follow the ground, or it disappears on paper
  document.body.classList.toggle('paper', name === 'PAPER');
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
// Arrows, not number keys: the digits sit behind Shift on AZERTY, so a plain
// keypress never reaches them.
const ORDER = ['EMBER', 'ULTRA', 'PAPER'];
let lookIx = 0;
addEventListener('keydown', (e) => {
  let d = 0;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') d = 1;
  if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   d = -1;
  if (!d) return;
  e.preventDefault();
  lookIx = (lookIx + d + ORDER.length) % ORDER.length;
  apply(ORDER[lookIx]);
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

apply('EMBER');

function frame(t) {
  // Anything that depends on an async load is set HERE, not in send().
  //
  // send() runs once on a page with no panel. The figure's aspect and alpha
  // bounding box are only known after the image decodes, and the font only
  // after it loads -- both land after that single call. Setting them once meant
  // the figure rendered with aspect 1 and a full-canvas rect (squashed), and
  // snapped correct the instant any slider forced a second send().
  view.bind(figTex, 'uFigTex');
  view.set('uFigRect', figTex.rect);
  view.set('uFigPos', [figTex.aspect, state.figH, state.figX, state.figY]);

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

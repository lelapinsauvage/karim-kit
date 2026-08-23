import { quad, hexToRgb } from './gl.js';
import frag from './shaders/sun.frag?raw';

const view = quad(document.getElementById('c'), frag);
const $ = (id) => document.getElementById(id);

// Two locked looks. Switch with the buttons or 1 / 2 -- so a direction can be
// compared instantly instead of re-dialled, which is the only way to judge two
// options fairly.
const PRESETS = {
  // Same structure as ULTRA -- soft edge, wide glow, a little purity so the
  // body has depth rather than reading as a flat fill. Red carries less
  // luminance than blue at the same value, so it takes slightly more spread and
  // glow to sit at the same weight in the frame.
  EMBER: {
    r:0.30, edge:0.400, coreSize:0.99, rimBand:0.75, drift:1.18, glow:0.92,
    glowSize:0.58, grain:0.13, grainSize:1.45, grainMask:0.55, spread:0.34,
    bgFall:0.70, bgFloor:0.35, warmth:0.55, purity:0.24, wobble:1.42,
    cloth:0.14, clothScale:33, clothShape:2.729, clothMorph:2, clothWeight:0.095,
    clothWave:7.5, clothSpeed:1.9, charge:0.33, chargeSpd:0.55, chargeLen:9,
    light:1.4, rake:0.82, sheen:0.9, cord:1.3,
    clothInk:'#8c8c8c', coreX:0.19, coreY:0.26, pigment:'#990000', bg:'#333333',
  },
  ULTRA: {
    r:0.30, edge:0.400, coreSize:0.99, rimBand:0.75, drift:1.18, glow:0.82,
    glowSize:0.58, grain:0.13, grainSize:1.45, grainMask:0.55, spread:0.28,
    bgFall:0.70, bgFloor:0.35, warmth:0.55, purity:0.24, wobble:1.42,
    cloth:0.14, clothScale:33, clothShape:2.729, clothMorph:2, clothWeight:0.095,
    clothWave:7.5, clothSpeed:1.9, charge:0.33, chargeSpd:0.55, chargeLen:9,
    light:1.4, rake:0.82, sheen:0.9, cord:1.3,
    clothInk:'#8c8c8c', coreX:0.19, coreY:0.26, pigment:'#0805e1', bg:'#333333',
  },
};

const NUM = { r:'uR', edge:'uEdge', coreSize:'uCoreSize', rimBand:'uRimBand', drift:'uDrift',
  glow:'uGlow', glowSize:'uGlowSize', grain:'uGrain', grainSize:'uGrainSize',
  grainMask:'uGrainMask', spread:'uSpread', bgFall:'uBgFall', bgFloor:'uBgFloor', warmth:'uWarmth', purity:'uPurity',
  wobble:'uWobble', cloth:'uCloth', clothScale:'uClothScale',
  clothShape:'uClothShape', clothMorph:'uClothMorph', clothWeight:'uClothWeight', clothWave:'uClothWave', clothSpeed:'uClothSpeed',
  light:'uLight', rake:'uRake', sheen:'uSheen', cord:'uCord',
  charge:'uCharge', chargeSpd:'uChargeSpd', chargeLen:'uChargeLen' };
// two colours. core and rim are derived in the shader.
const COL = { pigment:'uPigment', bg:'uBg', clothInk:'uClothInk' };
function push(){
  for(const [id,u] of Object.entries(NUM)){const v=parseFloat($(id).value);view.set(u,v);
    const o=$('o-'+id); if(o)o.textContent=v.toFixed(3);}
  // The ground is the pigment by default. One colour to change, and the frame
  // is automatically in the same family as the light -- which is what a lit
  // room actually looks like. Untick to drive it separately.
  const linked = $('linkBg').checked;
  $('bg').disabled = linked;
  $('bg-hex').disabled = linked;
  if (linked) { $('bg').value = $('pigment').value; $('bg-hex').value = $('pigment').value; }
  for(const [id,u] of Object.entries(COL)) view.set(u,hexToRgb($(id).value));

  const cx=parseFloat($('coreX').value), cy=parseFloat($('coreY').value);
  view.set('uCore',[cx,cy]); $('o-coreX').textContent=cx.toFixed(2); $('o-coreY').textContent=cy.toFixed(2);
  view.set('uPos',[0,0]);
}
for(const id of [...Object.keys(NUM),...Object.keys(COL),'coreX','coreY','linkBg']) $(id).addEventListener('input',push);

// hex field <-> swatch, both directions. colours arrive as hex, from a
// reference or from Figma, and typing one is faster than the native picker.
for (const id of Object.keys(COL)) {
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
  for (const [k, v] of Object.entries(p)) {
    const el = $(k); if (!el) continue;
    el.value = v;
    const hx = $(k + '-hex'); if (hx) hx.value = v;
  }
  for (const b of document.querySelectorAll('.preset'))
    b.setAttribute('aria-current', String(b.dataset.k === name));
  push();
}
for (const b of document.querySelectorAll('.preset')) b.onclick = () => apply(b.dataset.k);
addEventListener('keydown', (e) => {
  if (e.key === '1') apply('EMBER');
  if (e.key === '2') apply('ULTRA');
});

// dump the whole state, so a look you like can be pasted into a character file
$('copy').onclick = () => {
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
  view.set('uTime', t * 0.001);
  view.draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

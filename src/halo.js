import { quad, hexToRgb } from './gl.js';
import frag from './shaders/halo.frag?raw';

const view = quad(document.getElementById('c'), frag);
const $ = (id) => document.getElementById(id);

const NUM = {
  r: 'uR', bloom: 'uBloom', bloomOp: 'uBloomOp', frontOp: 'uFrontOp',
  intensity: 'uIntensity',
  grainSz: 'uGrain', churn: 'uChurn', glitter: 'uGlitter', limb: 'uLimb', flare: 'uFlare',
  gridAmt: 'uGridAmt', gridN: 'uGridN',
  glyphScale: 'uGlyphScale', groundShape: 'uGroundShape', fieldOp: 'uFieldOp',
  mouseR: 'uMouseR', mouseAmt: 'uMouseAmt',
};
const COL = { pigment: 'uPigment', hot: 'uHot', glyphInk: 'uGlyphInk', groundA: 'uGroundA', groundB: 'uGroundB' };

function push() {
  for (const [id, u] of Object.entries(NUM)) {
    const v = parseFloat($(id).value);
    view.set(u, v);
    const o = $('o-' + id); if (o) o.textContent = v.toFixed(2);
  }
  for (const [id, u] of Object.entries(COL)) view.set(u, hexToRgb($(id).value));
  view.set('uPos', [0, 0.02]);
}
for (const id of [...Object.keys(NUM), ...Object.keys(COL)]) $(id).addEventListener('input', push);
push();

// cursor, damped -- it trails the pointer rather than snapping to it
const m = [0, 0], mt = [0, 0];
addEventListener('pointermove', (e) => {
  const s = Math.min(innerWidth, innerHeight);
  mt[0] = (e.clientX - innerWidth / 2) / s;
  mt[1] = -(e.clientY - innerHeight / 2) / s;
});

function frame(t) {
  m[0] += (mt[0] - m[0]) * 0.08;
  m[1] += (mt[1] - m[1]) * 0.08;
  view.set('uMouse', m);
  view.set('uTime', t * 0.001);
  view.draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

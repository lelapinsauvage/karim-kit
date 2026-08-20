import { quad, hexToRgb } from './gl.js';
import frag from './shaders/truchet.frag?raw';

const view = quad(document.getElementById('c'), frag);

const ui = (id) => document.getElementById(id);
const nums = ['shape', 'scale', 'thickness', 'breath', 'warp', 'jitter',
              'rough', 'breakup', 'density', 'drift', 'grain',
              'discR', 'discSoft', 'discShape', 'discScale'];
const uName = {
  shape: 'uShape', scale: 'uScale', thickness: 'uThickness', breath: 'uBreath',
  warp: 'uWarp', jitter: 'uJitter', rough: 'uRough', breakup: 'uBreakup',
  density: 'uDensity', drift: 'uDrift', grain: 'uGrain',
  discR: 'uDiscR', discSoft: 'uDiscSoft', discShape: 'uDiscShape',
  discScale: 'uDiscScale',
};
const FAMILIES = ['arc', 'chord', 'elbow', 'step'];

function push() {
  for (const n of nums) {
    const v = parseFloat(ui(n).value);
    view.set(uName[n], v);
    ui('o-' + n).textContent = v.toFixed(n === 'shape' ? 2 : 3);
  }
  const s = parseFloat(ui('shape').value);
  const i = Math.floor(s);
  const t = s - i;
  ui('fam').textContent = (t < 0.04 || t > 0.96) ? FAMILIES[t > 0.96 ? i + 1 : i]
    : `${FAMILIES[i]} → ${FAMILIES[i + 1]}  ${(t * 100) | 0}%`;
  view.set('uInk', hexToRgb(ui('ink').value));
  view.set('uGround', hexToRgb(ui('ground').value));
  view.set('uDiscInk', hexToRgb(ui('discInk').value));
  view.set('uDiscA', hexToRgb(ui('discA').value));
  view.set('uDiscB', hexToRgb(ui('discB').value));
  const dy = parseFloat(ui('discY').value);
  view.set('uDiscPos', [0, dy]);
  ui('o-discY').textContent = dy.toFixed(3);
}
for (const n of [...nums, 'ink', 'ground', 'discInk', 'discA', 'discB', 'discY']) ui(n).addEventListener('input', push);
push();

// the page no longer scrolls -- no scrollbar means no gutter, and the canvas
// is genuinely edge to edge. the wheel drives the rewire directly instead.
let rewire = 0, target = 0;
addEventListener('wheel', (e) => { target += e.deltaY * 0.0012; }, { passive: true });

addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() !== 'f') return;
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen();
});

function frame(t) {
  rewire += (target - rewire) * 0.07;   // lag so the rewire feels like matter
  view.set('uTime', t * 0.001);
  view.set('uRewire', rewire);
  view.draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

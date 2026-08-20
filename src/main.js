import { quad, hexToRgb } from './gl.js';
import { CHARACTERS } from './characters.js';
import { blend, easeInOut } from './tween.js';
import frag from './shaders/truchet.frag?raw';

const view = quad(document.getElementById('c'), frag);

// --- craft params: how the ink behaves. shared across all characters. --------
const ui = (id) => document.getElementById(id);
const nums = ['thickness', 'breath', 'warp', 'jitter', 'rough',
              'breakup', 'density', 'drift', 'grain', 'discSoft'];
const uName = {
  thickness: 'uThickness', breath: 'uBreath', warp: 'uWarp', jitter: 'uJitter',
  rough: 'uRough', breakup: 'uBreakup', density: 'uDensity', drift: 'uDrift',
  grain: 'uGrain', discSoft: 'uDiscSoft',
};
function pushCraft() {
  for (const n of nums) {
    const v = parseFloat(ui(n).value);
    view.set(uName[n], v);
    ui('o-' + n).textContent = v.toFixed(3);
  }
}
for (const n of nums) ui(n).addEventListener('input', pushCraft);
pushCraft();

// --- the slider -------------------------------------------------------------
// switching does not cross-fade two pictures. the halo grows until it has
// swallowed the viewport, the whole field changes underneath it, and it
// contracts again around the next character. one mechanism, both jobs.

const GROW = 2.1;      // radius at full cover, in uv units
const DUR  = 1500;     // ms

let from = 0, to = 0, startedAt = -1;

const figA = ui('figA'), figB = ui('figB');
const label = ui('label');

function applyFigure(el, ch) {
  if (ch.figure) { el.src = ch.figure; el.style.display = 'block'; }
  else el.style.display = 'none';
}
applyFigure(figA, CHARACTERS[0]);
label.textContent = CHARACTERS[0].name;

function go(dir) {
  if (startedAt >= 0) return;              // ignore input mid-transition
  from = to;
  to = (to + dir + CHARACTERS.length) % CHARACTERS.length;
  applyFigure(figB, CHARACTERS[to]);
  startedAt = performance.now();
}
addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') go(1);
  if (e.key === 'ArrowLeft')  go(-1);
  if (e.key.toLowerCase() === 'f') {
    document.fullscreenElement ? document.exitFullscreen()
                               : document.documentElement.requestFullscreen();
  }
});
addEventListener('click', (e) => { if (!e.target.closest('.panel')) go(1); });

let rewire = 0, rewireTarget = 0;
addEventListener('wheel', (e) => { rewireTarget += e.deltaY * 0.0012; }, { passive: true });

function frame(now) {
  let t = 0;
  if (startedAt >= 0) {
    t = (now - startedAt) / DUR;
    if (t >= 1) { t = 1; startedAt = -1; from = to; applyFigure(figA, CHARACTERS[to]); }
  }

  const a = CHARACTERS[from], b = CHARACTERS[to];
  const s = blend(a, b, t);

  // radius rides a bump: out past the viewport at the midpoint, back to halo
  const cover = Math.sin(Math.PI * easeInOut(t));
  const radius = s.haloR + (GROW - s.haloR) * cover;

  // the figures hand over while the field is covered, so no cross-dissolve
  const swap = Math.min(Math.max((t - 0.42) / 0.16, 0), 1);
  figA.style.opacity = String(1 - swap);
  figB.style.opacity = String(swap);
  if (t > 0 && t < 1) label.textContent = t < 0.5 ? a.name : b.name;

  view.set('uShape', s.shape);
  view.set('uScale', s.scale);
  view.set('uGround', s.ground);
  view.set('uInk', s.ink);
  view.set('uDiscInk', s.discInk);
  view.set('uDiscA', s.discA);
  view.set('uDiscB', s.discB);
  view.set('uDiscShape', s.discShape);
  view.set('uDiscScale', s.discScale);
  view.set('uHaloForm', s.haloForm);
  view.set('uHaloN', s.haloN);
  view.set('uHaloRot', now * 0.00004);
  view.set('uDiscR', radius);
  view.set('uDiscPos', [0, 0.06]);

  rewire += (rewireTarget - rewire) * 0.07;
  view.set('uTime', now * 0.001);
  view.set('uRewire', rewire);
  view.draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

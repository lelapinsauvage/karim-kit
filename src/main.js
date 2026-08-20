import { quad, hexToRgb } from './gl.js';
import { CHARACTERS } from './characters.js';
import { blend, easeInOut } from './tween.js';
import frag from './shaders/truchet.frag?raw';

const view = quad(document.getElementById('c'), frag);

// --- craft params: how the ink behaves. shared across all characters. --------
const ui = (id) => document.getElementById(id);
const nums = ['thickness', 'breath', 'warp', 'jitter', 'rough',
              'breakup', 'density', 'drift', 'grain', 'discSoft', 'figWarp'];
const uName = {
  thickness: 'uThickness', breath: 'uBreath', warp: 'uWarp', jitter: 'uJitter',
  rough: 'uRough', breakup: 'uBreakup', density: 'uDensity', drift: 'uDrift',
  grain: 'uGrain', discSoft: 'uDiscSoft', figWarp: 'uFigWarp',
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

const label = ui('label');
label.textContent = CHARACTERS[0].name;

// one texture unit per character, loaded once
const TEX = CHARACTERS.map((ch, i) => view.texture(ch.figure, i));

function go(dir) {
  if (startedAt >= 0) return;              // ignore input mid-transition
  from = to;
  to = (to + dir + CHARACTERS.length) % CHARACTERS.length;
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
    if (t >= 1) { t = 1; startedAt = -1; from = to; }
  }

  const a = CHARACTERS[from], b = CHARACTERS[to];
  const s = blend(a, b, t);

  // radius rides a bump: out past the viewport at the midpoint, back to halo
  const cover = Math.sin(Math.PI * easeInOut(t));
  const radius = s.haloR + (GROW - s.haloR) * cover;

  // the halo edge itself performs the changeover -- no opacity anywhere.
  // first half: the growing halo reveals the incoming figure. after the
  // midpoint it owns the frame and the halo contracts around it.
  const wipeActive = startedAt >= 0 && t < 0.5 ? 1 : 0;
  const wipeDone   = t >= 0.5 ? 1 : 0;
  view.bind(TEX[from], 'uTexA');
  view.bind(TEX[to],   'uTexB');
  view.set('uFigA', [TEX[from].aspect, a.figH, a.figY, 0]);
  view.set('uFigB', [TEX[to].aspect,   b.figH, b.figY, 0]);
  view.set('uWipeActive', wipeActive);
  view.set('uWipeDone', wipeDone);
  view.set('uFigWarp', parseFloat(ui('figWarp').value));
  label.textContent = t < 0.5 ? a.name : b.name;

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

import { quad, hexToRgb } from './gl.js';
import { LOOKS, GROUND } from './looks.js';
import frag from './shaders/hero.frag?raw';

const view = quad(document.getElementById('c'), frag);
const $ = (id) => document.getElementById(id);

// --- loader: tracks real decode progress, not a timer ------------------------
const ASSETS = [];                              // figure cutouts go here
let decoded = 0;
ASSETS.forEach((src) => {
  const img = new Image();
  img.onload = img.onerror = () => { decoded++; };
  img.src = src;
});

let shown = 0, ready = false;
function loading(now) {
  const target = ASSETS.length ? decoded / ASSETS.length : Math.min(1, now / 900);
  shown += (target - shown) * 0.08;
  $('pct').textContent = Math.round(shown * 100);
  if (!ready && shown > 0.995) {
    ready = true;
    $('loader').classList.add('done');
  }
  // the halo scales with progress -- the site introduces itself before it exists
  return ready ? 1 : shown;
}

// --- looks -------------------------------------------------------------------
const REST = 0.30, COVER = 2.6, DUR = 1250;
const ease    = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - Math.pow(-2 * t + 2, 3) / 2);
const EO_K = 5.5, EO_N = 1 - 2 ** -EO_K;
const easeOut = (t) => (1 - 2 ** (-EO_K * t)) / EO_N;   // normalised: lands on 1

let cur = 0, nxt = 0, startedAt = -1;

const nav = $('nav');
LOOKS.forEach((_, i) => {
  const b = document.createElement('button');
  b.className = 'dot';
  b.onclick = () => goTo(i);
  nav.appendChild(b);
});

function paintRail(l) {
  $('r-lot').textContent = `LOT ${l.lot} — 04`;
  $('r-name').textContent = l.name;
  $('r-pig').textContent = l.pigment;
  $('r-org').textContent = l.origin;
  $('r-cloth').textContent = l.cloth;
  $('m-mark').textContent = `◼ 40181 · ${l.lot}`;
  [...nav.children].forEach((d, i) => d.setAttribute('aria-current', String(i === nxt)));
}
paintRail(LOOKS[0]);

function goTo(i) {
  if (startedAt >= 0 || i === nxt) return;
  cur = nxt;
  nxt = i;
  startedAt = performance.now();
}
const go = (dir) => goTo((nxt + dir + LOOKS.length) % LOOKS.length);
addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') go(1);
  if (e.key === 'ArrowUp'   || e.key === 'ArrowLeft')  go(-1);
});
addEventListener('click', (e) => { if (!e.target.closest('.dot')) go(1); });
let wheelLock = 0;
addEventListener('wheel', (e) => {
  if (performance.now() < wheelLock || Math.abs(e.deltaY) < 12) return;
  wheelLock = performance.now() + 900;
  go(e.deltaY > 0 ? 1 : -1);
}, { passive: true });

// --- frame -------------------------------------------------------------------
const gA = hexToRgb(GROUND.a), gB = hexToRgb(GROUND.b), gInk = hexToRgb(GROUND.ink);
let railIs = 0;

function frame(now) {
  const boot = loading(now);

  let t = 0;
  if (startedAt >= 0) {
    t = (now - startedAt) / DUR;
    // t falls to 0 on the completing frame -- leaving it at 1 renders one frame
    // of the resting shape wearing end-of-transition values
    if (t >= 1) { t = 0; startedAt = -1; cur = nxt; }
  }
  const a = LOOKS[cur], b = LOOKS[nxt];
  const idle = startedAt < 0;

  // forward only: the halo grows past the frame, then the next is born from zero
  const radius = idle ? REST * boot
    : (t < 0.5 ? REST + (COVER - REST) * ease(t * 2)
               : REST * easeOut((t - 0.5) * 2));
  const st = t < 0.5 ? a : b;

  if (railIs !== (t < 0.5 ? cur : nxt)) { railIs = t < 0.5 ? cur : nxt; paintRail(LOOKS[railIs]); }

  view.set('uGroundA', gA);
  view.set('uGroundB', gB);
  view.set('uGroundInk', gInk);
  view.set('uGroundShape', st.shape);
  view.set('uGroundScale', st.scale);

  view.set('uHaloR', radius);
  view.set('uHaloForm', st.form);
  view.set('uHaloN', st.sides);
  view.set('uHaloA', hexToRgb(st.halo));
  view.set('uHaloB', hexToRgb(st.haloDeep));
  view.set('uHaloInk', hexToRgb(st.haloInk));
  view.set('uPos', [-0.02, 0.04]);

  view.set('uTime', now * 0.001);
  view.draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

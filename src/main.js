import { quad, hexToRgb } from './gl.js';
import { CHARACTERS } from './characters.js';
import frag from './shaders/truchet.frag?raw';

const view = quad(document.getElementById('c'), frag);

// --- craft params: how the ink behaves. shared across all characters. --------
const ui = (id) => document.getElementById(id);
const nums = ['thickness', 'breath', 'warp', 'jitter', 'rough',
              'breakup', 'density', 'drift', 'grain', 'discSoft', 'figWarp', 'figFlow', 'figEdge', 'figTone'];
const uName = {
  thickness: 'uThickness', breath: 'uBreath', warp: 'uWarp', jitter: 'uJitter',
  rough: 'uRough', breakup: 'uBreakup', density: 'uDensity', drift: 'uDrift',
  grain: 'uGrain', discSoft: 'uDiscSoft', figWarp: 'uFigWarp', figFlow: 'uFigFlow',
  figEdge: 'uFigEdge', figTone: 'uFigTone',
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

// --- the changeover ---------------------------------------------------------
// Forward only. Phase 1: the current disc grows until it fills the frame --
// at which point the screen IS the next character's ground, because the chain
// is authored that way. Phase 2: the next disc is born from zero at the centre.
// Nothing shrinks back, and nothing cross-fades.

const COVER = 2.6;     // disc radius that clears the corners, in uv units
const DUR   = 1150;    // ms

const ease    = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeIn  = (t) => t * t * t;                       // the disc accelerates away
const easeOut = (t) => 1 - Math.pow(2, -9 * t);         // the next one arrives fast
const hex  = (h) => { const n = parseInt(h.slice(1), 16);
  return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
const lerp3 = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

let cur = 0, nxt = 0, startedAt = -1;
const label = ui('label');
const TEX = CHARACTERS.map((ch, i) => ch.figure ? view.texture(ch.figure, i) : null);

function go(dir) {
  if (startedAt >= 0) return;
  cur = nxt;
  nxt = (nxt + dir + CHARACTERS.length) % CHARACTERS.length;
  startedAt = performance.now();
}

let showFigures = false;
addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'h') showFigures = !showFigures;
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
    if (t >= 1) { t = 1; startedAt = -1; cur = nxt; }
  }

  const a = CHARACTERS[cur], b = CHARACTERS[nxt];
  let st, radius, ground, ink, shape, scale;

  if (t < 0.5) {
    // phase 1 -- a's disc accelerates outward and swallows the frame
    const p = easeIn(t * 2);
    st = a;
    radius = a.haloR + (COVER - a.haloR) * p;
    ground = [hex(a.groundA), hex(a.groundB)];
    ink = hex(a.ink); shape = a.shape; scale = a.scale;
  } else {
    // phase 2 -- the frame is now b's ground; b's disc is born from zero.
    // the ground pattern morphs out of a's disc pattern over the first slice,
    // so the field reorganises by morphing rather than by cutting.
    // easeOut, so the new shape is most of the way there within a third of the
    // phase instead of crawling in behind the changeover
    const p = easeOut((t - 0.5) * 2);
    const m = Math.min(1, (t - 0.5) * 2 / 0.35);
    st = b;
    radius = b.haloR * p;
    ground = [hex(b.groundA), hex(b.groundB)];
    ink   = lerp3(hex(a.discInk), hex(b.ink), m);
    shape = a.discShape + (b.shape - a.discShape) * m;
    scale = a.scale * a.discScale + (b.scale - a.scale * a.discScale) * m;
  }

  view.set('uShape', shape);
  view.set('uScale', scale);
  view.set('uGroundA', ground[0]);
  view.set('uGroundB', ground[1]);
  view.set('uInk', ink);
  view.set('uDiscR', radius);
  view.set('uDiscPos', [0, 0.06]);
  view.set('uDiscShape', st.discShape);
  view.set('uDiscScale', st.discScale);
  view.set('uDiscInk', hex(st.discInk));
  view.set('uDiscA', hex(st.discA));
  view.set('uDiscB', hex(st.discB));
  view.set('uHaloForm', st.haloForm);
  view.set('uHaloN', st.haloN);
  view.set('uHaloRot', now * 0.00004);

  const tex = TEX[t < 0.5 ? cur : nxt];
  if (tex) {
    view.bind(tex, 'uTexA');
    view.set('uFigA', [tex.aspect, st.figH ?? 1.3, st.figY ?? -0.36, 0]);
    view.set('uRectA', tex.rect);
  }
  view.set('uFigShow', showFigures && tex ? 1 : 0);

  label.textContent = st.name;

  rewire += (rewireTarget - rewire) * 0.07;
  view.set('uTime', now * 0.001);
  view.set('uRewire', rewire);
  view.draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

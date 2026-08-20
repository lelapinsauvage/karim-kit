import { quad, hexToRgb } from './gl.js';
import { CHARACTERS } from './characters.js';
import frag from './shaders/truchet.frag?raw';

const view = quad(document.getElementById('c'), frag);

// --- craft params: how the ink behaves. shared across all characters. --------
const ui = (id) => document.getElementById(id);
const nums = ['thickness', 'breath', 'warp', 'jitter', 'rough',
              'breakup', 'density', 'drift', 'grain', 'glow', 'discSoft', 'figWarp', 'figFlow', 'figEdge', 'figTone'];
const uName = {
  thickness: 'uThickness', breath: 'uBreath', warp: 'uWarp', jitter: 'uJitter',
  rough: 'uRough', breakup: 'uBreakup', density: 'uDensity', drift: 'uDrift',
  grain: 'uGrain', glow: 'uGlow', discSoft: 'uDiscSoft', figWarp: 'uFigWarp', figFlow: 'uFigFlow',
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

const ZOOM  = 1.6;     // outer pull-out per changeover, folded into the chain
const COVER = 2.6;     // disc radius that clears the corners, in uv units
const DUR   = 1150;    // ms

const ease    = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeIn  = (t) => t * t * t;                       // the disc accelerates away
// NORMALISED. An unnormalised 1 - 2^(-k t) never reaches 1: it left the incoming
// disc at 97.8% of its resting radius and 103.5% of its resting pattern scale,
// which then snapped on the handover frame. Cells re-index when scale changes,
// so the whole maze re-rolled -- visible as a glitch even though the numbers
// were within a few percent.
const EO_K = 5.5, EO_N = 1 - Math.pow(2, -EO_K);
const easeOut = (t) => (1 - Math.pow(2, -EO_K * t)) / EO_N;
const hex  = (h) => { const n = parseInt(h.slice(1), 16);
  return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
const lerp3 = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const mixHex = (p, q, t) => lerp3(hex(p), hex(q), t);
const smoothstep = (e0, e1, x) => {
  const u = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1);
  return u * u * (3 - 2 * u);
};

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

// debug: ?frz=<0..1> freezes the changeover at that progress, ?frz=idle holds
// the resting state. lets two exact frames be compared pixel for pixel.
let FRZ = new URLSearchParams(location.search).get('frz');
window.__setFrz = (v) => { FRZ = v; if (v !== 'idle' && v !== null) { cur = 0; nxt = 1; } };
if (FRZ !== null && FRZ !== 'idle') { cur = 0; nxt = 1; }

function frame(now) {
  let t = 0;
  if (FRZ !== null) {
    if (FRZ === 'idle') { cur = nxt = 1; t = 0; startedAt = -1; }
    else { t = parseFloat(FRZ); startedAt = 1; }
  } else if (startedAt >= 0) {
    t = (now - startedAt) / DUR;
    // t must fall to 0, not stay at 1. On the completing frame `idle` flips
    // true and the shape snaps to its resting radius -- but every t-driven
    // value (mulOuter above all, at 1.6x) was still reading end-of-transition.
    // One frame of the resting shape wearing the wrong pattern scale: the blink.
    if (t >= 1) { t = 0; startedAt = -1; cur = nxt; }
  }
  const idleFlag = FRZ === 'idle' || (FRZ === null && startedAt < 0);

  const a = CHARACTERS[cur], b = CHARACTERS[nxt];
  const idle = idleFlag;

  // Three concentric zones. At rest the outer disc is the current character's
  // halo and the inner one has no radius. Through a changeover the outer disc
  // accelerates off the frame while the inner -- the next character -- is
  // already growing behind it, so nothing waits for a full-cover moment.
  // the outer disc must clear the frame completely before the next one starts.
  // overlapping them read as glitching, not as continuity.
  const outerR = idle ? a.haloR : a.haloR + (COVER - a.haloR) * easeIn(t * 2 > 1 ? 1 : t * 2);
  const innerR = idle || t < 0.5 ? 0 : b.haloR * easeOut((t - 0.5) * 2);

  view.set('uGZoom', 1);

  // Each layer's pattern scale animates, and each goes ONE WAY.
  // outer: pulls out by ZOOM across the whole changeover and stops there --
  //   the chain expects it, so it lands on the next resting scale exactly.
  // inner: arrives already pulled out and zooms in to rest. Also one way.
  const p2       = t < 0.5 ? 0 : (t - 0.5) * 2;
  const mulOuter = 1 + (ZOOM - 1) * ease(t);
  const mulInner = 1 + 1.6 * (1 - easeOut(p2));

  // ground = the current character's field
  view.set('uShape',   a.shape);
  view.set('uScale',   a.scale);
  view.set('uGroundA', hex(a.groundA));
  view.set('uGroundB', hex(a.groundB));
  view.set('uInkA',    hex(a.inkA));
  view.set('uInkB',    hex(a.inkB));

  // outer = the current character's disc. Its COLOUR lerps toward the next
  // character's ground as it expands, on the same curve the gradient mapping
  // uses -- so by full cover it already is the next dark field and the handover
  // has nothing to reveal. Shape and scale still chain numerically.
  const k = smoothstep(0.7, 1.8, outerR);
  view.set('uOuter',  [outerR, a.haloForm, a.haloN, a.discShape]);
  view.set('uOuterX', [a.discScale * mulOuter, 0, 0]);
  view.set('uOInkA',  mixHex(a.discInkA, b.inkA, k));
  view.set('uOInkB',  mixHex(a.discInkB, b.inkB, k));
  view.set('uOA',     mixHex(a.discA,   b.groundA, k));
  view.set('uOB',     mixHex(a.discB,   b.groundB, k));

  // inner = the next character's disc
  // the incoming halo is BORN as the outgoing one's form and morphs into its
  // own as it settles -- otherwise the silhouette simply swaps at the handover
  const iForm = a.haloForm + (b.haloForm - a.haloForm) * easeOut(p2);
  const iN    = a.haloN    + (b.haloN    - a.haloN)    * easeOut(p2);
  view.set('uInner',  [innerR, iForm, iN, b.discShape]);
  // inner is expressed relative to the GROUND's scale, so convert through b's
  // own resting scale -- otherwise it lands a factor off when it becomes ground
  view.set('uInnerX', [(b.scale * b.discScale / a.scale) * mulInner, 0, 0]);
  view.set('uIInkA',  hex(b.discInkA));
  view.set('uIInkB',  hex(b.discInkB));
  view.set('uIA',     hex(b.discA));
  view.set('uIB',     hex(b.discB));

  view.set('uDiscPos', [0, 0.06]);
  view.set('uHaloRot', FRZ !== null ? 0.0005 : now * 0.00004);

  const tex = TEX[idle ? cur : nxt];
  if (tex) {
    view.bind(tex, 'uTexA');
    view.set('uFigA', [tex.aspect, 1.3, -0.36, 0]);
    view.set('uRectA', tex.rect);
  }
  view.set('uFigShow', showFigures && tex ? 1 : 0);
  label.textContent = (t > 0.55 ? b : a).name;

  rewire += (rewireTarget - rewire) * 0.07;
  view.set('uTime', FRZ !== null ? 12.0 : now * 0.001);
  view.set('uRewire', rewire);
  view.draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

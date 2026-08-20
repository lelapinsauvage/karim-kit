// numeric + hex crossfade between two character signatures.

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const hex = (h) => {
  const n = parseInt(h.replace('#', ''), 16);
  return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
};

const mixRgb = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

const NUM = ['shape', 'scale', 'haloForm', 'haloN', 'haloR', 'discShape', 'discScale'];
const COL = ['ground', 'ink', 'discInk', 'discA', 'discB'];

export function blend(a, b, raw) {
  const t = easeInOut(Math.min(Math.max(raw, 0), 1));
  const out = {};
  for (const k of NUM) out[k] = a[k] + (b[k] - a[k]) * t;
  for (const k of COL) out[k] = mixRgb(hex(a[k]), hex(b[k]), t);
  return out;
}

export { easeInOut };

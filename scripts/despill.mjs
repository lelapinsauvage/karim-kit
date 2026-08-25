// Remove backdrop colour bleeding into the subject's edge.
//
// A saturated seamless bounces its own colour onto hair and shoulders. The
// background remover takes the backdrop out and leaves that bounce behind,
// baked into OPAQUE pixels -- so eroding the alpha does nothing, because the
// stain is inside the matte, not on its feathered edge.
//
// This is the standard compositing fix: near the edge, clamp the offending hue
// back toward the pixel's own neutral. Strength falls off with distance from
// the edge, so the interior of the figure is never touched.
//
// usage: node scripts/despill.mjs <file.png> <#hex-of-backdrop> [radius]

import sharp from 'sharp';

const [file, hex, radiusArg] = process.argv.slice(2);
if (!file || !hex) {
  console.error('usage: despill.mjs <file.png> <#rrggbb> [radius]');
  process.exit(1);
}
const RADIUS = Number(radiusArg ?? 12);

const spill = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const img = sharp(file).ensureAlpha();
const { width, height } = await img.metadata();
const buf = await img.raw().toBuffer();      // RGBA

// Distance to the nearest transparent pixel, in whole pixels, computed with two
// passes of a chamfer transform. Cheaper than a true EDT and accurate enough --
// the falloff only has to be smooth, not metric.
const INF = 1e9;
const dist = new Float32Array(width * height);
for (let i = 0; i < dist.length; i++) dist[i] = buf[i * 4 + 3] < 250 ? 0 : INF;

const relax = (i, j, w) => { const d = dist[j] + w; if (d < dist[i]) dist[i] = d; };
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const i = y * width + x;
    if (x > 0) relax(i, i - 1, 1);
    if (y > 0) relax(i, i - width, 1);
    if (x > 0 && y > 0) relax(i, i - width - 1, 1.414);
    if (x < width - 1 && y > 0) relax(i, i - width + 1, 1.414);
  }
}
for (let y = height - 1; y >= 0; y--) {
  for (let x = width - 1; x >= 0; x--) {
    const i = y * width + x;
    if (x < width - 1) relax(i, i + 1, 1);
    if (y < height - 1) relax(i, i + width, 1);
    if (x < width - 1 && y < height - 1) relax(i, i + width + 1, 1.414);
    if (x > 0 && y < height - 1) relax(i, i + width - 1, 1.414);
  }
}

// How much of the backdrop colour is in this pixel, as a projection onto the
// spill colour's own direction. Using a projection rather than a per-channel
// test means a pink stain is detected on brown hair and on blue wool alike.
const mag = Math.hypot(...spill) || 1;
const unit = spill.map((c) => c / mag);

let touched = 0;
for (let i = 0; i < width * height; i++) {
  const d = dist[i];
  if (d >= RADIUS || buf[i * 4 + 3] < 8) continue;
  const fall = 1 - d / RADIUS;                       // 1 at the edge, 0 at RADIUS

  const r = buf[i * 4], g = buf[i * 4 + 1], b = buf[i * 4 + 2];
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  // the part of this pixel pointing along the spill colour, beyond its own grey
  const along = (r - lum) * unit[0] + (g - lum) * unit[1] + (b - lum) * unit[2];
  if (along <= 0) continue;

  const k = along * fall * 0.9;
  buf[i * 4]     = Math.max(0, Math.min(255, r - k * unit[0]));
  buf[i * 4 + 1] = Math.max(0, Math.min(255, g - k * unit[1]));
  buf[i * 4 + 2] = Math.max(0, Math.min(255, b - k * unit[2]));
  touched++;
}

await sharp(buf, { raw: { width, height, channels: 4 } }).png().toFile(file + '.tmp');
const { renameSync } = await import('node:fs');
renameSync(file + '.tmp', file);
console.log(`  despilled ${hex} from ${touched.toLocaleString()} px within ${RADIUS}px of the edge`);

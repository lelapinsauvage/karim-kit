// Depth map for a local image, via Replicate.
//
// The relight technique needs two things from a photograph: a depth map for the
// body's form, and the image's own luminance for fabric micro-detail. Depth
// alone is far too smooth to resolve a weave; luminance alone has no idea which
// way a shoulder turns. Together they give a usable normal.
//
// usage: node scripts/depth.mjs src/figures/figure.png

import { readFileSync, writeFileSync, existsSync } from 'node:fs';

if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.+)\s*$/);
    if (m) process.env[m[1]] ??= m[2];
  }
}
const TOKEN = process.env.REPLICATE_API_TOKEN;
if (!TOKEN) throw new Error('REPLICATE_API_TOKEN missing');
const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

const src = process.argv[2];
if (!src) throw new Error('usage: node scripts/depth.mjs <image>');

// the model needs a URL, so inline the file as a data URI
const b64 = readFileSync(src).toString('base64');
const dataUri = `data:image/png;base64,${b64}`;

const meta = await (await fetch('https://api.replicate.com/v1/models/chenxwh/depth-anything-v2', { headers: H })).json();

let p = await (await fetch('https://api.replicate.com/v1/predictions', {
  method: 'POST', headers: { ...H, Prefer: 'wait' },
  body: JSON.stringify({ version: meta.latest_version.id, input: { image: dataUri, model_size: 'Large' } }),
})).json();

if (p.detail) throw new Error(p.detail);
while (p.status === 'starting' || p.status === 'processing') {
  await new Promise((r) => setTimeout(r, 2500));
  p = await (await fetch(p.urls.get, { headers: H })).json();
  process.stdout.write('.');
}
if (p.status !== 'succeeded') throw new Error(`${p.status}: ${p.error}`);

const url = Array.isArray(p.output) ? p.output[0] : (p.output.grey_depth ?? p.output);
const out = src.replace(/\.png$/, '-depth.png');
writeFileSync(out, Buffer.from(await (await fetch(url)).arrayBuffer()));
console.log(`\n-> ${out}`);

// Generic Replicate image generator + background remover.
//
// usage: node scripts/generate.mjs <name> "<prompt>" [more name/prompt pairs]
//        REFS="a.jpg,b.jpg" node scripts/generate.mjs <name> "<prompt>"
//
// Writes src/figures/<name>.png with the background removed.
//
// REFS is the important one. nano-banana-pro takes up to 14 reference images
// and they carry look far better than any adjective can: a moodboard of the
// palette, the garments and the lighting you actually want beats a paragraph
// describing them, every time. Words select from an average; a reference
// selects from a picture.

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { extname } from 'node:path';

if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.+)\s*$/);
    if (m) process.env[m[1]] ??= m[2];
  }
}
const TOKEN = process.env.REPLICATE_API_TOKEN;
if (!TOKEN) throw new Error('REPLICATE_API_TOKEN missing (put it in .env.local)');

const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

// Local files go up as data URIs. Replicate accepts them directly, which saves
// a separate upload round trip per reference -- and with a dozen references
// that round trip is most of the wall clock.
const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
function asDataURI(path) {
  const ext = extname(path).toLowerCase();
  const mime = MIME[ext];
  if (!mime) throw new Error(`generate: unsupported reference type ${ext} (${path})`);
  return `data:${mime};base64,${readFileSync(path).toString('base64')}`;
}

// REFS=a.jpg,b.jpg  or  REFS=/some/folder  (every image in it)
function loadRefs() {
  const spec = process.env.REFS;
  if (!spec) return [];
  const out = [];
  for (const item of spec.split(',').map((x) => x.trim()).filter(Boolean)) {
    // Braces are load-bearing. Without them the else binds to the INNER if,
    // so every non-image in a folder -- one .DS_Store is enough -- pushes the
    // folder itself as a reference and the run dies on it.
    if (statSync(item).isDirectory()) {
      for (const f of readdirSync(item).sort()) {
        if (MIME[extname(f).toLowerCase()]) out.push(`${item}/${f}`);
      }
    } else {
      out.push(item);
    }
  }
  // 14 is the model's ceiling. Truncate loudly -- a moodboard silently cut in
  // half is a look you cannot reproduce and cannot explain.
  if (out.length > 14) {
    console.log(`  ${out.length} references, using the first 14`);
    out.length = 14;
  }
  return out;
}

// official models take POST /models/{owner}/{name}/predictions.
// community models 404 there and need a version id via POST /predictions.
async function start(model, input) {
  let res = await fetch(`https://api.replicate.com/v1/models/${model}/predictions`, {
    method: 'POST', headers: { ...H, Prefer: 'wait' }, body: JSON.stringify({ input }),
  });
  if (res.status !== 404) return res;
  const meta = await (await fetch(`https://api.replicate.com/v1/models/${model}`, { headers: H })).json();
  return fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST', headers: { ...H, Prefer: 'wait' },
    body: JSON.stringify({ version: meta.latest_version.id, input }),
  });
}

// the image models rate-limit under load. retry rather than fail the batch --
// live, this is the difference between a hiccup and a dead minute on stream.
async function run(model, input, tries = 4) {
  for (let i = 1; ; i++) {
    try { return await attempt(model, input); }
    catch (err) {
      if (i >= tries || !/RateLimit|unavailable|high demand|502|503/i.test(String(err))) throw err;
      const wait = i * 8000;
      console.log(`\n  rate limited, retry ${i}/${tries - 1} in ${wait / 1000}s`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

async function attempt(model, input) {
  const res = await start(model, input);
  let p = await res.json();
  if (p.error) throw new Error(`${model}: ${p.error}`);
  if (p.detail) throw new Error(`${model}: ${p.detail}`);
  while (p.status === 'starting' || p.status === 'processing') {
    await new Promise((r) => setTimeout(r, 2000));
    p = await (await fetch(p.urls.get, { headers: H })).json();
  }
  if (p.status !== 'succeeded') throw new Error(`${model}: ${p.status} ${p.error ?? ''}`);
  return Array.isArray(p.output) ? p.output[0] : p.output;
}

const REF_PATHS = loadRefs();
const REFS = REF_PATHS.map(asDataURI);
if (REFS.length) console.log(`  ${REFS.length} reference image(s)`);

const pairs = process.argv.slice(2);
for (let i = 0; i < pairs.length; i += 2) {
  const [name, prompt] = [pairs[i], pairs[i + 1]];
  process.stdout.write(`${name}: generating… `);
  const raw = await run('google/nano-banana-pro', {
    prompt, aspect_ratio: '3:4', resolution: '2K', output_format: 'png',
    ...(REFS.length ? { image_input: REFS } : {}),
  });
  process.stdout.write('cutting out… ');
  const cut = await run('851-labs/background-remover', { image: raw, format: 'png' });
  const buf = Buffer.from(await (await fetch(cut)).arrayBuffer());
  writeFileSync(`src/figures/${name}.png`, buf);
  console.log(`${(buf.length / 1024 | 0)}kb -> src/figures/${name}.png`);
}

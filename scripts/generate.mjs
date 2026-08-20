// Generic Replicate image generator + background remover.
// usage: node scripts/generate.mjs <name> "<prompt>" [more name/prompt pairs]
//
// Writes src/figures/<name>.png with the background removed.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';

if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.+)\s*$/);
    if (m) process.env[m[1]] ??= m[2];
  }
}
const TOKEN = process.env.REPLICATE_API_TOKEN;
if (!TOKEN) throw new Error('REPLICATE_API_TOKEN missing (put it in .env.local)');

const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

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

const pairs = process.argv.slice(2);
for (let i = 0; i < pairs.length; i += 2) {
  const [name, prompt] = [pairs[i], pairs[i + 1]];
  process.stdout.write(`${name}: generating… `);
  const raw = await run('google/nano-banana-pro', {
    prompt, aspect_ratio: '3:4', resolution: '2K', output_format: 'png',
  });
  process.stdout.write('cutting out… ');
  const cut = await run('851-labs/background-remover', { image: raw, format: 'png' });
  const buf = Buffer.from(await (await fetch(cut)).arrayBuffer());
  writeFileSync(`src/figures/${name}.png`, buf);
  console.log(`${(buf.length / 1024 | 0)}kb -> src/figures/${name}.png`);
}

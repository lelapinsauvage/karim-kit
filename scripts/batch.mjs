import { MODELS, prompt } from './models.mjs';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

// node scripts/batch.mjs               -> everything, flat
// node scripts/batch.mjs cinema         -> everything, cinema
// node scripts/batch.mjs cinema n02 n04 -> just those two, cinema
const argv = process.argv.slice(2);
const look = argv[0] === 'cinema' || argv[0] === 'flat' ? argv.shift() : 'flat';
const only = argv;
const list = only.length ? MODELS.filter(([n]) => only.includes(n)) : MODELS;

// The look goes in the FILENAME. Two versions of the same subject under
// different light are the comparison that decides which look ships, and
// overwriting one with the other destroys exactly that.
const out = (n) => (look === 'flat' ? n : `${n}-${look}`);

for (const [name, body] of list) {
  const file = out(name);
  if (existsSync(`src/figures/${file}.png`)) { console.log(`${file}: exists, skipping`); continue; }
  try {
    execFileSync('node', ['scripts/generate.mjs', file, prompt(body, look)], { stdio: 'inherit' });
    execFileSync('sips', ['-Z', '1400', `src/figures/${file}.png`, '--out', `src/figures/${file}.png`],
                 { stdio: 'ignore' });
  } catch (e) {
    console.log(`${file}: FAILED — ${e.message.split('\n')[0]}`);
  }
}

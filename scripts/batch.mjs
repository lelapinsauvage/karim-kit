import { MODELS, prompt } from './models.mjs';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const only = process.argv.slice(2);
const list = only.length ? MODELS.filter(([n]) => only.includes(n)) : MODELS;

for (const [name, body] of list) {
  if (existsSync(`src/figures/${name}.png`)) { console.log(`${name}: exists, skipping`); continue; }
  try {
    execFileSync('node', ['scripts/generate.mjs', name, prompt(body)], { stdio: 'inherit' });
    execFileSync('sips', ['-Z', '1400', `src/figures/${name}.png`, '--out', `src/figures/${name}.png`],
                 { stdio: 'ignore' });
  } catch (e) {
    console.log(`${name}: FAILED — ${e.message.split('\n')[0]}`);
  }
}

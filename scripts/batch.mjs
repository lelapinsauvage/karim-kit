import { MODELS, prompt } from './models.mjs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync } from 'node:fs';

const run = promisify(execFile);

// node scripts/batch.mjs            -> the whole set, all at once
// node scripts/batch.mjs a01 a03    -> just those
//
// Everything fires in parallel. Generation is a minute or two of waiting on
// someone else's GPU, so doing it one at a time is the single biggest waste
// available -- and live, nine minutes of it is a third of the clock.
const only = process.argv.slice(2);
const list = only.length ? MODELS.filter(([n]) => only.includes(n)) : MODELS;

const t0 = Date.now();
const jobs = list.map(async ([name, pose, ground, who, body]) => {
  // The skip-if-exists guard silently served stale images after a prompt
  // change -- the run reports success, the files are yesterday's, and the only
  // way to find out is to open one. Regenerating is the default; skipping is
  // opt-in.
  if (process.env.KEEP && existsSync(`src/figures/${name}.png`))
    return `${name}: exists, skipped`;
  try {
    await run('node', ['scripts/generate.mjs', name, prompt(pose, ground, who, body)]);
    await run('sips', ['-Z', '1400', `src/figures/${name}.png`,
                       '--out', `src/figures/${name}.png`]);
    return `${name}: done`;
  } catch (e) {
    return `${name}: FAILED - ${String(e.message).split('\n')[0].slice(0, 120)}`;
  }
});

for (const line of await Promise.all(jobs)) console.log(line);
console.log(`${list.length} in ${((Date.now() - t0) / 1000).toFixed(0)}s`);

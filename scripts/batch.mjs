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

// Staggered, not simultaneous. Ten requests landing on the same second is what
// trips the rate limit in the first place -- and then all ten back off together
// and trip it again. A second between starts costs nine seconds and turns a
// wall into a queue.
const stagger = (i) => new Promise((r) => setTimeout(r, i * 1000));

const jobs = list.map(async ([name, pose, ground, who, body], i) => {
  await stagger(i);
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

const lines = await Promise.all(jobs);
for (const line of lines) console.log(line);

const failed = lines.filter((l) => l.includes('FAILED'));
console.log(`${list.length - failed.length}/${list.length} in ${((Date.now() - t0) / 1000).toFixed(0)}s`);

// Say what is missing by name. A batch that half-succeeds and reports a
// duration is a batch nobody checks, and the gap turns up later as a figure
// that does not load.
if (failed.length) {
  console.log(`\nmissing: ${failed.map((l) => l.split(':')[0]).join(' ')}`);
  console.log('rerun just those: node scripts/batch.mjs ' + failed.map((l) => l.split(':')[0]).join(' '));
}

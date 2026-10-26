// Runs every API suite one after another against the local stack and prints one line per suite.
//   npm run test:api            (QA_DATABASE_URL and QA_API_URL as for a single suite)
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const suites = fs.readdirSync(dir).filter((f) => /^suite-.*\.mjs$/.test(f)).sort();

// A dev server that has just started compiles routes on first use, so wait until the API answers
const api = process.env.QA_API_URL || 'http://localhost:3001/api';
for (let i = 0; ; i++) {
  const up = await fetch(`${api}/workspaces`).then((r) => r.status < 500, () => false);
  if (up) break;
  if (i >= 60) { console.error(`The API at ${api} is not answering; start the backend first.`); process.exit(1); }
  await new Promise((r) => setTimeout(r, 2000));
}
let failedSuites = 0;
for (const suite of suites) {
  const run = spawnSync(process.execPath, [path.join(dir, suite)], { cwd: dir, encoding: 'utf8', env: process.env });
  const out = `${run.stdout || ''}${run.stderr || ''}`;
  const tally = out.match(/(\d+) passed, (\d+) failed/);
  const ok = run.status === 0 && tally && tally[2] === '0';
  if (!ok) failedSuites++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${suite.padEnd(42)} ${tally ? tally[0] : 'did not finish'}`);
  if (!ok) {
    for (const line of out.split('\n').filter((l) => /^FAIL |Error/.test(l)).slice(0, 8)) console.log('      ' + line);
  }
}
console.log(`\n${suites.length - failedSuites}/${suites.length} suites passed`);
process.exit(failedSuites ? 1 : 0);

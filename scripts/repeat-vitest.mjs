#!/usr/bin/env node
/**
 * Repeat critical Vitest files N times to expose intermittent failures.
 * Usage: node scripts/repeat-vitest.mjs --times 20
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const CRITICAL_TESTS = [
  '__tests__/cron-overlap.test.ts',
  '__tests__/cron-routes-smoke.test.ts',
  '__tests__/buffer-scheduler-integration.test.ts',
  '__tests__/firm-outreach-daily-cap-race.test.ts',
  '__tests__/custody-storage-concurrency.test.ts',
  '__tests__/health-ready.test.ts',
  '__tests__/vercel-cron-routes.test.ts',
];

function parseTimes(argv) {
  const idx = argv.indexOf('--times');
  if (idx === -1) return 20;
  const n = Number(argv[idx + 1]);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 20;
}

const times = parseTimes(process.argv.slice(2));
let failures = 0;

for (let i = 1; i <= times; i++) {
  const label = `repeat ${i}/${times}`;
  const result = spawnSync(
    'npx',
    ['vitest', 'run', ...CRITICAL_TESTS],
    { cwd: root, stdio: 'inherit', shell: true, env: process.env },
  );
  if (result.status !== 0) {
    failures += 1;
    console.error(`[repeat-vitest] FAILED on ${label}`);
  } else {
    console.log(`[repeat-vitest] passed ${label}`);
  }
}

if (failures > 0) {
  console.error(`[repeat-vitest] ${failures}/${times} runs failed`);
  process.exit(1);
}

console.log(`[repeat-vitest] all ${times} runs passed`);

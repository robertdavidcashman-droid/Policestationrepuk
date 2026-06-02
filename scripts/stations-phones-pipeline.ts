/**
 * Run custody audit flags, enrichment, and phone correction in order.
 * npx tsx scripts/stations-phones-pipeline.ts [--write] [--fetch]
 */
import { spawnSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const args = process.argv.slice(2);
const write = args.includes('--write');
const fetch = args.includes('--fetch');
const extra = write ? ['--write'] : [];
const fetchExtra = fetch ? ['--fetch'] : [];

function run(script: string, scriptArgs: string[]): void {
  const r = spawnSync('npx', ['tsx', resolve(__dirname, script), ...scriptArgs], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

run('audit-custody-stations.ts', write ? ['--apply-flags'] : []);
run('enrich-custody-phones.ts', [...extra, ...fetchExtra]);
run('correct-station-phones.ts', extra);

console.log('\n=== stations-phones-pipeline complete ===');

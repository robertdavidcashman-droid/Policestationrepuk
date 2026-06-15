#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const password = crypto.randomBytes(18).toString('base64url');
const outFile = path.join(root, '.generated-admin-password.txt');

function run(args) {
  const r = spawnSync('npx', ['--yes', 'vercel', ...args], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, CI: '1' },
  });
  if (r.stdout?.length) process.stdout.write(r.stdout);
  if (r.stderr?.length) process.stderr.write(r.stderr);
  if (r.status !== 0) process.exit(r.status ?? 1);
}

run(['env', 'rm', 'ADMIN_PASSWORD', 'production', '--yes']);
run([
  'env',
  'add',
  'ADMIN_PASSWORD',
  'production',
  '--value',
  password,
  '--sensitive',
  '--yes',
]);

fs.writeFileSync(outFile, password, { mode: 0o600 });
console.log(`\nSaved repuk admin password to ${outFile}`);
console.log('Redeploy: npx vercel --prod --yes');

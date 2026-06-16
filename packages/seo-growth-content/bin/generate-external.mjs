#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const script = path.join(__dirname, '..', 'src', 'generate-external-content.mjs');
const root = process.env.SEO_GROWTH_ROOT || process.cwd();
const result = spawnSync(process.execPath, [script], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, SEO_GROWTH_PKG: path.join(__dirname, '..', 'src') },
});
process.exit(result.status ?? 1);

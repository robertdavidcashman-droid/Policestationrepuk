#!/usr/bin/env node
/**
 * Start Next.js for Playwright site audit with KV/Vercel env stripped so
 * validateEnv() does not fail on empty strings and production KV is not used.
 */
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const port = process.env.PORT?.trim() || '3100';
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || `http://127.0.0.1:${port}`;

const STRIP = [
  'VERCEL',
  'VERCEL_ENV',
  'NEXT_PUBLIC_VERCEL_ENV',
  'KV_REST_API_URL',
  'KV_REST_API_TOKEN',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
];

const env = { ...process.env };
for (const key of STRIP) delete env[key];

env.NODE_ENV = 'production';
env.PORT = port;
env.NEXT_PUBLIC_SITE_URL = baseUrl;
env.LEGACY_REPS_PUBLIC = '1';
env.CRON_SECRET = env.CRON_SECRET || 'ci-smoke-placeholder-not-for-production';
env.DISABLE_KV_FOR_AUDIT = '1';

const child = spawn('npx', ['next', 'start', '--port', port], {
  cwd: root,
  env,
  stdio: 'inherit',
  shell: true,
});

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});

process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));

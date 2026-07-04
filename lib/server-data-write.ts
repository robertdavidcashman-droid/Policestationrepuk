import { mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';

/** Vercel serverless bundles are read-only under `/var/task`. */
export function canWriteProjectDataFiles(): boolean {
  return process.env.VERCEL !== '1';
}

export function resolveProjectDataPath(relativePath: string): string {
  return resolve(process.cwd(), relativePath);
}

/** Persist JSON under `data/` locally; skip silently on Vercel. */
export function tryWriteProjectJson(relativePath: string, data: unknown): boolean {
  if (!canWriteProjectDataFiles()) return false;
  const path = resolveProjectDataPath(relativePath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
  return true;
}

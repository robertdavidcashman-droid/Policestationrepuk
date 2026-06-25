import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  BUFFER_CHANNELS,
  BUFFER_ORG_ID,
  REPUK_BUFFER_CONTENT_FEEDS,
  SIBLING_LOCAL_TARGETS,
  VERCEL_BUFFER_PROJECTS,
} from '../scripts/lib/buffer-cross-site-config.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');

describe('buffer cross-site config', () => {
  it('exports org, channels, and three Vercel projects', () => {
    expect(BUFFER_ORG_ID).toMatch(/^[a-f0-9]{24}$/);
    expect(Object.keys(BUFFER_CHANNELS).length).toBeGreaterThanOrEqual(7);
    expect(VERCEL_BUFFER_PROJECTS).toHaveLength(3);
    expect(SIBLING_LOCAL_TARGETS).toHaveLength(2);
  });

  it('REPUK feed reconciliation is local-only JSON', () => {
    const feeds = JSON.parse(REPUK_BUFFER_CONTENT_FEEDS);
    expect(feeds).toEqual([{ id: 'policestationrepuk', type: 'local' }]);
  });

  it('psrtrain and custodynote have staggered crons', () => {
    const crons = VERCEL_BUFFER_PROJECTS.filter((p) => p.cron).map((p) => p.cron);
    expect(crons).toHaveLength(2);
    expect(crons[0]?.schedule).not.toBe(crons[1]?.schedule);
    expect(crons.every((c) => c?.path === '/api/buffer/schedule')).toBe(true);
  });
});

describe('setup-buffer-cross-site.mjs', () => {
  it('--dry-run exits 0', () => {
    const result = spawnSync('node', ['scripts/setup-buffer-cross-site.mjs', '--dry-run'], {
      cwd: ROOT,
      encoding: 'utf8',
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Buffer cross-site setup (DRY RUN)');
    expect(result.stdout).toContain('BUFFER_CONTENT_FEEDS');
  });
});

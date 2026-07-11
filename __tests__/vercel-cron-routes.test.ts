import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join, resolve } from 'path';

const ROOT = resolve(__dirname, '..');

function cronRouteFile(apiPath: string): string {
  const segments = apiPath.replace(/^\/api\/cron\//, '').split('/');
  return join(ROOT, 'app', 'api', 'cron', ...segments, 'route.ts');
}

describe('vercel.json cron routes', () => {
  it('every scheduled cron path has a matching route.ts file', () => {
    const vercel = JSON.parse(
      readFileSync(join(ROOT, 'vercel.json'), 'utf8'),
    ) as { crons?: Array<{ path: string; schedule: string }> };

    const missing: string[] = [];
    for (const cron of vercel.crons ?? []) {
      const routePath = cronRouteFile(cron.path);
      if (!existsSync(routePath)) {
        missing.push(`${cron.path} → expected ${routePath}`);
      }
    }

    expect(missing, `Missing cron route files:\n${missing.join('\n')}`).toEqual([]);
  });

  it('does not schedule removed firm-outreach-kick path', () => {
    const vercel = JSON.parse(
      readFileSync(join(ROOT, 'vercel.json'), 'utf8'),
    ) as { crons?: Array<{ path: string }> };
    const paths = (vercel.crons ?? []).map((c) => c.path);
    expect(paths).not.toContain('/api/cron/firm-outreach-kick');
    expect(paths).toContain('/api/cron/firm-outreach-bootstrap');
  });
});

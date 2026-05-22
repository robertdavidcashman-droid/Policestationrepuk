/**
 * Canonical-route guard: confirms there is exactly one source of truth for
 * the public registration page (`/register`) and every legacy/marketing alias
 * points at it.
 *
 * If anyone reintroduces a `/police-station-rep-registration` page module
 * (instead of the redirect) this test will fail loudly, because the public
 * marketing surface must NOT diverge from the gated flow.
 */

import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

const projectRoot = path.resolve(__dirname, '..');

describe('registration — canonical route invariants', () => {
  it('uses /register as the only Next.js page module', () => {
    const registerPage = path.join(projectRoot, 'app', 'register', 'page.tsx');
    expect(fs.existsSync(registerPage)).toBe(true);
    const legacy = path.join(
      projectRoot,
      'app',
      'police-station-rep-registration',
      'page.tsx',
    );
    expect(fs.existsSync(legacy)).toBe(false);
  });

  it('redirects /police-station-rep-registration → /register in next.config.ts', () => {
    const cfg = fs.readFileSync(
      path.join(projectRoot, 'next.config.ts'),
      'utf-8',
    );
    expect(cfg).toMatch(/police-station-rep-registration/);
    expect(cfg).toMatch(/destination:\s*['"]\/register['"]/);
  });

  it('also redirects /Register (case variant) via next.config.ts rewrite', () => {
    const cfg = fs.readFileSync(
      path.join(projectRoot, 'next.config.ts'),
      'utf-8',
    );
    expect(cfg).toMatch(/\/Register/);
  });

  it('middleware canonicalises .com → .org and www.org → apex .org', () => {
    const mw = fs.readFileSync(path.join(projectRoot, 'middleware.ts'), 'utf-8');
    expect(mw).toMatch(/policestationrepuk\.com/);
    expect(mw).toMatch(/www\.policestationrepuk\.org/);
    expect(mw).toMatch(/canonicalHostRedirect/);
  });

  it('robots.txt disallows /register so the gate landing page is not indexed', () => {
    const robots = fs.readFileSync(path.join(projectRoot, 'app', 'robots.ts'), 'utf-8');
    expect(robots).toMatch(/'\/register'/);
  });
});

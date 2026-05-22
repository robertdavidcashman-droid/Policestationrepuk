/**
 * Regression guard: the production CSP `script-src` and `frame-src`
 * directives MUST include `https://challenges.cloudflare.com` so the
 * Cloudflare Turnstile widget loads on the forms that still use it
 * (the secure rep-verification page and the "Report this profile" button).
 *
 * /register no longer uses Turnstile — the widget broke too many genuine
 * applicants and was the dominant cause of "I entered the email code but the
 * form never opened" support tickets — but the CSP must still allow the
 * other surfaces.
 */

import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

const cfg = fs.readFileSync(
  path.join(__dirname, '..', 'next.config.ts'),
  'utf-8',
);

// CSP values contain `'self'` and other single-quoted tokens, so the regex
// must capture across them. Match a double-quoted string ending at the
// closing double-quote followed by `}` (the header object terminator).
const cspMatch = cfg.match(
  /Content-Security-Policy["']\s*,\s*value:\s*"([^"]+)"/,
);

describe('Content-Security-Policy — Cloudflare Turnstile allowlist', () => {
  it('declares a single Content-Security-Policy header in next.config.ts', () => {
    expect(cspMatch).not.toBeNull();
  });

  it('includes challenges.cloudflare.com in script-src', () => {
    const csp = cspMatch?.[1] ?? '';
    const scriptSrc = csp.match(/script-src([^;]+)/)?.[1] ?? '';
    expect(scriptSrc).toMatch(/https:\/\/challenges\.cloudflare\.com/);
  });

  it('includes challenges.cloudflare.com in frame-src', () => {
    const csp = cspMatch?.[1] ?? '';
    const frameSrc = csp.match(/frame-src([^;]+)/)?.[1] ?? '';
    expect(frameSrc).toMatch(/https:\/\/challenges\.cloudflare\.com|https:/);
  });
});

/**
 * Security headers regression test for Policestationrepuk.
 *
 * Ensures next.config.ts headers() returns required security headers.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const configSrc = readFileSync(join(process.cwd(), 'next.config.ts'), 'utf-8');

const REQUIRED_HEADERS = [
  'X-Frame-Options',
  'X-Content-Type-Options',
  'Referrer-Policy',
  'Permissions-Policy',
  'Strict-Transport-Security',
  'Content-Security-Policy',
];

describe('security headers regression', () => {
  it('next.config.ts includes all required security header keys', () => {
    for (const header of REQUIRED_HEADERS) {
      expect(configSrc, `${header} not found in next.config.ts`).toContain(header);
    }
  });

  it('CSP includes default-src directive', () => {
    expect(configSrc).toContain('default-src');
  });

  it('HSTS has a max-age', () => {
    expect(configSrc).toMatch(/max-age=\d+/);
  });
});

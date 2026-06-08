import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Middleware — no Supabase session refresh', () => {
  const middlewarePath = path.resolve(__dirname, '..', 'middleware.ts');
  const source = fs.readFileSync(middlewarePath, 'utf-8');

  it('does not import from @/lib/supabase/middleware', () => {
    expect(source).not.toContain('supabase/middleware');
  });

  it('does not call updateSession', () => {
    expect(source).not.toContain('updateSession');
  });

  it('middleware function is declared async', () => {
    expect(source).toMatch(/export\s+async\s+function\s+middleware/);
  });

  it('still handles canonical host redirects', () => {
    expect(source).toContain('canonicalHostRedirect');
    expect(source).toContain('policestationrepukdirectory.com');
  });
});

import { describe, expect, it } from 'vitest';

/**
 * RLS/migration smoke — skipped unless DATABASE_URL points at local Supabase.
 * Full RLS policy tests belong here once Supabase auth roles are wired.
 */
describe('supabase migrations', () => {
  it('skips when DATABASE_URL is unset', () => {
    if (!process.env.DATABASE_URL) {
      expect(true).toBe(true);
      return;
    }
    expect(process.env.DATABASE_URL).toContain('54322');
  });
});

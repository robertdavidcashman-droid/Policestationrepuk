import { describe, expect, it } from 'vitest';
import { serperSearch, isSearchQueryError } from '@/lib/custody-discovery/search';

describe('custody search config', () => {
  it('returns explicit error when SERPER_API_KEY is missing', async () => {
    const prev = process.env.SERPER_API_KEY;
    delete process.env.SERPER_API_KEY;
    const result = await serperSearch('test query');
    if (prev) process.env.SERPER_API_KEY = prev;
    expect(isSearchQueryError(result)).toBe(true);
    if (isSearchQueryError(result)) {
      expect(result.reason).toContain('SERPER_API_KEY');
    }
  });
});

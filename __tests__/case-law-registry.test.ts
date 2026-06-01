import { describe, expect, it } from 'vitest';
import { VERIFIED_CASES } from '@/lib/case-law-registry';

describe('case-law registry', () => {
  it('has unique ids and citations', () => {
    const ids = VERIFIED_CASES.map((c) => c.id);
    const citations = VERIFIED_CASES.map((c) => c.citation);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(citations).size).toBe(citations.length);
  });

  it('every entry has at least one verified source URL', () => {
    for (const c of VERIFIED_CASES) {
      expect(c.verifiedSources.length, c.id).toBeGreaterThan(0);
      for (const url of c.verifiedSources) {
        expect(url).toMatch(/^https:\/\//);
      }
    }
  });

  it('does not include known hallucinated or removed citations', () => {
    const names = VERIFIED_CASES.map((c) => c.name);
    expect(names.some((n) => n.includes('ATH'))).toBe(false);
    expect(names.some((n) => n.includes('Dobson'))).toBe(false);
    expect(names.some((n) => n.includes('Dhesi'))).toBe(false);
    expect(names.some((n) => n === 'R v Ghosh')).toBe(false);
  });
});

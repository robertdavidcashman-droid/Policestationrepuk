import { describe, expect, it } from 'vitest';
import { diffSitemapUrls } from '@/lib/sitemap-build';

describe('diffSitemapUrls', () => {
  it('finds URLs present on only one side', () => {
    const diff = diffSitemapUrls(
      ['https://example.org/a', 'https://example.org/b'],
      ['https://example.org/b', 'https://example.org/c'],
    );
    expect(diff.onlyInExpected).toEqual(['https://example.org/a']);
    expect(diff.onlyInActual).toEqual(['https://example.org/c']);
  });
});

import { describe, it, expect } from 'vitest';
import { extractSlugFromPostText, siteHostnameFromUrl } from './metrics';

describe('metrics slug mapping', () => {
  it('extracts slug from post URL', () => {
    const slug = extractSlugFromPostText(
      'Kent police station cover\n\nhttps://www.policestationagent.com/blog/kent-cover-guide',
      'policestationagent.com',
    );
    expect(slug).toBe('kent-cover-guide');
  });

  it('returns null for unrelated domains', () => {
    expect(extractSlugFromPostText('https://example.com/foo', 'policestationagent.com')).toBeNull();
  });

  it('parses site hostname', () => {
    expect(siteHostnameFromUrl('https://www.custodynote.com')).toBe('custodynote.com');
  });
});

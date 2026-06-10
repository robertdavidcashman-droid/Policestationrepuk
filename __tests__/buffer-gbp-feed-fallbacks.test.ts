import { describe, expect, it } from 'vitest';
import { GBP_FEED_IDS, googleBusinessFeedFallbackUrl, googleBusinessImageCandidates } from '@/lib/buffer/image-url';

describe('buffer gbp feed fallbacks', () => {
  it('defines hosted defaults for every expected feed', () => {
    for (const feedId of GBP_FEED_IDS) {
      const url = googleBusinessFeedFallbackUrl(feedId, 'https://policestationrepuk.org');
      expect(url).toBe(`https://policestationrepuk.org/images/buffer/gbp/${feedId}-default.jpg`);
    }
  });

  it('prefers hosted default for external custodynote WebP RSS images', () => {
    const candidates = googleBusinessImageCandidates(
      'https://custodynote.com/screenshots/app/foo.webp',
      'https://policestationrepuk.org',
      'custodynote',
    );
    expect(candidates[0]).toBe('https://policestationrepuk.org/images/buffer/gbp/custodynote-default.jpg');
    expect(candidates.some((c) => c.includes('.webp'))).toBe(false);
  });

  it('prefers hosted default for psrtrain opengraph-image fallback', () => {
    const candidates = googleBusinessImageCandidates(
      'https://psrtrain.com/opengraph-image',
      'https://policestationrepuk.org',
      'psrtrain',
    );
    expect(candidates[0]).toBe('https://policestationrepuk.org/images/buffer/gbp/psrtrain-default.jpg');
  });
});

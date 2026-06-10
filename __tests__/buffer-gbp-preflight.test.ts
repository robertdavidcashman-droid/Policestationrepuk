import { describe, expect, it, vi } from 'vitest';
import {
  assertGoogleBusinessScheduleReady,
  collectGoogleBusinessPreflightIssues,
  isAllowedGbpAssetUrl,
  isDisallowedGbpAssetUrl,
} from '@/lib/buffer/gbp-preflight';
import type { SchedulablePost } from '@/lib/buffer/content-types';
import { mockGbpImageFetch } from './helpers/mock-gbp-fetch';

describe('buffer gbp preflight', () => {
  it('flags disallowed WebP and opengraph-image URLs', () => {
    expect(isDisallowedGbpAssetUrl('https://custodynote.com/foo.webp')).toBe(true);
    expect(isDisallowedGbpAssetUrl('https://psrtrain.com/opengraph-image')).toBe(true);
    expect(
      isAllowedGbpAssetUrl('https://policestationrepuk.org/images/buffer/gbp/custodynote-default.jpg'),
    ).toBe(true);
    expect(isAllowedGbpAssetUrl('https://custodynote.com/foo.webp')).toBe(false);
  });

  it('collectGoogleBusinessPreflightIssues rejects disallowed GBP asset URLs', async () => {
    const posts: SchedulablePost[] = [
      {
        feedId: 'custodynote',
        slug: 'example',
        title: 't',
        excerpt: 'e',
        url: 'https://custodynote.com/blog/example',
        imageUrl: 'https://custodynote.com/foo.webp',
        googleBusinessImageUrl: 'https://custodynote.com/foo.webp',
      },
    ];
    const issues = await collectGoogleBusinessPreflightIssues(posts);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0]?.reason).toMatch(/self-hosted/i);
  });

  it('passes when googleBusinessImageUrl is self-hosted JPEG', async () => {
    const gbpUrl = 'https://policestationrepuk.org/images/buffer/gbp/custodynote-default.jpg';
    const posts: SchedulablePost[] = [
      {
        feedId: 'custodynote',
        slug: 'example',
        title: 't',
        excerpt: 'e',
        url: 'https://custodynote.com/blog/example',
        imageUrl: 'https://custodynote.com/foo.webp',
        googleBusinessImageUrl: gbpUrl,
      },
    ];
    const issues = await assertGoogleBusinessScheduleReady(
      posts,
      mockGbpImageFetch({ jpegUrls: [gbpUrl] }) as unknown as typeof fetch,
    );
    expect(issues).toEqual([]);
  });
});

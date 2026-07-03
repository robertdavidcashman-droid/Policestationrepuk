import { describe, expect, it, vi } from 'vitest';
import { countSiteSentPosts } from '@/lib/buffer/verify-cross-site';

describe('countSiteSentPosts', () => {
  const posts = [
    { text: 'Read https://policestationrepuk.org/Blog/foo on our site' },
    { text: 'Guide at https://psrtrain.com/guides/bar' },
    { text: 'Another https://policestationrepuk.org/Blog/baz' },
    { text: 'No url here' },
  ];

  it('counts posts per hostname', () => {
    expect(countSiteSentPosts(posts, 'policestationrepuk.org')).toBe(2);
    expect(countSiteSentPosts(posts, 'psrtrain.com')).toBe(1);
    expect(countSiteSentPosts(posts, 'custodynote.com')).toBe(0);
  });
});

describe('CROSS_SITE_BUFFER_TARGETS', () => {
  it('lists four sites', async () => {
    const { CROSS_SITE_BUFFER_TARGETS } = await import('@/lib/buffer/cross-site-sites');
    expect(CROSS_SITE_BUFFER_TARGETS).toHaveLength(4);
    expect(CROSS_SITE_BUFFER_TARGETS.map((s) => s.id)).toEqual([
      'policestationrepuk',
      'psrtrain',
      'custodynote',
      'policestationagent',
    ]);
  });
});

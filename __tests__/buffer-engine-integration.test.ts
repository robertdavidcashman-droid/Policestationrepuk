import { describe, it, expect } from 'vitest';
import { createRepukBufferAdapter } from '@/lib/buffer/site-adapter';
import { MIN_POSTS_PER_DAY, computePoolCoverage, slugClickRate } from '@robertcashman/buffer-engine';

describe('buffer-engine repuk adapter', () => {
  it('loads schedulable posts with feed id', () => {
    const adapter = createRepukBufferAdapter();
    const posts = adapter.getSchedulablePosts();
    expect(Array.isArray(posts)).toBe(true);
    if (posts.length > 0) {
      expect(posts[0]?.feedId).toBe('policestationrepuk');
      expect(posts[0]?.url).toMatch(/policestationrepuk\.org/);
    }
  });

  it('enforces minimum 5 posts per day config', () => {
    expect(MIN_POSTS_PER_DAY).toBe(5);
  });

  it('computes pool coverage', () => {
    const adapter = createRepukBufferAdapter();
    const posts = adapter.getSchedulablePosts().slice(0, 3);
    const stats = new Map([
      [posts[0]?.slug ?? 'a', { slug: posts[0]?.slug ?? 'a', clicks: 1, impressions: 10, reactions: 0, timesPosted: 1, lastPostedAt: null }],
    ]);
    const coverage = computePoolCoverage(posts, stats);
    expect(coverage).toBeGreaterThan(0);
    expect(coverage).toBeLessThanOrEqual(1);
  });
});

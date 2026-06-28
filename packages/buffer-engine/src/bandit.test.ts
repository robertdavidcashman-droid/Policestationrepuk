import { describe, it, expect } from 'vitest';
import {
  pickBanditSchedulablePosts,
  slugClickRate,
  computePoolCoverage,
  effectiveExplorationRate,
} from './bandit';
import { mulberry32, hashSeed, postCooldownKey, generateDayNightPostTimes } from './scheduler-core';
import { MIN_POSTS_PER_DAY } from './config';
import type { SchedulablePost, SlugEngagementStats } from './types';

describe('bandit selection', () => {
  const posts: SchedulablePost[] = [
    { feedId: 'test', slug: 'a', title: 'A', excerpt: '', url: 'https://example.com/a' },
    { feedId: 'test', slug: 'b', title: 'B', excerpt: '', url: 'https://example.com/b' },
    { feedId: 'test', slug: 'c', title: 'C', excerpt: '', url: 'https://example.com/c' },
  ];

  it('respects cooldown exclusions', () => {
    const stats = new Map<string, SlugEngagementStats>();
    const picked = pickBanditSchedulablePosts(posts, {
      count: 2,
      excludeKeys: new Set([postCooldownKey('test', 'a')]),
      stats,
      explorationRate: 0.25,
      poolCoverage: 0,
      random: mulberry32(42),
    });
    expect(picked.every((p) => p.slug !== 'a')).toBe(true);
    expect(picked.length).toBe(2);
  });

  it('prefers high click-rate slugs when exploiting', () => {
    const stats = new Map<string, SlugEngagementStats>([
      ['a', { slug: 'a', clicks: 50, impressions: 100, reactions: 0, timesPosted: 5, lastPostedAt: null }],
      ['b', { slug: 'b', clicks: 1, impressions: 100, reactions: 0, timesPosted: 5, lastPostedAt: null }],
      ['c', { slug: 'c', clicks: 2, impressions: 100, reactions: 0, timesPosted: 5, lastPostedAt: null }],
    ]);
    const rng = () => 0.99;
    const picked = pickBanditSchedulablePosts(posts, {
      count: 1,
      excludeKeys: new Set(),
      stats,
      explorationRate: 0.01,
      poolCoverage: 1,
      random: rng,
    });
    expect(picked[0]?.slug).toBe('a');
  });

  it('explores least-posted slugs', () => {
    const stats = new Map<string, SlugEngagementStats>([
      ['a', { slug: 'a', clicks: 50, impressions: 100, reactions: 0, timesPosted: 10, lastPostedAt: null }],
      ['b', { slug: 'b', clicks: 1, impressions: 100, reactions: 0, timesPosted: 0, lastPostedAt: null }],
      ['c', { slug: 'c', clicks: 2, impressions: 100, reactions: 0, timesPosted: 1, lastPostedAt: null }],
    ]);
    const picked = pickBanditSchedulablePosts(posts, {
      count: 1,
      excludeKeys: new Set(),
      stats,
      explorationRate: 1,
      poolCoverage: 0.3,
      random: mulberry32(1),
    });
    expect(picked[0]?.slug).toBe('b');
  });
});

describe('slugClickRate', () => {
  it('uses Laplace smoothing', () => {
    const rate = slugClickRate({ slug: 'x', clicks: 0, impressions: 0, reactions: 0, timesPosted: 0, lastPostedAt: null });
    expect(rate).toBeCloseTo(0.1, 5);
  });
});

describe('day/night spread', () => {
  it('generates at least 5 slots for default config', () => {
    const rng = mulberry32(hashSeed('test-2026-06-28'));
    const times = generateDayNightPostTimes(
      '2026-06-28',
      {
        dayCount: 3,
        nightCount: 2,
        dayWindow: { startHour: 8, endHour: 21, minGapMinutes: 90 },
        nightWindow: { startHour: 21, endHour: 23, minGapMinutes: 60 },
        earlyMorningWindow: { startHour: 0, endHour: 7, minGapMinutes: 60 },
      },
      rng,
    );
    expect(times.length).toBeGreaterThanOrEqual(5);
  });
});

describe('config minimum', () => {
  it('MIN_POSTS_PER_DAY is 5', () => {
    expect(MIN_POSTS_PER_DAY).toBe(5);
  });
});

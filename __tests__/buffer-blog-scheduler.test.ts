import { describe, expect, it } from 'vitest';
import {
  appendRecentSlugs,
  buildPostText,
  generateRandomPostTimes,
  hashSeed,
  localDateInTimezone,
  londonOffsetForDate,
  mulberry32,
  pickRandomBlogPosts,
  shuffleChannels,
  slugsInCooldown,
} from '@/lib/buffer/scheduler-core';
import type { BlogArticle } from '@/lib/blog/types';

const sampleArticles: BlogArticle[] = [
  {
    slug: 'alpha-post',
    title: 'Alpha Post',
    metaTitle: 'Alpha',
    metaDescription: 'Alpha desc',
    primaryKeyword: 'alpha',
    categories: ['best-practice'],
    published: '2026-01-01',
    modified: '2026-01-01',
    excerpt: 'Alpha excerpt.',
    summary: 'Alpha summary',
    image: { src: '/images/a.webp', alt: 'A', width: 1200, height: 630 },
    relatedSlugs: [],
    bodyMarkdown: '## Alpha',
  },
  {
    slug: 'beta-post',
    title: 'Beta Post',
    metaTitle: 'Beta',
    metaDescription: 'Beta desc',
    primaryKeyword: 'beta',
    categories: ['law-firms'],
    published: '2026-01-02',
    modified: '2026-01-02',
    excerpt: 'Beta excerpt.',
    summary: 'Beta summary',
    image: { src: '/images/b.webp', alt: 'B', width: 1200, height: 630 },
    relatedSlugs: [],
    bodyMarkdown: '## Beta',
  },
  {
    slug: 'gamma-post',
    title: 'Gamma Post',
    metaTitle: 'Gamma',
    metaDescription: 'Gamma desc',
    primaryKeyword: 'gamma',
    categories: ['freelance-reps'],
    published: '2026-01-03',
    modified: '2026-01-03',
    excerpt: '',
    summary: 'Gamma summary',
    image: { src: '/images/c.webp', alt: 'C', width: 1200, height: 630 },
    relatedSlugs: [],
    bodyMarkdown: '## Gamma',
  },
];

describe('buffer blog scheduler core', () => {
  it('builds post text with title, excerpt, and Blog URL', () => {
    const text = buildPostText(sampleArticles[0]!, 'https://policestationrepuk.org');
    expect(text).toContain('Alpha Post');
    expect(text).toContain('Alpha excerpt.');
    expect(text).toContain('https://policestationrepuk.org/Blog/alpha-post');
  });

  it('picks random posts excluding cooldown slugs', () => {
    const rng = mulberry32(hashSeed('test-seed'));
    const picked = pickRandomBlogPosts(sampleArticles, 2, new Set(['alpha-post']), rng);
    expect(picked).toHaveLength(2);
    expect(picked.every((a) => a.slug !== 'alpha-post')).toBe(true);
  });

  it('generates deterministic times for the same date seed', () => {
    const rng1 = mulberry32(hashSeed('buffer-scheduler:2026-06-07'));
    const rng2 = mulberry32(hashSeed('buffer-scheduler:2026-06-07'));
    const times1 = generateRandomPostTimes('2026-06-07', 3, { startHour: 8, endHour: 21, minGapMinutes: 90 }, rng1);
    const times2 = generateRandomPostTimes('2026-06-07', 3, { startHour: 8, endHour: 21, minGapMinutes: 90 }, rng2);
    expect(times1).toEqual(times2);
    expect(times1).toHaveLength(3);
    expect(times1[0]!).toMatch(/^2026-06-07T\d{2}:\d{2}:00\+01:00$/);
  });

  it('excludes slugs inside cooldown window', () => {
    const now = new Date('2026-06-07T12:00:00Z');
    const excluded = slugsInCooldown(
      [{ slug: 'alpha-post', scheduledAt: '2026-06-01T10:00:00Z' }],
      14,
      now,
    );
    expect(excluded.has('alpha-post')).toBe(true);
  });

  it('formats local date in Europe/London', () => {
    const date = localDateInTimezone(new Date('2026-06-07T23:30:00Z'), 'Europe/London');
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('appends recent slug history with cap', () => {
    const merged = appendRecentSlugs(
      [{ slug: 'old', scheduledAt: '2026-01-01T00:00:00Z' }],
      [{ slug: 'new', scheduledAt: '2026-06-07T00:00:00Z' }],
      5,
    );
    expect(merged[0]?.slug).toBe('new');
    expect(merged).toHaveLength(2);
  });

  it('keeps minimum gap between generated post times', () => {
    const rng = mulberry32(hashSeed('gap-test'));
    const times = generateRandomPostTimes(
      '2026-06-08',
      3,
      { startHour: 8, endHour: 21, minGapMinutes: 90 },
      rng,
    );
    const minutes = times.map((t) => {
      const match = t.match(/T(\d{2}):(\d{2})/);
      return Number(match?.[1]) * 60 + Number(match?.[2]);
    });
    for (let i = 1; i < minutes.length; i++) {
      expect(minutes[i]! - minutes[i - 1]!).toBeGreaterThanOrEqual(45);
    }
  });

  it('uses GMT offset in winter and BST in summer for London', () => {
    expect(londonOffsetForDate('2026-01-15')).toBe('+00:00');
    expect(londonOffsetForDate('2026-06-08')).toBe('+01:00');
  });

  it('shuffles channel order deterministically from seed', () => {
    const channels = [
      { id: 'a', service: 'twitter' as const },
      { id: 'b', service: 'linkedin' as const },
      { id: 'c', service: 'googlebusiness' as const },
    ];
    const rng1 = mulberry32(hashSeed('channels'));
    const rng2 = mulberry32(hashSeed('channels'));
    expect(shuffleChannels(channels, rng1)).toEqual(shuffleChannels(channels, rng2));
  });

  it('throws when every article is on cooldown', () => {
    const rng = mulberry32(1);
    expect(() =>
      pickRandomBlogPosts(sampleArticles, 2, new Set(sampleArticles.map((a) => a.slug)), rng),
    ).toThrow(/No blog articles available/);
  });
});

import { describe, expect, it } from 'vitest';
import { BLOG_ARTICLES } from '@/lib/blog/articles-data';
import { hasSlugSpecificSources } from '@/lib/content-sources';

const FIRST_12_REPUK_SLUGS = [
  'how-to-become-police-station-representative-2026',
  'freelance-rep-day-rate-2026',
  'building-firm-panel-freelance-reps',
] as const;

describe('first-12 REPUK articles published', () => {
  it('batch-6 slugs exist in BLOG_ARTICLES with body and image', () => {
    for (const slug of FIRST_12_REPUK_SLUGS) {
      const article = BLOG_ARTICLES.find((a) => a.slug === slug);
      expect(article, `missing article ${slug}`).toBeDefined();
      expect(article!.bodyMarkdown.length).toBeGreaterThan(500);
      expect(article!.image.src).toMatch(/\.webp$/);
    }
  });

  it('batch-6 slugs are registered in content-sources', () => {
    for (const slug of FIRST_12_REPUK_SLUGS) {
      expect(hasSlugSpecificSources({ kind: 'blog', slug })).toBe(true);
    }
  });
});

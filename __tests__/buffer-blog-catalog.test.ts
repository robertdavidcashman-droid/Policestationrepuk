import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getAllBlogArticles } from '@/lib/blog/registry';
import { buildPostText } from '@/lib/buffer/scheduler-core';
import { googleBusinessImageCandidates } from '@/lib/buffer/image-url';
import { SITE_URL } from '@/lib/seo-layer/config';

describe('buffer blog catalog readiness', () => {
  it('has at least three blog articles for daily scheduling', () => {
    const articles = getAllBlogArticles();
    expect(articles.length).toBeGreaterThanOrEqual(3);
  });

  it('builds valid post text for every blog article', () => {
    for (const article of getAllBlogArticles()) {
      const text = buildPostText(article, SITE_URL);
      expect(text).toContain(article.title);
      expect(text).toContain(`${SITE_URL}/Blog/${article.slug}`);
      expect(article.slug.length).toBeGreaterThan(0);
    }
  });

  it('registers buffer cron in vercel.json', () => {
    const vercel = JSON.parse(readFileSync(join(process.cwd(), 'vercel.json'), 'utf8')) as {
      crons: Array<{ path: string; schedule: string }>;
    };
    const entry = vercel.crons.find((c) => c.path === '/api/cron/buffer-blog-posts');
    expect(entry).toBeDefined();
    expect(entry?.schedule).toBe('5 5 * * *');
  });

  it('every blog hero has a Google Business JPEG candidate', () => {
    const base = SITE_URL.replace(/\/$/, '');
    for (const article of getAllBlogArticles()) {
      const webpUrl = `${base}${article.image.src}`;
      const candidates = googleBusinessImageCandidates(webpUrl, base);
      expect(candidates.some((u) => /\.jpe?g(\?|$)/i.test(u))).toBe(true);
    }
  });
});

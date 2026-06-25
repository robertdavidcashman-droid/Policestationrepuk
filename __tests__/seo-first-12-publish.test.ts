import { describe, expect, it } from 'vitest';
import { BLOG_ARTICLES } from '@/lib/blog/articles-data';
import { getAllBlogArticles } from '@/lib/blog/registry';
import { getTopicClusterForSlug } from '@/lib/blog/topic-clusters';
import { hasSlugSpecificSources } from '@/lib/content-sources';

const FIRST_12_REPUK_SLUGS = [
  'how-to-become-police-station-representative-2026',
  'freelance-rep-day-rate-2026',
  'building-firm-panel-freelance-reps',
] as const;

function inboundLinkSources(targetSlug: string): string[] {
  const articles = getAllBlogArticles();
  const sources: string[] = [];
  for (const article of articles) {
    if (article.slug === targetSlug) continue;
    const bodyLinks = [...article.bodyMarkdown.matchAll(/\[([^\]]*)\]\(\/Blog\/([^)]+)\)/g)]
      .map((m) => m[2]!.trim())
      .filter((s) => s === targetSlug);
    if (bodyLinks.length) sources.push(article.slug);
    if (article.relatedSlugs?.includes(targetSlug)) sources.push(`${article.slug}:related`);
    const cluster = getTopicClusterForSlug(article.slug);
    if (cluster?.relatedSlugs.includes(targetSlug)) sources.push(`${article.slug}:cluster`);
  }
  return sources;
}

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

  it('batch-6 slugs are not orphan pages (CI audit:blog-orphans)', () => {
    for (const slug of FIRST_12_REPUK_SLUGS) {
      const inbound = inboundLinkSources(slug);
      expect(inbound.length, `${slug} has no inbound blog links`).toBeGreaterThan(0);
    }
  });

  it('batch-6 slugs pass blog SEO CI rules', () => {
    for (const slug of FIRST_12_REPUK_SLUGS) {
      const article = BLOG_ARTICLES.find((a) => a.slug === slug)!;
      expect(article.metaTitle.length).toBeGreaterThanOrEqual(25);
      expect(article.metaTitle.length).toBeLessThanOrEqual(65);
      expect(article.metaDescription.length).toBeGreaterThanOrEqual(120);
      expect(article.metaDescription.length).toBeLessThanOrEqual(165);
      expect(article.primaryKeyword?.trim().length).toBeGreaterThan(0);
      expect((article.bodyMarkdown.match(/^## /gm) ?? []).length).toBeGreaterThanOrEqual(3);
      expect((article.bodyMarkdown.match(/\]\(\/[a-zA-Z0-9/_?=&%-]*\)/g) ?? []).length).toBeGreaterThanOrEqual(3);
      expect(article.faqs?.length ?? 0).toBeGreaterThanOrEqual(3);
      const stem = article.primaryKeyword.toLowerCase().split(/\s+/)[0]!;
      expect(article.bodyMarkdown.slice(0, 600).toLowerCase()).toContain(stem);
    }
  });
});

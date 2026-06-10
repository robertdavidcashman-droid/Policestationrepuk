#!/usr/bin/env npx tsx
/**
 * Find blog posts with no inbound internal links from other blog articles.
 * Counts body markdown /Blog/ links, relatedSlugs, and topic-cluster sidebar links.
 * Usage: npm run audit:blog-orphans
 */
import { getAllBlogArticles } from '../../lib/blog/registry';
import { getTopicClusterForSlug } from '../../lib/blog/topic-clusters';

function blogLinksInMarkdown(md: string): string[] {
  return [...md.matchAll(/\[([^\]]*)\]\(\/Blog\/([^)]+)\)/g)].map((m) => m[2]!.trim());
}

function main() {
  const articles = getAllBlogArticles();
  const slugs = new Set(articles.map((a) => a.slug));
  const inbound = new Map<string, Set<string>>();

  for (const slug of slugs) {
    inbound.set(slug, new Set());
  }

  for (const article of articles) {
    const source = article.slug;

    for (const target of blogLinksInMarkdown(article.bodyMarkdown)) {
      if (!slugs.has(target) || target === source) continue;
      inbound.get(target)?.add(source);
    }

    for (const target of article.relatedSlugs ?? []) {
      if (!slugs.has(target) || target === source) continue;
      inbound.get(target)?.add(`${source}:related`);
    }

    const cluster = getTopicClusterForSlug(source);
    if (cluster) {
      for (const target of cluster.relatedSlugs) {
        if (!slugs.has(target) || target === source) continue;
        inbound.get(target)?.add(`${source}:cluster`);
      }
    }
  }

  const orphans = [...slugs].filter((slug) => (inbound.get(slug)?.size ?? 0) === 0);

  const report = {
    totalArticles: slugs.size,
    orphanCount: orphans.length,
    orphans: orphans.sort(),
  };

  console.log(JSON.stringify(report, null, 2));
  if (orphans.length > 0) process.exit(1);
}

main();

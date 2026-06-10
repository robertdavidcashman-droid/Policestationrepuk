#!/usr/bin/env npx tsx
/**
 * Find blog posts with no inbound internal links from other blog articles.
 * Usage: npm run audit:blog-orphans
 */
import { getAllBlogArticles } from '../lib/blog/registry';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const BLOG_DIR = join(process.cwd(), 'content/blog');

function slugFromFilename(name: string): string {
  return name.replace(/\.mdx?$/, '');
}

function internalBlogLinksInFile(path: string): string[] {
  const text = readFileSync(path, 'utf8');
  const matches = text.matchAll(/\[([^\]]*)\]\(\/Blog\/([^)]+)\)/g);
  return [...matches].map((m) => m[2]!.trim());
}

function main() {
  const articles = getAllBlogArticles();
  const slugs = new Set(articles.map((a) => a.slug));
  const inbound = new Map<string, Set<string>>();

  for (const slug of slugs) {
    inbound.set(slug, new Set());
  }

  const files = readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));
  for (const file of files) {
    const source = slugFromFilename(file);
    for (const target of internalBlogLinksInFile(join(BLOG_DIR, file))) {
      if (!slugs.has(target)) continue;
      inbound.get(target)?.add(source);
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

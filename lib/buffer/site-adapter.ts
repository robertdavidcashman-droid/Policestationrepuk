import type { BufferEngineAdapter, BufferKV, SchedulablePost } from '@robertcashman/buffer-engine';
import { resolveAbsoluteImageUrl } from '@robertcashman/buffer-engine';
import { getAllBlogArticles } from '@/lib/blog/registry';
import { SITE_URL } from '@/lib/seo-layer/config';
import { getKV } from '@/lib/kv';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const SITE_ID = 'policestationrepuk';

function kvAdapter(): BufferKV | null {
  const redis = getKV();
  if (!redis) return null;
  return {
    get: (key) => redis.get(key),
    set: (key, value, options) => {
      if (!options) return redis.set(key, value);
      if (options.nx && options.ex != null) {
        return redis.set(key, value, { nx: true, ex: options.ex });
      }
      if (options.nx) {
        return redis.set(key, value, { nx: true });
      }
      if (options.ex != null) {
        return redis.set(key, value, { ex: options.ex });
      }
      return redis.set(key, value);
    },
    del: (key) => redis.del(key),
  };
}

const OVERRIDES_PATH = join(process.cwd(), 'data', 'buffer-image-overrides.json');

function loadImageOverrides(): Record<string, string> {
  try {
    if (!existsSync(OVERRIDES_PATH)) return {};
    return JSON.parse(readFileSync(OVERRIDES_PATH, 'utf-8')) as Record<string, string>;
  } catch {
    return {};
  }
}

function saveImageOverride(slug: string, publicUrl: string): void {
  const overrides = loadImageOverrides();
  overrides[slug] = publicUrl;
  mkdirSync(join(process.cwd(), 'data'), { recursive: true });
  writeFileSync(OVERRIDES_PATH, JSON.stringify(overrides, null, 2));
}

export function createRepukBufferAdapter(): BufferEngineAdapter {
  return {
    siteId: SITE_ID,
    siteUrl: SITE_URL,
    kv: kvAdapter(),
    getSchedulablePosts(): SchedulablePost[] {
      const overrides = loadImageOverrides();
      const base = SITE_URL.replace(/\/$/, '');
      return getAllBlogArticles().map((article) => ({
        feedId: SITE_ID,
        slug: article.slug,
        title: article.title,
        excerpt: article.excerpt.trim(),
        url: `${base}/Blog/${article.slug}`,
        imageUrl:
          overrides[article.slug] ??
          resolveAbsoluteImageUrl(base, article.image.src),
        imageAlt: article.image.alt,
      }));
    },
    async correctSourceImage(input) {
      saveImageOverride(input.slug, input.publicUrl);
    },
  };
}

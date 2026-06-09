import { describe, expect, it, vi } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { getAllBlogArticles } from '@/lib/blog/registry';
import { SITE_URL } from '@/lib/seo-layer/config';
import {
  googleBusinessImageCandidates,
  resolveGoogleBusinessImageUrl,
} from '@/lib/buffer/image-url';

describe('buffer blog hero JPEG parity', () => {
  it('has a matching .jpg for every blog hero .webp', () => {
    const rasterDir = join(process.cwd(), 'public', 'images', 'blog', 'raster');
    for (const article of getAllBlogArticles()) {
      const src = article.image.src;
      expect(src).toMatch(/\.webp$/i);
      const slug = src.replace(/^.*\//, '').replace(/\.webp$/i, '');
      const jpgPath = join(rasterDir, `${slug}.jpg`);
      expect(existsSync(jpgPath), `missing JPEG companion for ${slug}`).toBe(true);
    }
  });

  it('googleBusinessImageCandidates includes .jpg rewrite for webp heroes', () => {
    const article = getAllBlogArticles()[0];
    expect(article).toBeDefined();
    const webpUrl = `${SITE_URL.replace(/\/$/, '')}${article!.image.src}`;
    const candidates = googleBusinessImageCandidates(webpUrl, SITE_URL);
    expect(candidates.some((u) => /\.jpe?g(\?|$)/i.test(u))).toBe(true);
    expect(candidates.some((u) => /\.webp(\?|$)/i.test(u))).toBe(false);
  });

  it('resolveGoogleBusinessImageUrl picks jpeg when jpg exists on origin', async () => {
    const article = getAllBlogArticles()[0];
    expect(article).toBeDefined();
    const base = SITE_URL.replace(/\/$/, '');
    const webpUrl = `${base}${article!.image.src}`;
    const jpgUrl = webpUrl.replace(/\.webp(\?.*)?$/i, '.jpg$1');

    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      const u = String(url);
      if (u === jpgUrl) {
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'image/jpeg', 'content-length': '12000' }),
        };
      }
      if (u === webpUrl) {
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'image/webp', 'content-length': '5000' }),
        };
      }
      return { ok: false, status: 404, headers: new Headers() };
    });

    const resolved = await resolveGoogleBusinessImageUrl(
      webpUrl,
      fetchMock as unknown as typeof fetch,
      base,
    );
    expect(resolved).toBe(jpgUrl);
  });
});

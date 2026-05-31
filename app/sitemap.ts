import type { MetadataRoute } from 'next';
import { buildSitemap } from '@/lib/sitemap-build';

/**
 * Must stay dynamic: build-time prerender skips Upstash KV (`skipKVInPrerender`),
 * which would omit KV-registered reps and legal-directory listings from the
 * sitemap while IndexNow postbuild still submits them.
 */
export const dynamic = 'force-dynamic';

export default function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildSitemap();
}

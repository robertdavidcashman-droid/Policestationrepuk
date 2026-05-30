import type { MetadataRoute } from 'next';
import { buildSitemap } from '@/lib/sitemap-build';

export default function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildSitemap();
}

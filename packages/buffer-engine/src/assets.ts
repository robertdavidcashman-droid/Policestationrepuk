import type { SchedulablePost } from './types';

/** Resolve a relative or protocol-relative image path to an absolute HTTPS URL. */
export function resolveAbsoluteImageUrl(baseUrl: string, src: string | undefined | null): string | undefined {
  if (!src?.trim()) return undefined;
  const trimmed = src.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  const base = baseUrl.replace(/\/$/, '');
  if (trimmed.startsWith('/')) return `${base}${trimmed}`;
  return `${base}/${trimmed}`;
}

export function buildBufferImageAssets(input: {
  imageUrl?: string;
  imageAlt?: string;
  title: string;
}): Array<{ image: { url: string; metadata: { altText: string } } }> {
  if (!input.imageUrl?.trim()) return [];
  return [
    {
      image: {
        url: input.imageUrl.trim(),
        metadata: { altText: (input.imageAlt || input.title).trim() || input.title },
      },
    },
  ];
}

export function imageAssetsFromPost(post: SchedulablePost): ReturnType<typeof buildBufferImageAssets> {
  return buildBufferImageAssets({
    imageUrl: post.imageUrl,
    imageAlt: post.imageAlt,
    title: post.title,
  });
}

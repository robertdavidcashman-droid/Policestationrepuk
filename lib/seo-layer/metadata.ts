import type { Metadata } from 'next';
import { SITE_URL, SITE_NAME, socialPreviewImageUrl } from './config';

export interface MetadataInput {
  title: string;
  description: string;
  path: string;
  /** Optional page-specific keywords (layout defaults apply when omitted). */
  keywords?: string[];
  noIndex?: boolean;
  /** Set to 'article' for blog/news posts to emit correct OG type and dates. */
  ogType?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  /** Absolute URL to Open Graph / Twitter image */
  ogImage?: { url: string; width?: number; height?: number; alt?: string };
}

const MAX_DESC = 155;

function capDescription(raw: string): string {
  if (raw.length <= MAX_DESC) return raw;
  const cut = raw.lastIndexOf(' ', MAX_DESC - 1);
  return (cut > 80 ? raw.slice(0, cut) : raw.slice(0, MAX_DESC - 1)) + '…';
}

export function buildMetadata(opts: MetadataInput): Metadata {
  const url = `${SITE_URL}${opts.path}`;
  const description = capDescription(opts.description);
  const ogType = opts.ogType ?? 'website';

  const defaultOgImage = {
    url: socialPreviewImageUrl(),
    width: 1200,
    height: 630,
    alt: `${SITE_NAME} — UK police station representative directory`,
  };

  const ogImages =
    opts.ogImage?.url != null
      ? [
          {
            url: opts.ogImage.url,
            width: opts.ogImage.width ?? 1200,
            height: opts.ogImage.height ?? 630,
            alt: opts.ogImage.alt,
          },
        ]
      : [defaultOgImage];

  const openGraph: Metadata['openGraph'] =
    ogType === 'article'
      ? {
          title: opts.title,
          description,
          url,
          siteName: SITE_NAME,
          type: 'article',
          locale: 'en_GB',
          ...(opts.publishedTime ? { publishedTime: opts.publishedTime } : {}),
          ...(opts.modifiedTime ? { modifiedTime: opts.modifiedTime } : {}),
          images: ogImages,
        }
      : {
          title: opts.title,
          description,
          url,
          siteName: SITE_NAME,
          type: 'website',
          locale: 'en_GB',
          images: ogImages,
        };

  const cardImageUrl = ogImages[0]?.url ?? socialPreviewImageUrl();

  return {
    title: opts.title,
    description,
    ...(opts.keywords?.length ? { keywords: opts.keywords } : {}),
    alternates: { canonical: url },
    openGraph,
    twitter: {
      card: 'summary_large_image',
      title: opts.title,
      description,
      images: [cardImageUrl],
    },
    robots: opts.noIndex ? { index: false, follow: true } : undefined,
  };
}

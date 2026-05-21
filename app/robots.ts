import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo-layer/config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/admin',
        '/admin/',
        '/secure-rep-verification',
        '/secure-rep-verification/',
        '/Account',
        '/Account/',
        // The /register page exists as the destination of the public CTAs but
        // its full form is gated behind a server-issued one-shot token (see
        // app/api/register/gate). De-index it so search engines do not index
        // the gate landing page.
        '/register',
        '/register/',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

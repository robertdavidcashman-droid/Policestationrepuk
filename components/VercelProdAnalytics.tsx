import { vercelWebAnalyticsEnabled } from '@/lib/vercel-web-analytics';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';

/** Renders Vercel Web Analytics only on production deployments (not local next start). */
export function VercelProdAnalytics() {
  if (!vercelWebAnalyticsEnabled()) return null;
  return (
    <>
      <SpeedInsights />
      <Analytics />
    </>
  );
}

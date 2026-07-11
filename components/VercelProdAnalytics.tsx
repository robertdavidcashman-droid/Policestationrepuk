'use client';

import dynamic from 'next/dynamic';
import { vercelWebAnalyticsEnabled } from '@/lib/vercel-web-analytics';

const SpeedInsights = dynamic(
  () => import('@vercel/speed-insights/next').then((m) => m.SpeedInsights),
  { ssr: false },
);

const Analytics = dynamic(
  () => import('@vercel/analytics/next').then((m) => m.Analytics),
  { ssr: false },
);

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

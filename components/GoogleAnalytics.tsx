'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { isAnalyticsEnabled } from '@/lib/analytics';

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

/** Loads GA4 after consent cookie is accepted; tracks page views on route change. */
export function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const enabled = isAnalyticsEnabled();

  useEffect(() => {
    if (!enabled || typeof window.gtag !== 'function') return;
    if (localStorage.getItem('cookies-accepted') !== 'true') return;
    const query = searchParams?.toString();
    const path = query ? `${pathname}?${query}` : pathname;
    window.gtag('config', GA_ID, { page_path: path });
  }, [enabled, pathname, searchParams]);

  if (!enabled) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          if (localStorage.getItem('cookies-accepted') === 'true') {
            gtag('config', '${GA_ID}', { anonymize_ip: true });
          }
        `}
      </Script>
    </>
  );
}

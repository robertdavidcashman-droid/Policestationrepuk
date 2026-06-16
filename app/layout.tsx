import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Header } from '@/components/Header';
import { PromoBannerStack } from '@/components/PromoBannerStack';
import { Footer } from '@/components/Footer';
import { SiteWidePromoStrip } from '@/components/SiteWidePromoStrip';
import { GoogleAnalytics } from '@/components/GoogleAnalytics';
import { AnalyticsEventBinder } from '@/components/AnalyticsEventBinder';
import { DeferredGlobalWidgets } from '@/components/DeferredGlobalWidgets';
import { Suspense } from 'react';
import { AssistantUiProvider } from '@/components/assistant/AssistantUiProvider';
import { JsonLd } from '@/components/JsonLd';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import { SITE_URL, SITE_NAME, SITE_KEYWORDS, socialPreviewImageUrl } from '@/lib/seo-layer/config';
import { platformLegalServiceSchema, webSiteSchema } from '@/lib/seo';

/** Set in Vercel / `.env` when verifying in Google Search Console (omit to skip meta tag). */
const GOOGLE_SITE_VERIFICATION = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();
/** Set in Vercel / `.env` when verifying in Bing Webmaster Tools (omit to skip meta tag). */
const BING_SITE_VERIFICATION = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION?.trim();

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#1e3a8a',
};

export const metadata: Metadata = {
  title: {
    default: 'PoliceStationRepUK — Free Police Station Rep Directory',
    /** Pages set full titles (most already include the brand); avoid double “| PoliceStationRepUK”. */
    template: '%s',
  },
  description:
    'Free UK directory of accredited police station representatives and police station phone numbers. Search reps by county or station; report updated custody numbers. 100% free.',
  keywords: [...SITE_KEYWORDS],
  metadataBase: new URL(SITE_URL),
  manifest: '/manifest.json',
  openGraph: {
    siteName: SITE_NAME,
    locale: 'en_GB',
    type: 'website',
    title: 'PoliceStationRepUK — Free Police Station Rep Directory UK',
    description:
      'The UK\'s free directory for police station reps, station phone numbers, and criminal defence cover across England & Wales.',
    url: SITE_URL,
    images: [
      {
        url: socialPreviewImageUrl(),
        width: 1200,
        height: 630,
        alt: 'PoliceStationRepUK — The UK\'s Free Directory for Police Station Cover',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PoliceStationRepUK — Free Police Station Rep Directory',
    description:
      'Find accredited police station reps across England & Wales. 100% free for solicitors and reps.',
    images: [socialPreviewImageUrl()],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  ...(GOOGLE_SITE_VERIFICATION || BING_SITE_VERIFICATION
    ? {
        other: {
          ...(GOOGLE_SITE_VERIFICATION
            ? { 'google-site-verification': GOOGLE_SITE_VERIFICATION }
            : {}),
          ...(BING_SITE_VERIFICATION ? { 'msvalidate.01': BING_SITE_VERIFICATION } : {}),
        },
      }
    : {}),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB" className={inter.variable}>
      {/* RSS autodiscovery tag — allows browsers and tools such as Buffer, Publer,
          Zapier, and Make to detect the feed without guessing the URL.
          The <link> element is placed here because Next.js metadata API does not
          expose a 'title' attribute on alternates.types entries. */}
      <head>
        <link
          rel="alternate"
          type="application/rss+xml"
          title="PoliceStationRepUK RSS Feed"
          href="/rss.xml"
        />
        <link rel="alternate" type="text/plain" title="LLM discovery" href="/llms.txt" />
      </head>
      <body className="flex min-h-screen min-h-[100dvh] flex-col overflow-x-clip bg-[var(--background)] font-sans text-[var(--foreground)] antialiased">
        <AssistantUiProvider>
          <JsonLd data={platformLegalServiceSchema()} />
          <JsonLd data={webSiteSchema()} />
          <a href="#main-content" className="skip-link">
            Skip to content
          </a>
          <div className="sticky top-0 z-40 overflow-visible shadow-md">
            <PromoBannerStack />
            <Header />
          </div>
          <main id="main-content" className="site-shell-main flex-1 w-full min-w-0">{children}</main>
          <SiteWidePromoStrip />
          <Footer />
          <Suspense fallback={null}>
            <GoogleAnalytics />
            <AnalyticsEventBinder />
          </Suspense>
          <DeferredGlobalWidgets />
        </AssistantUiProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}

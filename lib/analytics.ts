/**
 * Lightweight GA4 event helpers — no-op when measurement ID is unset.
 * Set NEXT_PUBLIC_GA_MEASUREMENT_ID in Vercel to enable.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

export function isAnalyticsEnabled(): boolean {
  return Boolean(GA_ID);
}

export function trackEvent(
  name: string,
  params?: Record<string, string | number | boolean | undefined>,
): void {
  if (typeof window === 'undefined' || !GA_ID || typeof window.gtag !== 'function') return;
  const cleaned: Record<string, string | number | boolean> = {};
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) cleaned[key] = value;
    }
  }
  window.gtag('event', name, cleaned);
}

export const AnalyticsEvents = {
  directorySearch: (query: string) => trackEvent('directory_search', { search_term: query.slice(0, 80) }),
  registerCtaClick: (source: string) => trackEvent('register_cta_click', { source }),
  blogToDirectoryClick: (slug: string) => trackEvent('blog_directory_click', { blog_slug: slug }),
  legalDirectorySubmit: () => trackEvent('legal_directory_submit'),
  custodynotePromoClick: (placement: string) => trackEvent('custodynote_promo_click', { placement }),
} as const;

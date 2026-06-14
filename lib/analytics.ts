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
  registerCtaClick: (source: string) => trackEvent('rep_registration', { source }),
  blogToDirectoryClick: (slug: string) => trackEvent('blog_cta_click', { blog_slug: slug }),
  legalDirectorySubmit: () => trackEvent('form_submit', { form: 'legal_directory' }),
  callClick: (placement: string) => trackEvent('call_click', { placement }),
  whatsappClick: (placement: string) => trackEvent('whatsapp_click', { placement }),
  emailClick: (placement: string) => trackEvent('email_click', { placement }),
  formSubmit: (form: string) => trackEvent('form_submit', { form }),
  repRegistration: (source: string) => trackEvent('rep_registration', { source }),
  trainingInterest: (placement: string) => trackEvent('training_interest', { placement }),
  demoRequest: (placement: string) => trackEvent('demo_request', { placement }),
  templateDownload: (placement: string) => trackEvent('template_download', { placement }),
  blogCtaClick: (slug: string, placement?: string) =>
    trackEvent('blog_cta_click', { blog_slug: slug, ...(placement ? { placement } : {}) }),
  custodynotePromoClick: (placement: string) =>
    trackEvent('outbound_partner_click', { partner: 'custodynote', placement }),
  psrTrainPromoClick: (placement: string) =>
    trackEvent('outbound_partner_click', { partner: 'psrtrain', placement }),
  psaPromoClick: (placement: string) =>
    trackEvent('outbound_partner_click', { partner: 'policestationagent', placement }),
  outboundPartnerClick: (partner: string, placement: string) =>
    trackEvent('outbound_partner_click', { partner, placement }),
  outboundDirectoryClick: (placement: string) =>
    trackEvent('outbound_directory_click', { placement }),
} as const;

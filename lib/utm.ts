/** Shared UTM helpers — see docs/site-standards.md for the network-wide convention. */

export type UtmSource =
  | 'policestationrepuk'
  | 'psrtrain'
  | 'custodynote'
  | 'policestationagent'
  | 'buffer'
  | 'newsletter';

export type UtmMedium = 'web' | 'social' | 'email' | 'app';

export interface UtmParams {
  source: UtmSource;
  medium: UtmMedium;
  campaign: string;
  content?: string;
  term?: string;
}

export function appendUtm(url: string, params: UtmParams): string {
  try {
    const u = new URL(url);
    u.searchParams.set('utm_source', params.source);
    u.searchParams.set('utm_medium', params.medium);
    u.searchParams.set('utm_campaign', params.campaign);
    if (params.content) u.searchParams.set('utm_content', params.content);
    if (params.term) u.searchParams.set('utm_term', params.term);
    return u.toString();
  } catch {
    return url;
  }
}

export function utmQueryString(params: UtmParams): string {
  const q = new URLSearchParams({
    utm_source: params.source,
    utm_medium: params.medium,
    utm_campaign: params.campaign,
  });
  if (params.content) q.set('utm_content', params.content);
  if (params.term) q.set('utm_term', params.term);
  return q.toString();
}

export function partnerHref(
  baseUrl: string,
  campaign: string,
  source: UtmSource = 'policestationrepuk',
  medium: UtmMedium = 'web',
): string {
  const trimmed = baseUrl.replace(/\/$/, '');
  return appendUtm(trimmed, { source, medium, campaign });
}

import { appendUtm, type UtmSource } from '@/lib/utm';

const SISTER_HOSTS = new Set([
  'custodynote.com',
  'psrtrain.com',
  'policestationagent.com',
  'policestationrepuk.org',
  'policestationrepuk.com',
]);

function normalizeHost(hostname: string): string {
  return hostname.toLowerCase().replace(/^www\./, '');
}

export function isSisterSiteHost(hostname: string): boolean {
  return SISTER_HOSTS.has(normalizeHost(hostname));
}

/** Append standard UTMs when a rep/listing website URL points at a sister site. */
export function withSisterSiteUtm(
  url: string,
  campaign: string,
  source: UtmSource = 'policestationrepuk',
): string {
  if (!url?.trim() || url.includes('utm_source=')) return url;
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    if (!isSisterSiteHost(parsed.hostname)) return url;
    return appendUtm(parsed.toString(), { source, medium: 'web', campaign });
  } catch {
    return url;
  }
}

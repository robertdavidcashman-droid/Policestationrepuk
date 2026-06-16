import crypto from 'crypto';
import { NON_EW_POSTCODE_PREFIXES } from './shared-constants';

export function normalizeFirmName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(ltd|limited|llp|plc|solicitors?|law|legal)\b/gi, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function slugifyFirmKey(parts: string[]): string {
  const slug = parts
    .map((p) =>
      p
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
    )
    .filter(Boolean)
    .join('-');
  return slug.slice(0, 120) || 'firm';
}

export function firmKeyFromParts(firmName: string, postcode?: string, town?: string): string {
  const name = normalizeFirmName(firmName);
  const pc = (postcode ?? '').replace(/\s+/g, '').toUpperCase().slice(0, 4);
  const t = town ? normalizeFirmName(town).replace(/\s+/g, '-') : '';
  return slugifyFirmKey([name.replace(/\s+/g, '-'), pc, t].filter(Boolean));
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function emailHash(email: string): string {
  return crypto.createHash('sha256').update(normalizeEmail(email)).digest('hex');
}

export function prospectIdFromKey(key: string): string {
  const hash = crypto.createHash('sha256').update(key).digest('hex').slice(0, 16);
  return `fop_${hash}`;
}

/** Prospect ids are scoped per campaign so shared Redis can hold PSA + RepUK queues. */
export function prospectIdForCampaign(campaignId: string, idKey: string): string {
  return prospectIdFromKey(`${campaignId}:${idKey}`);
}

export function isEnglandWalesPostcode(postcode: string | undefined | null): boolean {
  const pc = (postcode ?? '').trim().toUpperCase().replace(/\s+/g, '');
  if (!pc || pc.length < 2) return true;
  const area = pc.match(/^([A-Z]{1,2})/)?.[1] ?? '';
  if (!area) return true;
  if (area === 'G') return false;
  return !NON_EW_POSTCODE_PREFIXES.includes(area as (typeof NON_EW_POSTCODE_PREFIXES)[number]);
}

export function registrableDomain(host: string): string | null {
  const h = host.toLowerCase().replace(/^www\./, '');
  const parts = h.split('.').filter(Boolean);
  if (parts.length < 2) return null;
  if (parts.length === 2) return h;
  const tld = parts.slice(-2).join('.');
  if (tld === 'co.uk' || tld === 'org.uk' || tld === 'gov.uk') {
    return parts.slice(-3).join('.');
  }
  return parts.slice(-2).join('.');
}

export function domainFromUrl(url: string | undefined | null): string | null {
  if (!url?.trim()) return null;
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    return registrableDomain(u.hostname);
  } catch {
    return null;
  }
}

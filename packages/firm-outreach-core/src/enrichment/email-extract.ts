import {
  CRIMINAL_KEYWORDS,
  FREE_EMAIL_DOMAINS,
  PREFERRED_EMAIL_LOCALS,
  REJECTED_EMAIL_LOCALS,
} from '../shared-constants';
import { isPlausibleOutreachEmail } from './validator';
import { domainFromUrl, normalizeEmail } from '../normalize';
import type { EmailConfidence, FirmProspectEmail } from '../types';

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;

export function extractEmailsFromHtml(html: string): string[] {
  const found = new Set<string>();
  for (const m of html.matchAll(/mailto:([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/gi)) {
    const norm = normalizeEmail(m[1]);
    if (isPlausibleOutreachEmail(norm)) found.add(norm);
  }
  for (const m of html.matchAll(EMAIL_RE)) {
    const norm = normalizeEmail(m[0]);
    if (isPlausibleOutreachEmail(norm)) found.add(norm);
  }
  return [...found];
}

export function scoreEmailCandidate(
  email: string,
  opts: {
    prospectType: 'firm' | 'solicitor';
    websiteUrl?: string;
    forename?: string;
    surname?: string;
    pageText?: string;
  },
): number {
  const norm = normalizeEmail(email);
  if (!isPlausibleOutreachEmail(norm)) return 0;
  const [local, domain] = norm.split('@');
  if (!local || !domain) return 0;
  if (REJECTED_EMAIL_LOCALS.has(local)) return 0;

  let score = 40;
  const localBase = local.split('+')[0];
  for (const [key, boost] of Object.entries(PREFERRED_EMAIL_LOCALS) as [string, number][]) {
    if (localBase.includes(key)) score += boost;
  }

  const siteDomain = domainFromUrl(opts.websiteUrl);
  if (siteDomain && domain.endsWith(siteDomain)) score += 20;
  else if (FREE_EMAIL_DOMAINS.has(domain)) {
    score -= opts.prospectType === 'firm' ? 25 : 5;
  }

  if (opts.surname && localBase.includes(opts.surname.toLowerCase().slice(0, 4))) {
    score += 25;
  }
  if (opts.forename && localBase.includes(opts.forename.toLowerCase().slice(0, 3))) {
    score += 10;
  }

  const text = (opts.pageText ?? '').toLowerCase();
  for (const kw of CRIMINAL_KEYWORDS) {
    if (text.includes(kw)) {
      score += 5;
      break;
    }
  }

  return Math.min(100, Math.max(0, score));
}

export function pickBestEmail(
  candidates: string[],
  opts: Parameters<typeof scoreEmailCandidate>[1],
): FirmProspectEmail | null {
  const filtered = candidates.filter((address) => isPlausibleOutreachEmail(address));
  const ranked = filtered
    .map((address) => ({
      address,
      score: scoreEmailCandidate(address, opts),
      confidence: 'crawled' as EmailConfidence,
      source: 'website_crawl',
    }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score);

  return ranked[0] ?? null;
}

export function guessEmailsForDomain(domain: string): string[] {
  const locals = ['info', 'enquiries', 'contact', 'crime', 'criminal', 'duty', 'police'];
  return locals.map((l) => `${l}@${domain}`);
}

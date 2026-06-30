import * as cheerio from 'cheerio';
import { CONTACT_PATHS, FIRM_OUTREACH_UA } from '../constants';
import { domainFromUrl } from '../normalize';
import {
  extractEmailsFromHtml,
  guessEmailsForDomain,
  scoreEmailCandidate,
} from './email-extract';
import { hasMxRecord, isPlausibleOutreachEmail } from './validator';
import { isOwnSiteUrl, isDirectoryOrSocialUrl } from './website-discovery';
import type { EmailConfidence, FirmProspect, FirmProspectEmail } from '../types';

const FETCH_TIMEOUT_MS = 8_000;

async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': FIRM_OUTREACH_UA, Accept: 'text/html' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: 'follow',
    });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') ?? '';
    if (!ct.includes('text/html') && !ct.includes('text/plain')) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function absoluteUrl(base: string, path: string): string {
  try {
    return new URL(path, base).toString();
  } catch {
    return base;
  }
}

export async function crawlEmailsForProspect(
  prospect: FirmProspect,
  opts?: { maxPages?: number },
): Promise<{
  best: FirmProspectEmail | null;
  alternatives: FirmProspectEmail[];
  websiteUrl?: string;
  regulatoryNumber?: string;
}> {
  const websiteUrl = prospect.websiteUrl;
  if (websiteUrl && (isOwnSiteUrl(websiteUrl) || isDirectoryOrSocialUrl(websiteUrl))) {
    return {
      best: null,
      alternatives: [],
      websiteUrl: isDirectoryOrSocialUrl(websiteUrl) ? undefined : websiteUrl,
      regulatoryNumber: prospect.regulatoryNumber,
    };
  }

  const allCandidates = new Set<string>();
  let combinedText = '';

  const paths = opts?.maxPages
    ? CONTACT_PATHS.slice(0, opts.maxPages)
    : [...CONTACT_PATHS];

  if (websiteUrl) {
    const base = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`;
    for (const path of paths) {
      const url = absoluteUrl(base, path);
      const html = await fetchPage(url);
      if (!html) continue;
      combinedText += ' ' + cheerio.load(html)('body').text();
      for (const e of extractEmailsFromHtml(html)) allCandidates.add(e);
      await new Promise((r) => setTimeout(r, 120));
    }
  }

  const domain = domainFromUrl(websiteUrl);
  if (domain && allCandidates.size === 0) {
    for (const guess of guessEmailsForDomain(domain)) {
      if (await hasMxRecord(guess)) {
        allCandidates.add(guess);
      }
    }
  }

  const scoreOpts = {
    prospectType: prospect.prospectType,
    websiteUrl,
    forename: prospect.forename,
    surname: prospect.surname,
    pageText: combinedText,
  };

  const ranked = [...allCandidates]
    .filter((address) => isPlausibleOutreachEmail(address))
    .map((address) => {
      const score = scoreEmailCandidate(address, scoreOpts);
      const confidence: EmailConfidence = address.includes('@') &&
        guessEmailsForDomain(domain ?? '').includes(address)
        ? 'guessed'
        : 'crawled';
      return {
        address,
        score,
        confidence,
        source: confidence === 'guessed' ? 'mx_guess' : 'website_crawl',
      };
    })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score);

  const best = ranked[0] ?? null;
  return {
    best,
    alternatives: ranked.slice(1, 5),
    websiteUrl,
    regulatoryNumber: prospect.regulatoryNumber,
  };
}

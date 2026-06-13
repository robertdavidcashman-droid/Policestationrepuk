import crypto from 'crypto';
import { getKV } from '@/lib/kv';
import { normalizePhoneDigits } from '@/lib/phone-format';
import { hasCustodyWordingNear } from './phone';
import type { CustodyNumberFinding, SourceEvidence, SourceEvidenceKind } from './types';

const FETCH_TIMEOUT_MS = 12_000;
const EXCERPT_RADIUS = 400;
const PAGE_CACHE_PREFIX = 'custodydiscovery:pagecache:';

function pageCacheKey(url: string): string {
  return `${PAGE_CACHE_PREFIX}${crypto.createHash('sha256').update(url).digest('hex').slice(0, 32)}`;
}

function pageCacheTtlSec(): number {
  return Math.max(300, Number(process.env.CUSTODY_AI_PAGE_CACHE_SECONDS ?? 86400));
}

export function fetchEvidenceEnabled(): boolean {
  return process.env.CUSTODY_AI_FETCH_EVIDENCE !== 'false';
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function nearestSectionHeading(html: string, matchIndex: number): string {
  const before = html.slice(0, matchIndex);
  const headingMatches = [...before.matchAll(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/gi)];
  if (headingMatches.length === 0) return 'Page content';
  const raw = headingMatches[headingMatches.length - 1][1];
  return htmlToText(raw).slice(0, 120) || 'Page content';
}

function highlightPhoneInQuote(quote: string, display: string, normalized: string): string {
  if (quote.includes(display)) return quote.replace(display, `**${display}**`);
  const digits = normalized.replace(/\D/g, '');
  const re = new RegExp(digits.split('').join('[\\s\\-().]*'), 'i');
  const m = quote.match(re);
  if (m?.[0]) return quote.replace(m[0], `**${m[0]}**`);
  return quote;
}

function extractExcerptFromText(
  text: string,
  finding: CustodyNumberFinding,
): { quote: string; section: string } | null {
  const digits = finding.normalizedPhoneNumber.replace(/\D/g, '');
  const variants = [finding.possiblePhoneNumber, digits, `0${digits.slice(-10)}`].filter(Boolean);

  let idx = -1;
  let matched = finding.possiblePhoneNumber;
  for (const v of variants) {
    const i = text.indexOf(v);
    if (i >= 0) {
      idx = i;
      matched = v;
      break;
    }
  }
  if (idx < 0) {
    const re = new RegExp(digits.slice(-10).split('').join('[\\s\\-().]*'), 'i');
    const m = text.match(re);
    if (m?.index == null) return null;
    idx = m.index;
    matched = m[0];
  }

  const start = Math.max(0, idx - EXCERPT_RADIUS);
  const end = Math.min(text.length, idx + matched.length + EXCERPT_RADIUS);
  let quote = text.slice(start, end).trim();
  if (start > 0) quote = `…${quote}`;
  if (end < text.length) quote = `${quote}…`;
  quote = highlightPhoneInQuote(quote, finding.possiblePhoneNumber, finding.normalizedPhoneNumber);
  return { quote, section: 'Page content' };
}

async function fetchPageHtml(url: string): Promise<string | null> {
  const kv = getKV();
  if (kv) {
    const cached = await kv.get<string>(pageCacheKey(url));
    if (cached) return cached;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'PoliceStationRepUK-CustodyDiscovery/1.0 (+https://policestationrepuk.org)',
        Accept: 'text/html,application/xhtml+xml',
      },
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    const html = await res.text();
    if (kv) {
      await kv.set(pageCacheKey(url), html, { ex: pageCacheTtlSec() });
    }
    return html;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function snippetFallback(finding: CustodyNumberFinding): SourceEvidence {
  const quote = highlightPhoneInQuote(
    finding.pageSnippet,
    finding.possiblePhoneNumber,
    finding.normalizedPhoneNumber,
  );
  return {
    quote,
    section: finding.sourceTitle || 'Search snippet',
    sourceUrl: finding.sourceUrl,
    sourceTitle: finding.sourceTitle,
    source: 'search_snippet',
    fetchedAt: new Date().toISOString(),
  };
}

export async function fetchSourceEvidence(finding: CustodyNumberFinding): Promise<SourceEvidence> {
  const now = new Date().toISOString();
  const url = finding.sourceUrl?.trim() ?? '';

  if (!url.startsWith('http')) {
    return snippetFallback(finding);
  }

  if (/\.pdf(\?|#|$)/i.test(url)) {
    return {
      ...snippetFallback(finding),
      source: 'pdf_unfetched',
      section: 'PDF document (not fetched)',
    };
  }

  if (!fetchEvidenceEnabled()) {
    return snippetFallback(finding);
  }

  const html = await fetchPageHtml(url);
  if (!html) {
    return snippetFallback(finding);
  }

  const text = htmlToText(html);
  const digits = normalizePhoneDigits(finding.possiblePhoneNumber);
  const textDigits = text.replace(/\D/g, '');
  if (!digits || !textDigits.includes(digits.replace(/^0/, ''))) {
    return snippetFallback(finding);
  }

  const plainIdx = text.indexOf(finding.possiblePhoneNumber);
  const htmlIdx = html.toLowerCase().indexOf(finding.possiblePhoneNumber.toLowerCase());
  const section =
    plainIdx >= 0 || htmlIdx >= 0
      ? nearestSectionHeading(html, Math.max(htmlIdx, 0))
      : 'Page content';

  const excerpt = extractExcerptFromText(text, finding);
  if (!excerpt) {
    return snippetFallback(finding);
  }

  return {
    quote: excerpt.quote,
    section: section || excerpt.section,
    sourceUrl: url,
    sourceTitle: finding.sourceTitle,
    source: 'page_fetch',
    fetchedAt: now,
  };
}

export function evidenceHasCustodyWording(evidence: SourceEvidence): boolean {
  return hasCustodyWordingNear(evidence.quote.replace(/\*\*/g, ''));
}

export function evidenceContainsPhone(
  evidence: SourceEvidence,
  normalizedPhoneNumber: string,
): boolean {
  const digits = normalizedPhoneNumber.replace(/\D/g, '');
  const hay = evidence.quote.replace(/\*\*/g, '').replace(/\D/g, '');
  return hay.includes(digits) || hay.includes(digits.replace(/^0/, ''));
}

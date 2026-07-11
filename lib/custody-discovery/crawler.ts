import crypto from 'crypto';
import {
  confidenceLevelFromScore,
  initialFindingStatus,
  scoreConfidence,
  shouldAutoRejectFinding,
} from './confidence';
import { classifyPhoneNumber } from './classify';
import { hashSourceEvidence } from './hash';
import { numberSafetyFlags } from './number-safety';
import { toE164Uk } from '@/lib/phone-format';
import {
  extractPhonesFromText,
  hasCustodyWordingNear,
  isValidCustodyCandidate,
  pickBestCustodyCandidatePhone,
  type ExtractedPhone,
  type PhonePickContext,
} from './phone';
import { fetchOfficialSources } from './official-pages';
import { searchForSuite, isSearchQueryError, type SearchProvider } from './search';
import { fetchPageTextFromUrl } from './source-evidence';
import { detectSourceType, extractDomain } from './source-type';
import {
  getApprovedNumber,
  getFindingByHash,
  getFindingsForSuite,
  saveFinding,
} from './storage';
import { selectSuiteBatch } from './cursor';
import type { CrawlerRunStats, CustodyNumberFinding, CustodySuite, SearchResult } from './types';

const REJECT_CLASSIFICATIONS = new Set([
  'irrelevant',
  'general_101',
  'switchboard',
  'solicitor_office',
  'victim_witness',
]);

function newFindingId(): string {
  return `cnf_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;
}

export function defaultMaxSearchQueries(): number {
  return Math.max(1, Number(process.env.CUSTODY_DISCOVERY_MAX_QUERIES ?? 4));
}

export function maxPageFetchesPerSuite(): number {
  return Math.max(0, Number(process.env.CUSTODY_DISCOVERY_PAGE_FETCH_LIMIT ?? 3));
}

function phonePickContext(suite: CustodySuite): PhonePickContext {
  return {
    forceName: suite.forceName,
    suiteNames: [suite.custodySuiteName, suite.policeStationName],
  };
}

export function mergeSearchResults(serper: SearchResult[], official: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();
  const merged: SearchResult[] = [];
  for (const row of [...official, ...serper]) {
    const key = row.url.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(row);
  }
  return merged;
}

function urlFetchPriority(url: string): number {
  const u = url.toLowerCase();
  if (u.includes('.police.uk') || u.includes('police.uk/')) return 3;
  if (u.includes('gov.uk')) return 2;
  return 1;
}

function isFetchableUrl(url: string): boolean {
  return url.startsWith('http') && !/\.pdf(\?|#|$)/i.test(url);
}

function snippetNeedsPageFetch(hit: SearchResult, opts: PhonePickContext): boolean {
  const combined = `${hit.title} ${hit.snippet}`;
  const phone = pickBestCustodyCandidatePhone(combined, opts);
  if (!phone) return true;
  return !hasCustodyWordingNear(phone.context);
}

function resolvePhoneFromHit(
  hit: SearchResult,
  opts: PhonePickContext,
  pageText?: string,
): ExtractedPhone | null {
  const combined = `${hit.title} ${hit.snippet}`;
  const fromSnippet = pickBestCustodyCandidatePhone(combined, opts);
  if (fromSnippet && hasCustodyWordingNear(fromSnippet.context)) {
    return fromSnippet;
  }
  if (pageText) {
    const fromPage = pickBestCustodyCandidatePhone(pageText, opts);
    if (fromPage) return fromPage;
  }
  return fromSnippet;
}

async function buildPageTextCache(
  hits: SearchResult[],
  opts: PhonePickContext,
  budget: number,
): Promise<Map<string, string>> {
  const cache = new Map<string, string>();
  if (budget <= 0) return cache;

  const candidates = hits
    .filter((hit) => isFetchableUrl(hit.url) && snippetNeedsPageFetch(hit, opts))
    .sort((a, b) => urlFetchPriority(b.url) - urlFetchPriority(a.url));

  for (const hit of candidates) {
    if (cache.size >= budget) break;
    if (cache.has(hit.url)) continue;
    const text = await fetchPageTextFromUrl(hit.url);
    if (text) cache.set(hit.url, text);
  }

  return cache;
}

export interface ProcessSearchResultInput {
  suite: CustodySuite;
  title: string;
  url: string;
  snippet: string;
  date?: string;
  existingFindings: CustodyNumberFinding[];
  searchProvider?: SearchProvider;
  pageText?: string;
}

export async function processSearchHit(
  input: ProcessSearchResultInput,
): Promise<{ action: 'created' | 'updated' | 'rejected' | 'duplicate'; finding?: CustodyNumberFinding }> {
  const { suite, title, url, snippet, date, pageText } = input;

  if (!url?.trim().startsWith('http')) {
    return { action: 'rejected' };
  }

  const phone = resolvePhoneFromHit({ title, url, snippet }, phonePickContext(suite), pageText);
  if (!phone || !isValidCustodyCandidate(phone.display, suite.forceName)) {
    return { action: 'rejected' };
  }

  const sourceType = detectSourceType(url, title);
  const sourceDomain = extractDomain(url);
  const hash = hashSourceEvidence({
    custodySuiteId: suite.id,
    normalizedPhoneNumber: phone.normalized,
    sourceUrl: url,
    pageSnippet: phone.context,
  });

  const duplicate = await getFindingByHash(hash);
  if (duplicate) {
    const now = new Date().toISOString();
    const updated: CustodyNumberFinding = { ...duplicate, lastChecked: now, updatedAt: now };
    await saveFinding(updated);
    return { action: 'duplicate', finding: updated };
  }

  const sameNumberCount = input.existingFindings.filter(
    (f) => f.normalizedPhoneNumber === phone.normalized && f.status !== 'rejected',
  ).length + 1;

  const distinctNumbers = new Set(
    input.existingFindings
      .filter((f) => f.status !== 'rejected')
      .map((f) => f.normalizedPhoneNumber),
  );
  distinctNumbers.add(phone.normalized);
  const hasConflictingNumbers = distinctNumbers.size > 1;

  const approved = await getApprovedNumber(suite.id);
  const conflictsWithApproved =
    approved &&
    approved.normalizedPhoneNumber !== phone.normalized &&
    approved.publicVisible;

  const confidenceScore = scoreConfidence({
    sourceType,
    sourceUrl: url,
    sourceTitle: title,
    pageSnippet: phone.context,
    matchingSourceCount: input.existingFindings.length + 1,
    sameNumberSourceCount: sameNumberCount,
    sourceDate: date,
    isArchiveOnly: sourceType === 'archived',
    hasConflictingNumbers,
  });

  const classification = await classifyPhoneNumber({
    phoneNumber: phone.display,
    pageSnippet: phone.context,
    sourceTitle: title,
    custodySuiteName: suite.custodySuiteName,
    forceName: suite.forceName,
  });

  if (shouldAutoRejectFinding(confidenceScore, url) || REJECT_CLASSIFICATIONS.has(classification)) {
    return { action: 'rejected' };
  }

  const now = new Date().toISOString();
  const hasConflict = hasConflictingNumbers || Boolean(conflictsWithApproved);
  const status = initialFindingStatus();
  const conflictReason = hasConflict ? 'possible_conflict' : undefined;

  const finding: CustodyNumberFinding = {
    id: newFindingId(),
    custodySuiteId: suite.id,
    forceName: suite.forceName,
    custodySuiteName: suite.custodySuiteName,
    policeStationName: suite.policeStationName,
    possiblePhoneNumber: phone.display,
    normalizedPhoneNumber: phone.normalized,
    e164: toE164Uk(phone.normalized),
    numberFlags: numberSafetyFlags(phone.normalized),
    sourceTitle: title,
    sourceUrl: url,
    sourceDomain,
    sourceType,
    pageSnippet: phone.context,
    classification,
    confidenceScore,
    confidenceLevel: confidenceLevelFromScore(confidenceScore),
    status,
    dateFound: now,
    lastChecked: now,
    hashOfSourceEvidence: hash,
    notes: '',
    conflictReason,
    createdAt: now,
    updatedAt: now,
  };

  await saveFinding(finding);
  return { action: 'created', finding };
}

export interface CrawlSuiteOptions {
  searchProvider?: SearchProvider;
  maxQueries?: number;
}

export async function crawlCustodySuite(
  suite: CustodySuite,
  options: CrawlSuiteOptions = {},
): Promise<{
  searchesRun: number;
  numbersExtracted: number;
  created: number;
  updated: number;
  rejected: number;
  conflicts: number;
  officialPagesFetched: number;
  pageFetchesUsed: number;
  newFindingIds: string[];
}> {
  const maxQueries = options.maxQueries ?? defaultMaxSearchQueries();
  const pickOpts = phonePickContext(suite);

  const [serperOutcome, officialResults] = await Promise.all([
    searchForSuite(suite, options.searchProvider, maxQueries),
    fetchOfficialSources(suite),
  ]);

  if (isSearchQueryError(serperOutcome)) {
    throw new Error(serperOutcome.reason);
  }
  const serperResults = serperOutcome;

  const results = mergeSearchResults(serperResults, officialResults);
  const pageTextCache = await buildPageTextCache(
    results,
    pickOpts,
    maxPageFetchesPerSuite(),
  );

  const existing = await getFindingsForSuite(suite.id);

  let created = 0;
  let updated = 0;
  let rejected = 0;
  let conflicts = 0;
  let numbersExtracted = 0;
  const newFindingIds: string[] = [];

  for (const hit of results) {
    const pageText = pageTextCache.get(hit.url);
    const extractSource = pageText ? `${hit.title} ${hit.snippet} ${pageText}` : `${hit.title} ${hit.snippet}`;
    const phones = extractPhonesFromText(extractSource, 120, suite.forceName);
    numbersExtracted += phones.length;

    const outcome = await processSearchHit({
      suite,
      title: hit.title,
      url: hit.url,
      snippet: hit.snippet,
      date: hit.date,
      existingFindings: existing,
      searchProvider: options.searchProvider,
      pageText,
    });

    if (outcome.action === 'created') {
      created++;
      if (outcome.finding?.id) newFindingIds.push(outcome.finding.id);
      if (outcome.finding?.conflictReason) conflicts++;
      if (outcome.finding) existing.push(outcome.finding);
    } else if (outcome.action === 'duplicate') {
      updated++;
    } else {
      rejected++;
    }
  }

  return {
    searchesRun: maxQueries,
    numbersExtracted,
    created,
    updated,
    rejected,
    conflicts,
    officialPagesFetched: officialResults.length,
    pageFetchesUsed: pageTextCache.size,
    newFindingIds,
  };
}

export interface CrawlAllOptions extends CrawlSuiteOptions {
  limit?: number;
  suiteIds?: string[];
  /** When true (default), rotate batch cursor across cron runs. */
  useCursor?: boolean;
}

export interface CrawlerRunResult {
  stats: CrawlerRunStats;
  newFindingIds: string[];
}

export async function runCustodyDiscoveryCrawler(
  suites: CustodySuite[],
  options: CrawlAllOptions = {},
): Promise<CrawlerRunResult> {
  const started = Date.now();
  const useCursor = options.useCursor !== false;
  let target: CustodySuite[];
  let batchCursor = 0;
  let batchStartIndex = 0;
  let batchTotal = suites.filter((s) => s.active).length;
  let scannedSuiteIds: string[] = [];

  if (options.suiteIds?.length) {
    const set = new Set(options.suiteIds);
    target = suites.filter((s) => s.active && set.has(s.id));
    scannedSuiteIds = target.map((s) => s.id);
  } else if (options.limit && useCursor) {
    const selection = await selectSuiteBatch(suites, options.limit);
    target = selection.batch;
    batchCursor = selection.nextCursor;
    batchStartIndex = selection.batchStartIndex;
    batchTotal = selection.total;
    scannedSuiteIds = selection.scannedSuiteIds;
  } else {
    target = suites.filter((s) => s.active);
    if (options.limit) target = target.slice(0, options.limit);
    scannedSuiteIds = target.map((s) => s.id);
  }

  const stats: CrawlerRunStats = {
    suitesScanned: 0,
    searchesRun: 0,
    numbersExtracted: 0,
    findingsCreated: 0,
    findingsUpdated: 0,
    findingsRejected: 0,
    conflictsFlagged: 0,
    officialPagesFetched: 0,
    pageFetchesUsed: 0,
    batchCursor,
    batchStartIndex,
    batchTotal,
    scannedSuiteIds,
    elapsedMs: 0,
  };
  const newFindingIds: string[] = [];

  for (const suite of target) {
    try {
      const row = await crawlCustodySuite(suite, options);
      stats.searchesRun += row.searchesRun;
      stats.numbersExtracted += row.numbersExtracted;
      stats.findingsCreated += row.created;
      stats.findingsUpdated += row.updated;
      stats.findingsRejected += row.rejected;
      stats.conflictsFlagged += row.conflicts;
      stats.officialPagesFetched += row.officialPagesFetched;
      stats.pageFetchesUsed += row.pageFetchesUsed;
      newFindingIds.push(...row.newFindingIds);
    } catch (err) {
      console.error(`custody discovery: crawl failed for ${suite.id}`, err);
    }
    stats.suitesScanned++;
  }

  stats.elapsedMs = Date.now() - started;
  return { stats, newFindingIds };
}

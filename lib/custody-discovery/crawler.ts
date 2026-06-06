import crypto from 'crypto';
import {
  confidenceLevelFromScore,
  scoreConfidence,
  shouldAutoRejectFinding,
} from './confidence';
import { classifyPhoneNumber } from './classify';
import { hashSourceEvidence } from './hash';
import { extractPhonesFromText, isValidCustodyCandidate, pickCustodyCandidatePhone } from './phone';
import { fetchOfficialSources } from './official-pages';
import { searchForSuite, type SearchProvider } from './search';
import { detectSourceType, extractDomain } from './source-type';
import {
  getApprovedNumber,
  getFindingByHash,
  getFindingsForSuite,
  saveFinding,
} from './storage';
import { selectSuiteBatch } from './cursor';
import type { CrawlerRunStats, CustodyNumberFinding, CustodySuite } from './types';

function newFindingId(): string {
  return `cnf_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;
}

export interface ProcessSearchResultInput {
  suite: CustodySuite;
  title: string;
  url: string;
  snippet: string;
  date?: string;
  existingFindings: CustodyNumberFinding[];
  searchProvider?: SearchProvider;
}

export async function processSearchHit(
  input: ProcessSearchResultInput,
): Promise<{ action: 'created' | 'updated' | 'rejected' | 'duplicate'; finding?: CustodyNumberFinding }> {
  const { suite, title, url, snippet, date } = input;

  if (!url?.trim().startsWith('http')) {
    return { action: 'rejected' };
  }

  const combined = `${title} ${snippet}`;
  const phone = pickCustodyCandidatePhone(combined, suite.forceName);
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

  if (
    shouldAutoRejectFinding(confidenceScore, url) ||
    classification === 'irrelevant' ||
    classification === 'general_101' ||
    classification === 'switchboard'
  ) {
    return { action: 'rejected' };
  }

  const now = new Date().toISOString();
  let status: CustodyNumberFinding['status'] = 'new';
  let conflictReason: string | undefined;

  if (confidenceScore < 50 || classification !== 'direct_custody') {
    status = 'needs_review';
  }
  if (hasConflictingNumbers || conflictsWithApproved) {
    status = 'needs_review';
    conflictReason = 'possible_conflict';
  }

  const finding: CustodyNumberFinding = {
    id: newFindingId(),
    custodySuiteId: suite.id,
    forceName: suite.forceName,
    custodySuiteName: suite.custodySuiteName,
    policeStationName: suite.policeStationName,
    possiblePhoneNumber: phone.display,
    normalizedPhoneNumber: phone.normalized,
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
  newFindingIds: string[];
}> {
  let results = await searchForSuite(suite, options.searchProvider, options.maxQueries ?? 6);
  let officialPagesFetched = 0;
  if (results.length === 0) {
    const official = await fetchOfficialSources(suite);
    officialPagesFetched = official.length;
    results = official;
  }
  const existing = await getFindingsForSuite(suite.id);

  let created = 0;
  let updated = 0;
  let rejected = 0;
  let conflicts = 0;
  let numbersExtracted = 0;
  const newFindingIds: string[] = [];

  for (const hit of results) {
    const phones = extractPhonesFromText(`${hit.title} ${hit.snippet}`);
    numbersExtracted += phones.length;

    const outcome = await processSearchHit({
      suite,
      title: hit.title,
      url: hit.url,
      snippet: hit.snippet,
      date: hit.date,
      existingFindings: existing,
      searchProvider: options.searchProvider,
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
    searchesRun: Math.min(options.maxQueries ?? 6, 10),
    numbersExtracted,
    created,
    updated,
    rejected,
    conflicts,
    officialPagesFetched,
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
    batchCursor,
    batchStartIndex,
    batchTotal,
    scannedSuiteIds,
    elapsedMs: 0,
  };
  const newFindingIds: string[] = [];

  for (const suite of target) {
    const row = await crawlCustodySuite(suite, options);
    stats.suitesScanned++;
    stats.searchesRun += row.searchesRun;
    stats.numbersExtracted += row.numbersExtracted;
    stats.findingsCreated += row.created;
    stats.findingsUpdated += row.updated;
    stats.findingsRejected += row.rejected;
    stats.conflictsFlagged += row.conflicts;
    stats.officialPagesFetched += row.officialPagesFetched;
    newFindingIds.push(...row.newFindingIds);
  }

  stats.elapsedMs = Date.now() - started;
  return { stats, newFindingIds };
}

import { ensureDsccRegisterCache } from '@/lib/dscc-register-lookup';
import { readLaaCrimeJson } from '@/lib/legal-directory/laa-fetch';
import { enrichBatchSize } from '../constants';
import { buildCrimeRegistry, resolveStatusWithQualification } from '../qualification';
import type { CrimeRegistry } from '../qualification';
import { resolveProspectWebsite } from './resolve-prospect-website';
import {
  CURSOR_ENRICH,
  getCursor,
  getProspectsByIds,
  isDuplicateInitialSend,
  listProspectIdsByRecordStatus,
  getProspect,
  saveProspect,
  setCursor,
} from '../storage';
import type { EnrichmentRunStats, FirmProspect } from '../types';
import {
  enrichCandidateScore,
  ENRICH_CONCURRENCY,
  ENRICH_SCAN_MULTIPLIER,
  MAX_ENRICH_ATTEMPTS,
  NO_EMAIL_AFTER_ATTEMPTS,
  shouldEnrichProspect,
} from './enrich-candidates';
import { crawlEmailsForProspect } from './email-crawler';
import { paidEnrichEmails } from './paid-enrichment';
import { domainFromUrl } from '../normalize';
import { websiteIndicatesCrimePractice } from '../crime-website-verify';
import { isPlausibleOutreachEmail, validateEmailForSend } from './validator';

function pickDeliverableEmail(
  best: { address: string; confidence: FirmProspect['emailConfidence']; score: number } | null,
  alternatives: Array<{ address: string; confidence: FirmProspect['emailConfidence']; score: number }>,
): typeof best {
  if (best && isPlausibleOutreachEmail(best.address)) return best;
  return alternatives.find((a) => isPlausibleOutreachEmail(a.address)) ?? null;
}

async function enrichOne(prospect: FirmProspect, registry: CrimeRegistry): Promise<FirmProspect> {
  const now = new Date().toISOString();
  prospect.status = 'enriching';
  prospect.lastEnrichAttemptAt = now;
  prospect.enrichAttempts += 1;
  prospect.updatedAt = now;

  await resolveProspectWebsite(prospect);
  if (prospect.excludedReason === 'sra_not_authorised') {
    prospect.updatedAt = new Date().toISOString();
    return prospect;
  }

  if (!prospect.email || !isPlausibleOutreachEmail(prospect.email)) {
    if (prospect.email && !isPlausibleOutreachEmail(prospect.email)) {
      prospect.email = undefined;
      prospect.emailConfidence = undefined;
      prospect.emailScore = undefined;
    }

    const crawled = await crawlEmailsForProspect(prospect, { maxPages: 5 });
    prospect.websiteUrl = crawled.websiteUrl ?? prospect.websiteUrl;
    const chosen = pickDeliverableEmail(crawled.best, crawled.alternatives);
    if (chosen) {
      prospect.email = chosen.address;
      prospect.emailConfidence = chosen.confidence;
      prospect.emailScore = chosen.score;
      prospect.alternativeEmails = crawled.alternatives.filter(
        (a) => a.address !== chosen.address && isPlausibleOutreachEmail(a.address),
      );
    } else {
      const domain = domainFromUrl(prospect.websiteUrl);
      const paid = await paidEnrichEmails({
        firmName: prospect.firmName,
        domain: domain ?? undefined,
        postcode: prospect.postcode,
      });
      const paidOk = paid.find((e) => isPlausibleOutreachEmail(e.address));
      if (paidOk) {
        prospect.email = paidOk.address;
        prospect.emailConfidence = paidOk.confidence;
        prospect.emailScore = paidOk.score;
        prospect.alternativeEmails = paid.filter(
          (e) => e.address !== paidOk.address && isPlausibleOutreachEmail(e.address),
        );
      }
    }
  }

  prospect.enrichedAt = new Date().toISOString();
  prospect.updatedAt = prospect.enrichedAt;

  if (
    !prospect.crimeWebsiteVerified &&
    prospect.websiteUrl &&
    prospect.sources.includes('archive')
  ) {
    prospect.crimeWebsiteVerified = await websiteIndicatesCrimePractice(prospect.websiteUrl);
  }

  if (prospect.email && isPlausibleOutreachEmail(prospect.email)) {
    const mx = await validateEmailForSend(prospect.email);
    if (!mx.ok) {
      prospect.email = undefined;
      prospect.emailConfidence = undefined;
      prospect.emailScore = undefined;
      prospect.status =
        prospect.enrichAttempts >= NO_EMAIL_AFTER_ATTEMPTS ? 'no_email' : 'discovered';
      return prospect;
    }

    prospect.status = resolveStatusWithQualification(prospect, 'ready_to_send', registry);
    if (
      prospect.status === 'ready_to_send' &&
      (await isDuplicateInitialSend(prospect.email, prospect.id))
    ) {
      prospect.status = 'excluded';
      prospect.excludedReason = 'duplicate_email';
    }
  } else if (prospect.enrichAttempts >= NO_EMAIL_AFTER_ATTEMPTS) {
    prospect.status = 'no_email';
  } else {
    prospect.status = 'discovered';
  }

  return prospect;
}

export async function advanceEnrichCursor(
  cursor: number,
  processedCount: number,
  poolLength: number,
): Promise<number> {
  if (poolLength === 0) {
    await setCursor(CURSOR_ENRICH, 0);
    return 0;
  }
  if (processedCount <= 0) {
    if (cursor >= poolLength) {
      await setCursor(CURSOR_ENRICH, 0);
      return 0;
    }
    return cursor;
  }
  const next = cursor + processedCount;
  const wrapped = next >= poolLength ? 0 : next;
  await setCursor(CURSOR_ENRICH, wrapped);
  return wrapped;
}

async function loadEnrichRegistry(): Promise<CrimeRegistry> {
  const laa = readLaaCrimeJson();
  const dscc = await ensureDsccRegisterCache();
  return buildCrimeRegistry(laa, dscc?.entries ?? []);
}

/** Load enrichable prospect IDs from stored record status (not stale status indexes). */
export async function loadEnrichPoolIds(): Promise<string[]> {
  const discovered = await listProspectIdsByRecordStatus('discovered');
  const noEmail = await listProspectIdsByRecordStatus('no_email');
  const now = Date.now();
  const retryIds: string[] = [];
  for (const id of noEmail) {
    const p = await getProspect(id);
    if (p && shouldEnrichProspect(p, now)) retryIds.push(id);
  }
  return [...discovered, ...retryIds];
}

/** Score a sliding window of the pool and return top IDs for this batch. */
export async function pickEnrichBatchIds(opts: {
  poolIds: string[];
  cursor: number;
  limit: number;
  scanMultiplier?: number;
}): Promise<{ batchIds: string[]; scanned: number }> {
  const { poolIds, cursor, limit } = opts;
  const scanMultiplier = opts.scanMultiplier ?? ENRICH_SCAN_MULTIPLIER;
  if (poolIds.length === 0) return { batchIds: [], scanned: 0 };

  const scanCount = Math.min(poolIds.length, Math.max(limit * 2, limit * scanMultiplier));
  const start = cursor % poolIds.length;
  const windowIds: string[] = [];
  for (let i = 0; i < scanCount; i++) {
    windowIds.push(poolIds[(start + i) % poolIds.length]);
  }
  const prospectMap = await getProspectsByIds(windowIds);
  const candidates: { id: string; score: number }[] = [];

  for (const id of windowIds) {
    const p = prospectMap.get(id);
    if (!p || !shouldEnrichProspect(p)) continue;
    candidates.push({ id, score: enrichCandidateScore(p) });
  }

  candidates.sort((a, b) => b.score - a.score);
  return {
    batchIds: candidates.slice(0, limit).map((c) => c.id),
    scanned: scanCount,
  };
}

export async function runFirmEnrichment(opts?: {
  limit?: number;
  maxElapsedMs?: number;
}): Promise<EnrichmentRunStats> {
  const started = Date.now();
  const limit = opts?.limit ?? enrichBatchSize();
  const registry = await loadEnrichRegistry();
  const poolIds = await loadEnrichPoolIds();

  let cursor = await getCursor(CURSOR_ENRICH);
  if (cursor >= poolIds.length && poolIds.length > 0) {
    cursor = 0;
    await setCursor(CURSOR_ENRICH, 0);
  }

  const { batchIds, scanned } = await pickEnrichBatchIds({
    poolIds,
    cursor,
    limit,
  });

  let emailsFound = 0;
  let readyToSend = 0;
  let noEmail = 0;
  let errors = 0;
  let processedCount = 0;
  let stoppedEarly = false;
  let nextIndex = 0;

  async function processOne(id: string): Promise<void> {
    if (opts?.maxElapsedMs != null && Date.now() - started >= opts.maxElapsedMs) {
      stoppedEarly = true;
      return;
    }
    try {
      const p = await getProspect(id);
      if (!p || !shouldEnrichProspect(p)) return;
      const prevStatus = p.status;
      const enriched = await enrichOne(p, registry);
      await saveProspect(enriched, prevStatus);
      processedCount++;
      if (enriched.email) emailsFound++;
      if (enriched.status === 'ready_to_send') readyToSend++;
      if (enriched.status === 'no_email') noEmail++;
    } catch (err) {
      errors++;
      console.warn('[firm-outreach enrich]', id, err);
    }
  }

  const workers = Array.from({ length: Math.min(ENRICH_CONCURRENCY, batchIds.length) }, async () => {
    while (true) {
      if (opts?.maxElapsedMs != null && Date.now() - started >= opts.maxElapsedMs) {
        stoppedEarly = true;
        break;
      }
      const i = nextIndex++;
      if (i >= batchIds.length) break;
      await processOne(batchIds[i]);
    }
  });
  await Promise.all(workers);

  const advanceBy = processedCount > 0 || !stoppedEarly ? scanned : 0;
  await advanceEnrichCursor(cursor, advanceBy, poolIds.length);

  return {
    processed: processedCount,
    emailsFound,
    readyToSend,
    noEmail,
    errors,
    elapsedMs: Date.now() - started,
    stoppedEarly: stoppedEarly || undefined,
    poolSize: poolIds.length,
    candidatesScanned: scanned,
  };
}

export {
  shouldEnrichProspect,
  enrichCandidateScore,
  ENRICH_CONCURRENCY,
  MAX_ENRICH_ATTEMPTS,
  NO_EMAIL_AFTER_ATTEMPTS,
  ENRICH_SCAN_MULTIPLIER,
} from './enrich-candidates';

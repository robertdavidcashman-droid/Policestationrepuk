import { enrichBatchSize } from '../constants';
import { lookupSraOrganisationByName } from '../sra-org-lookup';
import {
  CURSOR_ENRICH,
  getCursor,
  listAllProspectIds,
  getProspect,
  saveProspect,
  setCursor,
} from '../storage';
import type { EnrichmentRunStats, FirmProspect } from '../types';
import { crawlEmailsForProspect } from './email-crawler';
import { paidEnrichEmails } from './paid-enrichment';
import { domainFromUrl } from '../normalize';
import { resolveStatusWithQualification } from '../qualification';
import { websiteIndicatesCrimePractice } from '../crime-website-verify';

async function enrichOne(prospect: FirmProspect): Promise<FirmProspect> {
  const now = new Date().toISOString();
  prospect.status = 'enriching';
  prospect.lastEnrichAttemptAt = now;
  prospect.enrichAttempts += 1;
  prospect.updatedAt = now;

  if (!prospect.regulatoryNumber || !prospect.websiteUrl) {
    const sra = await lookupSraOrganisationByName(prospect.firmName, prospect.postcode);
    if (sra.organisation) {
      prospect.regulatoryNumber = prospect.regulatoryNumber || sra.organisation.sraNumber;
      prospect.websiteUrl = prospect.websiteUrl || sra.organisation.website;
      if (sra.matched && !sra.organisation.authorised) {
        prospect.status = 'excluded';
        prospect.excludedReason = 'sra_not_authorised';
        return prospect;
      }
    }
    await new Promise((r) => setTimeout(r, 2000));
  }

  if (!prospect.email) {
    const crawled = await crawlEmailsForProspect(prospect);
    prospect.websiteUrl = crawled.websiteUrl ?? prospect.websiteUrl;
    if (crawled.best) {
      prospect.email = crawled.best.address;
      prospect.emailConfidence = crawled.best.confidence;
      prospect.emailScore = crawled.best.score;
      prospect.alternativeEmails = crawled.alternatives;
    } else {
      const domain = domainFromUrl(prospect.websiteUrl);
      const paid = await paidEnrichEmails({
        firmName: prospect.firmName,
        domain: domain ?? undefined,
        postcode: prospect.postcode,
      });
      if (paid[0]) {
        prospect.email = paid[0].address;
        prospect.emailConfidence = paid[0].confidence;
        prospect.emailScore = paid[0].score;
        prospect.alternativeEmails = paid.slice(1);
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

  if (prospect.email) {
    prospect.status = resolveStatusWithQualification(prospect, 'ready_to_send');
  } else if (prospect.enrichAttempts >= 3) {
    prospect.status = 'no_email';
  } else {
    prospect.status = 'discovered';
  }

  return prospect;
}

export async function advanceEnrichCursor(
  cursor: number,
  processedCount: number,
  needEnrichLength: number,
): Promise<number> {
  if (needEnrichLength === 0) {
    await setCursor(CURSOR_ENRICH, 0);
    return 0;
  }
  if (processedCount <= 0) {
    if (cursor >= needEnrichLength) {
      await setCursor(CURSOR_ENRICH, 0);
      return 0;
    }
    return cursor;
  }
  const next = cursor + processedCount;
  const wrapped = next >= needEnrichLength ? 0 : next;
  await setCursor(CURSOR_ENRICH, wrapped);
  return wrapped;
}

export async function runFirmEnrichment(opts?: {
  limit?: number;
  maxElapsedMs?: number;
}): Promise<EnrichmentRunStats> {
  const started = Date.now();
  const limit = opts?.limit ?? enrichBatchSize();
  const ids = await listAllProspectIds();
  const candidates: { id: string; score: number }[] = [];

  for (const id of ids) {
    const p = await getProspect(id);
    if (!p) continue;
    if (p.status !== 'discovered' && (p.status !== 'no_email' || p.enrichAttempts >= 3)) continue;

    let score = p.priorityScore;
    if (p.sources.includes('laa')) score += 60;
    if (p.sources.includes('dscc') && p.prospectType === 'firm') score += 30;
    if (p.enrichAttempts > 0) score -= 20;
    candidates.push({ id, score });
  }

  candidates.sort((a, b) => b.score - a.score);
  const needEnrich = candidates.map((c) => c.id);

  let cursor = await getCursor(CURSOR_ENRICH);
  if (cursor >= needEnrich.length && needEnrich.length > 0) {
    cursor = 0;
    await setCursor(CURSOR_ENRICH, 0);
  }

  const batch = needEnrich.slice(cursor, cursor + limit);

  let emailsFound = 0;
  let readyToSend = 0;
  let noEmail = 0;
  let errors = 0;
  let processedCount = 0;
  let stoppedEarly = false;

  for (const id of batch) {
    if (opts?.maxElapsedMs != null && Date.now() - started >= opts.maxElapsedMs) {
      stoppedEarly = true;
      break;
    }

    try {
      const p = await getProspect(id);
      if (!p) continue;
      const enriched = await enrichOne(p);
      await saveProspect(enriched, p.status);
      processedCount++;
      if (enriched.email) emailsFound++;
      if (enriched.status === 'ready_to_send') readyToSend++;
      if (enriched.status === 'no_email') noEmail++;
    } catch (err) {
      errors++;
      console.warn('[firm-outreach enrich]', id, err);
    }
  }

  await advanceEnrichCursor(cursor, processedCount, needEnrich.length);

  return {
    processed: processedCount,
    emailsFound,
    readyToSend,
    noEmail,
    errors,
    elapsedMs: Date.now() - started,
    stoppedEarly: stoppedEarly || undefined,
  };
}

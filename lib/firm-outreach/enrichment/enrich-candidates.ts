import type { FirmProspect } from '../types';

/** Stop enriching after this many attempts (includes re-queues). */
export const MAX_ENRICH_ATTEMPTS = 6;

/** Minimum days before a no_email prospect is tried again. */
export const NO_EMAIL_RETRY_DAYS = 30;

export function daysSinceIso(iso: string | undefined, now = Date.now()): number {
  if (!iso) return Infinity;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return Infinity;
  return (now - t) / 86_400_000;
}

/** Whether a prospect should enter the enrichment batch. */
export function shouldEnrichProspect(prospect: FirmProspect, now = Date.now()): boolean {
  if (prospect.enrichAttempts >= MAX_ENRICH_ATTEMPTS) return false;

  if (prospect.status === 'discovered') return true;

  if (prospect.status === 'no_email') {
    return daysSinceIso(prospect.lastEnrichAttemptAt, now) >= NO_EMAIL_RETRY_DAYS;
  }

  return false;
}

export function enrichCandidateScore(prospect: FirmProspect): number {
  let score = prospect.priorityScore;
  if (prospect.sources.includes('laa')) score += 60;
  if (prospect.sources.includes('dscc') && prospect.prospectType === 'firm') score += 30;
  if (prospect.enrichAttempts > 0) score -= 20;
  if (prospect.status === 'no_email') score -= 35;
  if (!prospect.websiteUrl) score -= 10;
  return score;
}

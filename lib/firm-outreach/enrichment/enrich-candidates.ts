import type { FirmProspect } from '../types';

/** Stop enriching after this many attempts (includes re-queues). */
export const MAX_ENRICH_ATTEMPTS = 6;

/** Mark no_email only after this many failed enrich attempts. */
export const NO_EMAIL_AFTER_ATTEMPTS = MAX_ENRICH_ATTEMPTS;

/** Minimum days before a no_email prospect is tried again. */
export const NO_EMAIL_RETRY_DAYS = 30;

/** How many discovered IDs to score per run (window × batch size). */
export const ENRICH_SCAN_MULTIPLIER = 10;

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
  if (prospect.sources.includes('laa')) score += 80;
  if (prospect.sources.includes('dscc') && prospect.prospectType === 'firm') score += 40;
  if (prospect.sources.includes('dscc') && prospect.prospectType === 'solicitor') score += 25;
  // LAA firms missing email are the main backlog — prioritise never-tried first.
  if (prospect.sources.includes('laa') && !prospect.email) score += 50;
  if (prospect.enrichAttempts === 0) score += 45;
  else if (prospect.enrichAttempts === 1) score += 15;
  else score -= prospect.enrichAttempts * 12;
  if (prospect.status === 'no_email') score -= 25;
  if (prospect.websiteUrl) score += 20;
  else score -= 15;
  if (prospect.regulatoryNumber) score += 10;
  return score;
}

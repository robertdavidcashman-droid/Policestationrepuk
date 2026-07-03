import { normalizePhoneDigits } from '@/lib/phone-format';
import { extractPhonesFromText } from './phone';
import { fetchPageTextFromUrl } from './source-evidence';
import {
  appendAuditEntry,
  getFinding,
  loadAllApprovedNumbers,
  saveApprovedNumber,
  saveFinding,
  invalidateApprovedCache,
} from './storage';
import type { ApprovedCustodyNumber } from './types';

export type RecheckOutcome =
  | 'still_present'
  | 'source_missing'
  | 'number_missing'
  | 'conflict'
  | 'skipped_pdf';

export interface ApprovedRecheckStats {
  due: number;
  checked: number;
  stillPresent: number;
  sourceMissing: number;
  numberMissing: number;
  conflicts: number;
  skipped: number;
  failed: number;
  results: { suiteId: string; phoneNumber: string; outcome: RecheckOutcome }[];
}

export function recheckIntervalDays(): number {
  return Math.max(7, Number(process.env.CUSTODY_RECHECK_DAYS ?? 90));
}

function recheckBatchLimit(): number {
  return Math.max(1, Number(process.env.CUSTODY_RECHECK_BATCH_LIMIT ?? 20));
}

export function isDueForRecheck(record: ApprovedCustodyNumber, now = new Date()): boolean {
  if (!record.publicVisible) return false;
  const last = record.lastVerifiedAt || record.approvedAt;
  const ts = Date.parse(last);
  if (!Number.isFinite(ts)) return true;
  return now.getTime() - ts > recheckIntervalDays() * 86_400_000;
}

/** Text contains the approved number (digit-sequence match, format-insensitive). */
export function pageTextContainsNumber(text: string, normalizedPhoneNumber: string): boolean {
  const digits = normalizePhoneDigits(normalizedPhoneNumber).replace(/\D/g, '');
  if (!digits) return false;
  const textDigits = text.replace(/\D/g, '');
  return textDigits.includes(digits) || textDigits.includes(digits.replace(/^0/, ''));
}

async function flagSourceFindingForReview(
  record: ApprovedCustodyNumber,
  note: string,
): Promise<void> {
  const finding = await getFinding(record.sourceFindingId);
  if (!finding) return;
  const now = new Date().toISOString();
  await saveFinding({
    ...finding,
    status: 'needs_review',
    conflictReason: finding.conflictReason ?? 'recheck_failed',
    notes: [`[Recheck ${now.slice(0, 10)}] ${note}`, finding.notes].filter(Boolean).join('\n'),
    updatedAt: now,
  });
}

/**
 * Re-verify one approved number against its original source page.
 * Never unpublishes or deletes — failures downgrade to `unverified` and
 * reopen the source finding so it appears in the outstanding digest.
 */
export async function recheckApprovedNumber(
  record: ApprovedCustodyNumber,
): Promise<RecheckOutcome> {
  const now = new Date().toISOString();

  if (/\.pdf(\?|#|$)/i.test(record.sourceUrl)) {
    return 'skipped_pdf';
  }

  const text = await fetchPageTextFromUrl(record.sourceUrl);

  if (!text) {
    const updated = appendAuditEntry(
      { ...record, verificationStatus: 'unverified' },
      {
        actor: 'cron:approved-recheck',
        action: 'recheck_source_missing',
        detail: `Source page unreachable: ${record.sourceUrl}`,
      },
    );
    await saveApprovedNumber(updated);
    await flagSourceFindingForReview(record, 'Source page unreachable — number kept published but unverified.');
    return 'source_missing';
  }

  if (pageTextContainsNumber(text, record.normalizedPhoneNumber)) {
    const updated = appendAuditEntry(
      { ...record, lastVerifiedAt: now },
      {
        actor: 'cron:approved-recheck',
        action: 'recheck_ok',
        detail: 'Number still present on source page.',
      },
    );
    await saveApprovedNumber(updated);
    return 'still_present';
  }

  // Number gone — check whether the page now shows a different candidate.
  const otherCandidates = extractPhonesFromText(text, 80);
  const conflict = otherCandidates.length > 0;

  const updated = appendAuditEntry(
    { ...record, verificationStatus: 'unverified' },
    {
      actor: 'cron:approved-recheck',
      action: conflict ? 'recheck_conflict' : 'recheck_number_missing',
      detail: conflict
        ? `Number no longer on page; page now lists ${otherCandidates[0].display} — human review required.`
        : 'Number no longer on source page — human review required.',
    },
  );
  await saveApprovedNumber(updated);
  await flagSourceFindingForReview(
    record,
    conflict
      ? `Approved number missing from source; page now shows ${otherCandidates[0].display}.`
      : 'Approved number no longer on source page.',
  );
  return conflict ? 'conflict' : 'number_missing';
}

export async function runApprovedRecheckBatch(opts?: {
  limit?: number;
  now?: Date;
}): Promise<ApprovedRecheckStats> {
  const limit = opts?.limit ?? recheckBatchLimit();
  const now = opts?.now ?? new Date();
  const approvedMap = await loadAllApprovedNumbers();

  const due = [...approvedMap.values()]
    .filter((r) => isDueForRecheck(r, now))
    .sort((a, b) => (a.lastVerifiedAt || a.approvedAt).localeCompare(b.lastVerifiedAt || b.approvedAt));

  const stats: ApprovedRecheckStats = {
    due: due.length,
    checked: 0,
    stillPresent: 0,
    sourceMissing: 0,
    numberMissing: 0,
    conflicts: 0,
    skipped: 0,
    failed: 0,
    results: [],
  };

  for (const record of due.slice(0, limit)) {
    try {
      const outcome = await recheckApprovedNumber(record);
      stats.checked++;
      if (outcome === 'still_present') stats.stillPresent++;
      else if (outcome === 'source_missing') stats.sourceMissing++;
      else if (outcome === 'number_missing') stats.numberMissing++;
      else if (outcome === 'conflict') stats.conflicts++;
      else stats.skipped++;
      stats.results.push({
        suiteId: record.custodySuiteId,
        phoneNumber: record.phoneNumber,
        outcome,
      });
    } catch (err) {
      stats.failed++;
      console.warn('[approved-recheck] failed for', record.custodySuiteId, err);
    }
  }

  if (stats.checked > 0) invalidateApprovedCache();
  return stats;
}

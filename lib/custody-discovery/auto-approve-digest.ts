import { autoPublishEnabled } from './auto-decision';
import { sendCustodyAutoApproveDigestEmail } from './email';
import {
  autoApproveDigestDate,
  markAutoApproveDigestSent,
  wasAutoApproveDigestSent,
} from './auto-approve-digest-state';
import {
  buildOutstandingReviewSummary,
  pickOutstandingDigestItems,
} from './outstanding-queue';
import { getAllFindings } from './storage';
import type { CustodyNumberFinding } from './types';

export type AutoApproveReason =
  | 'official_source'
  | 'corroborated'
  | 'conflict_winner'
  | 'other';

export interface AutoApprovedDigestItem {
  finding: CustodyNumberFinding;
  reason: AutoApproveReason;
  reasonLabel: string;
}

export interface AutoApproveDigestSummary {
  date: string;
  published: AutoApprovedDigestItem[];
  autoRejectedLast24h: number;
  duplicateConfirmationsLast24h: number;
  needsManualReview: number;
}

export function inferAutoApproveReason(finding: CustodyNumberFinding): {
  reason: AutoApproveReason;
  reasonLabel: string;
} {
  const notes = finding.notes ?? '';
  if (notes.includes('Conflict resolution') || notes.includes('conflict_winner')) {
    return { reason: 'conflict_winner', reasonLabel: 'Conflict resolution (best evidence)' };
  }
  if (notes.includes('corroboration') || notes.includes('cross-reference')) {
    return { reason: 'corroborated', reasonLabel: 'Multi-source corroboration' };
  }
  if (notes.includes('official source')) {
    return { reason: 'official_source', reasonLabel: 'Official police source' };
  }
  if (finding.sourceType === 'official_police' || finding.sourceType === 'police_uk') {
    return { reason: 'official_source', reasonLabel: 'Official police source' };
  }
  return { reason: 'other', reasonLabel: 'AI auto-approved' };
}

export function buildAutoApproveDigestSummary(
  findings: CustodyNumberFinding[],
  now = new Date(),
): AutoApproveDigestSummary {
  const dayAgo = now.getTime() - 86_400_000;
  const date = autoApproveDigestDate(now);

  const published: AutoApprovedDigestItem[] = findings
    .filter((f) => f.autoPublishedAt && Date.parse(f.autoPublishedAt) >= dayAgo)
    .sort((a, b) => (b.autoPublishedAt ?? '').localeCompare(a.autoPublishedAt ?? ''))
    .map((finding) => {
      const { reason, reasonLabel } = inferAutoApproveReason(finding);
      return { finding, reason, reasonLabel };
    });

  const autoRejectedLast24h = findings.filter(
    (f) => f.autoRejectedAt && Date.parse(f.autoRejectedAt) >= dayAgo,
  ).length;

  const duplicateConfirmationsLast24h = findings.filter(
    (f) =>
      f.status === 'duplicate' &&
      f.updatedAt &&
      Date.parse(f.updatedAt) >= dayAgo &&
      (f.notes ?? '').includes('Confirms the already-published'),
  ).length;

  const outstanding = buildOutstandingReviewSummary(findings);
  const needsManualReview = outstanding.items.filter(
    (item) => item.actionHint === 'review' || Boolean(item.finding.conflictReason),
  ).length;

  return {
    date,
    published,
    autoRejectedLast24h,
    duplicateConfirmationsLast24h,
    needsManualReview,
  };
}

export interface AutoApproveDigestResult {
  sent: boolean;
  reason?: string;
  date: string;
  summary?: AutoApproveDigestSummary;
  previewManualCount?: number;
}

export async function sendDailyAutoApproveDigest(opts?: {
  force?: boolean;
  now?: Date;
}): Promise<AutoApproveDigestResult> {
  if (!autoPublishEnabled()) {
    return { sent: false, reason: 'auto_publish_disabled', date: autoApproveDigestDate(opts?.now) };
  }

  const date = autoApproveDigestDate(opts?.now);

  if (!opts?.force && (await wasAutoApproveDigestSent(date))) {
    return { sent: false, reason: 'already_sent_today', date };
  }

  const findings = await getAllFindings();
  const summary = buildAutoApproveDigestSummary(findings, opts?.now);
  const outstanding = buildOutstandingReviewSummary(findings);
  const manualPreview = pickOutstandingDigestItems(outstanding, 8).filter(
    (item) => item.actionHint === 'review' || Boolean(item.finding.conflictReason),
  );

  const sent = await sendCustodyAutoApproveDigestEmail({
    date,
    summary,
    manualPreview,
  });

  if (sent) {
    await markAutoApproveDigestSent(date);
  }

  return {
    sent,
    reason: sent ? undefined : 'send_failed',
    date,
    summary,
    previewManualCount: manualPreview.length,
  };
}

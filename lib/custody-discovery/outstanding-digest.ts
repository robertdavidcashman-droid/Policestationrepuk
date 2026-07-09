import { autoPublishEnabled } from './auto-decision';
import { sendCustodyOutstandingDigestEmail } from './email';
import {
  markOutstandingDigestSent,
  outstandingDigestDate,
  wasOutstandingDigestSent,
} from './outstanding-digest-state';
import {
  buildOutstandingReviewSummary,
  pickOutstandingDigestItems,
} from './outstanding-queue';
import { getAllFindings } from './storage';

export interface OutstandingDigestResult {
  sent: boolean;
  reason?: string;
  date: string;
  summary?: ReturnType<typeof buildOutstandingReviewSummary>;
  previewCount?: number;
}

export async function sendDailyOutstandingDigest(opts?: {
  force?: boolean;
  now?: Date;
}): Promise<OutstandingDigestResult> {
  const date = outstandingDigestDate(opts?.now);

  if (autoPublishEnabled()) {
    return { sent: false, reason: 'auto_publish_mode', date };
  }

  if (!opts?.force && (await wasOutstandingDigestSent(date))) {
    return { sent: false, reason: 'already_sent_today', date };
  }

  const findings = await getAllFindings();
  const summary = buildOutstandingReviewSummary(findings);

  if (summary.total === 0) {
    return { sent: false, reason: 'nothing_outstanding', date, summary };
  }

  const previewItems = pickOutstandingDigestItems(summary);
  const sent = await sendCustodyOutstandingDigestEmail({
    date,
    summary,
    previewItems,
  });

  if (sent) {
    await markOutstandingDigestSent(date);
  }

  return {
    sent,
    reason: sent ? undefined : 'send_failed',
    date,
    summary,
    previewCount: previewItems.length,
  };
}

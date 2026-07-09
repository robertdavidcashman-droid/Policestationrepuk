import {
  bumpSkipReason,
  createEmptySkipReasons,
  type OutreachFailureRecord,
  type OutreachRunLog,
  type OutreachSkipReason,
} from '@robertcashman/firm-outreach-core';
import type { OutreachRunStats } from '../types';

export function initExtendedRunStats(base: OutreachRunStats): OutreachRunStats {
  return {
    ...base,
    attempted: 0,
    failed: 0,
    skipReasons: createEmptySkipReasons(),
    failures: [],
  };
}

export function recordSkip(
  stats: OutreachRunStats,
  reason: OutreachSkipReason,
): void {
  stats.skipped += 1;
  stats.attempted = (stats.attempted ?? 0) + 1;
  if (!stats.skipReasons) stats.skipReasons = createEmptySkipReasons();
  bumpSkipReason(stats.skipReasons, reason);
}

export function recordFailure(
  stats: OutreachRunStats,
  row: OutreachFailureRecord,
): void {
  stats.errors += 1;
  stats.failed = (stats.failed ?? 0) + 1;
  stats.attempted = (stats.attempted ?? 0) + 1;
  if (!stats.failures) stats.failures = [];
  stats.failures.push(row);
  if (!stats.skipReasons) stats.skipReasons = createEmptySkipReasons();
  const reason: OutreachSkipReason = row.transient
    ? 'transient_resend_error'
    : 'permanent_resend_error';
  bumpSkipReason(stats.skipReasons, reason);
}

export function buildOutreachRunLog(opts: {
  campaignId: string;
  startedAt: string;
  dryRun: boolean;
  stats: OutreachRunStats;
  dailyCap: number;
  sentTodayBefore: number;
  resendQuotaRemaining?: number;
}): OutreachRunLog {
  const finishedAt = new Date().toISOString();
  return {
    campaignId: opts.campaignId,
    startedAt: opts.startedAt,
    finishedAt,
    dryRun: opts.dryRun,
    attempted: opts.stats.attempted ?? 0,
    sent: opts.stats.sent,
    failed: opts.stats.failed ?? opts.stats.errors,
    skipped: opts.stats.skipped,
    suppressed: opts.stats.suppressed,
    skipReasons: opts.stats.skipReasons ?? {},
    failures: opts.stats.failures ?? [],
    elapsedMs: opts.stats.elapsedMs,
    dailyCap: opts.dailyCap,
    sentTodayBefore: opts.sentTodayBefore,
    resendQuotaRemaining: opts.resendQuotaRemaining,
  };
}

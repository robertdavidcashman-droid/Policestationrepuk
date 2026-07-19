import { verifyRepukBufferSchedule, runRepukBufferScheduler } from '@/lib/buffer/engine-run';
import { verifyBufferPostsPublished } from '@/lib/buffer/verify-posted';
import { getSchedulerTimezone } from '@/lib/buffer/config';
import {
  addDaysToLocalDate,
  localDateInTimezone,
} from '@/lib/buffer/scheduler-core';
import { getAutomationConfig } from '../config';
import { canPerformLiveSideEffects } from '../env-guard';
import { logAutomationEvent } from '../observability';
import type { RepairAction } from '../types';

export interface BufferRepairResult {
  repairs: RepairAction[];
  todayScheduled: number;
  todayRequired: number;
  yesterdayOk: boolean;
  yesterdaySent: number;
  yesterdayTotal: number;
  yesterdayProblems: number;
}

/**
 * Safe Buffer repairs for REPUK only:
 * - gap-fill today's under-quota schedule via existing verify path
 * - force scheduler only when no run and under quota (respectCurrentTime)
 * Does not publish meaningless test content.
 */
export async function repairBufferSchedule(options?: {
  dryRun?: boolean;
  now?: Date;
}): Promise<BufferRepairResult> {
  const config = getAutomationConfig();
  const dryRun = options?.dryRun ?? config.dryRun;
  const now = options?.now ?? new Date();
  const timezone = getSchedulerTimezone();
  const today = localDateInTimezone(now, timezone);
  const yesterday = addDaysToLocalDate(today, -1);
  const repairs: RepairAction[] = [];

  // Yesterday publish verification (inspect only — reschedule overdue flood is unsafe).
  const published = await verifyBufferPostsPublished(yesterday);
  const yesterdayOk = published.ok || published.reason === 'no_run';
  if (published.problems?.length) {
    logAutomationEvent('buffer.update.missing', {
      date: yesterday,
      count: published.problems.length,
    });
    for (const problem of published.problems.slice(0, 5)) {
      repairs.push({
        id: `yesterday-${problem.postId}`,
        kind: 'buffer_missing_or_failed',
        target: problem.postId,
        attempted: false,
        verified: false,
        dryRun,
        summary: `${problem.slug} status=${problem.status} (${problem.issue ?? 'unknown'}) — not auto-republished to avoid floods`,
      });
    }
  }

  // Today's schedule gap-fill.
  if (dryRun || !config.autoRepairEnabled || !canPerformLiveSideEffects()) {
    const verifyDry = await verifyRepukBufferSchedule({ now, gapFill: false });
    repairs.push({
      id: 'gap-fill-today',
      kind: 'buffer_gap_fill',
      target: today,
      attempted: false,
      verified: false,
      dryRun: true,
      summary: `Would gap-fill if under quota (currently ${verifyDry.scheduledCount}/${verifyDry.requiredCount})`,
    });
    return {
      repairs,
      todayScheduled: verifyDry.scheduledCount,
      todayRequired: verifyDry.requiredCount,
      yesterdayOk,
      yesterdaySent: published.sent ?? 0,
      yesterdayTotal: published.total ?? 0,
      yesterdayProblems: published.problems?.length ?? 0,
    };
  }

  logAutomationEvent('buffer.update.retry_started', { date: today, kind: 'gap_fill' });
  const verify = await verifyRepukBufferSchedule({ now, gapFill: true });
  const gapFilled = verify.gapFilled ?? 0;
  repairs.push({
    id: 'gap-fill-today',
    kind: 'buffer_gap_fill',
    target: today,
    attempted: true,
    verified: verify.ok,
    dryRun: false,
    summary: verify.ok
      ? `Schedule OK ${verify.scheduledCount}/${verify.requiredCount} (gapFilled=${gapFilled})`
      : `Still under quota ${verify.scheduledCount}/${verify.requiredCount}: ${verify.issues.join('; ')}`,
    error: verify.ok ? undefined : verify.issues.join('; '),
  });

  if (!verify.ok && gapFilled === 0) {
    // Missed scheduler run — try internal scheduler once (not public HTTP).
    const schedule = await runRepukBufferScheduler({
      now,
      force: true,
      respectCurrentTime: true,
    });
    repairs.push({
      id: 'force-schedule-today',
      kind: 'buffer_force_schedule',
      target: today,
      attempted: true,
      verified: Boolean(schedule.ok),
      dryRun: false,
      summary: schedule.ok
        ? `Scheduler recovered (${schedule.posts?.length ?? 0} posts)`
        : `Scheduler recovery failed: ${schedule.reason ?? 'unknown'}`,
      error: schedule.ok ? undefined : schedule.reason,
    });
    const recheck = await verifyRepukBufferSchedule({ now, gapFill: false });
    if (schedule.ok) {
      logAutomationEvent('buffer.update.retry_verified', {
        date: today,
        scheduledCount: recheck.scheduledCount,
      });
    }
    return {
      repairs,
      todayScheduled: recheck.scheduledCount,
      todayRequired: recheck.requiredCount,
      yesterdayOk,
      yesterdaySent: published.sent ?? 0,
      yesterdayTotal: published.total ?? 0,
      yesterdayProblems: published.problems?.length ?? 0,
    };
  }

  if (verify.ok && gapFilled > 0) {
    logAutomationEvent('buffer.update.retry_verified', {
      date: today,
      gapFilled,
    });
  }

  return {
    repairs,
    todayScheduled: verify.scheduledCount,
    todayRequired: verify.requiredCount,
    yesterdayOk,
    yesterdaySent: published.sent ?? 0,
    yesterdayTotal: published.total ?? 0,
    yesterdayProblems: published.problems?.length ?? 0,
  };
}

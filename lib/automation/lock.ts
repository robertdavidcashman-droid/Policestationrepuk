import { getKV } from '@/lib/kv';
import { getAutomationConfig } from './config';
import { logAutomationEvent } from './observability';
import type { JobLock } from './types';

const LOCK_PREFIX = 'automation:lock:';

function lockKey(jobName: string): string {
  return `${LOCK_PREFIX}${jobName}`;
}

function ttlSeconds(): number {
  return getAutomationConfig().lockTimeoutMinutes * 60;
}

/**
 * Acquire an owner-aware distributed lock (KV SET NX).
 * Returns the lock on success, null if another owner holds it.
 * When KV is unavailable, returns a degraded in-process lock so critical
 * schedulers can still run (engine/day locks remain the primary guard).
 */
export async function acquireJobLock(
  jobName: string,
  executionId: string,
  ttlSec = ttlSeconds(),
): Promise<JobLock | null> {
  const kv = getKV();
  if (!kv) {
    const now = new Date();
    const degraded: JobLock = {
      jobName,
      executionId,
      acquiredAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + ttlSec * 1000).toISOString(),
    };
    logAutomationEvent('automation.job.lock_failed', {
      jobName,
      executionId,
      reason: 'kv_unavailable_degraded_allow',
    });
    return degraded;
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlSec * 1000).toISOString();
  const lock: JobLock = {
    jobName,
    executionId,
    acquiredAt: now.toISOString(),
    expiresAt,
  };

  const result = await kv.set(lockKey(jobName), lock, { nx: true, ex: ttlSec });
  if (result === 'OK') {
    logAutomationEvent('automation.job.locked', { jobName, executionId, expiresAt });
    return lock;
  }

  // Recover expired locks left by crashed workers (best-effort).
  const existing = await kv.get<JobLock>(lockKey(jobName));
  if (existing?.expiresAt && Date.parse(existing.expiresAt) < Date.now()) {
    // Compare-and-swap: delete only if still the expired owner, then claim.
    const current = await kv.get<JobLock>(lockKey(jobName));
    if (
      current &&
      current.executionId === existing.executionId &&
      current.expiresAt === existing.expiresAt
    ) {
      await kv.del?.(lockKey(jobName));
      const retry = await kv.set(lockKey(jobName), lock, { nx: true, ex: ttlSec });
      if (retry === 'OK') {
        logAutomationEvent('automation.job.recovered', {
          jobName,
          executionId,
          previousOwner: existing.executionId,
          reason: 'expired_lock',
        });
        return lock;
      }
    }
  }

  logAutomationEvent('automation.job.lock_failed', {
    jobName,
    executionId,
    reason: 'held',
    holder: existing?.executionId ?? 'unknown',
  });
  return null;
}

/** Release only if this execution owns the lock. */
export async function releaseJobLock(
  jobName: string,
  executionId: string,
): Promise<boolean> {
  const kv = getKV();
  if (!kv) return false;

  const existing = await kv.get<JobLock>(lockKey(jobName));
  if (!existing) return true;
  if (existing.executionId !== executionId) {
    return false;
  }
  await kv.del?.(lockKey(jobName));
  return true;
}

export async function getJobLock(jobName: string): Promise<JobLock | null> {
  const kv = getKV();
  if (!kv) return null;
  return (await kv.get<JobLock>(lockKey(jobName))) ?? null;
}

/** Clear a lock only when expired (watchdog recovery). */
export async function clearExpiredJobLock(jobName: string): Promise<boolean> {
  const existing = await getJobLock(jobName);
  if (!existing) return false;
  if (Date.parse(existing.expiresAt) >= Date.now()) return false;
  const kv = getKV();
  if (!kv) return false;
  const current = await kv.get<JobLock>(lockKey(jobName));
  if (!current || current.executionId !== existing.executionId) return false;
  await kv.del?.(lockKey(jobName));
  logAutomationEvent('automation.job.recovered', {
    jobName,
    previousOwner: existing.executionId,
    reason: 'watchdog_cleared_expired_lock',
  });
  return true;
}

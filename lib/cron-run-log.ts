import { getKV } from '@/lib/kv';

export type CronRunOutcome = 'success' | 'skipped' | 'failed';

export interface CronRunLogEntry {
  jobName: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  outcome: CronRunOutcome;
  skipReason?: string;
  counts?: Record<string, number>;
  errorCategory?: string;
  errorMessage?: string;
}

const LATEST_PREFIX = 'cron-run:latest:';

function latestKey(jobName: string): string {
  return `${LATEST_PREFIX}${jobName}`;
}

export async function saveCronRunLog(entry: CronRunLogEntry): Promise<void> {
  const kv = getKV();
  if (!kv) return;
  await kv.set(latestKey(entry.jobName), entry, { ex: 60 * 60 * 24 * 30 });
}

export async function getCronRunLog(jobName: string): Promise<CronRunLogEntry | null> {
  const kv = getKV();
  if (!kv) return null;
  return (await kv.get<CronRunLogEntry>(latestKey(jobName))) ?? null;
}

export async function withCronRunLog<T>(
  jobName: string,
  fn: () => Promise<{
    outcome: CronRunOutcome;
    skipReason?: string;
    counts?: Record<string, number>;
    errorCategory?: string;
    errorMessage?: string;
    result: T;
  }>,
): Promise<T> {
  const startedAt = new Date().toISOString();
  const t0 = Date.now();
  try {
    const wrapped = await fn();
    await saveCronRunLog({
      jobName,
      startedAt,
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - t0,
      outcome: wrapped.outcome,
      skipReason: wrapped.skipReason,
      counts: wrapped.counts,
      errorCategory: wrapped.errorCategory,
      errorMessage: wrapped.errorMessage,
    });
    return wrapped.result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await saveCronRunLog({
      jobName,
      startedAt,
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - t0,
      outcome: 'failed',
      errorCategory: 'uncaught',
      errorMessage: message,
    });
    throw err;
  }
}

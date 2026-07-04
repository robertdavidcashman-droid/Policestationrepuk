import { getKV } from '@/lib/kv';

const FAILURE_PREFIX = 'buffer-scheduler-failure-notify:';

export function schedulerFailureErrorKey(error: string): string {
  return error
    .slice(0, 120)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function wasSchedulerFailureEmailSent(
  date: string,
  errorKey: string,
): Promise<boolean> {
  const kv = getKV();
  if (!kv) return false;
  return Boolean(await kv.get(`${FAILURE_PREFIX}${date}:${errorKey}`));
}

export async function markSchedulerFailureEmailSent(
  date: string,
  errorKey: string,
): Promise<void> {
  const kv = getKV();
  if (!kv) return;
  await kv.set(`${FAILURE_PREFIX}${date}:${errorKey}`, new Date().toISOString(), {
    ex: 60 * 60 * 24 * 14,
  });
}

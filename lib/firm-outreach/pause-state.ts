import { getKV } from '@/lib/kv';
import { outreachEnabled } from './constants';

const ADMIN_PAUSE_KEY = 'firmoutreach:settings:admin_paused';

export async function getAdminPauseState(): Promise<boolean | null> {
  const kv = getKV();
  if (!kv || typeof kv.get !== 'function') return null;
  const value = await kv.get<boolean>(ADMIN_PAUSE_KEY);
  return value ?? null;
}

export async function setAdminPauseState(paused: boolean): Promise<void> {
  const kv = getKV();
  if (!kv || typeof kv.set !== 'function') throw new Error('KV not configured');
  await kv.set(ADMIN_PAUSE_KEY, paused);
}

/** Env pause OR admin KV pause. */
export async function isOutreachPaused(): Promise<boolean> {
  if (process.env.FIRM_OUTREACH_PAUSED === 'true') return true;
  const adminPaused = await getAdminPauseState();
  return adminPaused === true;
}

/** Whether automated/cron sends may run (manual admin sends may still bypass). */
export async function isOutreachSendAllowed(): Promise<boolean> {
  if (!outreachEnabled()) return false;
  if (process.env.FIRM_OUTREACH_SEND_ENABLED === 'false') return false;
  return !(await isOutreachPaused());
}

export async function getOutreachPauseSummary(): Promise<{
  envPaused: boolean;
  adminPaused: boolean | null;
  effectivePaused: boolean;
}> {
  const envPaused = process.env.FIRM_OUTREACH_PAUSED === 'true';
  const adminPaused = await getAdminPauseState();
  return {
    envPaused,
    adminPaused,
    effectivePaused: envPaused || adminPaused === true,
  };
}

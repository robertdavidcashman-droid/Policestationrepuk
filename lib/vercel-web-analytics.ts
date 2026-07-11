/** True only on a live Vercel production deployment (not local next start / preview). */
export function vercelWebAnalyticsEnabled(): boolean {
  if (process.env.DISABLE_KV_FOR_AUDIT === '1') return false;
  return process.env.NEXT_PUBLIC_VERCEL_ENV === 'production';
}

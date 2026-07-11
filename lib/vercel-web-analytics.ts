/** True only on a live Vercel production deployment (not local next start / preview). */
export function vercelWebAnalyticsEnabled(): boolean {
  return process.env.VERCEL === '1' && process.env.VERCEL_ENV === 'production';
}

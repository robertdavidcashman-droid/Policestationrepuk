import { NextResponse } from 'next/server';
import { runBufferBlogScheduler } from '@/lib/buffer/scheduler';
import { isCronAuthorized } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Daily Buffer blog scheduler — picks 3 random policestationrepuk.org blog posts
 * and schedules them at random times today (Europe/London by default).
 *
 * Auth: Bearer ${CRON_SECRET} (Vercel Cron) or x-cron-secret in development.
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runBufferBlogScheduler();
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.reason }, { status: 500 });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error('[cron:buffer-blog-posts]', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Buffer scheduler failed' },
      { status: 500 },
    );
  }
}

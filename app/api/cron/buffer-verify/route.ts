import { NextResponse } from 'next/server';
import { verifyRepukBufferSchedule } from '@/lib/buffer/engine-run';
import { withAutomationJob } from '@/lib/automation/with-job';
import { isCronAuthorized } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Daily verify — confirm >=5 posts scheduled today; gap-fill if under quota. */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const wrapped = await withAutomationJob({
      jobName: 'buffer-verify',
      triggerSource: 'cron',
      run: async () => {
        const result = await verifyRepukBufferSchedule({ gapFill: true });
        return {
          status: result.ok ? 'successful' : 'partially_successful',
          result,
          counts: {
            quotaExpected: result.requiredCount,
            quotaAchieved: result.scheduledCount,
            recordsRepaired: result.gapFilled,
          },
          errorMessage: result.ok ? null : result.issues.join('; ') || 'under quota',
          repairs: result.gapFilled
            ? [`gap-filled ${result.gapFilled} posts`]
            : [],
        };
      },
    });

    if (wrapped.skipped) {
      return NextResponse.json({ ok: true, skipped: true, reason: wrapped.reason });
    }

    const result = wrapped.result!;
    return NextResponse.json(result, { status: result.ok ? 200 : 422 });
  } catch (err) {
    console.error('[cron:buffer-verify]', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'verify failed' },
      { status: 500 },
    );
  }
}

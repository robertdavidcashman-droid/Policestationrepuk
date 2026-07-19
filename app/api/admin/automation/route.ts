import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getAutomationAdminStatus } from '@/lib/automation/status';
import { runDailyHealthcheck } from '@/lib/automation/healthcheck';
import { runAutomationWatchdog } from '@/lib/automation/watchdog';
import { repairBufferSchedule } from '@/lib/automation/repairs/buffer';
import { inspectAndRepairCrossSiteQuota } from '@/lib/automation/repairs/cross-site';
import {
  acknowledgeIncident,
  resolveIncident,
  sendDailyHealthReportEmail,
} from '@/lib/automation/notifications';
import { verifyRepukBufferSchedule } from '@/lib/buffer/engine-run';
import { withAutomationJob } from '@/lib/automation/with-job';
import { buildDailyHealthReport } from '@/lib/automation/report';
import { createExecutionId } from '@/lib/automation/execution-log';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const status = await getAutomationAdminStatus();
    return NextResponse.json({ ok: true, status });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'status failed' },
      { status: 500 },
    );
  }
}

type Action =
  | 'healthcheck'
  | 'watchdog'
  | 'gap_fill'
  | 'cross_site_inspect'
  | 'acknowledge_incident'
  | 'resolve_incident'
  | 'test_daily_report';

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: {
    action?: Action;
    dryRun?: boolean;
    fingerprint?: string;
    force?: boolean;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const action = body.action;
  const dryRun = body.dryRun !== false; // default dry-run for safety
  if (!action) {
    return NextResponse.json({ error: 'action required' }, { status: 400 });
  }

  try {
    switch (action) {
      case 'healthcheck': {
        const result = await runDailyHealthcheck({
          dryRun,
          force: body.force === true,
          skipLock: false,
        });
        return NextResponse.json({ ok: true, result, admin: auth.email });
      }
      case 'watchdog': {
        const result = await runAutomationWatchdog({ dryRun });
        return NextResponse.json({ ok: true, result, admin: auth.email });
      }
      case 'gap_fill': {
        const wrapped = await withAutomationJob({
          jobName: 'buffer-verify',
          triggerSource: 'admin',
          dryRun,
          run: async () => {
            if (dryRun) {
              const inspect = await verifyRepukBufferSchedule({ gapFill: false });
              return {
                status: 'successful' as const,
                result: { dryRun: true, inspect },
                notes: [
                  `Would gap-fill to ${inspect.requiredCount} (currently ${inspect.scheduledCount})`,
                ],
              };
            }
            const repair = await repairBufferSchedule({ dryRun: false });
            return {
              status: repair.todayScheduled >= repair.todayRequired ? 'repaired' : 'partially_successful',
              result: repair,
              repairs: repair.repairs.map((r) => r.summary),
              counts: {
                quotaExpected: repair.todayRequired,
                quotaAchieved: repair.todayScheduled,
                recordsRepaired: repair.repairs.filter((r) => r.verified).length,
              },
            };
          },
        });
        return NextResponse.json({ ok: wrapped.ok, wrapped, admin: auth.email });
      }
      case 'cross_site_inspect': {
        const result = await inspectAndRepairCrossSiteQuota({ dryRun });
        return NextResponse.json({ ok: true, result, admin: auth.email });
      }
      case 'acknowledge_incident': {
        if (!body.fingerprint) {
          return NextResponse.json({ error: 'fingerprint required' }, { status: 400 });
        }
        const ok = await acknowledgeIncident(body.fingerprint);
        return NextResponse.json({ ok, fingerprint: body.fingerprint, admin: auth.email });
      }
      case 'resolve_incident': {
        if (!body.fingerprint) {
          return NextResponse.json({ error: 'fingerprint required' }, { status: 400 });
        }
        const result = await resolveIncident({
          fingerprint: body.fingerprint,
          dryRun,
          sendResolutionEmail: !dryRun,
          summary: `Resolved by admin ${auth.email}`,
        });
        return NextResponse.json({ ok: true, result, admin: auth.email });
      }
      case 'test_daily_report': {
        const report = buildDailyHealthReport({
          date: new Date().toISOString().slice(0, 10),
          executionId: createExecutionId(),
          dryRun,
          bufferExpected: 5,
          bufferActual: 5,
          crossSiteExpected: 20,
          crossSiteActual: 20,
          failedJobs: [],
          repairs: [],
          issues: [],
          duplicatesPrevented: 0,
          emailsSuppressed: 0,
          notes: [`Test report requested by ${auth.email}`],
        });
        const email = await sendDailyHealthReportEmail(report, {
          force: true,
          dryRun,
        });
        return NextResponse.json({ ok: true, report, email, admin: auth.email });
      }
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    console.error('[admin:automation]', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'action failed' },
      { status: 500 },
    );
  }
}

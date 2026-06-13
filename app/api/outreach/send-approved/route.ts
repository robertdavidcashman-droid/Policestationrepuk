import { NextResponse } from 'next/server';
import { outreachSendEnabled } from '@/lib/firm-outreach/constants';
import { buildOutreachActivityReport } from '@/lib/firm-outreach/outreach/activity-report';
import { sendOutreachSendConfirmationEmail } from '@/lib/firm-outreach/outreach/send-confirmation-email';
import {
  finalizeSendApproval,
  releaseSendApprovalClaim,
  tryClaimSendApproval,
} from '@/lib/firm-outreach/outreach/send-approval-token';
import { runFirmOutreach } from '@/lib/firm-outreach/outreach/run-outreach';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

async function readApprovalRef(request: Request): Promise<string | null> {
  const ct = request.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) {
    try {
      const body = (await request.json()) as { approvalRef?: unknown; token?: unknown };
      const ref = body.approvalRef ?? body.token;
      return typeof ref === 'string' && ref.length > 0 ? ref : null;
    } catch {
      return null;
    }
  }
  try {
    const form = await request.formData();
    const ref = form.get('approvalRef') ?? form.get('token');
    return typeof ref === 'string' && ref.length > 0 ? ref : null;
  } catch {
    return null;
  }
}

function redirectToResult(
  request: Request,
  params: Record<string, string>,
): NextResponse {
  const url = new URL('/outreach/send-approve/result', request.url);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(request: Request) {
  const approvalRef = await readApprovalRef(request);
  if (!approvalRef) {
    return redirectToResult(request, { detail: 'missing-token' });
  }

  const claim = await tryClaimSendApproval(approvalRef);
  if (!claim.ok) {
    if (claim.status === 409) {
      return redirectToResult(request, { detail: 'in-progress' });
    }
    const detail =
      claim.status === 410 ? 'expired-or-already-used' : 'invalid-token';
    return redirectToResult(request, { detail });
  }

  if (!outreachSendEnabled()) {
    await releaseSendApprovalClaim(approvalRef);
    return redirectToResult(request, { detail: 'send-disabled' });
  }

  try {
    const stats = await runFirmOutreach();
    const { report } = await buildOutreachActivityReport();
    const startOfUtcDay = Date.UTC(
      new Date().getUTCFullYear(),
      new Date().getUTCMonth(),
      new Date().getUTCDate(),
    );
    const receipts = report.sends
      .filter((s) => s.sentAt && Date.parse(s.sentAt) >= startOfUtcDay)
      .sort((a, b) => (b.sentAt ?? '').localeCompare(a.sentAt ?? ''))
      .slice(0, stats.sent);

    await sendOutreachSendConfirmationEmail({
      stats,
      receipts,
      readyRemaining: report.summary.readyToSend,
    });

    await finalizeSendApproval(approvalRef);

    return redirectToResult(request, {
      sent: String(stats.sent),
      skipped: String(stats.skipped),
      errors: String(stats.errors),
    });
  } catch (err) {
    console.error('[outreach/send-approved]', err);
    await releaseSendApprovalClaim(approvalRef);
    return redirectToResult(request, { detail: 'send-failed' });
  }
}

export function GET() {
  return NextResponse.json(
    { error: 'Method not allowed — confirm via the Ready to send page.' },
    { status: 405, headers: { Allow: 'POST' } },
  );
}

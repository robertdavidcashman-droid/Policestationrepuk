import { NextResponse } from 'next/server';
import { outreachSendEnabled } from '@/lib/firm-outreach/constants';
import { buildOutreachActivityReport } from '@/lib/firm-outreach/outreach/activity-report';
import { sendOutreachSendConfirmationEmail } from '@/lib/firm-outreach/outreach/send-confirmation-email';
import { consumeSendApprovalToken } from '@/lib/firm-outreach/outreach/send-approval-token';
import { runFirmOutreach } from '@/lib/firm-outreach/outreach/run-outreach';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

async function readToken(request: Request): Promise<string | null> {
  const ct = request.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) {
    try {
      const body = (await request.json()) as { token?: unknown };
      return typeof body.token === 'string' ? body.token : null;
    } catch {
      return null;
    }
  }
  try {
    const form = await request.formData();
    const t = form.get('token');
    return typeof t === 'string' && t.length > 0 ? t : null;
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
  const token = await readToken(request);
  if (!token) {
    return redirectToResult(request, { detail: 'missing-token' });
  }

  const result = await consumeSendApprovalToken(token);
  if (!result.ok) {
    const detail =
      result.status === 410 ? 'expired-or-already-used' : 'invalid-token';
    return redirectToResult(request, { detail });
  }

  if (!outreachSendEnabled()) {
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

    return redirectToResult(request, {
      sent: String(stats.sent),
      skipped: String(stats.skipped),
      errors: String(stats.errors),
    });
  } catch (err) {
    console.error('[outreach/send-approved]', err);
    return redirectToResult(request, { detail: 'send-failed' });
  }
}

export function GET() {
  return NextResponse.json(
    { error: 'Method not allowed — confirm via the Ready to send page.' },
    { status: 405, headers: { Allow: 'POST' } },
  );
}

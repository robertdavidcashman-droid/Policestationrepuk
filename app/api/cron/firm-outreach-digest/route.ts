import { NextResponse } from 'next/server';
import { isCronAuthorized } from '@/lib/cron-auth';
import { outreachRequireApproval } from '@/lib/firm-outreach/constants';
import { sendOutreachApprovalRequestEmail } from '@/lib/firm-outreach/outreach/approval-request-email';
import { sendDailyOutreachDigest } from '@/lib/firm-outreach/outreach/digest-email';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 120;

/** 17:00 backup: approval reminder if cap remaining, else legacy digest. */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (outreachRequireApproval()) {
    const result = await sendOutreachApprovalRequestEmail({ reminder: true });
    return NextResponse.json({ ok: true, mode: 'approval-reminder', ...result });
  }

  const result = await sendDailyOutreachDigest();
  return NextResponse.json({ ok: true, mode: 'digest', ...result });
}

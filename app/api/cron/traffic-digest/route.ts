import { NextResponse } from 'next/server';
import { execSync } from 'node:child_process';
import { sendTrafficDigestEmail } from '@/lib/buffer/email';
import { verifyScheduledBufferImages } from '@/lib/buffer/verify-scheduled';
import { isCronAuthorized } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Weekly network health digest: GBP scheduled-image verify + cross-domain link audit.
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const date = new Date().toISOString().slice(0, 10);
  let crossDomainOk = true;
  let crossDomainIssues: string[] = [];

  try {
    const out = execSync('npx tsx scripts/audit/cross-domain-links.ts', {
      encoding: 'utf8',
      cwd: process.cwd(),
    });
    const parsed = JSON.parse(out) as { ok: boolean; issues: string[] };
    crossDomainOk = parsed.ok;
    crossDomainIssues = parsed.issues ?? [];
  } catch (err) {
    crossDomainOk = false;
    crossDomainIssues = [err instanceof Error ? err.message : 'cross-domain audit failed'];
  }

  let gbpOk = true;
  let gbpIssueCount = 0;
  let scheduledCount: number | undefined;

  try {
    const gbp = await verifyScheduledBufferImages({ googleBusinessOnly: true });
    gbpOk = gbp.ok;
    gbpIssueCount = gbp.issueCount;
    scheduledCount = gbp.scheduledCount;
  } catch (err) {
    gbpOk = false;
    gbpIssueCount = 1;
    crossDomainIssues.push(err instanceof Error ? err.message : 'GBP verify failed');
  }

  const ok = gbpOk && crossDomainOk;

  await sendTrafficDigestEmail({
    date,
    gbpOk,
    gbpIssueCount,
    crossDomainOk,
    crossDomainIssues,
    scheduledCount,
  });

  if (!ok) {
    return NextResponse.json(
      { ok: false, gbpOk, gbpIssueCount, crossDomainOk, crossDomainIssues },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, gbpOk, crossDomainOk, scheduledCount });
}

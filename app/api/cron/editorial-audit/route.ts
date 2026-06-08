import { NextResponse } from 'next/server';
import { isCronAuthorized } from '@/lib/cron-auth';
import { runEditorialAudit } from '@/lib/editorial-audit/scheduler';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Rotating editorial content audit (daily via vercel.json).
 * Scans the next batch of blog/wiki/guide sections from source files,
 * flags factual red flags, and sends at most one digest email per day.
 * Auth: Bearer ${CRON_SECRET} or x-cron-secret header.
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const limitParam = url.searchParams.get('limit');
  const limit = limitParam ? Number(limitParam) : undefined;

  const result = await runEditorialAudit({ limit });

  return NextResponse.json({
    ok: true,
    totalUnits: result.totalUnits,
    batchStartIndex: result.batchStartIndex,
    nextCursor: result.nextCursor,
    scannedCount: result.scannedUnitIds.length,
    findingCount: result.findings.length,
    notification: result.notification,
    scannedUnitIds: result.scannedUnitIds,
    findings: result.findings.map((f) => ({
      fingerprint: f.fingerprint,
      url: f.url,
      sectionTitle: f.sectionTitle,
      severity: f.severity,
      code: f.code,
    })),
  });
}

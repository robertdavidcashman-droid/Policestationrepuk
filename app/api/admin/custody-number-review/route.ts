import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin-auth';
import {
  approveFinding,
  getAllFindings,
  getFinding,
  getCustodySuite,
  markApprovedAsVerified,
  markFindingStale,
  rejectFinding,
  updateFindingStatus,
} from '@/lib/custody-discovery/storage';
import type { FindingStatus } from '@/lib/custody-discovery/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const findings = await getAllFindings();
  return NextResponse.json({ ok: true, findings });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await request.json()) as {
    action?: 'approve' | 'reject' | 'stale' | 'update_notes' | 'mark_verified';
    findingId?: string;
    notes?: string;
    status?: FindingStatus;
    markVerified?: boolean;
  };

  const { action, findingId, notes } = body;
  if (!findingId || !action) {
    return NextResponse.json({ error: 'findingId and action required' }, { status: 400 });
  }

  if (action === 'approve') {
    const result = await approveFinding(findingId, auth.email, {
      notes,
      markVerified: body.markVerified,
    });
    if (!result) return NextResponse.json({ error: 'Finding not found' }, { status: 404 });
    revalidatePath('/StationsDirectory');
    revalidatePath('/admin/custody-number-review');
    const suite = await getCustodySuite(result.finding.custodySuiteId);
    if (suite?.stationSlug) {
      revalidatePath(`/police-station/${suite.stationSlug}`);
    }
    return NextResponse.json({ ok: true, ...result });
  }

  if (action === 'mark_verified') {
    const finding = await getFinding(findingId);
    if (!finding) return NextResponse.json({ error: 'Finding not found' }, { status: 404 });
    const approved = await markApprovedAsVerified(finding.custodySuiteId, auth.email);
    if (!approved) {
      return NextResponse.json({ error: 'No approved number for this suite' }, { status: 404 });
    }
    revalidatePath('/StationsDirectory');
    const suite = await getCustodySuite(finding.custodySuiteId);
    if (suite?.stationSlug) revalidatePath(`/police-station/${suite.stationSlug}`);
    return NextResponse.json({ ok: true, approved, finding });
  }

  if (action === 'reject') {
    const finding = await rejectFinding(findingId, notes);
    if (!finding) return NextResponse.json({ error: 'Finding not found' }, { status: 404 });
    return NextResponse.json({ ok: true, finding });
  }

  if (action === 'stale') {
    const finding = await markFindingStale(findingId, notes);
    if (!finding) return NextResponse.json({ error: 'Finding not found' }, { status: 404 });
    return NextResponse.json({ ok: true, finding });
  }

  if (action === 'update_notes') {
    const finding = await updateFindingStatus(findingId, body.status ?? 'needs_review', notes);
    if (!finding) return NextResponse.json({ error: 'Finding not found' }, { status: 404 });
    return NextResponse.json({ ok: true, finding });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

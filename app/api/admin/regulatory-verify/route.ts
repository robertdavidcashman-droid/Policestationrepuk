import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getAllRepsForAdmin } from '@/lib/data';
import { getReview } from '@/lib/admin-review';
import {
  checkRegulatoryDirectories,
  inferApplicantCategory,
  loadRegulatoryHintsByEmail,
  verifyAndPublishAllReps,
  verifyAndPublishRep,
} from '@/lib/regulatory-auto-pass';
import { ensureDsccRegisterCache, refreshDsccRegisterCache } from '@/lib/dscc-register-lookup';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

/**
 * POST /api/admin/regulatory-verify
 * Body: { email?: string, refreshDscc?: boolean, apply?: boolean }
 *
 * Check one or all reps against registers and risk scoring. When apply=true
 * (default), matching or low-risk reps are auto-published.
 */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: { email?: unknown; refreshDscc?: unknown; apply?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  const targetEmail =
    typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const refreshDscc = body.refreshDscc === true;
  const apply = body.apply !== false;

  if (refreshDscc) {
    await refreshDsccRegisterCache();
  } else {
    await ensureDsccRegisterCache();
  }

  if (targetEmail) {
    const reps = await getAllRepsForAdmin();
    const rep = reps.find((r) => r.email.toLowerCase() === targetEmail);
    if (!rep) {
      return NextResponse.json({ error: 'Rep not found' }, { status: 404 });
    }
    const review = await getReview(targetEmail);
    const hints = (await loadRegulatoryHintsByEmail()).get(targetEmail);
    const category = hints?.category ?? inferApplicantCategory(rep.accreditation);
    const check = await checkRegulatoryDirectories({
      email: targetEmail,
      name: rep.name,
      sraNumber: hints?.sraNumber,
      pinNumber: hints?.pinNumber || rep.dsccPin,
      category,
    });
    const sweep = apply
      ? await verifyAndPublishRep(rep, hints, review, auth.email)
      : null;
    return NextResponse.json({ ok: true, email: targetEmail, check, sweep });
  }

  if (!apply) {
    return NextResponse.json({ error: 'Batch dry-run not supported; omit apply or set apply=true' }, { status: 400 });
  }

  const summary = await verifyAndPublishAllReps(auth.email);

  return NextResponse.json({
    ok: true,
    ...summary,
    matchedOrApplied: summary.publishedRegister + summary.publishedLowRisk + summary.refreshed,
  });
}

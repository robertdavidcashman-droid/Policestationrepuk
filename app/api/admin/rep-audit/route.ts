import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getRepAuditSnapshot } from '@/lib/admin/rep-audit-cache';
import { buildRepAuditRowForEmail } from '@/lib/admin/rep-audit-loader';

export const dynamic = 'force-dynamic';

export type { RepAuditRow } from '@/lib/admin/rep-audit-loader';

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const url = new URL(request.url);
  const refresh = url.searchParams.get('refresh') === '1';
  const email = url.searchParams.get('email')?.trim().toLowerCase();

  if (email) {
    const row = await buildRepAuditRowForEmail(email);
    if (!row) {
      return NextResponse.json({ error: 'Rep not found' }, { status: 404 });
    }
    return NextResponse.json({ row }, { headers: { 'Cache-Control': 'no-store' } });
  }

  const snapshot = await getRepAuditSnapshot(refresh);
  return NextResponse.json(snapshot, { headers: { 'Cache-Control': 'no-store' } });
}

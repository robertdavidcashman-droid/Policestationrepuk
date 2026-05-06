import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getAllReps } from '@/lib/data';

const ADMIN_EMAILS = new Set(
  (process.env.ADMIN_EMAILS || process.env.OWNER_EMAIL || '')
    .split(/[,;]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
);

export async function GET() {
  const email = await getSession();
  if (!email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (ADMIN_EMAILS.size > 0 && !ADMIN_EMAILS.has(email.toLowerCase())) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 403 });
  }

  const reps = await getAllReps();
  const kvReps = reps
    .filter((r) => r.id?.startsWith('newrep:'))
    .map((r) => ({ id: r.id, slug: r.slug, name: r.name, email: r.email }));

  return NextResponse.json({ count: kvReps.length, reps: kvReps });
}

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { isValidReviewStatus, setReview, type RepReviewStatus } from '@/lib/admin-review';

export const dynamic = 'force-dynamic';

interface PatchBody {
  status?: RepReviewStatus;
  adminNotes?: string;
}

export async function PATCH(request: Request, ctx: { params: Promise<{ email: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { email: encodedEmail } = await ctx.params;
  const email = decodeURIComponent(encodedEmail).toLowerCase();
  if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 });

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (body.status !== undefined && !isValidReviewStatus(body.status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  if (
    body.adminNotes !== undefined &&
    (typeof body.adminNotes !== 'string' || body.adminNotes.length > 5000)
  ) {
    return NextResponse.json({ error: 'adminNotes must be a string (max 5000 chars)' }, { status: 400 });
  }

  try {
    const record = await setReview(
      email,
      { status: body.status, adminNotes: body.adminNotes },
      auth.email,
    );
    return NextResponse.json({ ok: true, review: record });
  } catch (err) {
    console.error('[admin review]', err);
    return NextResponse.json({ error: 'Could not save review' }, { status: 502 });
  }
}

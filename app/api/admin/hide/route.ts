import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import {
  hideStaticListingEmail,
  unhideStaticListingEmail,
} from '@/lib/data';

export const dynamic = 'force-dynamic';

interface PostBody {
  email?: string;
  hide?: boolean;
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 });

  try {
    if (body.hide) {
      await hideStaticListingEmail(email);
    } else {
      await unhideStaticListingEmail(email);
    }
    return NextResponse.json({ ok: true, email, hidden: Boolean(body.hide) });
  } catch (err) {
    console.error('[admin hide]', err);
    return NextResponse.json({ error: 'Could not update hidden list' }, { status: 502 });
  }
}

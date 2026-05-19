import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getRawReps } from '@/lib/data';
import {
  activateFeatured,
  cancelFeaturedSubscription,
  expireFeaturedSubscription,
  grandfatherExistingFeaturedReps,
  listFeaturedDebug,
} from '@/lib/featured';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  return NextResponse.json({ featured: await listFeaturedDebug() }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function POST() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const migrated = await grandfatherExistingFeaturedReps(getRawReps());
  return NextResponse.json({ ok: true, migrated });
}

interface PatchBody {
  email?: string;
  action?: 'activate' | 'cancel' | 'expire';
  expiresAt?: string;
  tier?: string;
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 });
  if (!body.action) return NextResponse.json({ error: 'Missing action' }, { status: 400 });

  try {
    if (body.action === 'activate') {
      const meta = await activateFeatured(email, {
        tier: body.tier || 'manual',
        expiresAt: body.expiresAt,
        lastWebhookEvent: `admin_manual:${auth.email}`,
      });
      return NextResponse.json({ ok: true, meta });
    }
    if (body.action === 'cancel') {
      const endsAt = body.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const meta = await cancelFeaturedSubscription(email, endsAt);
      if (!meta) return NextResponse.json({ error: 'No featured record for this email' }, { status: 404 });
      return NextResponse.json({ ok: true, meta });
    }
    if (body.action === 'expire') {
      const meta = await expireFeaturedSubscription(email);
      if (!meta) return NextResponse.json({ error: 'No featured record for this email' }, { status: 404 });
      return NextResponse.json({ ok: true, meta });
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('[admin featured PATCH]', err);
    return NextResponse.json({ error: 'Could not update featured record' }, { status: 502 });
  }
}

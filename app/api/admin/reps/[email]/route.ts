import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getKV } from '@/lib/kv';
import {
  getRawReps,
  getRegisteredRepByEmail,
  hideStaticListingEmail,
  invalidateProfileCache,
  invalidateRegisteredRepsCache,
} from '@/lib/data';
import { invalidateFeaturedCache } from '@/lib/featured';
import { validateEnglishCountySelections } from '@/lib/english-counties';
import { getReview } from '@/lib/admin-review';
import { loadFeaturedFlags } from '@/lib/featured';

export const dynamic = 'force-dynamic';

const ALLOWED_PROFILE_FIELDS = new Set([
  'name',
  'phone',
  'availability',
  'accreditation',
  'counties',
  'coverage_areas',
  'stations_covered',
  'notes',
  'postcode',
  'website_url',
  'whatsapp_link',
  'dscc_pin',
  'holiday_availability',
  'languages',
  'specialisms',
  'years_experience',
]);

async function loadAll(email: string) {
  const kv = getKV();
  const lower = email.toLowerCase();
  const [newrep, profile, featuredFlags, review, staticRep] = await Promise.all([
    kv ? kv.get<Record<string, unknown>>(`newrep:${lower}`) : Promise.resolve(null),
    kv ? kv.get<Record<string, unknown>>(`profile:${lower}`) : Promise.resolve(null),
    loadFeaturedFlags(),
    getReview(lower),
    Promise.resolve(getRawReps().find((r) => r.email.toLowerCase() === lower) ?? null),
  ]);
  return {
    email: lower,
    source: newrep ? ('registered' as const) : ('static' as const),
    newrep: newrep ?? null,
    profile: profile ?? null,
    featured: featuredFlags.get(lower) ?? null,
    review: review ?? null,
    staticRep,
  };
}

export async function GET(_request: Request, ctx: { params: Promise<{ email: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { email: encodedEmail } = await ctx.params;
  const email = decodeURIComponent(encodedEmail).toLowerCase();
  if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 });

  const data = await loadAll(email);
  if (!data.newrep && !data.staticRep) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(request: Request, ctx: { params: Promise<{ email: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { email: encodedEmail } = await ctx.params;
  const email = decodeURIComponent(encodedEmail).toLowerCase();
  if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 });

  const kv = getKV();
  if (!kv) return NextResponse.json({ error: 'Storage not configured' }, { status: 503 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  for (const key of Object.keys(body)) {
    if (ALLOWED_PROFILE_FIELDS.has(key)) update[key] = body[key];
  }

  if ('counties' in update) {
    const v = validateEnglishCountySelections(update.counties);
    if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
    update.counties = v.canonical;
  }

  for (const [key, val] of Object.entries(update)) {
    if (typeof val === 'string' && val.length > 5000) {
      return NextResponse.json({ error: `${key} is too long` }, { status: 400 });
    }
  }

  const staticRep = getRawReps().find((r) => r.email.toLowerCase() === email);
  const registered = await getRegisteredRepByEmail(email);
  if (!staticRep && !registered) {
    return NextResponse.json({ error: 'No matching rep' }, { status: 404 });
  }

  const repSlug = registered?.slug ?? staticRep?.slug ?? '';
  const now = new Date().toISOString();
  let existing: Record<string, unknown> = {};
  try {
    existing = (await kv.get<Record<string, unknown>>(`profile:${email}`)) ?? {};
  } catch (err) {
    console.error('[admin PATCH] profile read failed:', err);
    return NextResponse.json({ error: 'Could not read profile' }, { status: 502 });
  }

  const merged = {
    ...existing,
    ...update,
    updated_at: now,
    updated_by: auth.email,
    email,
    rep_slug: repSlug,
  };

  try {
    await kv.set(`profile:${email}`, merged);
  } catch (err) {
    console.error('[admin PATCH] profile write failed:', err);
    return NextResponse.json({ error: 'Could not save profile' }, { status: 502 });
  }

  invalidateProfileCache();

  return NextResponse.json({ ok: true, updated_at: now, profile: merged });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ email: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { email: encodedEmail } = await ctx.params;
  const email = decodeURIComponent(encodedEmail).toLowerCase();
  if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 });

  const kv = getKV();
  if (!kv) return NextResponse.json({ error: 'Storage not configured' }, { status: 503 });

  const staticRep = getRawReps().find((r) => r.email.toLowerCase() === email);
  const registered = await getRegisteredRepByEmail(email);

  if (!staticRep && !registered) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const isRegistered = Boolean(registered);

  try {
    if (isRegistered) {
      await kv.del(`newrep:${email}`);
      await kv.del(`profile:${email}`);
      await kv.del(`featured:${email}`);
      await kv.del(`repreview:${email}`);
      invalidateRegisteredRepsCache();
    } else {
      await hideStaticListingEmail(email);
      await kv.del(`profile:${email}`);
      await kv.del(`featured:${email}`);
    }

    invalidateProfileCache();
    invalidateFeaturedCache();
  } catch (err) {
    console.error('[admin DELETE]', err);
    return NextResponse.json({ error: 'Could not remove listing' }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    removedRegistration: isRegistered,
    hiddenStaticEntry: !isRegistered,
  });
}

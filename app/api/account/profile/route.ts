import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getKV } from '@/lib/kv';
import { getRawReps, getRegisteredRepByEmail, invalidateProfileCache } from '@/lib/data';
import type { Representative } from '@/lib/types';
import { sendProfileUpdateNotification } from '@/lib/email';
import { validateEnglishCountySelections } from '@/lib/english-counties';

/**
 * Fields a logged-in rep can self-edit on their own profile. Verification gate
 * fields (`verificationStatus`, `adminApproved`, `isPublic`, `lastVerifiedDate`)
 * are deliberately excluded — only the admin can change those.
 *
 * Free-text `accreditation` is also restricted via a server-side allow-list
 * inside the handler so a self-editor cannot promote themselves from
 * "probationary" to "duty solicitor".
 */
const ALLOWED_FIELDS = new Set([
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

/** Hard reject any attempt to bypass the verification gate via the self-edit endpoint. */
const PROTECTED_FIELDS = new Set([
  'verificationStatus',
  'adminApproved',
  'isPublic',
  'lastVerifiedDate',
  'review',
  'riskCategory',
  'riskReasons',
]);

async function findRep(email: string): Promise<Representative | null> {
  const reps = getRawReps();
  const staticRep = reps.find((r) => r.email.toLowerCase() === email);
  if (staticRep) return staticRep;
  return getRegisteredRepByEmail(email);
}

export async function GET() {
  const email = await getSession();
  if (!email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const rep = await findRep(email);
  if (!rep) {
    return NextResponse.json({ error: 'No listing found for this email' }, { status: 404 });
  }

  const kv = getKV();
  const overrides: Record<string, unknown> = kv
    ? (await kv.get<Record<string, unknown>>(`profile:${email}`)) ?? {}
    : {};

  function pick<T>(key: string, fallback: T): T {
    return key in overrides ? (overrides[key] as T) : fallback;
  }

  const merged = {
    slug: rep.slug,
    name: pick('name', rep.name),
    email: rep.email,
    phone: pick('phone', rep.phone),
    accreditation: pick('accreditation', rep.accreditation),
    availability: pick('availability', rep.availability),
    postcode: pick('postcode', rep.postcode ?? ''),
    counties: pick('counties', rep.counties ?? (rep.county ? [rep.county] : [])),
    stations_covered: pick('stations_covered', rep.stationsCovered ?? rep.stations ?? []),
    coverage_areas: pick('coverage_areas', rep.coverageAreas ?? ''),
    notes: pick('notes', rep.notes ?? rep.bio ?? ''),
    website_url: pick('website_url', rep.websiteUrl ?? ''),
    whatsapp_link: pick('whatsapp_link', rep.whatsappLink ?? ''),
    dscc_pin: pick('dscc_pin', rep.dsccPin ?? ''),
    holiday_availability: pick('holiday_availability', rep.holidayAvailability ?? []),
    languages: pick('languages', rep.languages ?? []),
    specialisms: pick('specialisms', rep.specialisms ?? []),
    years_experience: pick('years_experience', rep.yearsExperience ?? null),
    updated_at: pick('updated_at', null as string | null),
  };

  return NextResponse.json(merged);
}

export async function PUT(request: Request) {
  const email = await getSession();
  if (!email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const kv = getKV();
  if (!kv) {
    return NextResponse.json({ error: 'Storage not configured' }, { status: 503 });
  }

  const rep = await findRep(email);
  if (!rep) {
    return NextResponse.json({ error: 'No listing found for this email' }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  for (const key of Object.keys(body)) {
    if (PROTECTED_FIELDS.has(key)) {
      return NextResponse.json(
        {
          error:
            'You cannot change verification or publication fields here. Only the PoliceStationRepUK admin can promote a profile to public.',
        },
        { status: 403 },
      );
    }
  }

  // Reject any attempt to self-declare a probationary / trainee / unaccredited status.
  if (typeof body.accreditation === 'string') {
    const a = body.accreditation.toLowerCase();
    if (
      /probation|trainee|student|studying|working\s*towards|awaiting\s*accreditation|unaccredited/.test(
        a,
      )
    ) {
      return NextResponse.json(
        {
          error:
            'PoliceStationRepUK does not list probationary representatives, trainees or unaccredited applicants. Please contact admin if your status has changed.',
        },
        { status: 400 },
      );
    }
  }

  const update: Record<string, unknown> = {};
  for (const key of Object.keys(body)) {
    if (ALLOWED_FIELDS.has(key)) {
      update[key] = body[key];
    }
  }

  if ('counties' in update) {
    const v = validateEnglishCountySelections(update.counties);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }
    update.counties = v.canonical;
  }

  for (const [key, val] of Object.entries(update)) {
    if (typeof val === 'string' && val.length > 5000) {
      return NextResponse.json({ error: `${key} is too long` }, { status: 400 });
    }
  }

  const now = new Date().toISOString();

  let existing: Record<string, unknown>;
  try {
    existing = (await kv.get<Record<string, unknown>>(`profile:${email}`)) ?? {};
  } catch (err) {
    console.error('[profile PUT] Failed to read existing profile from KV:', err);
    return NextResponse.json({ error: 'Could not read existing profile data' }, { status: 502 });
  }

  const merged = { ...existing, ...update, updated_at: now, email, rep_slug: rep.slug };

  try {
    await kv.set(`profile:${email}`, merged);
  } catch (err) {
    console.error('[profile PUT] Failed to write profile to KV:', err);
    return NextResponse.json({ error: 'Could not save your profile. Please try again.' }, { status: 502 });
  }

  invalidateProfileCache();

  const changes: Record<string, { from: string; to: string }> = {};
  for (const key of ALLOWED_FIELDS) {
    const newVal = body[key];
    if (newVal === undefined) continue;
    const oldVal = getOldValue(rep, key);
    const newStr = Array.isArray(newVal) ? newVal.join(', ') : String(newVal ?? '');
    const oldStr = Array.isArray(oldVal) ? oldVal.join(', ') : String(oldVal ?? '');
    if (newStr !== oldStr) {
      changes[key] = { from: oldStr, to: newStr };
    }
  }

  if (Object.keys(changes).length > 0) {
    sendProfileUpdateNotification({
      repName: (body.name as string) || rep.name,
      repEmail: email,
      repSlug: rep.slug,
      changes,
    }).catch((err) => console.error('[profile notify]', err));
  }

  return NextResponse.json({ ok: true, updated_at: now });
}

function getOldValue(rep: Representative, key: string): unknown {
  const map: Record<string, unknown> = {
    name: rep.name,
    phone: rep.phone,
    availability: rep.availability,
    accreditation: rep.accreditation,
    counties: rep.counties ?? (rep.county ? [rep.county] : []),
    stations_covered: rep.stationsCovered ?? rep.stations,
    coverage_areas: rep.coverageAreas ?? '',
    notes: rep.notes ?? rep.bio,
    postcode: rep.postcode,
    website_url: rep.websiteUrl,
    whatsapp_link: rep.whatsappLink,
    dscc_pin: rep.dsccPin,
    holiday_availability: rep.holidayAvailability,
    languages: rep.languages,
    specialisms: rep.specialisms,
    years_experience: rep.yearsExperience,
  };
  return map[key] ?? '';
}

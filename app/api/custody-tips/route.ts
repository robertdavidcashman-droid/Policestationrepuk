/**
 * Rep-contributed custody numbers.
 *
 * A logged-in rep submits one or more custody desk numbers for stations they
 * cover. Submissions are tied to their authenticated session email (one
 * corroboration vote per rep per station). A number publishes as `verified`
 * once two independent reps agree, or one rep agrees with an official number
 * already on file. Contributing >= 5 stations earns a renewable free featured
 * month (banked until the rep is verified).
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getClientIp, rateLimitOk } from '@/lib/contact-guards';
import { getAllReps, getAllStations, getRegisteredRepByEmail } from '@/lib/data';
import { validateCustodyNumber } from '@/lib/custody-tips/validate';
import { recordTip, countRepActiveStations, invalidateCustodyConsensusCache } from '@/lib/custody-tips/storage';
import { grantContributorReward } from '@/lib/custody-tips/reward';
import type { CustodyTipSource } from '@/lib/custody-tips/types';
import type { PoliceStation } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface SubmissionInput {
  stationId?: unknown;
  slug?: unknown;
  number?: unknown;
}

interface CustodyTipBody {
  submissions?: unknown;
  stationId?: unknown;
  slug?: unknown;
  number?: unknown;
  source?: unknown;
  _hp?: unknown;
}

const VALID_SOURCES: CustodyTipSource[] = ['register', 'contribute_page', 'reverify_email'];

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function resolveStation(
  ref: { stationId: string; slug: string },
  byId: Map<string, PoliceStation>,
  bySlug: Map<string, PoliceStation>,
): PoliceStation | undefined {
  if (ref.stationId && byId.has(ref.stationId)) return byId.get(ref.stationId);
  if (ref.slug && bySlug.has(ref.slug)) return bySlug.get(ref.slug);
  return undefined;
}

/** Only count a number as "official" when it came from file/override, not a prior unverified tip. */
function officialNumberFor(station: PoliceStation): string | undefined {
  const contrib = station.verificationMeta?.custodyContribution;
  if (contrib && contrib.status !== 'verified') return undefined;
  return station.custodyPhone || undefined;
}

export async function POST(request: Request) {
  try {
    const email = await getSession();
    if (!email) {
      return NextResponse.json(
        { error: 'Please log in to your rep account to contribute custody numbers.' },
        { status: 401 },
      );
    }

    const raw = (await request.json()) as CustodyTipBody;
    if (raw._hp) return NextResponse.json({ ok: true, results: [] });

    const source: CustodyTipSource = VALID_SOURCES.includes(raw.source as CustodyTipSource)
      ? (raw.source as CustodyTipSource)
      : 'contribute_page';

    const rawList: SubmissionInput[] = Array.isArray(raw.submissions)
      ? (raw.submissions as SubmissionInput[])
      : [{ stationId: raw.stationId, slug: raw.slug, number: raw.number }];

    if (rawList.length === 0 || rawList.length > 25) {
      return NextResponse.json({ error: 'Submit between 1 and 25 numbers.' }, { status: 400 });
    }

    const ip = getClientIp(request);
    const rl = await rateLimitOk({ ip, scope: 'custody-tips', max: 10, windowMs: 15 * 60 * 1000 });
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Too many submissions. Please wait a few minutes and try again.' },
        { status: 429 },
      );
    }

    const stations = await getAllStations();
    const byId = new Map(stations.map((s) => [s.id, s]));
    const bySlug = new Map(stations.map((s) => [s.slug, s]));
    const rep = await getRegisteredRepByEmail(email);

    const results: Array<{
      stationId?: string;
      stationName?: string;
      slug?: string;
      ok: boolean;
      status?: 'verified' | 'unverified';
      confirmedBy?: number;
      number?: string;
      error?: string;
    }> = [];

    for (const item of rawList) {
      const ref = { stationId: str(item.stationId), slug: str(item.slug) };
      const station = resolveStation(ref, byId, bySlug);
      if (!station) {
        results.push({ ...ref, ok: false, error: 'Unknown station — pick one from the list.' });
        continue;
      }

      const validated = validateCustodyNumber(str(item.number));
      if (!validated.ok) {
        results.push({
          stationId: station.id,
          stationName: station.name,
          slug: station.slug,
          ok: false,
          error: validated.error,
        });
        continue;
      }

      const { consensus } = await recordTip({
        stationId: station.id,
        stationSlug: station.slug,
        stationName: station.name,
        number: validated.number!,
        repEmail: email,
        repName: rep?.name,
        source,
        submitterIp: ip,
        officialNumber: officialNumberFor(station),
      });

      results.push({
        stationId: station.id,
        stationName: station.name,
        slug: station.slug,
        ok: true,
        status: consensus.status,
        confirmedBy: consensus.confirmedBy,
        number: validated.number,
      });
    }

    invalidateCustodyConsensusCache();

    // Evaluate the contributor reward against the rep's current public visibility.
    const stationCount = await countRepActiveStations(email);
    const publicReps = await getAllReps();
    const repVerified = publicReps.some((r) => r.email.toLowerCase() === email.toLowerCase());
    const reward = await grantContributorReward({ email, stationCount, repVerified });

    return NextResponse.json({
      ok: true,
      accepted: results.filter((r) => r.ok).length,
      results,
      reward,
    });
  } catch (err) {
    console.error('[custody-tips] unexpected error:', err);
    return NextResponse.json(
      { error: 'Something went wrong saving your submission. Please try again.' },
      { status: 500 },
    );
  }
}

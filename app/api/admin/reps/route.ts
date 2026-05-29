import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import {
  getAllProfileOverrides,
  getAllRegisteredRepsRaw,
  getHiddenListingEmails,
  getRawReps,
} from '@/lib/data';
import { loadFeaturedFlags, type FeaturedMeta } from '@/lib/featured';
import { loadAllReviews, type RepReview } from '@/lib/admin-review';
import { matchesAutomatedSmokeRep } from '@/lib/directory-blocklist';
import type { Representative } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface AdminRepSummary {
  email: string;
  source: 'registered' | 'static';
  name: string;
  phone: string;
  county: string;
  counties: string[];
  stations: string[];
  coverage_areas: string;
  availability: string;
  accreditation: string;
  notes: string;
  postcode: string;
  slug: string;
  registeredAt: string | null;
  updatedAt: string | null;
  hidden: boolean;
  featured: {
    status: FeaturedMeta['status'] | null;
    tier: string | null;
    activatedAt: string | null;
    expiresAt: string | null;
    isLegacyFeatured: boolean;
  };
  review: {
    status: RepReview['status'];
    adminNotes: string;
    lastReviewedAt: string | null;
    reviewedBy: string | null;
  };
}

function asString(value: unknown): string {
  if (value == null) return '';
  if (Array.isArray(value)) return value.join(', ');
  return String(value).trim();
}

function asList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((s): s is string => typeof s === 'string').map((s) => s.trim()).filter(Boolean);
  if (typeof value === 'string') {
    return value.split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

function summariseRegistered(
  row: Record<string, unknown>,
  override: Record<string, unknown> | undefined,
  featured: FeaturedMeta | undefined,
  review: RepReview | undefined,
  hidden: boolean,
): AdminRepSummary | null {
  const email = asString(row.email).toLowerCase();
  if (!email) return null;
  const counties = asList(override?.counties ?? row.counties);
  const stations = asList(override?.stations_covered ?? row.stations);
  return {
    email,
    source: 'registered',
    name: asString(override?.name ?? row.name),
    phone: asString(override?.phone ?? row.phone),
    county: counties[0] || '',
    counties,
    stations,
    coverage_areas: asString(override?.coverage_areas ?? row.coverage_areas),
    availability: asString(override?.availability ?? row.availability),
    accreditation: asString(override?.accreditation ?? row.accreditation),
    notes: asString(override?.notes ?? row.message),
    postcode: asString(override?.postcode ?? ''),
    slug: asString(override?.rep_slug ?? row.slug),
    registeredAt: asString(row.registeredAt) || null,
    updatedAt: asString(override?.updated_at) || null,
    hidden,
    featured: {
      status: featured?.status ?? null,
      tier: featured?.tier ?? featured?.featuredPlanName ?? null,
      activatedAt: featured?.activatedAt ?? null,
      expiresAt: featured?.expiresAt ?? featured?.featuredExpiryDate ?? null,
      isLegacyFeatured: Boolean(featured?.isLegacyFeatured || featured?.status === 'legacy'),
    },
    review: {
      status: review?.status ?? 'pending',
      adminNotes: review?.adminNotes ?? '',
      lastReviewedAt: review?.lastReviewedAt ?? null,
      reviewedBy: review?.reviewedBy ?? null,
    },
  };
}

function summariseStatic(
  rep: Representative,
  override: Record<string, unknown> | undefined,
  featured: FeaturedMeta | undefined,
  review: RepReview | undefined,
  hidden: boolean,
): AdminRepSummary {
  const counties = asList(override?.counties ?? rep.counties ?? (rep.county ? [rep.county] : []));
  const stations = asList(override?.stations_covered ?? rep.stationsCovered ?? rep.stations);
  return {
    email: rep.email.toLowerCase(),
    source: 'static',
    name: asString(override?.name ?? rep.name),
    phone: asString(override?.phone ?? rep.phone),
    county: counties[0] || rep.county || '',
    counties,
    stations,
    coverage_areas: asString(override?.coverage_areas ?? rep.coverageAreas ?? ''),
    availability: asString(override?.availability ?? rep.availability),
    accreditation: asString(override?.accreditation ?? rep.accreditation),
    notes: asString(override?.notes ?? rep.notes ?? rep.bio ?? ''),
    postcode: asString(override?.postcode ?? rep.postcode ?? ''),
    slug: rep.slug,
    registeredAt: null,
    updatedAt: asString(override?.updated_at) || null,
    hidden,
    featured: {
      status: featured?.status ?? (rep.featured ? 'legacy' : null),
      tier: featured?.tier ?? featured?.featuredPlanName ?? null,
      activatedAt: featured?.activatedAt ?? null,
      expiresAt: featured?.expiresAt ?? featured?.featuredExpiryDate ?? null,
      isLegacyFeatured: Boolean(featured?.isLegacyFeatured || featured?.status === 'legacy' || rep.featured),
    },
    review: {
      status: review?.status ?? 'pending',
      adminNotes: review?.adminNotes ?? '',
      lastReviewedAt: review?.lastReviewedAt ?? null,
      reviewedBy: review?.reviewedBy ?? null,
    },
  };
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const [registeredRaw, profileOverrides, featuredFlags, reviews, hiddenSet, staticReps] = await Promise.all([
    getAllRegisteredRepsRaw(),
    getAllProfileOverrides(),
    loadFeaturedFlags(),
    loadAllReviews(),
    getHiddenListingEmails(),
    Promise.resolve(getRawReps()),
  ]);

  const out: AdminRepSummary[] = [];

  for (const { row } of registeredRaw) {
    const email = asString(row.email).toLowerCase();
    if (!email) continue;
    const summary = summariseRegistered(
      row,
      profileOverrides.get(email),
      featuredFlags.get(email),
      reviews.get(email),
      hiddenSet.has(email),
    );
    if (!summary) continue;
    if (
      matchesAutomatedSmokeRep({
        email: summary.email,
        name: summary.name,
        slug: summary.slug,
        notes: summary.notes,
      })
    ) {
      continue;
    }
    out.push(summary);
  }

  const registeredEmails = new Set(out.map((r) => r.email));
  for (const rep of staticReps) {
    const email = rep.email.toLowerCase();
    if (!email) continue;
    if (registeredEmails.has(email)) continue;
    out.push(
      summariseStatic(
        rep,
        profileOverrides.get(email),
        featuredFlags.get(email),
        reviews.get(email),
        hiddenSet.has(email),
      ),
    );
  }

  out.sort((a, b) => {
    const at = a.registeredAt ? new Date(a.registeredAt).getTime() : 0;
    const bt = b.registeredAt ? new Date(b.registeredAt).getTime() : 0;
    if (at !== bt) return bt - at;
    return a.name.localeCompare(b.name);
  });

  const counts = {
    total: out.length,
    registered: out.filter((r) => r.source === 'registered').length,
    static: out.filter((r) => r.source === 'static').length,
    hidden: out.filter((r) => r.hidden).length,
    featured: out.filter((r) => r.featured.status === 'active' || r.featured.status === 'legacy' || r.featured.isLegacyFeatured).length,
    flagged: out.filter((r) => r.review.status === 'flagged').length,
    pending: out.filter((r) => r.review.status === 'pending').length,
  };

  return NextResponse.json(
    { counts, reps: out },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

export type { AdminRepSummary };

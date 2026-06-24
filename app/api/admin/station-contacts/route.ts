import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getAllFindings } from '@/lib/custody-discovery/storage';
import { getAllStations } from '@/lib/data';
import { getPendingStationUpdates } from '@/lib/station-overrides';
import {
  buildStationContactOverview,
  buildStationContactSummary,
  type StationHealthContext,
} from '@/lib/station-contacts/health';
import type { StationContactSnapshot } from '@/lib/station-contacts/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

function parsePositiveInt(value: string | null, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.floor(n);
}

async function buildHealthContext(): Promise<{
  ctx: StationHealthContext;
  openFindingsTotal: number;
  pendingCommunityUpdates: number;
}> {
  const [findings, pending] = await Promise.all([getAllFindings(), getPendingStationUpdates()]);
  const openFindingsByStationId: Record<string, number> = {};
  let openFindingsTotal = 0;

  for (const finding of findings) {
    if (finding.status !== 'new' && finding.status !== 'needs_review') continue;
    openFindingsTotal += 1;
    openFindingsByStationId[finding.custodySuiteId] =
      (openFindingsByStationId[finding.custodySuiteId] ?? 0) + 1;
  }

  const pendingUpdateStationIds = new Set(pending.map((p) => p.stationId));

  return {
    ctx: { openFindingsByStationId, pendingUpdateStationIds },
    openFindingsTotal,
    pendingCommunityUpdates: pending.length,
  };
}

function filterSummaries(
  summaries: ReturnType<typeof buildStationContactSummary>[],
  params: URLSearchParams,
) {
  const q = params.get('q')?.trim().toLowerCase() ?? '';
  const force = params.get('force')?.trim() ?? '';
  const county = params.get('county')?.trim() ?? '';
  const region = params.get('region')?.trim() ?? '';
  const badge = params.get('badge')?.trim() ?? '';
  const missingCustody = params.get('missingCustody') === '1';

  return summaries.filter((row) => {
    if (force && row.forceName !== force) return false;
    if (county && row.county !== county) return false;
    if (region && row.region !== region) return false;
    if (missingCustody && (!row.isCustody || row.custodyPublished)) return false;
    if (badge && !row.badges.some((b) => b.id === badge)) return false;
    if (q) {
      const hay = `${row.name} ${row.slug} ${row.forceName} ${row.county} ${row.mainPhone ?? ''} ${row.custodyPhone ?? ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const url = new URL(request.url);
    const format = url.searchParams.get('format');
    const stations = await getAllStations();
    const { ctx, openFindingsTotal, pendingCommunityUpdates } = await buildHealthContext();
    const summaries = stations.map((s) => buildStationContactSummary(s, ctx));
    const overview = buildStationContactOverview(
      summaries,
      openFindingsTotal,
      pendingCommunityUpdates,
    );

    if (format === 'snapshot') {
      const snapshot: StationContactSnapshot = {
        generatedAt: overview.generatedAt,
        overview,
        stations: summaries,
      };
      return NextResponse.json(snapshot);
    }

    const filtered = filterSummaries(summaries, url.searchParams);
    const page = parsePositiveInt(url.searchParams.get('page'), 1);
    const limit = Math.min(parsePositiveInt(url.searchParams.get('limit'), 50), 200);
    const total = filtered.length;
    const start = (page - 1) * limit;
    const rows = filtered.slice(start, start + limit);

    const forces = [...new Set(summaries.map((s) => s.forceName).filter(Boolean))].sort();
    const counties = [...new Set(summaries.map((s) => s.county).filter(Boolean))].sort();
    const regions = [...new Set(summaries.map((s) => s.region).filter(Boolean))].sort();

    return NextResponse.json({
      ok: true,
      generatedAt: overview.generatedAt,
      overview,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      filters: { forces, counties, regions },
      rows,
    });
  } catch (err) {
    console.error('[admin station-contacts]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load station contacts' },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: {
    action?: 'approve-finding' | 'approve-update';
    findingId?: string;
    stationId?: string;
    submissionId?: string;
    fields?: import('@/lib/station-overrides').StationOverrideFields;
    notes?: string;
    markVerified?: boolean;
    sourceUrl?: string;
    force?: boolean;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { approveStationContact } = await import('@/lib/station-contacts/apply');

  if (body.action === 'approve-finding') {
    if (!body.findingId) return NextResponse.json({ error: 'Missing findingId' }, { status: 400 });
    const result = await approveStationContact({
      kind: 'custody-finding',
      findingId: body.findingId,
      approvedBy: auth.email,
      notes: body.notes,
      markVerified: body.markVerified,
    });
    if (!result.ok) return NextResponse.json({ error: 'Finding not found' }, { status: 404 });
    return NextResponse.json(result);
  }

  if (body.action === 'approve-update') {
    if (!body.stationId || !body.fields) {
      return NextResponse.json({ error: 'Missing stationId or fields' }, { status: 400 });
    }
    const result = await approveStationContact({
      kind: 'community-update',
      stationId: body.stationId,
      submissionId: body.submissionId,
      fields: body.fields,
      approvedBy: auth.email,
      markVerified: body.markVerified,
      sourceUrl: body.sourceUrl,
    });
    if (result.conflict && !body.force) {
      return NextResponse.json({ error: 'Conflict detected', ...result }, { status: 409 });
    }
    if (!result.ok) return NextResponse.json(result, { status: 404 });
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

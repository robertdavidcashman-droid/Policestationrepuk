import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin-auth';
import { getAllStations } from '@/lib/data';
import {
  deletePendingStationUpdate,
  deleteStationOverride,
  getAllStationOverrides,
  getPendingStationUpdates,
  saveStationOverride,
  type StationOverrideFields,
} from '@/lib/station-overrides';

export const dynamic = 'force-dynamic';

interface PostBody {
  action?: 'approve' | 'reject' | 'revert';
  id?: string;
  stationId?: string;
  fields?: StationOverrideFields;
}

async function revalidateStation(stationId: string) {
  const stations = await getAllStations();
  const station = stations.find((s) => s.id === stationId);
  revalidatePath('/StationsDirectory');
  revalidatePath('/Map');
  revalidatePath('/HelpUsStationNumbers');
  if (station) revalidatePath(`/police-station/${station.slug}`);
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const [pending, overrides] = await Promise.all([
    getPendingStationUpdates(),
    getAllStationOverrides(),
  ]);
  return NextResponse.json({ pending, overrides });
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

  const action = body.action;

  try {
    if (action === 'approve') {
      if (!body.stationId || !body.fields) {
        return NextResponse.json({ error: 'Missing stationId or fields' }, { status: 400 });
      }
      const override = await saveStationOverride(body.stationId, body.fields, {
        approvedBy: auth.email,
        submissionId: body.id,
      });
      if (body.id) await deletePendingStationUpdate(body.id);
      await revalidateStation(body.stationId);
      return NextResponse.json({ ok: true, override });
    }

    if (action === 'reject') {
      if (!body.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
      await deletePendingStationUpdate(body.id);
      return NextResponse.json({ ok: true });
    }

    if (action === 'revert') {
      if (!body.stationId) {
        return NextResponse.json({ error: 'Missing stationId' }, { status: 400 });
      }
      await deleteStationOverride(body.stationId);
      await revalidateStation(body.stationId);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('[admin station-update]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not process action' },
      { status: 502 },
    );
  }
}

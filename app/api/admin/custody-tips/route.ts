import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin-auth';
import { getAllStations } from '@/lib/data';
import {
  adminRejectStation,
  adminVerifyConsensus,
  getAllConsensusRecords,
  getTipsForStation,
} from '@/lib/custody-tips/storage';

export const dynamic = 'force-dynamic';

interface PostBody {
  action?: 'verify' | 'reject';
  stationId?: string;
}

async function revalidateStation(stationId: string) {
  const stations = await getAllStations();
  const station = stations.find((s) => s.id === stationId);
  revalidatePath('/StationsDirectory');
  if (station) revalidatePath(`/police-station/${station.slug}`);
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const consensus = await getAllConsensusRecords();
  return NextResponse.json({ consensus });
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

  if (!body.stationId) {
    return NextResponse.json({ error: 'Missing stationId' }, { status: 400 });
  }

  try {
    if (body.action === 'verify') {
      const consensus = await adminVerifyConsensus(body.stationId, auth.email);
      if (!consensus) {
        return NextResponse.json({ error: 'No consensus for that station' }, { status: 404 });
      }
      await revalidateStation(body.stationId);
      return NextResponse.json({ ok: true, consensus });
    }

    if (body.action === 'reject') {
      await adminRejectStation(body.stationId);
      await revalidateStation(body.stationId);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('[admin custody-tips]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not process action' },
      { status: 502 },
    );
  }
}

/** Admin helper: tips behind one station (used by the queue UI on demand). */
export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  let body: { stationId?: string };
  try {
    body = (await request.json()) as { stationId?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body.stationId) return NextResponse.json({ error: 'Missing stationId' }, { status: 400 });
  const tips = await getTipsForStation(body.stationId);
  return NextResponse.json({ tips });
}

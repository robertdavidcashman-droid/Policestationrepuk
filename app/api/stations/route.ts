import { NextResponse } from 'next/server';
import { getAllStations } from '@/lib/data';

export async function GET() {
  const stations = await getAllStations();
  const pins = stations.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    county: s.county || s.forceName || 'Unknown',
    address: s.address,
    forceName: s.forceName || '',
    phone: s.phone || '',
    custodyPhone: s.custodyPhone || '',
    custodyPhone2: s.custodyPhone2 || '',
    nonEmergencyPhone: s.nonEmergencyPhone || '',
    isCustodyStation: Boolean(s.isCustodyStation || s.custodySuite),
    custodySuite: Boolean(s.isCustodyStation || s.custodySuite),
    lat: s.latitude ?? null,
    lng: s.longitude ?? null,
  }));
  return NextResponse.json(pins);
}

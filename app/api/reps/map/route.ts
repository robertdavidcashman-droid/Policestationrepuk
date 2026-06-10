import { NextResponse } from 'next/server';
import { getAllReps, getAllCounties } from '@/lib/data';

export const dynamic = 'force-dynamic';

/** Rep counts by county for map / coverage widgets. */
export async function GET() {
  const [reps, counties] = await Promise.all([getAllReps(), getAllCounties()]);
  const counts = new Map<string, number>();

  for (const rep of reps) {
    const keys = new Set<string>();
    if (rep.county) keys.add(rep.county.toLowerCase());
    for (const c of rep.counties ?? []) {
      if (c) keys.add(c.toLowerCase());
    }
    for (const key of keys) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  const byCounty = counties
    .map((c) => ({
      slug: c.slug,
      name: c.name,
      repCount: counts.get(c.name.toLowerCase()) ?? counts.get(c.slug.toLowerCase()) ?? 0,
    }))
    .filter((c) => c.repCount > 0)
    .sort((a, b) => b.repCount - a.repCount);

  return NextResponse.json({
    totalReps: reps.length,
    countiesWithReps: byCounty.length,
    byCounty,
  });
}

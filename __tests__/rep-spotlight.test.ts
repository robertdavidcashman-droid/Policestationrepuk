/**
 * Fair-rotation guarantees for the "Rep of the Month" spotlight.
 *
 * Neutrality is the point of this feature, so these tests assert:
 *   - selection is deterministic for a given month
 *   - the window advances each month (rotation actually happens)
 *   - over a full cycle every eligible rep is selected exactly once (fairness)
 *   - the directory owner (Robert Cashman) is NOT given any priority
 */

import { describe, expect, it } from 'vitest';
import type { Representative } from '@/lib/types';
import {
  eligibleSpotlightReps,
  monthIndex,
  selectMonthlySpotlight,
} from '@/lib/rep-spotlight';

function makeRep(slug: string, over: Partial<Representative> = {}): Representative {
  return {
    id: slug,
    slug,
    name: slug.replace(/-/g, ' '),
    email: `${slug}@example.com`,
    county: 'Kent',
    stations: ['Maidstone'],
    availability: 'Daytime',
    ...over,
  } as Representative;
}

const REPS: Representative[] = [
  makeRep('robert-cashman'),
  makeRep('alice-adams'),
  makeRep('zoe-zhang'),
  makeRep('bob-baker'),
  // Ineligible: no county and no stations -> should be filtered out.
  makeRep('no-area', { county: '', stations: [] }),
];

describe('rep-spotlight fair rotation', () => {
  it('filters out reps without a public-facing area', () => {
    const eligible = eligibleSpotlightReps(REPS);
    expect(eligible.map((r) => r.slug)).not.toContain('no-area');
    expect(eligible).toHaveLength(4);
  });

  it('is deterministic for a given month', () => {
    const date = new Date(Date.UTC(2026, 5, 1));
    const a = selectMonthlySpotlight(REPS, 1, date);
    const b = selectMonthlySpotlight(REPS, 1, date);
    expect(a[0]?.slug).toBe(b[0]?.slug);
  });

  it('advances the selection across consecutive months', () => {
    const m0 = selectMonthlySpotlight(REPS, 1, new Date(Date.UTC(2026, 0, 1)))[0]?.slug;
    const m1 = selectMonthlySpotlight(REPS, 1, new Date(Date.UTC(2026, 1, 1)))[0]?.slug;
    expect(m0).not.toBe(m1);
  });

  it('gives every eligible rep exactly one turn over a full cycle', () => {
    const eligibleCount = eligibleSpotlightReps(REPS).length;
    const base = monthIndex(new Date(Date.UTC(2026, 0, 1)));
    const seen = new Set<string>();
    for (let i = 0; i < eligibleCount; i++) {
      // monthIndex advances by 1 each calendar month; emulate by stepping months.
      const date = new Date(Date.UTC(2026, i, 1));
      expect(monthIndex(date)).toBe(base + i);
      const pick = selectMonthlySpotlight(REPS, 1, date)[0];
      if (pick) seen.add(pick.slug);
    }
    expect(seen.size).toBe(eligibleCount);
  });

  it('does not privilege the directory owner', () => {
    const eligibleCount = eligibleSpotlightReps(REPS).length;
    let robertCount = 0;
    for (let i = 0; i < eligibleCount * 3; i++) {
      const date = new Date(Date.UTC(2026, i, 1));
      const pick = selectMonthlySpotlight(REPS, 1, date)[0];
      if (pick?.slug === 'robert-cashman') robertCount++;
    }
    // Over three full cycles Robert appears exactly 3 times — same as everyone else.
    expect(robertCount).toBe(3);
  });
});

import type { Representative } from './types';

/**
 * Fair, rotating "Rep of the Month" spotlight.
 *
 * Neutrality is the whole point of this feature: placement cannot be bought and
 * no individual rep (including the directory owner) is pinned. Every eligible
 * rep is ordered deterministically by slug and the selection window advances by
 * one position each month, so over time every rep receives an equal turn.
 */

/** Reps eligible for the free spotlight: a real profile the public can open. */
export function eligibleSpotlightReps(reps: Representative[]): Representative[] {
  return reps
    .filter(
      (r) =>
        Boolean(r.slug) &&
        Boolean(r.name) &&
        (Boolean(r.county) || (Array.isArray(r.stations) && r.stations.length > 0)),
    )
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

/** Months since year 0 — a stable, monotonic monthly counter. */
export function monthIndex(date: Date = new Date()): number {
  return date.getUTCFullYear() * 12 + date.getUTCMonth();
}

/**
 * Deterministically pick `count` reps for the given month. The window rotates
 * by `count` each month, giving every rep an equal, predictable turn.
 */
export function selectMonthlySpotlight(
  reps: Representative[],
  count = 1,
  date: Date = new Date(),
): Representative[] {
  const pool = eligibleSpotlightReps(reps);
  if (pool.length === 0) return [];
  const n = Math.min(Math.max(1, count), pool.length);
  const start = ((monthIndex(date) * n) % pool.length + pool.length) % pool.length;
  const selection: Representative[] = [];
  for (let i = 0; i < n; i++) {
    selection.push(pool[(start + i) % pool.length]);
  }
  return selection;
}

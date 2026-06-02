import type { PoliceStation } from '@/lib/types';

const CUSTODY_NAME_RE = /custody|custody suite|justice centre/i;

/** Whether this row represents a custody suite (flag or name heuristic). */
export function isCustodyStation(s: PoliceStation): boolean {
  return Boolean(s.isCustodyStation || s.custodySuite || CUSTODY_NAME_RE.test(s.name ?? ''));
}

/** Normalised name for matching seed / external directories. */
export function normaliseStationName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s*police station\s*/gi, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Match legacy seed slug (e.g. `medway`) to station slug (e.g. `medway-police-station`). */
export function slugMatchesSeed(seedSlug: string, stationSlug: string): boolean {
  const s = seedSlug.toLowerCase().trim();
  const t = stationSlug.toLowerCase().trim();
  if (!s || !t) return false;
  if (t === s) return true;
  if (t.startsWith(`${s}-`) || t.endsWith(`-${s}`)) return true;
  if (t.includes(`-${s}-`)) return true;
  return false;
}

export function nameMatchesSeed(seedName: string, stationName: string): boolean {
  const a = normaliseStationName(seedName);
  const b = normaliseStationName(stationName);
  if (!a || !b) return false;
  return b === a || b.startsWith(`${a} `) || b.startsWith(a);
}

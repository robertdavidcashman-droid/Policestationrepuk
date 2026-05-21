import type { Representative, PoliceStation } from '@/lib/types';
import { repMatchesCountyName } from '@/lib/county-matching';

/** Filter by police force display name (must match a value from station data). */
export function repMatchesPoliceForce(
  rep: Representative,
  selectedForce: string,
  stations: PoliceStation[],
): boolean {
  const t = selectedForce.trim();
  if (!t) return true;

  const target = t.toLowerCase();
  const inForce = stations.filter((s) => {
    const f = (s.forceName || '').toLowerCase().trim();
    if (!f) return false;
    return f === target || f.includes(target) || target.includes(f);
  });
  if (inForce.length === 0) return false;

  const counties = new Set<string>();
  for (const st of inForce) {
    const c = (st.county || '').trim();
    if (c) counties.add(c);
  }
  for (const c of counties) {
    if (repMatchesCountyName(rep.county, c)) return true;
  }

  const repStations = (rep.stations || []).map((x) => x.toLowerCase().trim()).filter(Boolean);
  for (const st of inForce) {
    const sn = st.name.toLowerCase();
    for (const rs of repStations) {
      if (!rs) continue;
      if (sn.includes(rs) || rs.includes(sn)) return true;
      if (rs.length >= 8 && sn.includes(rs.slice(0, 10))) return true;
    }
  }

  return false;
}

/**
 * Public directory accreditation filters. Note: the `probationary` key is
 * intentionally removed — PoliceStationRepUK no longer lists probationary
 * representatives.
 */
export type AccreditationFilterKey = '' | 'duty' | 'solicitor' | 'accredited';

export function repMatchesAccreditationFilter(rep: Representative, filterKey: AccreditationFilterKey): boolean {
  if (!filterKey) return true;
  const a = (rep.accreditation || '').toLowerCase();
  switch (filterKey) {
    case 'duty':
      return /\bduty\b/i.test(rep.accreditation || '');
    case 'solicitor':
      return /\bsolicitor\b/i.test(a) && !/probationary|trainee/i.test(a);
    case 'accredited':
      if (/probationary|trainee/i.test(a)) return false;
      return /\bduty\b|law society|accredited|higher rights|psras/i.test(a);
    default:
      return true;
  }
}

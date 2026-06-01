import type { PoliceStation } from '@/lib/types';

/**
 * Police forces don't map 1:1 to counties, but for directory grouping a single
 * representative county per force is far more useful than the current "Other"
 * bucket (stations.json has no `county` field populated).
 *
 * Forces that genuinely span multiple counties (Thames Valley, Dyfed-Powys,
 * British Transport Police) keep a sensible umbrella label rather than a
 * misleading single county.
 */
const FORCE_TO_COUNTY: Record<string, string> = {
  'metropolitan police': 'London',
  'city of london police': 'London',
  'greater manchester police': 'Greater Manchester',
  'essex police': 'Essex',
  'lancashire constabulary': 'Lancashire',
  'west midlands police': 'West Midlands',
  'northumbria police': 'Northumberland',
  'north yorkshire police': 'North Yorkshire',
  'west yorkshire police': 'West Yorkshire',
  'devon and cornwall police': 'Devon and Cornwall',
  'cumbria constabulary': 'Cumbria',
  'hertfordshire constabulary': 'Hertfordshire',
  'derbyshire constabulary': 'Derbyshire',
  'humberside police': 'Humberside',
  'cheshire constabulary': 'Cheshire',
  'norfolk constabulary': 'Norfolk',
  'thames valley police': 'Thames Valley',
  'south yorkshire police': 'South Yorkshire',
  'staffordshire police': 'Staffordshire',
  'merseyside police': 'Merseyside',
  'kent police': 'Kent',
  'west mercia police': 'West Mercia',
  'south wales police': 'South Wales',
  'lincolnshire police': 'Lincolnshire',
  'nottinghamshire police': 'Nottinghamshire',
  'cambridgeshire constabulary': 'Cambridgeshire',
  'hampshire constabulary': 'Hampshire',
  'dyfed-powys police': 'Dyfed-Powys',
  'north wales police': 'North Wales',
  'suffolk constabulary': 'Suffolk',
  'leicestershire police': 'Leicestershire',
  'sussex police': 'Sussex',
  'avon and somerset constabulary': 'Avon and Somerset',
  'durham constabulary': 'County Durham',
  'dorset police': 'Dorset',
  'gwent police': 'Gwent',
  'northamptonshire police': 'Northamptonshire',
  'bedfordshire police': 'Bedfordshire',
  'surrey police': 'Surrey',
  'wiltshire police': 'Wiltshire',
  'gloucestershire constabulary': 'Gloucestershire',
  'warwickshire police': 'Warwickshire',
  'cleveland police': 'Cleveland',
  'british transport police': 'British Transport Police',
  'ministry of defence police': 'Ministry of Defence',
  'civil nuclear constabulary': 'Civil Nuclear',
};

/** Strip the force suffix to fall back to a county-ish label. */
function stripForceSuffix(force: string): string {
  return force
    .replace(/\b(police|constabulary|service)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Derive a county/grouping label for a station. Prefers an existing `county`
 * value, then a curated force map, then a stripped force name, then "Other".
 */
export function deriveStationCounty(station: PoliceStation): string {
  const existing = (station.county || '').trim();
  if (existing) return existing;

  const force = (station.forceName || '').trim();
  if (force) {
    const mapped = FORCE_TO_COUNTY[force.toLowerCase()];
    if (mapped) return mapped;
    const stripped = stripForceSuffix(force);
    if (stripped) return stripped;
  }

  return 'Other';
}

/** Returns a copy with `county` populated when it was missing. */
export function withDerivedCounty(station: PoliceStation): PoliceStation {
  if ((station.county || '').trim()) return station;
  return { ...station, county: deriveStationCounty(station) };
}

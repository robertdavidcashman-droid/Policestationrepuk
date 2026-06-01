import type { PoliceStation } from '@/lib/types';
import { getKV, skipKVInPrerender } from '@/lib/kv';

/**
 * Approved community corrections to station address / phone data, stored in KV
 * so they take effect without redeploying `data/stations.json`. Each override
 * is keyed by the station id and merged into `getAllStations()` at request time
 * (and after ISR), closing the loop on the "community-maintained" promise.
 */

const OVERRIDE_PREFIX = 'stationoverride:';
const PENDING_PREFIX = 'stationpending:';

export interface StationOverrideFields {
  address?: string;
  postcode?: string;
  phone?: string;
  custodyPhone?: string;
  custodyPhone2?: string;
  nonEmergencyPhone?: string;
}

export interface StationOverride {
  stationId: string;
  fields: StationOverrideFields;
  updatedAt: string;
  approvedBy?: string;
  submissionId?: string;
}

export interface PendingStationUpdate {
  id: string;
  stationId: string;
  stationName: string;
  fields: StationOverrideFields;
  notes?: string;
  submitterName?: string;
  submitterEmail?: string;
  submittedAt: string;
}

const OVERRIDE_FIELD_KEYS: (keyof StationOverrideFields)[] = [
  'address',
  'postcode',
  'phone',
  'custodyPhone',
  'custodyPhone2',
  'nonEmergencyPhone',
];

function cleanFields(input: StationOverrideFields): StationOverrideFields {
  const out: StationOverrideFields = {};
  for (const key of OVERRIDE_FIELD_KEYS) {
    const v = input[key];
    if (typeof v === 'string' && v.trim()) out[key] = v.trim();
  }
  return out;
}

/* ------------------------------------------------------------------ */
/*  Cache                                                              */
/* ------------------------------------------------------------------ */

let _overrides: Map<string, StationOverride> | null = null;
let _overridesAt = 0;
const OVERRIDES_CACHE_MS =
  Math.max(30, Number(process.env.STATION_OVERRIDES_TTL_SECONDS) || 300) * 1000;

export function invalidateStationOverridesCache(): void {
  _overrides = null;
  _overridesAt = 0;
}

async function loadStationOverrides(): Promise<Map<string, StationOverride>> {
  const now = Date.now();
  if (_overrides && now - _overridesAt < OVERRIDES_CACHE_MS) return _overrides;
  if (skipKVInPrerender()) {
    if (!_overrides) {
      _overrides = new Map();
      _overridesAt = now;
    }
    return _overrides;
  }
  _overrides = new Map();
  _overridesAt = now;
  const kv = getKV();
  if (!kv) return _overrides;
  try {
    const keys = await kv.keys(`${OVERRIDE_PREFIX}*`);
    if (keys.length === 0) return _overrides;
    const pipeline = kv.pipeline();
    for (const key of keys) pipeline.get(key);
    const results = await pipeline.exec<(StationOverride | null)[]>();
    for (const row of results) {
      if (row && typeof row === 'object' && typeof row.stationId === 'string') {
        _overrides.set(row.stationId, row);
      }
    }
  } catch (err) {
    console.error('[station-overrides] failed to load from KV:', err);
  }
  return _overrides;
}

/* ------------------------------------------------------------------ */
/*  Merge helpers                                                      */
/* ------------------------------------------------------------------ */

export function applyStationOverride(
  station: PoliceStation,
  override: StationOverride | undefined,
): PoliceStation {
  if (!override) return station;
  const f = override.fields;
  return {
    ...station,
    ...(f.address ? { address: f.address } : {}),
    ...(f.postcode ? { postcode: f.postcode } : {}),
    ...(f.phone ? { phone: f.phone } : {}),
    ...(f.custodyPhone ? { custodyPhone: f.custodyPhone } : {}),
    ...(f.custodyPhone2 ? { custodyPhone2: f.custodyPhone2 } : {}),
    ...(f.nonEmergencyPhone ? { nonEmergencyPhone: f.nonEmergencyPhone } : {}),
  };
}

/** Apply all approved overrides to a list of stations. */
export async function applyStationOverrides(
  stations: PoliceStation[],
): Promise<PoliceStation[]> {
  const overrides = await loadStationOverrides();
  if (overrides.size === 0) return stations;
  return stations.map((s) => applyStationOverride(s, overrides.get(s.id)));
}

/* ------------------------------------------------------------------ */
/*  Admin writes                                                       */
/* ------------------------------------------------------------------ */

export async function saveStationOverride(
  stationId: string,
  fields: StationOverrideFields,
  meta: { approvedBy?: string; submissionId?: string } = {},
): Promise<StationOverride> {
  const kv = getKV();
  if (!kv) throw new Error('KV not configured');
  const cleaned = cleanFields(fields);
  if (Object.keys(cleaned).length === 0) {
    throw new Error('No valid fields to save');
  }
  const existing = await kv.get<StationOverride>(`${OVERRIDE_PREFIX}${stationId}`);
  const record: StationOverride = {
    stationId,
    fields: { ...(existing?.fields ?? {}), ...cleaned },
    updatedAt: new Date().toISOString(),
    approvedBy: meta.approvedBy ?? existing?.approvedBy,
    submissionId: meta.submissionId ?? existing?.submissionId,
  };
  await kv.set(`${OVERRIDE_PREFIX}${stationId}`, record);
  invalidateStationOverridesCache();
  return record;
}

export async function deleteStationOverride(stationId: string): Promise<void> {
  const kv = getKV();
  if (!kv) throw new Error('KV not configured');
  await kv.del(`${OVERRIDE_PREFIX}${stationId}`);
  invalidateStationOverridesCache();
}

export async function getAllStationOverrides(): Promise<StationOverride[]> {
  const map = await loadStationOverrides();
  return [...map.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/* ------------------------------------------------------------------ */
/*  Pending submission queue (KV mirror of the public form)            */
/* ------------------------------------------------------------------ */

export async function savePendingStationUpdate(
  pending: PendingStationUpdate,
): Promise<void> {
  const kv = getKV();
  if (!kv) return; // pending queue is best-effort; email + Supabase still capture it
  try {
    await kv.set(`${PENDING_PREFIX}${pending.id}`, pending);
  } catch (err) {
    console.error('[station-overrides] failed to save pending update:', err);
  }
}

export async function getPendingStationUpdates(): Promise<PendingStationUpdate[]> {
  if (skipKVInPrerender()) return [];
  const kv = getKV();
  if (!kv) return [];
  try {
    const keys = await kv.keys(`${PENDING_PREFIX}*`);
    if (keys.length === 0) return [];
    const pipeline = kv.pipeline();
    for (const key of keys) pipeline.get(key);
    const results = await pipeline.exec<(PendingStationUpdate | null)[]>();
    return results
      .filter((r): r is PendingStationUpdate => Boolean(r && typeof r === 'object'))
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  } catch (err) {
    console.error('[station-overrides] failed to load pending updates:', err);
    return [];
  }
}

export async function deletePendingStationUpdate(id: string): Promise<void> {
  const kv = getKV();
  if (!kv) return;
  try {
    await kv.del(`${PENDING_PREFIX}${id}`);
  } catch (err) {
    console.error('[station-overrides] failed to delete pending update:', err);
  }
}

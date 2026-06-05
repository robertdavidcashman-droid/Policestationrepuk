/**
 * KV persistence + orchestration for rep-contributed custody numbers.
 * Modelled on lib/station-overrides.ts (direct getKV + key scans).
 *
 * Keys:
 *   custodytip:{id}                — a single CustodyTip
 *   custodytip:station:{stationId} — string[] of tip ids for a station
 *   custodytip:rep:{email}         — string[] of tip ids by a rep
 *   custodyconsensus:{stationId}   — derived CustodyConsensus overlay
 *
 * When a number reaches `verified` we also write a station override so it shows
 * on the live site through the existing override pipeline.
 */

import crypto from 'crypto';
import { getKV, skipKVInPrerender } from '@/lib/kv';
import { normalizePhoneDigits } from '@/lib/phone-format';
import { saveStationOverride, deleteStationOverride } from '@/lib/station-overrides';
import { computeConsensus, mergeConsensus } from './corroboration';
import type { CustodyConsensus, CustodyTip, CustodyTipSource } from './types';

const TIP_PREFIX = 'custodytip:';
const STATION_INDEX = `${TIP_PREFIX}station:`;
const REP_INDEX = `${TIP_PREFIX}rep:`;
const CONSENSUS_PREFIX = 'custodyconsensus:';

function tipKey(id: string): string {
  return `${TIP_PREFIX}${id}`;
}
function stationIndexKey(stationId: string): string {
  return `${STATION_INDEX}${stationId}`;
}
function repIndexKey(email: string): string {
  return `${REP_INDEX}${email.toLowerCase()}`;
}
function consensusKey(stationId: string): string {
  return `${CONSENSUS_PREFIX}${stationId}`;
}

function newId(): string {
  return `ct_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;
}

async function readIndex(key: string): Promise<string[]> {
  const kv = getKV();
  if (!kv) return [];
  const raw = await kv.get<string[]>(key);
  return Array.isArray(raw) ? raw : [];
}

async function appendIndex(key: string, id: string): Promise<void> {
  const kv = getKV();
  if (!kv) return;
  const ids = await readIndex(key);
  if (!ids.includes(id)) {
    ids.push(id);
    await kv.set(key, ids);
  }
}

export async function getTip(id: string): Promise<CustodyTip | null> {
  const kv = getKV();
  if (!kv) return null;
  return (await kv.get<CustodyTip>(tipKey(id))) ?? null;
}

async function getTipsByIds(ids: string[]): Promise<CustodyTip[]> {
  const kv = getKV();
  if (!kv || ids.length === 0) return [];
  const pipeline = kv.pipeline();
  for (const id of ids) pipeline.get(tipKey(id));
  const rows = await pipeline.exec<(CustodyTip | null)[]>();
  return rows.filter((r): r is CustodyTip => Boolean(r && typeof r === 'object'));
}

export async function getTipsForStation(stationId: string): Promise<CustodyTip[]> {
  return getTipsByIds(await readIndex(stationIndexKey(stationId)));
}

export async function getTipsForRep(email: string): Promise<CustodyTip[]> {
  return getTipsByIds(await readIndex(repIndexKey(email)));
}

async function saveTip(tip: CustodyTip): Promise<void> {
  const kv = getKV();
  if (!kv) throw new Error('KV not configured');
  await kv.set(tipKey(tip.id), tip);
}

export async function getConsensus(stationId: string): Promise<CustodyConsensus | null> {
  const kv = getKV();
  if (!kv) return null;
  return (await kv.get<CustodyConsensus>(consensusKey(stationId))) ?? null;
}

async function saveConsensus(consensus: CustodyConsensus): Promise<void> {
  const kv = getKV();
  if (!kv) return;
  await kv.set(consensusKey(consensus.stationId), consensus);
}

export interface RecordTipInput {
  stationId: string;
  stationSlug: string;
  stationName: string;
  /** Already-validated display number. */
  number: string;
  repEmail: string;
  repName?: string;
  source: CustodyTipSource;
  submitterIp?: string;
  /** Existing custody number on file (stations.json) for the official-match path. */
  officialNumber?: string;
}

export interface RecordTipResult {
  tip: CustodyTip;
  consensus: CustodyConsensus;
  /** True when this submission caused/maintained a verified number. */
  verified: boolean;
  /** True when this submission newly created a rep disagreement on numbers. */
  conflictNew: boolean;
}

/**
 * Record a rep's custody-number submission, enforcing one vote per rep per
 * station, recompute the consensus, and (when verified) publish via override.
 */
export async function recordTip(input: RecordTipInput): Promise<RecordTipResult> {
  const kv = getKV();
  if (!kv) throw new Error('KV not configured');

  const repEmail = input.repEmail.toLowerCase();
  const numberDigits = normalizePhoneDigits(input.number);
  const now = new Date();
  const nowIso = now.toISOString();

  const existing = await getTipsForStation(input.stationId);
  const repPrior = existing.filter((t) => t.repEmail === repEmail && t.status === 'active');

  let tip: CustodyTip;
  const sameNumber = repPrior.find((t) => t.numberDigits === numberDigits);

  if (sameNumber) {
    // Re-confirmation of the same number: refresh timestamp (drives renewal).
    tip = { ...sameNumber, createdAt: nowIso, source: input.source };
    await saveTip(tip);
  } else {
    // Correction: supersede the rep's prior active tips for this station.
    for (const prior of repPrior) {
      await saveTip({ ...prior, status: 'superseded' });
    }
    tip = {
      id: newId(),
      stationId: input.stationId,
      stationSlug: input.stationSlug,
      stationName: input.stationName,
      number: input.number,
      numberDigits,
      repEmail,
      repName: input.repName,
      createdAt: nowIso,
      status: 'active',
      source: input.source,
      submitterIp: input.submitterIp,
    };
    await saveTip(tip);
    await appendIndex(stationIndexKey(input.stationId), tip.id);
    await appendIndex(repIndexKey(repEmail), tip.id);
  }

  // Recompute consensus from the full, updated tip set.
  const refreshed = await getTipsForStation(input.stationId);
  const officialDigits = input.officialNumber
    ? normalizePhoneDigits(input.officialNumber)
    : undefined;
  const computed = computeConsensus(input.stationId, refreshed, officialDigits, now);
  const prevConsensus = await getConsensus(input.stationId);
  const consensus = mergeConsensus(prevConsensus, computed ?? fallbackConsensus(input, numberDigits, nowIso));
  await saveConsensus(consensus);

  // Publish verified numbers to the live site via the override pipeline.
  if (consensus.status === 'verified') {
    try {
      await saveStationOverride(
        input.stationId,
        { custodyPhone: consensus.number },
        { submissionId: tip.id, approvedBy: 'rep-corroboration' },
      );
    } catch (err) {
      console.error('[custody-tips] failed to write station override:', err);
    }
  }

  return {
    tip,
    consensus,
    verified: consensus.status === 'verified',
    conflictNew: Boolean(consensus.conflict && !prevConsensus?.conflict),
  };
}

function fallbackConsensus(
  input: RecordTipInput,
  numberDigits: string,
  nowIso: string,
): CustodyConsensus {
  return {
    stationId: input.stationId,
    number: input.number,
    numberDigits,
    status: 'unverified',
    confirmedBy: 1,
    contributors: [input.repEmail.toLowerCase()],
    conflict: false,
    dateVerified: null,
    lastSubmittedAt: nowIso,
    updatedAt: nowIso,
  };
}

/* ------------------------------------------------------------------ */
/*  Consensus overlay (loaded into the data layer at request time)     */
/* ------------------------------------------------------------------ */

let _consensus: Map<string, CustodyConsensus> | null = null;
let _consensusAt = 0;
const CONSENSUS_CACHE_MS =
  Math.max(30, Number(process.env.CUSTODY_CONSENSUS_TTL_SECONDS) || 300) * 1000;

export function invalidateCustodyConsensusCache(): void {
  _consensus = null;
  _consensusAt = 0;
}

/** Load every consensus record keyed by stationId (for the station data merge). */
export async function loadAllCustodyConsensus(): Promise<Map<string, CustodyConsensus>> {
  const now = Date.now();
  if (_consensus && now - _consensusAt < CONSENSUS_CACHE_MS) return _consensus;
  if (skipKVInPrerender()) {
    if (!_consensus) {
      _consensus = new Map();
      _consensusAt = now;
    }
    return _consensus;
  }
  _consensus = new Map();
  _consensusAt = now;
  const kv = getKV();
  if (!kv) return _consensus;
  try {
    const keys = await kv.keys(`${CONSENSUS_PREFIX}*`);
    if (keys.length === 0) return _consensus;
    const pipeline = kv.pipeline();
    for (const key of keys) pipeline.get(key);
    const rows = await pipeline.exec<(CustodyConsensus | null)[]>();
    for (const row of rows) {
      if (row && typeof row === 'object' && typeof row.stationId === 'string') {
        _consensus.set(row.stationId, row);
      }
    }
  } catch (err) {
    console.error('[custody-tips] failed to load consensus from KV:', err);
  }
  return _consensus;
}

/* ------------------------------------------------------------------ */
/*  Admin                                                              */
/* ------------------------------------------------------------------ */

export async function getAllTips(): Promise<CustodyTip[]> {
  if (skipKVInPrerender()) return [];
  const kv = getKV();
  if (!kv) return [];
  try {
    const keys = await kv.keys(`${TIP_PREFIX}*`);
    const tipIds = keys.filter(
      (k) => !k.startsWith(STATION_INDEX) && !k.startsWith(REP_INDEX),
    );
    return getTipsByIds(tipIds.map((k) => k.slice(TIP_PREFIX.length)));
  } catch (err) {
    console.error('[custody-tips] failed to load all tips:', err);
    return [];
  }
}

/** Distinct stations a rep currently has an active tip for (reward counting). */
export async function countRepActiveStations(email: string): Promise<number> {
  const tips = await getTipsForRep(email);
  const stations = new Set(
    tips.filter((t) => t.status === 'active').map((t) => t.stationId),
  );
  return stations.size;
}

/** Fresh (uncached) scan of all consensus records — for the admin queue. */
export async function getAllConsensusRecords(): Promise<CustodyConsensus[]> {
  if (skipKVInPrerender()) return [];
  const kv = getKV();
  if (!kv) return [];
  try {
    const keys = await kv.keys(`${CONSENSUS_PREFIX}*`);
    if (keys.length === 0) return [];
    const pipeline = kv.pipeline();
    for (const key of keys) pipeline.get(key);
    const rows = await pipeline.exec<(CustodyConsensus | null)[]>();
    return rows
      .filter((r): r is CustodyConsensus => Boolean(r && typeof r === 'object'))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch (err) {
    console.error('[custody-tips] failed to scan consensus records:', err);
    return [];
  }
}

/** Admin: force a station's consensus number to verified and publish it. */
export async function adminVerifyConsensus(
  stationId: string,
  approvedBy: string,
): Promise<CustodyConsensus | null> {
  const consensus = await getConsensus(stationId);
  if (!consensus) return null;
  const verified: CustodyConsensus = {
    ...consensus,
    status: 'verified',
    conflict: false,
    dateVerified: consensus.dateVerified ?? new Date().toISOString().slice(0, 10),
    updatedAt: new Date().toISOString(),
  };
  await saveConsensus(verified);
  try {
    await saveStationOverride(
      stationId,
      { custodyPhone: verified.number },
      { approvedBy },
    );
  } catch (err) {
    console.error('[custody-tips] admin verify override failed:', err);
  }
  invalidateCustodyConsensusCache();
  return verified;
}

/** Admin: reject a station's contributed number — clears tips, consensus and override. */
export async function adminRejectStation(stationId: string): Promise<void> {
  const kv = getKV();
  if (!kv) throw new Error('KV not configured');
  const tips = await getTipsForStation(stationId);
  for (const tip of tips) {
    if (tip.status === 'active') await saveTip({ ...tip, status: 'rejected' });
  }
  await kv.del(consensusKey(stationId));
  try {
    await deleteStationOverride(stationId);
  } catch (err) {
    console.error('[custody-tips] admin reject override delete failed:', err);
  }
  invalidateCustodyConsensusCache();
}

import crypto from 'crypto';
import { getKV, skipKVInPrerender } from '@/lib/kv';
import type {
  ApprovedCustodyNumber,
  CustodyNumberFinding,
  CustodySuite,
  FindingStatus,
} from './types';

const SUITE_PREFIX = 'custodysuite:';
const SUITE_INDEX = 'custodysuite:index';
const FINDING_PREFIX = 'custodyfinding:';
const FINDING_SUITE_INDEX = 'custodyfinding:suite:';
const FINDING_HASH_INDEX = 'custodyfinding:hash:';
const APPROVED_PREFIX = 'approvedcustody:';

function suiteKey(id: string): string {
  return `${SUITE_PREFIX}${id}`;
}
function findingKey(id: string): string {
  return `${FINDING_PREFIX}${id}`;
}
function suiteFindingIndex(suiteId: string): string {
  return `${FINDING_SUITE_INDEX}${suiteId}`;
}
function hashKey(hash: string): string {
  return `${FINDING_HASH_INDEX}${hash}`;
}
function approvedKey(suiteId: string): string {
  return `${APPROVED_PREFIX}${suiteId}`;
}

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;
}

async function readStringList(key: string): Promise<string[]> {
  const kv = getKV();
  if (!kv) return [];
  const raw = await kv.get<string[]>(key);
  return Array.isArray(raw) ? raw : [];
}

async function appendIndex(key: string, id: string): Promise<void> {
  const kv = getKV();
  if (!kv) return;
  const ids = await readStringList(key);
  if (!ids.includes(id)) {
    ids.push(id);
    await kv.set(key, ids);
  }
}

/* ------------------------------------------------------------------ */
/*  Custody suites                                                     */
/* ------------------------------------------------------------------ */

export async function saveCustodySuite(suite: CustodySuite): Promise<void> {
  const kv = getKV();
  if (!kv) throw new Error('KV not configured');
  await kv.set(suiteKey(suite.id), suite);
  await appendIndex(SUITE_INDEX, suite.id);
}

export async function getCustodySuite(id: string): Promise<CustodySuite | null> {
  const kv = getKV();
  if (!kv) return null;
  return (await kv.get<CustodySuite>(suiteKey(id))) ?? null;
}

export async function getAllCustodySuites(): Promise<CustodySuite[]> {
  if (skipKVInPrerender()) return [];
  const kv = getKV();
  if (!kv) return [];
  const ids = await readStringList(SUITE_INDEX);
  if (ids.length === 0) return [];
  const pipeline = kv.pipeline();
  for (const id of ids) pipeline.get(suiteKey(id));
  const rows = await pipeline.exec<(CustodySuite | null)[]>();
  return rows.filter((r): r is CustodySuite => Boolean(r && typeof r === 'object'));
}

export async function bootstrapCustodySuites(suites: CustodySuite[]): Promise<number> {
  const kv = getKV();
  if (!kv) return 0;

  const existingIds = new Set(await readStringList(SUITE_INDEX));
  const missing = suites.filter((s) => !existingIds.has(s.id));

  // Fast path — full directory already in KV (skip ~900 round-trips per cron run).
  if (missing.length === 0 && existingIds.size >= suites.length) {
    return suites.length;
  }

  const now = new Date().toISOString();
  const pipeline = kv.pipeline();
  const indexIds = [...existingIds];

  for (const suite of missing) {
    pipeline.set(suiteKey(suite.id), suite);
    if (!indexIds.includes(suite.id)) indexIds.push(suite.id);
  }

  if (missing.length > 0) {
    pipeline.set(SUITE_INDEX, indexIds);
    await pipeline.exec();
  }

  return suites.length;
}

/* ------------------------------------------------------------------ */
/*  Findings                                                           */
/* ------------------------------------------------------------------ */

export async function getFinding(id: string): Promise<CustodyNumberFinding | null> {
  const kv = getKV();
  if (!kv) return null;
  return (await kv.get<CustodyNumberFinding>(findingKey(id))) ?? null;
}

export async function getFindingByHash(hash: string): Promise<CustodyNumberFinding | null> {
  const kv = getKV();
  if (!kv) return null;
  const id = await kv.get<string>(hashKey(hash));
  if (!id) return null;
  return getFinding(id);
}

export async function getFindingsForSuite(suiteId: string): Promise<CustodyNumberFinding[]> {
  const kv = getKV();
  if (!kv) return [];
  const ids = await readStringList(suiteFindingIndex(suiteId));
  if (ids.length === 0) return [];
  const pipeline = kv.pipeline();
  for (const id of ids) pipeline.get(findingKey(id));
  const rows = await pipeline.exec<(CustodyNumberFinding | null)[]>();
  return rows.filter((r): r is CustodyNumberFinding => Boolean(r && typeof r === 'object'));
}

export async function getAllFindings(): Promise<CustodyNumberFinding[]> {
  if (skipKVInPrerender()) return [];
  const kv = getKV();
  if (!kv) return [];
  try {
    const keys = await kv.keys(`${FINDING_PREFIX}*`);
    const findingIds = keys.filter((k) => !k.startsWith(FINDING_SUITE_INDEX) && !k.startsWith(FINDING_HASH_INDEX));
    if (findingIds.length === 0) return [];
    const pipeline = kv.pipeline();
    for (const key of findingIds) pipeline.get(key);
    const rows = await pipeline.exec<(CustodyNumberFinding | null)[]>();
    return rows
      .filter((r): r is CustodyNumberFinding => Boolean(r && typeof r === 'object'))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch (err) {
    console.error('[custody-discovery] failed to load findings:', err);
    return [];
  }
}

export async function saveFinding(finding: CustodyNumberFinding): Promise<void> {
  const kv = getKV();
  if (!kv) throw new Error('KV not configured');
  await kv.set(findingKey(finding.id), finding);
  await appendIndex(suiteFindingIndex(finding.custodySuiteId), finding.id);
  await kv.set(hashKey(finding.hashOfSourceEvidence), finding.id);
}

export async function updateFindingStatus(
  id: string,
  status: FindingStatus,
  notes?: string,
): Promise<CustodyNumberFinding | null> {
  const finding = await getFinding(id);
  if (!finding) return null;
  const updated: CustodyNumberFinding = {
    ...finding,
    status,
    notes: notes ?? finding.notes,
    updatedAt: new Date().toISOString(),
  };
  await saveFinding(updated);
  return updated;
}

/* ------------------------------------------------------------------ */
/*  Approved numbers                                                   */
/* ------------------------------------------------------------------ */

export async function getApprovedNumber(suiteId: string): Promise<ApprovedCustodyNumber | null> {
  const kv = getKV();
  if (!kv) return null;
  return (await kv.get<ApprovedCustodyNumber>(approvedKey(suiteId))) ?? null;
}

export async function saveApprovedNumber(record: ApprovedCustodyNumber): Promise<void> {
  const kv = getKV();
  if (!kv) throw new Error('KV not configured');
  await kv.set(approvedKey(record.custodySuiteId), record);
}

export async function loadAllApprovedNumbers(): Promise<Map<string, ApprovedCustodyNumber>> {
  const map = new Map<string, ApprovedCustodyNumber>();
  if (skipKVInPrerender()) return map;
  const kv = getKV();
  if (!kv) return map;
  try {
    const keys = await kv.keys(`${APPROVED_PREFIX}*`);
    if (keys.length === 0) return map;
    const pipeline = kv.pipeline();
    for (const key of keys) pipeline.get(key);
    const rows = await pipeline.exec<(ApprovedCustodyNumber | null)[]>();
    for (const row of rows) {
      if (row && typeof row === 'object' && row.custodySuiteId) {
        map.set(row.custodySuiteId, row);
      }
    }
  } catch (err) {
    console.error('[custody-discovery] failed to load approved numbers:', err);
  }
  return map;
}

import { resolveApprovalVerificationStatus } from './verification';
import { toE164Uk } from '@/lib/phone-format';
import type { ApprovalAuditEntry } from './types';

const AUDIT_LOG_MAX_ENTRIES = 50;

export function appendAuditEntry(
  record: ApprovedCustodyNumber,
  entry: Omit<ApprovalAuditEntry, 'at'>,
): ApprovedCustodyNumber {
  const auditLog = [...(record.auditLog ?? []), { ...entry, at: new Date().toISOString() }];
  return { ...record, auditLog: auditLog.slice(-AUDIT_LOG_MAX_ENTRIES) };
}

export async function approveFinding(
  findingId: string,
  approvedBy: string,
  opts?: { notes?: string; markVerified?: boolean },
): Promise<{ finding: CustodyNumberFinding; approved: ApprovedCustodyNumber } | null> {
  const finding = await getFinding(findingId);
  if (!finding) return null;

  const now = new Date().toISOString();
  const verificationStatus = resolveApprovalVerificationStatus(finding, opts?.markVerified);
  const approvedFinding: CustodyNumberFinding = {
    ...finding,
    status: 'approved',
    notes: opts?.notes ?? finding.notes,
    updatedAt: now,
  };
  await saveFinding(approvedFinding);

  const suite = await getCustodySuite(finding.custodySuiteId);
  const isAi = approvedBy === 'ai-reviewer';
  const approved: ApprovedCustodyNumber = appendAuditEntry(
    {
      id: newId('acn'),
      custodySuiteId: finding.custodySuiteId,
      stationSlug: suite?.stationSlug,
      phoneNumber: finding.possiblePhoneNumber,
      normalizedPhoneNumber: finding.normalizedPhoneNumber,
      e164: finding.e164 ?? toE164Uk(finding.normalizedPhoneNumber),
      sourceFindingId: finding.id,
      sourceUrl: finding.sourceUrl,
      approvedBy,
      approvedAt: now,
      lastVerifiedAt: verificationStatus === 'verified' ? now : '',
      verificationStatus,
      publicVisible: true,
      notes: opts?.notes ?? '',
    },
    {
      actor: approvedBy,
      action: isAi ? 'auto_approved' : 'approved',
      detail: `source: ${finding.sourceUrl} · score ${finding.confidenceScore} (${finding.confidenceLevel}) · ${finding.sourceType}`,
    },
  );
  await saveApprovedNumber(approved);
  invalidateApprovedCache();
  return { finding: approvedFinding, approved };
}

export async function markApprovedAsVerified(
  custodySuiteId: string,
  verifiedBy: string,
): Promise<ApprovedCustodyNumber | null> {
  const approved = await getApprovedNumber(custodySuiteId);
  if (!approved) return null;
  const now = new Date().toISOString();
  const updated: ApprovedCustodyNumber = appendAuditEntry(
    {
      ...approved,
      verificationStatus: 'verified',
      lastVerifiedAt: now,
      notes: approved.notes || `Marked verified by ${verifiedBy}`,
    },
    { actor: verifiedBy, action: 'marked_verified' },
  );
  await saveApprovedNumber(updated);
  invalidateApprovedCache();
  return updated;
}

export async function revokeApproval(custodySuiteId: string): Promise<void> {
  const kv = getKV();
  if (!kv) return;
  await kv.del(approvedKey(custodySuiteId));
  invalidateApprovedCache();
}

export async function rejectFinding(findingId: string, notes?: string): Promise<CustodyNumberFinding | null> {
  const finding = await getFinding(findingId);
  if (!finding) return null;
  if (finding.status === 'approved') {
    await revokeApproval(finding.custodySuiteId);
  }
  return updateFindingStatus(findingId, 'rejected', notes);
}

export async function markFindingStale(findingId: string, notes?: string): Promise<CustodyNumberFinding | null> {
  return updateFindingStatus(findingId, 'stale', notes);
}

/* ------------------------------------------------------------------ */
/*  Cache for public overlay                                           */
/* ------------------------------------------------------------------ */

let _approvedCache: Map<string, ApprovedCustodyNumber> | null = null;
let _approvedAt = 0;
const APPROVED_CACHE_MS = Math.max(60, Number(process.env.CUSTODY_DISCOVERY_CACHE_SECONDS) || 300) * 1000;

export function invalidateApprovedCache(): void {
  _approvedCache = null;
  _approvedAt = 0;
}

export async function getApprovedCache(): Promise<Map<string, ApprovedCustodyNumber>> {
  const now = Date.now();
  if (_approvedCache && now - _approvedAt < APPROVED_CACHE_MS) return _approvedCache;
  _approvedCache = await loadAllApprovedNumbers();
  _approvedAt = now;
  return _approvedCache;
}

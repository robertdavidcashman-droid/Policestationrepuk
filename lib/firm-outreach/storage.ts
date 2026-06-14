import crypto from 'crypto';
import { getKV, skipKVInPrerender } from '@/lib/kv';
import { emailHash, normalizeEmail } from './normalize';
import type {
  FirmOutreachSend,
  FirmOutreachSendStatus,
  FirmOutreachSuppression,
  FirmProspect,
  FirmProspectStatus,
  SuppressionReason,
} from './types';

const PROSPECT_PREFIX = 'firmprospect:';
const PROSPECT_INDEX = 'firmprospect:index';
const PROSPECT_STATUS_INDEX = 'firmprospect:status:';
const PROSPECT_EMAIL_INDEX = 'firmprospect:email:';
const PROSPECT_FIRM_INDEX = 'firmprospect:firm:';
const SEND_PREFIX = 'firmoutreach:send:';
const SEND_INDEX = 'firmoutreach:send:index';
const SEND_RESEND_INDEX = 'firmoutreach:send:resend:';
const SEND_EMAIL_INDEX = 'firmoutreach:send:email:';
const SUPPRESSION_INDEX = 'firmoutreach:suppression:index';
const SEND_DAILY_PREFIX = 'firmoutreach:daily:';
const SUPPRESSION_PREFIX = 'firmoutreach:suppression:';
const CURSOR_ENRICH = 'firmoutreach:cursor:enrich';
const CURSOR_SEND = 'firmoutreach:cursor:send';
const PAID_DAILY_PREFIX = 'firmoutreach:paid:';

function prospectKey(id: string): string {
  return `${PROSPECT_PREFIX}${id}`;
}

function statusIndexKey(status: FirmProspectStatus): string {
  return `${PROSPECT_STATUS_INDEX}${status}`;
}

function sendKey(id: string): string {
  return `${SEND_PREFIX}${id}`;
}

function dailySendKey(date: string): string {
  return `${SEND_DAILY_PREFIX}${date}`;
}

function paidDailyKey(date: string): string {
  return `${PAID_DAILY_PREFIX}${date}`;
}

function newSendId(): string {
  return `fos_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;
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

async function removeFromIndex(key: string, id: string): Promise<void> {
  const kv = getKV();
  if (!kv) return;
  const ids = await readStringList(key);
  const next = ids.filter((x) => x !== id);
  if (next.length !== ids.length) await kv.set(key, next);
}

export async function saveProspect(prospect: FirmProspect, previousStatus?: FirmProspectStatus): Promise<void> {
  const kv = getKV();
  if (!kv) throw new Error('KV not configured');
  const existing = await getProspect(prospect.id);
  const oldStatus = previousStatus ?? existing?.status;
  await kv.set(prospectKey(prospect.id), prospect);
  await appendIndex(PROSPECT_INDEX, prospect.id);
  await appendIndex(statusIndexKey(prospect.status), prospect.id);
  await appendIndex(PROSPECT_FIRM_INDEX + prospect.firmKey, prospect.id);
  if (prospect.email) {
    await kv.set(PROSPECT_EMAIL_INDEX + emailHash(prospect.email), prospect.id);
  }
  if (oldStatus && oldStatus !== prospect.status) {
    await removeFromIndex(statusIndexKey(oldStatus), prospect.id);
  }
}

export async function getProspect(id: string): Promise<FirmProspect | null> {
  const kv = getKV();
  if (!kv) return null;
  return (await kv.get<FirmProspect>(prospectKey(id))) ?? null;
}

const MGET_CHUNK = 100;

/** Batch-fetch prospects by id (Upstash mget, chunked). */
export async function getProspectsByIds(ids: string[]): Promise<Map<string, FirmProspect>> {
  const kv = getKV();
  const map = new Map<string, FirmProspect>();
  if (!kv || ids.length === 0) return map;

  const unique = [...new Set(ids)];
  for (let i = 0; i < unique.length; i += MGET_CHUNK) {
    const chunk = unique.slice(i, i + MGET_CHUNK);
    const keys = chunk.map((id) => prospectKey(id));
    const values = await kv.mget<(FirmProspect | null)[]>(...keys);
    chunk.forEach((id, idx) => {
      const p = values[idx];
      if (p) map.set(id, p);
    });
  }
  return map;
}

/** Batch-fetch suppressions for send emails (Upstash mget, chunked). */
export async function getSuppressionsByEmails(
  emails: string[],
): Promise<Map<string, FirmOutreachSuppression>> {
  const kv = getKV();
  const map = new Map<string, FirmOutreachSuppression>();
  if (!kv || emails.length === 0) return map;

  const unique = [...new Set(emails.map((e) => normalizeEmail(e)))];
  for (let i = 0; i < unique.length; i += MGET_CHUNK) {
    const chunk = unique.slice(i, i + MGET_CHUNK);
    const keys = chunk.map((e) => SUPPRESSION_PREFIX + emailHash(e));
    const values = await kv.mget<(FirmOutreachSuppression | null)[]>(...keys);
    chunk.forEach((email, idx) => {
      const row = values[idx];
      if (row) map.set(email, row);
    });
  }
  return map;
}

export async function getProspectByEmail(email: string): Promise<FirmProspect | null> {
  const kv = getKV();
  if (!kv) return null;
  const id = await kv.get<string>(PROSPECT_EMAIL_INDEX + emailHash(email));
  if (!id) return null;
  return getProspect(id);
}

export async function listProspectIdsByStatus(status: FirmProspectStatus): Promise<string[]> {
  if (skipKVInPrerender()) return [];
  return readStringList(statusIndexKey(status));
}

export async function listAllProspectIds(): Promise<string[]> {
  if (skipKVInPrerender()) return [];
  return readStringList(PROSPECT_INDEX);
}

export async function listProspectsByStatus(status: FirmProspectStatus, limit = 500): Promise<FirmProspect[]> {
  const ids = (await listProspectIdsByStatus(status)).slice(0, limit);
  const out: FirmProspect[] = [];
  for (const id of ids) {
    const p = await getProspect(id);
    if (p) out.push(p);
  }
  return out;
}

export async function listProspectsForFirmKey(firmKey: string): Promise<FirmProspect[]> {
  const kv = getKV();
  if (!kv) return [];
  const ids = await readStringList(PROSPECT_FIRM_INDEX + firmKey);
  const out: FirmProspect[] = [];
  for (const id of ids) {
    const p = await getProspect(id);
    if (p) out.push(p);
  }
  return out;
}

export async function getCursor(key: typeof CURSOR_ENRICH | typeof CURSOR_SEND): Promise<number> {
  const kv = getKV();
  if (!kv) return 0;
  const val = await kv.get<number>(key);
  return typeof val === 'number' && val >= 0 ? val : 0;
}

export async function setCursor(key: typeof CURSOR_ENRICH | typeof CURSOR_SEND, value: number): Promise<void> {
  const kv = getKV();
  if (!kv) return;
  await kv.set(key, value);
}

export { CURSOR_ENRICH, CURSOR_SEND };

export async function saveSend(send: FirmOutreachSend): Promise<void> {
  const kv = getKV();
  if (!kv) throw new Error('KV not configured');
  await kv.set(sendKey(send.id), send);
  await appendIndex(SEND_INDEX, send.id);
  await appendIndex(SEND_EMAIL_INDEX + emailHash(send.email), send.id);
  if (send.resendMessageId) {
    await kv.set(SEND_RESEND_INDEX + send.resendMessageId, send.id);
  }
}

export async function getSend(id: string): Promise<FirmOutreachSend | null> {
  const kv = getKV();
  if (!kv) return null;
  return (await kv.get<FirmOutreachSend>(sendKey(id))) ?? null;
}

export async function listRecentSends(limit = 50): Promise<FirmOutreachSend[]> {
  const all = await listAllSends();
  return all.slice(0, limit);
}

export async function listAllSends(): Promise<FirmOutreachSend[]> {
  const kv = getKV();
  if (!kv) return [];
  const ids = [...(await readStringList(SEND_INDEX))].reverse();
  if (ids.length === 0) return [];

  const out: FirmOutreachSend[] = [];
  const BATCH = 100;
  for (let i = 0; i < ids.length; i += BATCH) {
    const batch = ids.slice(i, i + BATCH);
    const pipeline = kv.pipeline();
    for (const id of batch) pipeline.get(sendKey(id));
    const rows = await pipeline.exec<(FirmOutreachSend | null)[]>();
    for (const row of rows) {
      if (row && typeof row === 'object' && row.id) out.push(row);
    }
  }
  return out;
}

export async function findSendByResendMessageId(
  resendMessageId: string,
): Promise<FirmOutreachSend | null> {
  const kv = getKV();
  if (!kv) return null;
  const sendId = await kv.get<string>(SEND_RESEND_INDEX + resendMessageId);
  if (!sendId) return null;
  return getSend(sendId);
}

export async function listSendsForProspect(prospectId: string): Promise<FirmOutreachSend[]> {
  const all = await listAllSends();
  return all.filter((s) => s.prospectId === prospectId);
}

/** Sends recorded for a normalised email address (newest first). */
export async function listSendsForEmail(email: string): Promise<FirmOutreachSend[]> {
  const normalized = normalizeEmail(email);
  const ids = await readStringList(SEND_EMAIL_INDEX + emailHash(normalized));
  const out: FirmOutreachSend[] = [];
  for (const id of ids) {
    const s = await getSend(id);
    if (s && normalizeEmail(s.email) === normalized) out.push(s);
  }
  if (out.length > 0) {
    return out.sort((a, b) =>
      (b.sentAt ?? b.createdAt).localeCompare(a.sentAt ?? a.createdAt),
    );
  }

  // Fallback for sends recorded before per-email indexing.
  const all = await listAllSends();
  return all
    .filter((s) => normalizeEmail(s.email) === normalized)
    .sort((a, b) => (b.sentAt ?? b.createdAt).localeCompare(a.sentAt ?? a.createdAt));
}

/** True when another prospect already received the initial outreach at this email. */
export function emailHasInitialOutreachFromOtherProspect(
  sends: FirmOutreachSend[],
  email: string,
  prospectId: string,
): boolean {
  const normalized = normalizeEmail(email);
  return sends.some(
    (s) =>
      normalizeEmail(s.email) === normalized &&
      s.sequenceStep === 0 &&
      s.prospectId !== prospectId &&
      s.status !== 'bounced' &&
      s.status !== 'queued',
  );
}

/** True when another prospect already received the initial outreach at this email. */
export async function isDuplicateInitialSend(
  email: string,
  prospectId: string,
): Promise<boolean> {
  const sends = await listSendsForEmail(email);
  return emailHasInitialOutreachFromOtherProspect(sends, email, prospectId);
}

export async function excludeProspectDuplicateEmail(
  prospect: FirmProspect,
): Promise<FirmProspect> {
  const prevStatus = prospect.status;
  prospect.status = 'excluded';
  prospect.excludedReason = 'duplicate_email';
  prospect.updatedAt = new Date().toISOString();
  await saveProspect(prospect, prevStatus);
  return prospect;
}

const SEND_STATUS_RANK: Record<FirmOutreachSendStatus, number> = {
  queued: 0,
  sent: 1,
  delivered: 2,
  opened: 3,
  clicked: 4,
  bounced: 10,
  complained: 11,
};

export async function applySendWebhookEvent(opts: {
  resendMessageId?: string;
  email?: string;
  eventType: string;
  at?: string;
}): Promise<FirmOutreachSend | null> {
  const at = opts.at ?? new Date().toISOString();
  let send: FirmOutreachSend | null = null;

  if (opts.resendMessageId) {
    send = await findSendByResendMessageId(opts.resendMessageId);
  }
  if (!send && opts.email) {
    const prospect = await getProspectByEmail(opts.email);
    if (prospect) {
      const sends = await listSendsForProspect(prospect.id);
      send = sends[0] ?? null;
    }
  }
  if (!send) return null;

  const type = opts.eventType;
  if (type === 'email.delivered') {
    send.status = 'delivered';
    send.deliveredAt = send.deliveredAt ?? at;
  } else if (type === 'email.opened') {
    if (SEND_STATUS_RANK[send.status] < SEND_STATUS_RANK.opened) send.status = 'opened';
    send.openedAt = send.openedAt ?? at;
  } else if (type === 'email.clicked') {
    send.status = 'clicked';
    send.clickedAt = send.clickedAt ?? at;
  } else if (type === 'email.bounced') {
    send.status = 'bounced';
    send.bouncedAt = send.bouncedAt ?? at;
  } else if (type === 'email.complained') {
    send.status = 'complained';
    send.complainedAt = send.complainedAt ?? at;
  } else if (type === 'email.sent') {
    send.status = send.status === 'queued' ? 'sent' : send.status;
    send.sentAt = send.sentAt ?? at;
  }

  send.lastEventAt = at;
  await saveSend(send);
  return send;
}

export async function getDailySendCount(date: string): Promise<number> {
  const kv = getKV();
  if (!kv) return 0;
  const n = await kv.get<number>(dailySendKey(date));
  return typeof n === 'number' ? n : 0;
}

export async function incrementDailySendCount(date: string): Promise<number> {
  const kv = getKV();
  if (!kv) return 0;
  const key = dailySendKey(date);
  const current = (await kv.get<number>(key)) ?? 0;
  const next = current + 1;
  await kv.set(key, next, { ex: 60 * 60 * 24 * 3 });
  return next;
}

export async function getPaidLookupCount(date: string): Promise<number> {
  const kv = getKV();
  if (!kv) return 0;
  const n = await kv.get<number>(paidDailyKey(date));
  return typeof n === 'number' ? n : 0;
}

export async function incrementPaidLookupCount(date: string): Promise<number> {
  const kv = getKV();
  if (!kv) return 0;
  const key = paidDailyKey(date);
  const current = (await kv.get<number>(key)) ?? 0;
  const next = current + 1;
  await kv.set(key, next, { ex: 60 * 60 * 24 * 2 });
  return next;
}

export async function isSuppressed(email: string): Promise<boolean> {
  const kv = getKV();
  if (!kv) return false;
  const hit = await kv.get<FirmOutreachSuppression>(SUPPRESSION_PREFIX + emailHash(email));
  return Boolean(hit);
}

export async function addSuppression(
  email: string,
  reason: SuppressionReason,
): Promise<void> {
  const kv = getKV();
  if (!kv) return;
  const norm = normalizeEmail(email);
  const record: FirmOutreachSuppression = {
    emailHash: emailHash(norm),
    email: norm,
    reason,
    createdAt: new Date().toISOString(),
  };
  await kv.set(SUPPRESSION_PREFIX + record.emailHash, record);
  await appendIndex(SUPPRESSION_INDEX, record.emailHash);
}

export async function getSuppression(email: string): Promise<FirmOutreachSuppression | null> {
  const kv = getKV();
  if (!kv) return null;
  return (await kv.get<FirmOutreachSuppression>(SUPPRESSION_PREFIX + emailHash(email))) ?? null;
}

export async function listAllSuppressions(): Promise<FirmOutreachSuppression[]> {
  const kv = getKV();
  if (!kv) return [];
  const hashes = await readStringList(SUPPRESSION_INDEX);
  if (hashes.length === 0) return [];

  const out: FirmOutreachSuppression[] = [];
  for (let i = 0; i < hashes.length; i += MGET_CHUNK) {
    const chunk = hashes.slice(i, i + MGET_CHUNK);
    const keys = chunk.map((hash) => SUPPRESSION_PREFIX + hash);
    const values = await kv.mget<(FirmOutreachSuppression | null)[]>(...keys);
    for (const row of values) {
      if (row) out.push(row);
    }
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function markProspectWaClick(prospectId: string): Promise<void> {
  const prospect = await getProspect(prospectId);
  if (!prospect) return;
  const now = new Date().toISOString();
  prospect.waLinkClickedAt = now;
  prospect.updatedAt = now;
  await saveProspect(prospect);

  const sends = await listSendsForProspect(prospectId);
  if (sends[0]) {
    sends[0].status = 'clicked';
    sends[0].clickedAt = sends[0].clickedAt ?? now;
    sends[0].lastEventAt = now;
    await saveSend(sends[0]);
  }
}

export async function markProspectJoinedWhatsApp(prospectId: string): Promise<FirmProspect | null> {
  const prospect = await getProspect(prospectId);
  if (!prospect) return null;
  const prevStatus = prospect.status;
  const now = new Date().toISOString();
  prospect.status = 'joined_whatsapp';
  prospect.joinedWhatsAppAt = now;
  prospect.updatedAt = now;
  await saveProspect(prospect, prevStatus);
  if (prospect.email) {
    await addSuppression(prospect.email, 'joined');
  }
  return prospect;
}

export function createSendRecord(input: {
  prospectId: string;
  firmName: string;
  prospectType: FirmProspect['prospectType'];
  email: string;
  campaignId: string;
  sequenceStep: number;
  subject: string;
}): FirmOutreachSend {
  return {
    id: newSendId(),
    prospectId: input.prospectId,
    firmName: input.firmName,
    prospectType: input.prospectType,
    email: input.email,
    campaignId: input.campaignId,
    sequenceStep: input.sequenceStep,
    subject: input.subject,
    status: 'queued',
    createdAt: new Date().toISOString(),
  };
}

export async function countProspectsByStatus(): Promise<Record<string, number>> {
  const statuses: FirmProspectStatus[] = [
    'discovered',
    'enriched',
    'ready_to_send',
    'sent',
    'bounced',
    'unsubscribed',
    'joined_whatsapp',
    'excluded',
    'no_email',
  ];
  const out: Record<string, number> = {};
  for (const s of statuses) {
    out[s] = (await listProspectIdsByStatus(s)).length;
  }
  return out;
}

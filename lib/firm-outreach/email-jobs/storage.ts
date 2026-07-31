import crypto from 'crypto';
import {
  DEFAULT_EMAIL_JOB_LEASE_SECONDS,
  DEFAULT_EMAIL_JOB_MAX_ATTEMPTS,
  EMAIL_JOB_CLAIMABLE_STATUSES,
  EMAIL_JOB_TERMINAL_STATUSES,
  type EmailJob,
  type EmailJobStatus,
  buildOutreachIdempotencyKey,
} from '@robertcashman/firm-outreach-core';
import { claimKey } from '@/lib/kv-atomic';
import { getKV, skipKVInPrerender } from '@/lib/kv';

const JOB_PREFIX = 'firmoutreach:job:';
const JOB_INDEX = 'firmoutreach:job:index';
const JOB_STATUS_PREFIX = 'firmoutreach:job:status:';
const JOB_IDEM_PREFIX = 'firmoutreach:job:idem:';
const JOB_PENDING_ZSET = 'firmoutreach:job:pending_z';

function jobKey(id: string): string {
  return `${JOB_PREFIX}${id}`;
}

function statusKey(status: EmailJobStatus): string {
  return `${JOB_STATUS_PREFIX}${status}`;
}

function idemKey(idempotencyKey: string): string {
  return `${JOB_IDEM_PREFIX}${idempotencyKey}`;
}

function newJobId(): string {
  return `foj_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;
}

async function readStringList(key: string): Promise<string[]> {
  const kv = getKV();
  if (!kv) return [];
  try {
    const members = await kv.smembers(key);
    if (Array.isArray(members) && members.length > 0) {
      return members.map(String);
    }
  } catch {
    // legacy JSON array
  }
  const raw = await kv.get<string[]>(key);
  return Array.isArray(raw) ? raw : [];
}

async function addToSet(key: string, id: string): Promise<void> {
  const kv = getKV();
  if (!kv) return;
  try {
    await kv.sadd(key, id);
  } catch {
    const legacy = await kv.get<string[]>(key);
    await kv.del(key);
    if (Array.isArray(legacy)) {
      for (const member of legacy) await kv.sadd(key, member);
    }
    await kv.sadd(key, id);
  }
}

async function removeFromSet(key: string, id: string): Promise<void> {
  const kv = getKV();
  if (!kv) return;
  try {
    await kv.srem(key, id);
  } catch {
    const legacy = await kv.get<string[]>(key);
    if (!Array.isArray(legacy)) return;
    const next = legacy.filter((x) => x !== id);
    await kv.set(key, next);
  }
}

export async function getEmailJob(id: string): Promise<EmailJob | null> {
  const kv = getKV();
  if (!kv) return null;
  return (await kv.get<EmailJob>(jobKey(id))) ?? null;
}

export async function getEmailJobByIdempotencyKey(
  idempotencyKey: string,
): Promise<EmailJob | null> {
  const kv = getKV();
  if (!kv) return null;
  const id = await kv.get<string>(idemKey(idempotencyKey));
  if (!id) return null;
  return getEmailJob(id);
}

export async function saveEmailJob(
  job: EmailJob,
  previousStatus?: EmailJobStatus,
): Promise<void> {
  const kv = getKV();
  if (!kv) throw new Error('KV not configured');
  job.updatedAt = new Date().toISOString();
  await kv.set(jobKey(job.id), job);
  await addToSet(JOB_INDEX, job.id);
  await addToSet(statusKey(job.status), job.id);
  if (previousStatus && previousStatus !== job.status) {
    await removeFromSet(statusKey(previousStatus), job.id);
  }
  // Score pending/retry by nextRetryAt or createdAt for ordered claim.
  if (EMAIL_JOB_CLAIMABLE_STATUSES.has(job.status)) {
    const score = Date.parse(job.nextRetryAt ?? job.createdAt) || Date.now();
    try {
      await kv.zadd(JOB_PENDING_ZSET, { score, member: job.id });
    } catch {
      // zset optional — claim falls back to status set scan
    }
  } else {
    try {
      await kv.zrem(JOB_PENDING_ZSET, job.id);
    } catch {
      /* ignore */
    }
  }
}

export interface EnqueueEmailJobInput {
  campaignId: string;
  prospectId: string;
  firmName: string;
  prospectType: EmailJob['prospectType'];
  email: string;
  sequenceStep: number;
  correlationId: string;
  runId?: string;
  dryRun?: boolean;
  subject?: string;
}

export interface EnqueueEmailJobResult {
  job: EmailJob;
  created: boolean;
  duplicate: boolean;
}

/**
 * Create a durable send job. Database-level uniqueness via SET NX on idempotency key.
 */
export async function enqueueEmailJob(
  input: EnqueueEmailJobInput,
): Promise<EnqueueEmailJobResult> {
  const kv = getKV();
  if (!kv) throw new Error('KV not configured');

  const idempotencyKey = buildOutreachIdempotencyKey(
    input.campaignId,
    input.email,
    input.sequenceStep,
  );
  const existing = await getEmailJobByIdempotencyKey(idempotencyKey);
  if (existing) {
    return { job: existing, created: false, duplicate: true };
  }

  const now = new Date().toISOString();
  const id = newJobId();
  const claimed = await claimKey(idemKey(idempotencyKey), 60 * 60 * 24 * 120, id);
  if (!claimed) {
    const raced = await getEmailJobByIdempotencyKey(idempotencyKey);
    if (raced) return { job: raced, created: false, duplicate: true };
    // Idem key held without job row — heal by reading value
    const heldId = await kv.get<string>(idemKey(idempotencyKey));
    if (heldId) {
      const job = await getEmailJob(heldId);
      if (job) return { job, created: false, duplicate: true };
    }
  }

  const job: EmailJob = {
    id,
    idempotencyKey,
    campaignId: input.campaignId,
    prospectId: input.prospectId,
    firmName: input.firmName,
    prospectType: input.prospectType,
    email: input.email.trim().toLowerCase(),
    sequenceStep: input.sequenceStep,
    status: 'pending',
    attemptCount: 0,
    maxAttempts: DEFAULT_EMAIL_JOB_MAX_ATTEMPTS,
    createdAt: now,
    updatedAt: now,
    correlationId: input.correlationId,
    runId: input.runId,
    dryRun: input.dryRun,
    subject: input.subject,
  };

  await saveEmailJob(job);
  await kv.set(idemKey(idempotencyKey), id, { ex: 60 * 60 * 24 * 120 });
  return { job, created: true, duplicate: false };
}

export async function listEmailJobIdsByStatus(
  status: EmailJobStatus,
  limit = 200,
): Promise<string[]> {
  if (skipKVInPrerender()) return [];
  const ids = await readStringList(statusKey(status));
  return ids.slice(0, limit);
}

export async function countEmailJobsByStatus(): Promise<Partial<Record<EmailJobStatus, number>>> {
  const statuses: EmailJobStatus[] = [
    'pending',
    'claimed',
    'processing',
    'accepted',
    'delivered',
    'deferred',
    'bounced',
    'complained',
    'unsubscribed',
    'suppressed',
    'failed',
    'retry_scheduled',
    'permanently_failed',
  ];
  const out: Partial<Record<EmailJobStatus, number>> = {};
  for (const s of statuses) {
    const ids = await readStringList(statusKey(s));
    out[s] = ids.length;
  }
  return out;
}

/**
 * Atomically claim the next due job. Lease prevents double-send across workers.
 */
export async function claimNextEmailJob(opts: {
  owner: string;
  campaignId?: string;
  leaseSeconds?: number;
  now?: Date;
}): Promise<EmailJob | null> {
  const kv = getKV();
  if (!kv) return null;
  const now = opts.now ?? new Date();
  const leaseSeconds = opts.leaseSeconds ?? DEFAULT_EMAIL_JOB_LEASE_SECONDS;
  const nowMs = now.getTime();

  let candidateIds: string[] = [];
  try {
    const due = await kv.zrange(JOB_PENDING_ZSET, 0, nowMs, {
      byScore: true,
      offset: 0,
      count: 80,
    });
    if (Array.isArray(due)) candidateIds = due.map(String);
  } catch {
    /* fallback below */
  }

  if (candidateIds.length === 0) {
    const pending = await listEmailJobIdsByStatus('pending', 80);
    const retry = await listEmailJobIdsByStatus('retry_scheduled', 80);
    candidateIds = [...pending, ...retry];
  }

  for (const id of candidateIds) {
    const job = await getEmailJob(id);
    if (!job) continue;
    if (opts.campaignId && job.campaignId !== opts.campaignId) continue;
    if (!EMAIL_JOB_CLAIMABLE_STATUSES.has(job.status)) continue;
    if (job.status === 'retry_scheduled' && job.nextRetryAt) {
      if (Date.parse(job.nextRetryAt) > nowMs) continue;
    }

    const leased = await claimKey(
      `firmoutreach:job:lease:${job.id}`,
      leaseSeconds,
      opts.owner,
    );
    if (!leased) continue;

    const prev = job.status;
    job.status = 'claimed';
    job.claimedAt = now.toISOString();
    job.claimOwner = opts.owner;
    job.claimExpiresAt = new Date(nowMs + leaseSeconds * 1000).toISOString();
    job.updatedAt = now.toISOString();
    await saveEmailJob(job, prev);
    return job;
  }

  return null;
}

/** Requeue claimed/processing jobs whose lease expired. */
export async function recoverAbandonedEmailJobs(opts?: {
  limit?: number;
  now?: Date;
}): Promise<number> {
  const kv = getKV();
  if (!kv) return 0;
  const now = opts?.now ?? new Date();
  const limit = opts?.limit ?? 100;
  let recovered = 0;

  for (const status of ['claimed', 'processing'] as const) {
    const ids = await listEmailJobIdsByStatus(status, limit);
    for (const id of ids) {
      if (recovered >= limit) return recovered;
      const job = await getEmailJob(id);
      if (!job) continue;
      const expires = job.claimExpiresAt ? Date.parse(job.claimExpiresAt) : 0;
      if (expires && expires > now.getTime()) continue;

      const prev = job.status;
      job.status = job.attemptCount > 0 ? 'retry_scheduled' : 'pending';
      job.nextRetryAt = now.toISOString();
      job.claimedAt = undefined;
      job.claimOwner = undefined;
      job.claimExpiresAt = undefined;
      job.lastError = job.lastError ?? 'abandoned_lease_recovered';
      // Drop the NX lease key so another worker can claim immediately.
      try {
        await kv.del(`firmoutreach:job:lease:${job.id}`);
      } catch {
        /* ignore */
      }
      await saveEmailJob(job, prev);
      recovered++;
    }
  }
  return recovered;
}

export async function markJobProcessing(job: EmailJob): Promise<EmailJob> {
  const prev = job.status;
  job.status = 'processing';
  job.updatedAt = new Date().toISOString();
  if (!job.firstAttemptAt) job.firstAttemptAt = job.updatedAt;
  job.attemptCount += 1;
  await saveEmailJob(job, prev);
  return job;
}

export async function markJobAccepted(
  job: EmailJob,
  opts: { providerMessageId: string; sendId?: string; subject?: string },
): Promise<EmailJob> {
  const prev = job.status;
  job.status = 'accepted';
  job.providerMessageId = opts.providerMessageId;
  job.sendId = opts.sendId ?? job.sendId;
  job.subject = opts.subject ?? job.subject;
  job.acceptedAt = new Date().toISOString();
  job.completedAt = job.acceptedAt;
  job.lastError = undefined;
  job.nextRetryAt = undefined;
  await saveEmailJob(job, prev);
  return job;
}

export async function markJobRetryOrPermanent(
  job: EmailJob,
  opts: {
    error: string;
    statusCode?: number;
    retryable: boolean;
    delayMs: number;
  },
): Promise<EmailJob> {
  const prev = job.status;
  job.lastError = opts.error.slice(0, 500);
  job.providerStatusCode = opts.statusCode;
  const exhausted = job.attemptCount >= job.maxAttempts;
  if (!opts.retryable || exhausted) {
    job.status = 'permanently_failed';
    job.completedAt = new Date().toISOString();
    job.nextRetryAt = undefined;
  } else {
    job.status = 'retry_scheduled';
    job.nextRetryAt = new Date(Date.now() + opts.delayMs).toISOString();
  }
  job.claimedAt = undefined;
  job.claimOwner = undefined;
  job.claimExpiresAt = undefined;
  await saveEmailJob(job, prev);
  return job;
}

export async function markJobSuppressed(
  job: EmailJob,
  reason: 'suppressed' | 'unsubscribed' | 'bounced' | 'complained',
): Promise<EmailJob> {
  const prev = job.status;
  job.status = reason;
  job.completedAt = new Date().toISOString();
  await saveEmailJob(job, prev);
  return job;
}

export function isTerminalEmailJob(job: EmailJob): boolean {
  return EMAIL_JOB_TERMINAL_STATUSES.has(job.status);
}

export { buildOutreachIdempotencyKey };

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildOutreachIdempotencyKey,
  classifyProviderError,
  nextOutreachStep,
  reconcileReadyProspectStatus,
  retryDelayMs,
  sequenceStepOf,
} from '@robertcashman/firm-outreach-core';

describe('buildOutreachIdempotencyKey', () => {
  it('is deterministic for campaign + normalised email + step', () => {
    const a = buildOutreachIdempotencyKey('whatsapp_invite_v1', 'Info@Example.COM', 0);
    const b = buildOutreachIdempotencyKey('whatsapp_invite_v1', 'info@example.com', 0);
    expect(a).toBe(b);
    expect(a).toHaveLength(40);
  });

  it('differs by step and campaign', () => {
    const base = buildOutreachIdempotencyKey('whatsapp_invite_v1', 'a@b.co.uk', 0);
    expect(buildOutreachIdempotencyKey('whatsapp_invite_v1', 'a@b.co.uk', 1)).not.toBe(base);
    expect(buildOutreachIdempotencyKey('agent_cover_kent_v1', 'a@b.co.uk', 0)).not.toBe(base);
  });
});

describe('nextOutreachStep', () => {
  it('returns 0 for ready_to_send with missing sequenceStep', () => {
    expect(
      nextOutreachStep({
        status: 'ready_to_send',
        sequenceStep: undefined as unknown as number,
        lastEmailAt: undefined,
      }),
    ).toBe(0);
  });

  it('returns null for not-due sent prospects', () => {
    expect(
      nextOutreachStep({
        status: 'sent',
        sequenceStep: 0,
        lastEmailAt: new Date().toISOString(),
      }),
    ).toBeNull();
  });

  it('returns follow-up step after 7 days', () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    expect(
      nextOutreachStep({
        status: 'sent',
        sequenceStep: 0,
        lastEmailAt: eightDaysAgo,
      }),
    ).toBe(1);
  });

  it('treats stale ready+lastEmailAt as sent for follow-ups', () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    expect(
      nextOutreachStep({
        status: 'ready_to_send',
        sequenceStep: 0,
        lastEmailAt: eightDaysAgo,
      }),
    ).toBe(1);
  });
});

describe('reconcileReadyProspectStatus', () => {
  it('moves ready with lastEmailAt even when sequenceStep is undefined', () => {
    expect(
      reconcileReadyProspectStatus({
        status: 'ready_to_send',
        sequenceStep: undefined as unknown as number,
        lastEmailAt: '2026-06-01T00:00:00.000Z',
        email: 'info@example.co.uk',
      }),
    ).toBe('sent');
  });
});

describe('sequenceStepOf', () => {
  it('defaults missing values to 0', () => {
    expect(sequenceStepOf({ sequenceStep: undefined as unknown as number })).toBe(0);
    expect(sequenceStepOf({ sequenceStep: 2 })).toBe(2);
  });
});

describe('classifyProviderError', () => {
  it('classifies transient HTTP and network errors', () => {
    expect(classifyProviderError('timeout', 504)).toBe('transient');
    expect(classifyProviderError('Too Many Requests', 429)).toBe('transient');
    expect(classifyProviderError('ENOTFOUND api.resend.com')).toBe('transient');
    expect(classifyProviderError('ECONNRESET')).toBe('transient');
  });

  it('classifies permanent errors', () => {
    expect(classifyProviderError('invalid email', 422)).toBe('permanent');
    expect(classifyProviderError('unauthorized', 401)).toBe('permanent');
    expect(classifyProviderError('domain not verified')).toBe('permanent');
  });
});

describe('retryDelayMs', () => {
  it('stays within exponential bound', () => {
    for (let attempt = 1; attempt <= 5; attempt++) {
      const delay = retryDelayMs(attempt, { baseMs: 1000, maxMs: 60_000 });
      expect(delay).toBeGreaterThanOrEqual(0);
      expect(delay).toBeLessThanOrEqual(60_000);
    }
  });
});

const store = vi.hoisted(() => {
  const data = new Map<string, unknown>();
  const sets = new Map<string, Set<string>>();
  const zsets = new Map<string, Map<string, number>>();
  return { data, sets, zsets };
});

vi.mock('@/lib/kv', () => ({
  getKV: () => ({
    set: async (key: string, value: unknown, opts?: { nx?: boolean; ex?: number }) => {
      if (opts?.nx && store.data.has(key)) return null;
      store.data.set(key, value);
      return 'OK';
    },
    get: async (key: string) => store.data.get(key) ?? null,
    del: async (key: string) => {
      store.data.delete(key);
      store.sets.delete(key);
      store.zsets.delete(key);
    },
    incr: async (key: string) => {
      const next = Number(store.data.get(key) ?? 0) + 1;
      store.data.set(key, next);
      return next;
    },
    decr: async (key: string) => {
      const next = Number(store.data.get(key) ?? 0) - 1;
      store.data.set(key, next);
      return next;
    },
    expire: async () => 'OK',
    sadd: async (key: string, member: string) => {
      const set = store.sets.get(key) ?? new Set<string>();
      set.add(member);
      store.sets.set(key, set);
      return 1;
    },
    srem: async (key: string, member: string) => {
      store.sets.get(key)?.delete(member);
      return 1;
    },
    smembers: async (key: string) => [...(store.sets.get(key) ?? [])],
    zadd: async (key: string, entry: { score: number; member: string }) => {
      const z = store.zsets.get(key) ?? new Map<string, number>();
      z.set(entry.member, entry.score);
      store.zsets.set(key, z);
      return 1;
    },
    zrem: async (key: string, member: string) => {
      store.zsets.get(key)?.delete(member);
      return 1;
    },
    zrange: async (key: string, min: number, max: number) => {
      const z = store.zsets.get(key);
      if (!z) return [];
      return [...z.entries()]
        .filter(([, score]) => score >= min && score <= max)
        .sort((a, b) => a[1] - b[1])
        .map(([member]) => member);
    },
  }),
  skipKVInPrerender: () => false,
}));

import {
  claimNextEmailJob,
  enqueueEmailJob,
  getEmailJobByIdempotencyKey,
  markJobAccepted,
  markJobProcessing,
  markJobRetryOrPermanent,
  recoverAbandonedEmailJobs,
} from '@/lib/firm-outreach/email-jobs/storage';

describe('email job queue (KV)', () => {
  beforeEach(() => {
    store.data.clear();
    store.sets.clear();
    store.zsets.clear();
  });

  it('enforces idempotency — second enqueue is duplicate', async () => {
    const a = await enqueueEmailJob({
      campaignId: 'whatsapp_invite_v1',
      prospectId: 'p1',
      firmName: 'Test',
      prospectType: 'firm',
      email: 'info@test.co.uk',
      sequenceStep: 0,
      correlationId: 'c1',
    });
    const b = await enqueueEmailJob({
      campaignId: 'whatsapp_invite_v1',
      prospectId: 'p2',
      firmName: 'Test 2',
      prospectType: 'firm',
      email: 'INFO@test.co.uk',
      sequenceStep: 0,
      correlationId: 'c2',
    });
    expect(a.created).toBe(true);
    expect(b.duplicate).toBe(true);
    expect(b.job.id).toBe(a.job.id);
    const byKey = await getEmailJobByIdempotencyKey(a.job.idempotencyKey);
    expect(byKey?.id).toBe(a.job.id);
  });

  it('claims a job atomically for only one worker', async () => {
    await enqueueEmailJob({
      campaignId: 'whatsapp_invite_v1',
      prospectId: 'p1',
      firmName: 'Test',
      prospectType: 'firm',
      email: 'one@test.co.uk',
      sequenceStep: 0,
      correlationId: 'c1',
    });

    const [w1, w2] = await Promise.all([
      claimNextEmailJob({ owner: 'worker-1', campaignId: 'whatsapp_invite_v1' }),
      claimNextEmailJob({ owner: 'worker-2', campaignId: 'whatsapp_invite_v1' }),
    ]);

    const claimed = [w1, w2].filter(Boolean);
    expect(claimed).toHaveLength(1);
    expect(claimed[0]!.status).toBe('claimed');
  });

  it('recovers abandoned claimed jobs', async () => {
    const { job } = await enqueueEmailJob({
      campaignId: 'whatsapp_invite_v1',
      prospectId: 'p1',
      firmName: 'Test',
      prospectType: 'firm',
      email: 'abandon@test.co.uk',
      sequenceStep: 0,
      correlationId: 'c1',
    });
    const claimed = await claimNextEmailJob({
      owner: 'dead-worker',
      campaignId: 'whatsapp_invite_v1',
    });
    expect(claimed?.id).toBe(job.id);

    // Expire lease
    claimed!.claimExpiresAt = new Date(Date.now() - 1000).toISOString();
    const { saveEmailJob } = await import('@/lib/firm-outreach/email-jobs/storage');
    await saveEmailJob(claimed!, 'claimed');

    const recovered = await recoverAbandonedEmailJobs({ limit: 10 });
    expect(recovered).toBe(1);

    const again = await claimNextEmailJob({
      owner: 'new-worker',
      campaignId: 'whatsapp_invite_v1',
    });
    expect(again?.id).toBe(job.id);
  });

  it('retries transient failures and permanently fails after max attempts', async () => {
    const { job } = await enqueueEmailJob({
      campaignId: 'whatsapp_invite_v1',
      prospectId: 'p1',
      firmName: 'Test',
      prospectType: 'firm',
      email: 'retry@test.co.uk',
      sequenceStep: 0,
      correlationId: 'c1',
    });
    let current = await claimNextEmailJob({
      owner: 'w',
      campaignId: 'whatsapp_invite_v1',
    });
    expect(current).toBeTruthy();
    current = await markJobProcessing(current!);
    current = await markJobRetryOrPermanent(current, {
      error: '429 rate limit',
      statusCode: 429,
      retryable: true,
      delayMs: 0,
    });
    expect(current.status).toBe('retry_scheduled');

    current.maxAttempts = 1;
    current.attemptCount = 1;
    current = await markJobRetryOrPermanent(current, {
      error: 'invalid recipient',
      statusCode: 422,
      retryable: false,
      delayMs: 0,
    });
    expect(current.status).toBe('permanently_failed');
  });

  it('marks accepted with provider message id', async () => {
    const { job } = await enqueueEmailJob({
      campaignId: 'agent_cover_kent_v1',
      prospectId: 'p1',
      firmName: 'Kent LLP',
      prospectType: 'firm',
      email: 'kent@test.co.uk',
      sequenceStep: 0,
      correlationId: 'c1',
    });
    let current = await claimNextEmailJob({
      owner: 'w',
      campaignId: 'agent_cover_kent_v1',
    });
    current = await markJobProcessing(current!);
    current = await markJobAccepted(current, { providerMessageId: 're_123' });
    expect(current.status).toBe('accepted');
    expect(current.providerMessageId).toBe('re_123');
  });
});

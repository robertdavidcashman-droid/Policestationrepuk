/**
 * Safe end-to-end outreach workflow using an in-memory KV + mock provider.
 * Never contacts Resend or real leads.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EmailMessage, EmailProvider, EmailSendResult } from '@/lib/firm-outreach/email-provider';
import type { FirmProspect } from '@/lib/firm-outreach/types';
import { buildOutreachIdempotencyKey } from '@robertcashman/firm-outreach-core';

const store = vi.hoisted(() => {
  const data = new Map<string, unknown>();
  const sets = new Map<string, Set<string>>();
  const zsets = new Map<string, Map<string, number>>();
  const incrValues = new Map<string, number>();
  return {
    data,
    sets,
    zsets,
    incrValues,
    clear() {
      data.clear();
      sets.clear();
      zsets.clear();
      incrValues.clear();
    },
  };
});

const providerState = vi.hoisted(() => ({
  sends: [] as EmailMessage[],
  failNext: false,
  failTransient: false,
}));

vi.mock('@/lib/kv', () => ({
  getKV: () => ({
    set: async (key: string, value: unknown, opts?: { nx?: boolean }) => {
      if (opts?.nx && store.data.has(key)) return null;
      store.data.set(key, value);
      return 'OK';
    },
    get: async <T>(key: string) => (store.data.get(key) as T) ?? null,
    del: async (key: string) => {
      store.data.delete(key);
      store.sets.delete(key);
    },
    incr: async (key: string) => {
      const next = (store.incrValues.get(key) ?? 0) + 1;
      store.incrValues.set(key, next);
      store.data.set(key, next);
      return next;
    },
    decr: async (key: string) => {
      const next = (store.incrValues.get(key) ?? 0) - 1;
      store.incrValues.set(key, next);
      store.data.set(key, next);
      return next;
    },
    expire: async () => 'OK',
    sadd: async (key: string, member: string) => {
      const set = store.sets.get(key) ?? new Set<string>();
      set.add(String(member));
      store.sets.set(key, set);
      return 1;
    },
    srem: async (key: string, member: string) => {
      store.sets.get(key)?.delete(String(member));
      return 1;
    },
    smembers: async (key: string) => [...(store.sets.get(key) ?? [])],
    mget: async (...keys: string[]) => keys.map((k) => store.data.get(k) ?? null),
    zadd: async (key: string, entry: { score: number; member: string }) => {
      const z = store.zsets.get(key) ?? new Map();
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
        .map(([m]) => m);
    },
    pipeline: () => {
      const ops: Array<() => unknown> = [];
      const api = {
        get: (key: string) => {
          ops.push(() => store.data.get(key) ?? null);
          return api;
        },
        sadd: (key: string, member: string) => {
          ops.push(() => {
            const set = store.sets.get(key) ?? new Set<string>();
            set.add(member);
            store.sets.set(key, set);
          });
          return api;
        },
        exec: async () => ops.map((fn) => fn()),
      };
      return api;
    },
  }),
  skipKVInPrerender: () => false,
}));

vi.mock('@/lib/firm-outreach/outreach/from-address', () => ({
  assertOutreachSendReady: async () => ({ ok: true }),
  resolveOutreachFromAddress: async () => ({
    from: 'PoliceStationRepUK <noreply@policestationrepuk.org>',
    domain: 'policestationrepuk.org',
    domainVerified: true,
  }),
  resolveFromAddressForCampaign: () => ({
    from: 'PoliceStationRepUK <noreply@policestationrepuk.org>',
  }),
  fetchResendVerifiedDomains: async () => ['policestationrepuk.org'],
  repukFromAddress: () => 'PoliceStationRepUK <noreply@policestationrepuk.org>',
  DEFAULT_PSA_FROM_FALLBACK: 'Police Station Agent <noreply@policestationrepuk.org>',
  isDomainNotVerifiedError: () => false,
}));

vi.mock('@/lib/firm-outreach/pause-state', () => ({
  isOutreachSendAllowed: async () => true,
}));

vi.mock('@/lib/firm-outreach/constants', async () => {
  const actual = await vi.importActual<typeof import('@/lib/firm-outreach/constants')>(
    '@/lib/firm-outreach/constants',
  );
  return {
    ...actual,
    outreachSendEnabled: () => true,
    dailySendCap: () => 10,
  };
});

import { setEmailProviderForTests } from '@/lib/firm-outreach/email-provider';
import { getEmailJobByIdempotencyKey } from '@/lib/firm-outreach/email-jobs/storage';
import { runFirmOutreach } from '@/lib/firm-outreach/outreach/run-outreach';
import {
  addSuppression,
  applySendWebhookEvent,
  isSuppressed,
  saveProspect,
} from '@/lib/firm-outreach/storage';

function makeProspect(overrides: Partial<FirmProspect> = {}): FirmProspect {
  return {
    id: overrides.id ?? 'fop_e2e_1',
    firmKey: 'e2e-firm',
    firmName: 'E2E Solicitors LLP',
    prospectType: 'firm',
    status: 'ready_to_send',
    sequenceStep: 0,
    sources: ['laa'],
    priorityScore: 50,
    campaignId: 'whatsapp_invite_v1',
    enrichAttempts: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    email: 'e2e-test@example.co.uk',
    ...overrides,
  };
}

class MockProvider implements EmailProvider {
  readonly name = 'mock';
  async validateConfiguration() {
    return { configured: true, provider: 'mock', errors: [] };
  }
  async send(message: EmailMessage): Promise<EmailSendResult> {
    providerState.sends.push(message);
    if (providerState.failTransient) {
      providerState.failTransient = false;
      return { ok: false, error: '503 unavailable', statusCode: 503, retryable: true };
    }
    if (providerState.failNext) {
      providerState.failNext = false;
      return { ok: false, error: 'invalid email', statusCode: 422, retryable: false };
    }
    return { ok: true, providerMessageId: `mock_${providerState.sends.length}` };
  }
}

describe('safe outreach e2e', () => {
  beforeEach(() => {
    store.clear();
    providerState.sends = [];
    providerState.failNext = false;
    providerState.failTransient = false;
    process.env.RESEND_API_KEY = 'test-key';
    process.env.KV_REST_API_URL = 'http://localhost';
    process.env.KV_REST_API_TOKEN = 'test';
    process.env.FIRM_OUTREACH_DRY_RUN = '0';
    process.env.FIRM_OUTREACH_ENABLED = 'true';
    process.env.FIRM_OUTREACH_SEND_ENABLED = 'true';
    setEmailProviderForTests(new MockProvider());
  });

  it('creates job → claims → accepts → stores provider id → blocks duplicate', async () => {
    await saveProspect(makeProspect());

    const stats = await runFirmOutreach({
      campaignId: 'whatsapp_invite_v1',
      limit: 5,
    });

    expect(stats.sent).toBe(1);
    expect(stats.accepted).toBe(1);
    expect(stats.jobsCreated).toBe(1);
    expect(providerState.sends).toHaveLength(1);
    expect(providerState.sends[0]!.to).toBe('e2e-test@example.co.uk');

    const idem = buildOutreachIdempotencyKey(
      'whatsapp_invite_v1',
      'e2e-test@example.co.uk',
      0,
    );
    const job = await getEmailJobByIdempotencyKey(idem);
    expect(job?.status).toBe('accepted');
    expect(job?.providerMessageId).toBe('mock_1');

    const again = await runFirmOutreach({
      campaignId: 'whatsapp_invite_v1',
      limit: 5,
    });
    expect(again.sent).toBe(0);
    expect(providerState.sends).toHaveLength(1);
  });

  it('schedules retry on transient provider failure', async () => {
    providerState.failTransient = true;
    await saveProspect(makeProspect({ id: 'fop_e2e_retry', email: 'retry@example.co.uk' }));

    const stats = await runFirmOutreach({
      campaignId: 'whatsapp_invite_v1',
      limit: 5,
    });

    expect(stats.sent).toBe(0);
    expect(stats.retryScheduled).toBe(1);
    expect(stats.errors).toBe(1);

    const idem = buildOutreachIdempotencyKey(
      'whatsapp_invite_v1',
      'retry@example.co.uk',
      0,
    );
    expect((await getEmailJobByIdempotencyKey(idem))?.status).toBe('retry_scheduled');
  });

  it('permanently fails invalid recipient', async () => {
    providerState.failNext = true;
    await saveProspect(makeProspect({ id: 'fop_e2e_bad', email: 'bad@example.co.uk' }));

    const stats = await runFirmOutreach({
      campaignId: 'whatsapp_invite_v1',
      limit: 5,
    });

    expect(stats.permanentlyFailed).toBe(1);
    const idem = buildOutreachIdempotencyKey(
      'whatsapp_invite_v1',
      'bad@example.co.uk',
      0,
    );
    expect((await getEmailJobByIdempotencyKey(idem))?.status).toBe('permanently_failed');
  });

  it('blocks future sends after unsubscribe suppression', async () => {
    await addSuppression('blocked@example.co.uk', 'unsubscribe');
    await saveProspect(
      makeProspect({ id: 'fop_e2e_unsub', email: 'blocked@example.co.uk' }),
    );

    const stats = await runFirmOutreach({
      campaignId: 'whatsapp_invite_v1',
      limit: 5,
    });

    expect(stats.sent).toBe(0);
    expect(stats.suppressed).toBeGreaterThanOrEqual(1);
    expect(await isSuppressed('blocked@example.co.uk')).toBe(true);
    expect(providerState.sends).toHaveLength(0);
  });

  it('applies delivery webhook onto send record', async () => {
    await saveProspect(makeProspect({ id: 'fop_e2e_wh', email: 'hook@example.co.uk' }));
    await runFirmOutreach({ campaignId: 'whatsapp_invite_v1', limit: 5 });

    const updated = await applySendWebhookEvent({
      resendMessageId: 'mock_1',
      email: 'hook@example.co.uk',
      eventType: 'email.delivered',
    });
    expect(updated?.status).toBe('delivered');
  });
});

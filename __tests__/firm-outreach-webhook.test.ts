import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FirmOutreachSend } from '@/lib/firm-outreach/types';

const store = new Map<string, unknown>();

vi.mock('@/lib/kv', () => ({
  getKV: () => ({
    get: async <T>(key: string) => (store.get(key) as T | undefined) ?? null,
    set: async (key: string, value: unknown) => {
      store.set(key, value);
    },
    del: async (key: string) => {
      store.delete(key);
    },
    mget: async (...keys: string[]) => keys.map((k) => store.get(k) ?? null),
    pipeline: () => {
      const ops: Array<{ op: 'get'; key: string }> = [];
      return {
        get: (key: string) => {
          ops.push({ op: 'get', key });
        },
        exec: async () => ops.map((o) => store.get(o.key) ?? null),
      };
    },
  }),
  skipKVInPrerender: () => false,
}));

function send(overrides: Partial<FirmOutreachSend>): FirmOutreachSend {
  return {
    id: `fos_${Math.random().toString(36).slice(2, 8)}`,
    prospectId: 'fop_agent',
    firmName: 'Test Firm',
    prospectType: 'firm',
    email: 'info@examplefirm.co.uk',
    campaignId: 'agent_cover_kent_v1',
    sequenceStep: 0,
    subject: 'Kent police station agent cover',
    status: 'sent',
    createdAt: '2026-06-29T10:00:00.000Z',
    sentAt: '2026-06-29T10:00:00.000Z',
    ...overrides,
  };
}

describe('applySendWebhookEvent cross-campaign fallback', () => {
  beforeEach(() => {
    store.clear();
    vi.resetModules();
  });

  it('matches agent campaign send by email when resendMessageId is missing', async () => {
    const { saveSend, applySendWebhookEvent } = await import('@/lib/firm-outreach/storage');
    const agentSend = send({ id: 'fos_agent', campaignId: 'agent_cover_kent_v1' });
    await saveSend(agentSend);

    const updated = await applySendWebhookEvent({
      email: 'info@examplefirm.co.uk',
      eventType: 'email.delivered',
      at: '2026-06-29T11:00:00.000Z',
    });

    expect(updated?.campaignId).toBe('agent_cover_kent_v1');
    expect(updated?.status).toBe('delivered');
    expect(updated?.deliveredAt).toBe('2026-06-29T11:00:00.000Z');
  });

  it('prefers an in-flight send over an older bounced one for the same email', async () => {
    const { saveSend, applySendWebhookEvent } = await import('@/lib/firm-outreach/storage');
    await saveSend(
      send({
        id: 'fos_old',
        status: 'bounced',
        bouncedAt: '2026-06-20T10:00:00.000Z',
        sentAt: '2026-06-20T10:00:00.000Z',
      }),
    );
    await saveSend(
      send({
        id: 'fos_new',
        status: 'sent',
        sentAt: '2026-06-29T10:00:00.000Z',
      }),
    );

    const updated = await applySendWebhookEvent({
      email: 'info@examplefirm.co.uk',
      eventType: 'email.delivered',
    });

    expect(updated?.id).toBe('fos_new');
    expect(updated?.status).toBe('delivered');
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '@/app/api/cron/firm-outreach-status/route';

vi.mock('@/lib/firm-outreach/config-status', () => ({
  getOutreachConfigStatus: vi.fn().mockResolvedValue({
    kvConfigured: true,
    resendConfigured: true,
    outreachEnabled: true,
    sendAllowed: true,
    sendHealthy: true,
    sendBlockers: [],
    campaignSendHealth: [],
    requireApproval: true,
    effectivePaused: false,
  }),
}));

vi.mock('@/lib/firm-outreach/constants', () => ({
  outreachRequireApproval: () => true,
}));

vi.mock('@/lib/firm-outreach/outreach/activity-report', () => ({
  buildOutreachActivityReport: vi.fn().mockResolvedValue({
    report: {
      summary: { readyToSend: 109, sentToday: 0, sentLast7Days: 687 },
      readyToSendProspects: [{ suppressed: false, email: 'a@b.com' }],
    },
  }),
}));

const ENV = process.env;

describe('firm-outreach-status cron route', () => {
  beforeEach(() => {
    process.env = { ...ENV, CRON_SECRET: 'cron-test-secret' };
  });

  afterEach(() => {
    process.env = { ...ENV };
  });

  it('returns 401 without cron secret', async () => {
    const res = await GET(new Request('http://localhost/api/cron/firm-outreach-status'));
    expect(res.status).toBe(401);
  });

  it('returns config and queue summary when authorized', async () => {
    const res = await GET(
      new Request('http://localhost/api/cron/firm-outreach-status', {
        headers: { authorization: 'Bearer cron-test-secret' },
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.config.requireApproval).toBe(true);
    expect(json.queue.readyToSend).toBe(109);
  });
});

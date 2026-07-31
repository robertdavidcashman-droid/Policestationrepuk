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

vi.mock('@/lib/firm-outreach/email-jobs/storage', () => ({
  countEmailJobsByStatus: vi.fn().mockResolvedValue({
    pending: 0,
    claimed: 0,
    processing: 0,
    accepted: 2,
    retry_scheduled: 0,
    permanently_failed: 0,
  }),
}));

vi.mock('@/lib/firm-outreach/outreach/candidate-selection', () => ({
  selectOutreachCandidates: vi.fn().mockResolvedValue({
    candidates: [],
    readyScanned: 10,
    sentScanned: 5,
    readyEligible: 8,
    followUpEligible: 1,
    firmCooldownSkipped: 0,
  }),
}));

vi.mock('@/lib/firm-outreach/storage', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/firm-outreach/storage')>();
  return {
    ...actual,
    getLatestOutreachRunLog: vi.fn().mockResolvedValue(null),
  };
});

vi.mock('@robertcashman/firm-outreach-core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@robertcashman/firm-outreach-core')>();
  return {
    ...actual,
    validateOutreachEnv: () => ({
      ok: true,
      errors: [],
      warnings: [],
      dryRun: false,
      sendingEnabled: true,
    }),
  };
});

const ENV = process.env;

describe('firm-outreach-status cron route', () => {
  beforeEach(() => {
    process.env = {
      ...ENV,
      CRON_SECRET: 'cron-test-secret',
      RESEND_API_KEY: 're_test',
      KV_REST_API_URL: 'http://localhost',
      KV_REST_API_TOKEN: 'token',
    };
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

  it('accepts outreach bootstrap secret header', async () => {
    process.env = {
      ...ENV,
      CRON_SECRET: 'cron-test-secret',
      FIRM_OUTREACH_BOOTSTRAP_SECRET: 'boot-test-secret',
    };
    const res = await GET(
      new Request('http://localhost/api/cron/firm-outreach-status', {
        headers: { 'x-firm-outreach-bootstrap-secret': 'boot-test-secret' },
      }),
    );
    expect(res.status).toBe(200);
  });
});

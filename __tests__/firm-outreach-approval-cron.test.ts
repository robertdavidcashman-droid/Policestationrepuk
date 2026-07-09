import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET as fullGet } from '@/app/api/cron/firm-outreach-pipeline/full/route';
import { GET as digestGet } from '@/app/api/cron/firm-outreach-digest/route';

const mockPipeline = vi.fn();
const mockApprovalEmail = vi.fn();
const mockDigest = vi.fn();

vi.mock('@/lib/firm-outreach/run-pipeline', () => ({
  runFirmOutreachPipeline: (...args: unknown[]) => mockPipeline(...args),
}));

vi.mock('@/lib/firm-outreach/outreach/approval-request-email', () => ({
  sendOutreachApprovalRequestEmail: (...args: unknown[]) => mockApprovalEmail(...args),
}));

vi.mock('@/lib/firm-outreach/outreach/digest-email', () => ({
  sendDailyOutreachDigest: (...args: unknown[]) => mockDigest(...args),
}));

const ENV = process.env;

describe('firm-outreach approval crons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...ENV, CRON_SECRET: 'cron-test', FIRM_OUTREACH_REQUIRE_APPROVAL: 'true' };
    mockPipeline.mockResolvedValue({ skipped: false, send: { sent: 0 } });
    mockApprovalEmail.mockResolvedValue({ sent: true, date: '2026-06-13' });
    mockDigest.mockResolvedValue({ sent: true, date: '2026-06-13' });
  });

  afterEach(() => {
    process.env = { ...ENV };
  });

  describe('firm-outreach-pipeline/full', () => {
    it('returns 401 without cron secret', async () => {
      const res = await fullGet(new Request('http://localhost/api/cron/firm-outreach-pipeline/full'));
      expect(res.status).toBe(401);
    });

    it('sends approval email without running the heavy pipeline', async () => {
      const res = await fullGet(
        new Request('http://localhost/api/cron/firm-outreach-pipeline/full', {
          headers: { authorization: 'Bearer cron-test' },
        }),
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.mode).toBe('approval-only');
      expect(mockPipeline).not.toHaveBeenCalled();
      expect(mockApprovalEmail).toHaveBeenCalledOnce();
    });

    it('passes force=1 to approval email', async () => {
      await fullGet(
        new Request('http://localhost/api/cron/firm-outreach-pipeline/full?force=1', {
          headers: { authorization: 'Bearer cron-test' },
        }),
      );
      expect(mockApprovalEmail).toHaveBeenCalledWith({ force: true });
    });
  });

  describe('firm-outreach-digest', () => {
    it('sends approval reminder when approval required', async () => {
      const res = await digestGet(
        new Request('http://localhost/api/cron/firm-outreach-digest', {
          headers: { authorization: 'Bearer cron-test' },
        }),
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.mode).toBe('approval-reminder');
      expect(mockApprovalEmail).toHaveBeenCalledWith({ reminder: true });
      expect(mockDigest).not.toHaveBeenCalled();
    });
  });
});

describe('firm-outreach legacy digest cron', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...ENV, CRON_SECRET: 'cron-test', FIRM_OUTREACH_REQUIRE_APPROVAL: 'false' };
    mockDigest.mockResolvedValue({ sent: true, date: '2026-06-13' });
  });

  afterEach(() => {
    process.env = { ...ENV };
  });

  it('runs legacy digest when approval disabled', async () => {
    const res = await digestGet(
      new Request('http://localhost/api/cron/firm-outreach-digest', {
        headers: { authorization: 'Bearer cron-test' },
      }),
    );
    const json = await res.json();
    expect(json.mode).toBe('digest');
    expect(mockDigest).toHaveBeenCalledOnce();
  });
});

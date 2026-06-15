import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '@/app/api/cron/traffic-digest/route';

const mockAuditCrossDomain = vi.fn();
const mockVerifyGbp = vi.fn();
const mockDigestEmail = vi.fn();

vi.mock('@/lib/audit/cross-domain-links', () => ({
  auditCrossDomainLinks: (...args: unknown[]) => mockAuditCrossDomain(...args),
}));

vi.mock('@/lib/buffer/verify-scheduled', () => ({
  verifyScheduledBufferImages: (...args: unknown[]) => mockVerifyGbp(...args),
}));

vi.mock('@/lib/buffer/email', () => ({
  sendTrafficDigestEmail: (...args: unknown[]) => mockDigestEmail(...args),
}));

const ENV = process.env;

describe('traffic-digest cron route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...ENV, CRON_SECRET: 'cron-test-secret' };
    mockAuditCrossDomain.mockResolvedValue({ ok: true, issueCount: 0, issues: [] });
    mockVerifyGbp.mockResolvedValue({
      ok: true,
      issueCount: 0,
      scheduledCount: 5,
      issues: [],
    });
    mockDigestEmail.mockResolvedValue(true);
  });

  afterEach(() => {
    process.env = { ...ENV };
  });

  it('returns 401 without cron secret', async () => {
    const res = await GET(new Request('http://localhost/api/cron/traffic-digest'));
    expect(res.status).toBe(401);
    expect(mockAuditCrossDomain).not.toHaveBeenCalled();
  });

  it('calls in-process cross-domain audit (no shell exec)', async () => {
    const res = await GET(
      new Request('http://localhost/api/cron/traffic-digest', {
        headers: { authorization: 'Bearer cron-test-secret' },
      }),
    );
    expect(res.status).toBe(200);
    expect(mockAuditCrossDomain).toHaveBeenCalledTimes(1);
    expect(mockVerifyGbp).toHaveBeenCalledWith({ googleBusinessOnly: true });
    expect(mockDigestEmail).toHaveBeenCalledWith(
      expect.objectContaining({ gbpOk: true, crossDomainOk: true, scheduledCount: 5 }),
    );
  });

  it('reports failures without shelling out', async () => {
    mockAuditCrossDomain.mockResolvedValue({
      ok: false,
      issueCount: 1,
      issues: ['psrtrain: missing custodynote.com'],
    });
    mockVerifyGbp.mockResolvedValue({
      ok: false,
      issueCount: 1,
      scheduledCount: 3,
      issues: [{ slug: 'example-post', issue: 'missing image' }],
    });

    const res = await GET(
      new Request('http://localhost/api/cron/traffic-digest', {
        headers: { authorization: 'Bearer cron-test-secret' },
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.gbpIssueCount).toBe(1);
    expect(body.crossDomainIssues).toContain('psrtrain: missing custodynote.com');
  });
});

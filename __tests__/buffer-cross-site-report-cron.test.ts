import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '@/app/api/cron/buffer-cross-site-report/route';

const mockVerify = vi.fn();
const mockWasSent = vi.fn();
const mockMarkSent = vi.fn();
const mockSuccessEmail = vi.fn();
const mockFailureEmail = vi.fn();

vi.mock('@/lib/buffer/verify-cross-site', () => ({
  verifyCrossSiteBufferPosts: (...args: unknown[]) => mockVerify(...args),
}));

vi.mock('@/lib/buffer/cross-site-digest', () => ({
  crossSiteDigestVerifyDate: () => '2026-07-02',
  wasCrossSiteDigestSent: (...args: unknown[]) => mockWasSent(...args),
  markCrossSiteDigestSent: (...args: unknown[]) => mockMarkSent(...args),
}));

vi.mock('@/lib/buffer/email', () => ({
  sendBufferCrossSiteSuccessEmail: (...args: unknown[]) => mockSuccessEmail(...args),
  sendBufferCrossSiteFailureEmail: (...args: unknown[]) => mockFailureEmail(...args),
}));

const ENV = process.env;

describe('buffer-cross-site-report cron route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...ENV, CRON_SECRET: 'cron-test-secret' };
    mockWasSent.mockResolvedValue(false);
    mockMarkSent.mockResolvedValue(undefined);
    mockSuccessEmail.mockResolvedValue(true);
    mockFailureEmail.mockResolvedValue(true);
    mockVerify.mockResolvedValue({
      ok: true,
      date: '2026-07-02',
      sites: [
        { id: 'policestationrepuk', hostname: 'policestationrepuk.org', sentCount: 5, requiredCount: 5, ok: true },
      ],
      problems: [],
    });
  });

  afterEach(() => {
    process.env = { ...ENV };
  });

  it('returns 401 without cron secret', async () => {
    const res = await GET(new Request('http://localhost/api/cron/buffer-cross-site-report'));
    expect(res.status).toBe(401);
  });

  it('sends success email when all sites ok', async () => {
    const res = await GET(
      new Request('http://localhost/api/cron/buffer-cross-site-report', {
        headers: { authorization: 'Bearer cron-test-secret' },
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(mockSuccessEmail).toHaveBeenCalledOnce();
    expect(mockMarkSent).toHaveBeenCalledWith('2026-07-02');
  });

  it('sends failure email when a site is below quota', async () => {
    mockVerify.mockResolvedValue({
      ok: false,
      date: '2026-07-02',
      sites: [
        { id: 'psrtrain', hostname: 'psrtrain.com', sentCount: 2, requiredCount: 5, ok: false, issue: 'only 2/5' },
      ],
      problems: [{ id: 'psrtrain', hostname: 'psrtrain.com', sentCount: 2, requiredCount: 5, ok: false }],
    });
    const res = await GET(
      new Request('http://localhost/api/cron/buffer-cross-site-report', {
        headers: { authorization: 'Bearer cron-test-secret' },
      }),
    );
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(mockFailureEmail).toHaveBeenCalledOnce();
    expect(mockSuccessEmail).not.toHaveBeenCalled();
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '@/app/api/cron/buffer-daily-report/route';

const mockVerify = vi.fn();
const mockWasSent = vi.fn();
const mockMarkSent = vi.fn();
const mockSuccessEmail = vi.fn();
const mockFailureEmail = vi.fn();

vi.mock('@/lib/buffer/verify-posted', () => ({
  verifyBufferPostsPublished: (...args: unknown[]) => mockVerify(...args),
}));

vi.mock('@/lib/buffer/daily-digest', () => ({
  bufferDigestVerifyDate: () => '2026-06-12',
  wasBufferDigestSent: (...args: unknown[]) => mockWasSent(...args),
  markBufferDigestSent: (...args: unknown[]) => mockMarkSent(...args),
}));

vi.mock('@/lib/buffer/email', () => ({
  sendBufferDailySuccessEmail: (...args: unknown[]) => mockSuccessEmail(...args),
  sendBufferDailyFailureEmail: (...args: unknown[]) => mockFailureEmail(...args),
}));

const ENV = process.env;

describe('buffer-daily-report cron route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...ENV, CRON_SECRET: 'cron-test-secret' };
    mockWasSent.mockResolvedValue(false);
    mockMarkSent.mockResolvedValue(undefined);
    mockSuccessEmail.mockResolvedValue(true);
    mockFailureEmail.mockResolvedValue(true);
    mockVerify.mockResolvedValue({
      ok: true,
      date: '2026-06-12',
      total: 15,
      sent: 15,
      pending: 0,
      failed: 0,
      feedCounts: { policestationrepuk: 5 },
      posts: [{ slug: 'a', status: 'sent', dueAt: '2026-06-12T10:00:00.000Z' }],
      problems: [],
    });
  });

  afterEach(() => {
    process.env = { ...ENV };
  });

  it('returns 401 without cron secret', async () => {
    const res = await GET(new Request('http://localhost/api/cron/buffer-daily-report'));
    expect(res.status).toBe(401);
    expect(mockVerify).not.toHaveBeenCalled();
  });

  it('sends success email when all posts sent', async () => {
    const res = await GET(
      new Request('http://localhost/api/cron/buffer-daily-report', {
        headers: { authorization: 'Bearer cron-test-secret' },
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(mockSuccessEmail).toHaveBeenCalledOnce();
    expect(mockMarkSent).toHaveBeenCalledWith('2026-06-12');
  });

  it('skips when digest already sent', async () => {
    mockWasSent.mockResolvedValue(true);
    const res = await GET(
      new Request('http://localhost/api/cron/buffer-daily-report', {
        headers: { authorization: 'Bearer cron-test-secret' },
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.skipped).toBe(true);
    expect(mockVerify).not.toHaveBeenCalled();
  });

  it('sends failure email when posts not all sent', async () => {
    mockVerify.mockResolvedValue({
      ok: false,
      date: '2026-06-12',
      total: 15,
      sent: 14,
      pending: 0,
      failed: 1,
      feedCounts: {},
      posts: [],
      problems: [{ slug: 'x', status: 'scheduled', dueAt: '2026-06-12T10:00:00.000Z' }],
    });
    const res = await GET(
      new Request('http://localhost/api/cron/buffer-daily-report', {
        headers: { authorization: 'Bearer cron-test-secret' },
      }),
    );
    expect(res.status).toBe(500);
    expect(mockFailureEmail).toHaveBeenCalledOnce();
    expect(mockSuccessEmail).not.toHaveBeenCalled();
  });
});

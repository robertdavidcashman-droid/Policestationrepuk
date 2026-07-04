import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '@/app/api/cron/buffer-blog-posts/route';

const mockRun = vi.fn();
const mockEmail = vi.fn();
const mockWasFailureSent = vi.fn();
const mockMarkFailureSent = vi.fn();

vi.mock('@/lib/buffer/engine-run', () => ({
  runRepukBufferScheduler: (...args: unknown[]) => mockRun(...args),
}));

vi.mock('@/lib/buffer/email', () => ({
  sendBufferSchedulerFailureEmail: (...args: unknown[]) => mockEmail(...args),
}));

vi.mock('@/lib/buffer/scheduler-notification-digest', () => ({
  wasSchedulerFailureEmailSent: (...args: unknown[]) => mockWasFailureSent(...args),
  markSchedulerFailureEmailSent: (...args: unknown[]) => mockMarkFailureSent(...args),
  schedulerFailureErrorKey: (error: string) => error.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
}));

const ENV = process.env;

describe('buffer-blog-posts cron route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...ENV, CRON_SECRET: 'cron-test-secret' };
    mockWasFailureSent.mockResolvedValue(false);
    mockMarkFailureSent.mockResolvedValue(undefined);
    mockRun.mockResolvedValue({
      ok: true,
      date: '2026-06-08',
      posts: [],
    });
  });

  afterEach(() => {
    process.env = { ...ENV };
  });

  it('returns 401 without cron secret', async () => {
    const res = await GET(new Request('http://localhost/api/cron/buffer-blog-posts'));
    expect(res.status).toBe(401);
    expect(mockRun).not.toHaveBeenCalled();
  });

  it('accepts Bearer cron secret', async () => {
    const res = await GET(
      new Request('http://localhost/api/cron/buffer-blog-posts', {
        headers: { authorization: 'Bearer cron-test-secret' },
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(mockRun).toHaveBeenCalledWith({ force: false });
  });

  it('accepts x-cron-secret header', async () => {
    const res = await GET(
      new Request('http://localhost/api/cron/buffer-blog-posts', {
        headers: { 'x-cron-secret': 'cron-test-secret' },
      }),
    );
    expect(res.status).toBe(200);
    expect(mockRun).toHaveBeenCalledWith({ force: false });
  });

  it('returns 200 with ok false when scheduler reports failure (Resend notified)', async () => {
    mockRun.mockResolvedValue({ ok: false, reason: 'BUFFER_API_KEY is not configured' });
    const res = await GET(
      new Request('http://localhost/api/cron/buffer-blog-posts', {
        headers: { 'x-cron-secret': 'cron-test-secret' },
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(mockEmail).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'BUFFER_API_KEY is not configured' }),
    );
  });

  it('sends failure email when scheduler throws', async () => {
    mockRun.mockRejectedValue(new Error('createPost failed: dueAt is in the past'));
    const res = await GET(
      new Request('http://localhost/api/cron/buffer-blog-posts', {
        headers: { 'x-cron-secret': 'cron-test-secret' },
      }),
    );
    expect(res.status).toBe(500);
    expect(mockEmail).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'createPost failed: dueAt is in the past' }),
    );
  });

  it('passes force=true when ?force=1', async () => {
    const res = await GET(
      new Request('http://localhost/api/cron/buffer-blog-posts?force=1', {
        headers: { authorization: 'Bearer cron-test-secret' },
      }),
    );
    expect(res.status).toBe(200);
    expect(mockRun).toHaveBeenCalledWith({ force: true });
  });

  it('returns 200 with ok false when GBP preflight fails (Resend notified)', async () => {
    mockRun.mockResolvedValue({
      ok: false,
      reason: 'GBP preflight failed',
      gbpIssues: [{ feedId: 'custodynote', slug: 'example', reason: 'WebP asset URL' }],
    });
    const res = await GET(
      new Request('http://localhost/api/cron/buffer-blog-posts', {
        headers: { authorization: 'Bearer cron-test-secret' },
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.gbpIssues).toHaveLength(1);
    expect(mockEmail).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'GBP preflight failed' }),
    );
  });

  it('returns skipped response without email when already scheduled', async () => {
    mockRun.mockResolvedValue({
      ok: true,
      skipped: true,
      reason: 'Already scheduled for this date',
      date: '2026-06-08',
      posts: [{ slug: 'a', feedId: 'policestationrepuk' }],
    });
    const res = await GET(
      new Request('http://localhost/api/cron/buffer-blog-posts', {
        headers: { authorization: 'Bearer cron-test-secret' },
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.skipped).toBe(true);
    expect(json.reason).toMatch(/already scheduled/i);
    expect(mockEmail).not.toHaveBeenCalled();
  });

  it('does not send failure email when reconciled after cooldown exhaustion', async () => {
    mockRun.mockResolvedValue({
      ok: true,
      skipped: true,
      reconciled: true,
      scheduledInBuffer: 5,
      reason: 'Buffer already has 5/5 posts scheduled for today (cooldown exhausted)',
      date: '2026-07-04',
    });
    const res = await GET(
      new Request('http://localhost/api/cron/buffer-blog-posts', {
        headers: { authorization: 'Bearer cron-test-secret' },
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.reconciled).toBe(true);
    expect(mockEmail).not.toHaveBeenCalled();
  });

  it('suppresses duplicate failure email for same date and error', async () => {
    mockWasFailureSent.mockResolvedValue(true);
    mockRun.mockResolvedValue({ ok: false, reason: 'BUFFER_API_KEY is not configured' });
    const res = await GET(
      new Request('http://localhost/api/cron/buffer-blog-posts', {
        headers: { authorization: 'Bearer cron-test-secret' },
      }),
    );
    expect(res.status).toBe(200);
    expect(mockEmail).not.toHaveBeenCalled();
  });
});

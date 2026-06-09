import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '@/app/api/cron/buffer-blog-posts/route';

const mockRun = vi.fn();
const mockEmail = vi.fn();

vi.mock('@/lib/buffer/scheduler', () => ({
  runBufferBlogScheduler: (...args: unknown[]) => mockRun(...args),
}));

vi.mock('@/lib/buffer/email', () => ({
  sendBufferSchedulerFailureEmail: (...args: unknown[]) => mockEmail(...args),
}));

const ENV = process.env;

describe('buffer-blog-posts cron route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...ENV, CRON_SECRET: 'cron-test-secret' };
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
    expect(mockRun).toHaveBeenCalledOnce();
  });

  it('accepts x-cron-secret header', async () => {
    const res = await GET(
      new Request('http://localhost/api/cron/buffer-blog-posts', {
        headers: { 'x-cron-secret': 'cron-test-secret' },
      }),
    );
    expect(res.status).toBe(200);
    expect(mockRun).toHaveBeenCalledOnce();
  });

  it('returns 500 when scheduler reports failure', async () => {
    mockRun.mockResolvedValue({ ok: false, reason: 'BUFFER_API_KEY is not configured' });
    const res = await GET(
      new Request('http://localhost/api/cron/buffer-blog-posts', {
        headers: { 'x-cron-secret': 'cron-test-secret' },
      }),
    );
    expect(res.status).toBe(500);
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
    expect(mockRun).toHaveBeenCalledWith(expect.any(Date), { force: true });
  });

  it('returns skipped response with ok true when already scheduled', async () => {
    mockRun.mockResolvedValue({
      ok: true,
      skipped: true,
      reason: 'Already scheduled for this date',
      date: '2026-06-08',
      posts: [],
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
  });
});

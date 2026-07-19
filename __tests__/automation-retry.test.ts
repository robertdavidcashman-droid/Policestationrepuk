import { describe, expect, it, vi, afterEach } from 'vitest';
import { withRetry, extractRetryAfterMs } from '@/lib/automation/retry';

describe('automation retry', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it('retries transient failures then succeeds', async () => {
    vi.stubEnv('AUTO_RETRY_ENABLED', '1');
    vi.stubEnv('MAX_RETRY_COUNT', '3');
    let attempts = 0;
    const result = await withRetry(
      async () => {
        attempts += 1;
        if (attempts < 3) throw new Error('timeout while fetching');
        return 'ok';
      },
      { baseDelayMs: 1, maxDelayMs: 2 },
    );
    expect(result).toBe('ok');
    expect(attempts).toBe(3);
  });

  it('does not retry auth errors', async () => {
    let attempts = 0;
    await expect(
      withRetry(async () => {
        attempts += 1;
        throw new Error('Unauthorized invalid API key');
      }, { maxRetries: 5, baseDelayMs: 1 }),
    ).rejects.toThrow(/Unauthorized/);
    expect(attempts).toBe(1);
  });

  it('exhausts retries for persistent network errors', async () => {
    vi.stubEnv('AUTO_RETRY_ENABLED', '1');
    let attempts = 0;
    await expect(
      withRetry(
        async () => {
          attempts += 1;
          throw new Error('network socket hang up');
        },
        { maxRetries: 2, baseDelayMs: 1, maxDelayMs: 2 },
      ),
    ).rejects.toThrow(/network/);
    expect(attempts).toBe(3);
  });

  it('reads Retry-After from error details', () => {
    const err = Object.assign(new Error('Too many requests'), {
      details: [{ extensions: { retryAfter: 7 } }],
    });
    expect(extractRetryAfterMs(err)).toBe(7000);
  });
});

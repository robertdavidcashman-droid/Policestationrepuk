/**
 * Unit tests for the Turnstile server-side verifier.
 *
 * These guard the contract every API route relies on:
 *   - When Turnstile env vars are missing the verifier short-circuits and
 *     returns `code='TURNSTILE_NOT_CONFIGURED'` (NOT an error).
 *   - When the client sends no token, we return `TURNSTILE_MISSING`.
 *   - When Cloudflare reports `timeout-or-duplicate` we map it to
 *     `TURNSTILE_EXPIRED` so the UI can prompt a retry.
 *   - Other failures map to `TURNSTILE_FAILED` / `TURNSTILE_NETWORK_ERROR`.
 *   - On success the verifier reports `TURNSTILE_OK`.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const ORIGINAL_FETCH = globalThis.fetch;

beforeEach(() => {
  vi.stubEnv('ENABLE_TURNSTILE', '');
  vi.stubEnv('TURNSTILE_SECRET', '');
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllEnvs();
  globalThis.fetch = ORIGINAL_FETCH;
  vi.restoreAllMocks();
});

describe('verifyTurnstile', () => {
  it('returns TURNSTILE_NOT_CONFIGURED when env vars are missing', async () => {
    const { verifyTurnstile } = await import('@/lib/turnstile');
    const result = await verifyTurnstile('any-token', '1.2.3.4');
    expect(result.ok).toBe(true);
    expect(result.code).toBe('TURNSTILE_NOT_CONFIGURED');
  });

  it('returns TURNSTILE_MISSING when the token is empty', async () => {
    vi.stubEnv('ENABLE_TURNSTILE', '1');
    vi.stubEnv('TURNSTILE_SECRET', 'secret');
    const { verifyTurnstile } = await import('@/lib/turnstile');
    const result = await verifyTurnstile('', '1.2.3.4');
    expect(result.ok).toBe(false);
    expect(result.code).toBe('TURNSTILE_MISSING');
    expect(result.message).toMatch(/bot-protection check/i);
  });

  it('maps timeout-or-duplicate to TURNSTILE_EXPIRED', async () => {
    vi.stubEnv('ENABLE_TURNSTILE', '1');
    vi.stubEnv('TURNSTILE_SECRET', 'secret');
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: false, 'error-codes': ['timeout-or-duplicate'] }),
    } as unknown as Response);
    const { verifyTurnstile } = await import('@/lib/turnstile');
    const result = await verifyTurnstile('stale-token', '1.2.3.4');
    expect(result.ok).toBe(false);
    expect(result.code).toBe('TURNSTILE_EXPIRED');
  });

  it('returns TURNSTILE_FAILED for other Cloudflare errors', async () => {
    vi.stubEnv('ENABLE_TURNSTILE', '1');
    vi.stubEnv('TURNSTILE_SECRET', 'secret');
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: false, 'error-codes': ['invalid-input-secret'] }),
    } as unknown as Response);
    const { verifyTurnstile } = await import('@/lib/turnstile');
    const result = await verifyTurnstile('any-token', '1.2.3.4');
    expect(result.ok).toBe(false);
    expect(result.code).toBe('TURNSTILE_FAILED');
  });

  it('returns TURNSTILE_NETWORK_ERROR when fetch rejects', async () => {
    vi.stubEnv('ENABLE_TURNSTILE', '1');
    vi.stubEnv('TURNSTILE_SECRET', 'secret');
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('econn'));
    const { verifyTurnstile } = await import('@/lib/turnstile');
    const result = await verifyTurnstile('any-token', '1.2.3.4');
    expect(result.ok).toBe(false);
    expect(result.code).toBe('TURNSTILE_NETWORK_ERROR');
  });

  it('returns TURNSTILE_OK on success', async () => {
    vi.stubEnv('ENABLE_TURNSTILE', '1');
    vi.stubEnv('TURNSTILE_SECRET', 'secret');
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as unknown as Response);
    const { verifyTurnstile } = await import('@/lib/turnstile');
    const result = await verifyTurnstile('good-token', '1.2.3.4');
    expect(result.ok).toBe(true);
    expect(result.code).toBe('TURNSTILE_OK');
  });

  it('forwards remoteip but not when "unknown"', async () => {
    vi.stubEnv('ENABLE_TURNSTILE', '1');
    vi.stubEnv('TURNSTILE_SECRET', 'secret');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as unknown as Response);
    globalThis.fetch = fetchMock;
    const { verifyTurnstile } = await import('@/lib/turnstile');
    await verifyTurnstile('good-token', '1.2.3.4');
    const body = (fetchMock.mock.calls[0][1] as RequestInit).body as URLSearchParams;
    expect(body.get('remoteip')).toBe('1.2.3.4');

    fetchMock.mockClear();
    await verifyTurnstile('good-token', 'unknown');
    const body2 = (fetchMock.mock.calls[0][1] as RequestInit).body as URLSearchParams;
    expect(body2.get('remoteip')).toBeNull();
  });
});

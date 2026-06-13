/**
 * Email-verification code lifecycle (issue / consume) against an in-memory
 * fake KV. Validates:
 *   - codes are 6 digits
 *   - expired codes return `{ ok: false, reason: 'expired' }`
 *   - wrong codes return `{ ok: false, reason: 'wrong' }` and increment attempts
 *   - too many attempts return `{ ok: false, reason: 'too-many-attempts' }`
 *   - on success the record is deleted (single-use)
 *   - when KV is absent the consumer returns `disabled-no-kv`
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

interface KVRecord {
  value: unknown;
  ttlSec?: number;
  setAt: number;
}

class FakeKV {
  private store = new Map<string, KVRecord>();
  get<T = unknown>(key: string): Promise<T | null> {
    const rec = this.store.get(key);
    if (!rec) return Promise.resolve(null);
    if (rec.ttlSec && Date.now() - rec.setAt > rec.ttlSec * 1000) {
      this.store.delete(key);
      return Promise.resolve(null);
    }
    return Promise.resolve(rec.value as T);
  }
  set(key: string, value: unknown, opts?: { ex?: number }): Promise<'OK'> {
    this.store.set(key, {
      value,
      ttlSec: opts?.ex,
      setAt: Date.now(),
    });
    return Promise.resolve('OK');
  }
  del(key: string): Promise<number> {
    const had = this.store.delete(key);
    return Promise.resolve(had ? 1 : 0);
  }
  /** Used by tests to simulate clock skew. */
  forceExpire(key: string): void {
    const rec = this.store.get(key);
    if (!rec) return;
    rec.setAt = Date.now() - 60 * 60 * 1000;
  }
}

let fakeKV: FakeKV;

beforeEach(() => {
  fakeKV = new FakeKV();
  vi.resetModules();
  vi.doMock('@/lib/kv', () => ({
    getKV: () => fakeKV,
    skipKVInPrerender: () => false,
  }));
});

afterEach(() => {
  vi.doUnmock('@/lib/kv');
  vi.restoreAllMocks();
});

describe('enquiry email verification — code lifecycle', () => {
  it('issues a 6-digit code and returns it', async () => {
    const { issueEnquiryEmailCode } = await import('@/lib/enquiry-email-verify');
    const code = await issueEnquiryEmailCode('test@example.com');
    expect(code).not.toBeNull();
    expect(code).toMatch(/^\d{6}$/);
  });

  it('consumes the code successfully on the first try and deletes the record', async () => {
    const { issueEnquiryEmailCode, consumeEnquiryEmailCode } = await import(
      '@/lib/enquiry-email-verify'
    );
    const code = (await issueEnquiryEmailCode('test@example.com')) as string;
    const first = await consumeEnquiryEmailCode('test@example.com', code);
    expect(first.ok).toBe(true);
    // Second attempt should fail because the record was deleted.
    const second = await consumeEnquiryEmailCode('test@example.com', code);
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.reason).toBe('missing');
  });

  it('rejects a wrong code with reason "wrong" and counts the attempt', async () => {
    const { issueEnquiryEmailCode, consumeEnquiryEmailCode } = await import(
      '@/lib/enquiry-email-verify'
    );
    await issueEnquiryEmailCode('test@example.com');
    const r = await consumeEnquiryEmailCode('test@example.com', '000000');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('wrong');
  });

  it('locks out after 5 wrong attempts', async () => {
    const { issueEnquiryEmailCode, consumeEnquiryEmailCode } = await import(
      '@/lib/enquiry-email-verify'
    );
    await issueEnquiryEmailCode('test@example.com');
    for (let i = 0; i < 5; i++) {
      await consumeEnquiryEmailCode('test@example.com', '000000');
    }
    const r = await consumeEnquiryEmailCode('test@example.com', '000000');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('too-many-attempts');
  });

  it('returns "expired" once the TTL has elapsed', async () => {
    const { issueEnquiryEmailCode, consumeEnquiryEmailCode } = await import(
      '@/lib/enquiry-email-verify'
    );
    const code = (await issueEnquiryEmailCode('test@example.com')) as string;
    // Force the underlying record into the past so the expiresAt check trips.
    const rec = await fakeKV.get<{
      code: string;
      expiresAt: number;
      email: string;
      createdAt: number;
      attempts: number;
    }>('enquiry-code:test@example.com');
    if (rec) {
      rec.expiresAt = Date.now() - 1000;
      await fakeKV.set('enquiry-code:test@example.com', rec);
    }
    const r = await consumeEnquiryEmailCode('test@example.com', code);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('expired');
  });
});

describe('enquiry email verification — no KV configured', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.doMock('@/lib/kv', () => ({
      getKV: () => null,
      skipKVInPrerender: () => false,
    }));
  });

  it('returns disabled-no-kv', async () => {
    const { consumeEnquiryEmailCode } = await import('@/lib/enquiry-email-verify');
    const r = await consumeEnquiryEmailCode('test@example.com', '123456');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('disabled-no-kv');
  });
});

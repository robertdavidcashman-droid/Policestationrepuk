/**
 * HMAC-signed, single-use admin decision token used in the held-for-review
 * email Approve / Decline buttons. Validates:
 *   - issue + verifyTokenSignature roundtrip
 *   - tampered payload + tampered signature both rejected
 *   - expired tokens rejected
 *   - peek does not consume; consume actually deletes the KV row
 *   - second consume of the same token returns 410 (already used)
 *   - peek/consume reject when the env secret is missing or too short
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

interface KVRecord {
  value: unknown;
  ttlSec?: number;
  setAt: number;
}

class FakeKV {
  store = new Map<string, KVRecord>();
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
    this.store.set(key, { value, ttlSec: opts?.ex, setAt: Date.now() });
    return Promise.resolve('OK');
  }
  del(key: string): Promise<number> {
    const had = this.store.delete(key);
    return Promise.resolve(had ? 1 : 0);
  }
}

let fakeKV: FakeKV;
const ORIGINAL_SECRET = process.env.ADMIN_DECISION_TOKEN_SECRET;

beforeEach(() => {
  fakeKV = new FakeKV();
  process.env.ADMIN_DECISION_TOKEN_SECRET =
    'unit-test-secret-must-be-at-least-16-chars-long';
  vi.resetModules();
  vi.doMock('@/lib/kv', () => ({
    getKV: () => fakeKV,
    skipKVInPrerender: () => false,
  }));
});

afterEach(() => {
  if (ORIGINAL_SECRET == null) {
    delete process.env.ADMIN_DECISION_TOKEN_SECRET;
  } else {
    process.env.ADMIN_DECISION_TOKEN_SECRET = ORIGINAL_SECRET;
  }
  vi.doUnmock('@/lib/kv');
  vi.restoreAllMocks();
});

describe('admin-decision-token — issue + verify roundtrip', () => {
  it('issues a token whose signature verifies and whose payload round-trips', async () => {
    const { issueDecisionToken, verifyTokenSignature } = await import(
      '@/lib/admin-decision-token'
    );
    const { token, jti, exp } = await issueDecisionToken({
      email: 'WT.LEGAL@outlook.com',
      action: 'approve',
      category: 'psras-accredited',
    });
    expect(token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    const r = verifyTokenSignature(token);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.payload.email).toBe('wt.legal@outlook.com');
      expect(r.payload.action).toBe('approve');
      expect(r.payload.category).toBe('psras-accredited');
      expect(r.payload.jti).toBe(jti);
      expect(r.payload.exp).toBe(exp);
    }
  });

  it('also writes a one-shot KV record at admin-decision-token:{jti}', async () => {
    const { issueDecisionToken } = await import('@/lib/admin-decision-token');
    const { jti } = await issueDecisionToken({
      email: 'wt.legal@outlook.com',
      action: 'decline',
      category: 'solicitor',
    });
    const record = await fakeKV.get(`admin-decision-token:${jti}`);
    expect(record).not.toBeNull();
    expect((record as { email: string }).email).toBe('wt.legal@outlook.com');
    expect((record as { action: string }).action).toBe('decline');
  });
});

describe('admin-decision-token — tamper resistance', () => {
  it('rejects a token whose signature has been tampered', async () => {
    const { issueDecisionToken, verifyTokenSignature } = await import(
      '@/lib/admin-decision-token'
    );
    const { token } = await issueDecisionToken({
      email: 'rep@example.com',
      action: 'approve',
      category: 'psras-accredited',
    });
    const tampered = token.slice(0, -2) + (token.endsWith('aa') ? 'bb' : 'aa');
    const r = verifyTokenSignature(tampered);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('Invalid signature');
  });

  it('rejects a token whose payload has been swapped (action approve -> decline)', async () => {
    const { issueDecisionToken, verifyTokenSignature } = await import(
      '@/lib/admin-decision-token'
    );
    const { token } = await issueDecisionToken({
      email: 'rep@example.com',
      action: 'approve',
      category: 'psras-accredited',
    });
    const [, sig] = token.split('.');
    // Build a NEW payload with action=decline and try to keep the original sig.
    const fakePayload = Buffer.from(
      JSON.stringify({
        email: 'rep@example.com',
        action: 'decline',
        category: 'psras-accredited',
        exp: Math.floor(Date.now() / 1000) + 60,
        jti: 'spoof',
      }),
    )
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
    const r = verifyTokenSignature(`${fakePayload}.${sig}`);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('Invalid signature');
  });

  it('rejects a malformed token (no dot)', async () => {
    const { verifyTokenSignature } = await import('@/lib/admin-decision-token');
    const r = verifyTokenSignature('not-a-token');
    expect(r.ok).toBe(false);
  });

  it('rejects an empty token', async () => {
    const { verifyTokenSignature } = await import('@/lib/admin-decision-token');
    const r = verifyTokenSignature('');
    expect(r.ok).toBe(false);
  });
});

describe('admin-decision-token — expiry', () => {
  it('rejects a token whose exp is in the past', async () => {
    const { issueDecisionToken, verifyTokenSignature } = await import(
      '@/lib/admin-decision-token'
    );
    const { token, jti } = await issueDecisionToken({
      email: 'rep@example.com',
      action: 'approve',
      category: 'psras-accredited',
      ttlSeconds: 60,
    });
    // Forge an expired token by re-signing the same payload with exp in the past.
    const [payloadB64] = token.split('.');
    const decoded = JSON.parse(
      Buffer.from(
        payloadB64.replace(/-/g, '+').replace(/_/g, '/') +
          '='.repeat((4 - (payloadB64.length % 4)) % 4),
        'base64',
      ).toString('utf8'),
    );
    decoded.exp = Math.floor(Date.now() / 1000) - 10;
    decoded.jti = jti;
    const { buildToken } = await import('@/lib/admin-decision-token');
    const expired = buildToken(decoded);
    const r = verifyTokenSignature(expired);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('Token expired');
  });
});

describe('admin-decision-token — one-shot semantics', () => {
  it('peek does not delete the KV row', async () => {
    const { issueDecisionToken, peekDecisionToken } = await import(
      '@/lib/admin-decision-token'
    );
    const { token, jti } = await issueDecisionToken({
      email: 'rep@example.com',
      action: 'approve',
      category: 'psras-accredited',
    });
    const r1 = await peekDecisionToken(token);
    expect(r1.ok).toBe(true);
    const r2 = await peekDecisionToken(token);
    expect(r2.ok).toBe(true);
    expect(await fakeKV.get(`admin-decision-token:${jti}`)).not.toBeNull();
  });

  it('consume deletes the KV row and returns the payload', async () => {
    const { issueDecisionToken, consumeDecisionToken } = await import(
      '@/lib/admin-decision-token'
    );
    const { token, jti } = await issueDecisionToken({
      email: 'rep@example.com',
      action: 'approve',
      category: 'psras-accredited',
    });
    const r = await consumeDecisionToken(token);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.payload.email).toBe('rep@example.com');
    expect(await fakeKV.get(`admin-decision-token:${jti}`)).toBeNull();
  });

  it('a second consume of the same token returns 410 already used', async () => {
    const { issueDecisionToken, consumeDecisionToken } = await import(
      '@/lib/admin-decision-token'
    );
    const { token } = await issueDecisionToken({
      email: 'rep@example.com',
      action: 'approve',
      category: 'psras-accredited',
    });
    const a = await consumeDecisionToken(token);
    expect(a.ok).toBe(true);
    const b = await consumeDecisionToken(token);
    expect(b.ok).toBe(false);
    if (!b.ok) expect(b.status).toBe(410);
  });
});

describe('admin-decision-token — secret hardening', () => {
  it('refuses to operate with no secret configured', async () => {
    delete process.env.ADMIN_DECISION_TOKEN_SECRET;
    const { verifyTokenSignature } = await import('@/lib/admin-decision-token');
    const r = verifyTokenSignature('whatever.sig');
    expect(r.ok).toBe(false);
  });

  it('refuses to operate when the secret is too short', async () => {
    process.env.ADMIN_DECISION_TOKEN_SECRET = 'short';
    const { verifyTokenSignature } = await import('@/lib/admin-decision-token');
    const r = verifyTokenSignature('whatever.sig');
    expect(r.ok).toBe(false);
  });
});

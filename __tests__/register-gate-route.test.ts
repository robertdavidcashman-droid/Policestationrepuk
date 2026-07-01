/**
 * Integration tests for POST /api/register/gate.
 *
 * These exercise the full request handler against a fake KV. The Cloudflare
 * Turnstile gate has been removed from the registration flow (the widget was
 * the dominant cause of "I entered the email code but the form never opened"
 * support tickets), so abuse mitigation is now: honeypot + rate-limit +
 * mandatory PIN/SRA/proof + risk scoring + optional email-code verification.
 *
 * Key behaviours under test:
 *   - missing email / invalid category / no evidence → HTTP 400 + structured `code`
 *   - SRA 190283 (test user, "Solicitor") → HTTP 200 + gateToken + riskCategory='low'
 *   - PSRAS rep with PIN only → HTTP 200 + gateToken (no longer demands proof)
 *   - solicitor with PROOF URL only → HTTP 200 + gateToken (no SRA required)
 *   - honeypot tripped → HTTP 400 + code=HONEYPOT_TRIGGERED
 *   - ineligible category-label edge cases bubble up to the blocked panel
 *   - email-code wiring (enabled-but-missing) still rejects with EMAIL_CODE_REQUIRED
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

class FakeKV {
  private store = new Map<string, unknown>();
  get<T = unknown>(key: string): Promise<T | null> {
    return Promise.resolve((this.store.get(key) as T) ?? null);
  }
  set(key: string, value: unknown): Promise<'OK'> {
    this.store.set(key, value);
    return Promise.resolve('OK');
  }
  del(key: string): Promise<number> {
    const had = this.store.delete(key);
    return Promise.resolve(had ? 1 : 0);
  }
  keys(): Promise<string[]> {
    return Promise.resolve([...this.store.keys()]);
  }
  pipeline() {
    const ops: Array<() => unknown> = [];
    const self = this;
    return {
      zremrangebyscore: () => ops.push(() => 0),
      zcard: () => ops.push(() => 0),
      zadd: () => ops.push(() => 1),
      pexpire: () => ops.push(() => 1),
      get: (k: string) => ops.push(() => self.store.get(k) ?? null),
      exec: async () => ops.map((fn) => fn()),
    };
  }
  zremrangebyscore(): Promise<number> {
    return Promise.resolve(0);
  }
}

let fakeKV: FakeKV;

beforeEach(() => {
  fakeKV = new FakeKV();
  // Use stubEnv so the env mutation is reverted per-test, which keeps these
  // specs deterministic when vitest runs files in parallel.
  vi.stubEnv('REQUIRE_ENQUIRY_EMAIL_VERIFICATION', '');
  vi.resetModules();
  vi.doMock('@/lib/kv', () => ({
    getKV: () => fakeKV,
    skipKVInPrerender: () => false,
  }));
  // Suppress noisy console output from the safeLog calls.
  vi.spyOn(console, 'info').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.doUnmock('@/lib/kv');
  vi.restoreAllMocks();
});

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/register/gate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': '1.2.3.4',
    },
    body: JSON.stringify(body),
  });
}

async function callGate(body: unknown) {
  const { POST } = await import('@/app/api/register/gate/route');
  const res = await POST(makeRequest(body));
  return {
    status: res.status,
    body: (await res.json()) as Record<string, unknown>,
  };
}

describe('POST /api/register/gate — validation', () => {
  it('400 INVALID_EMAIL when email is missing', async () => {
    const r = await callGate({ category: 'solicitor', sraNumber: '190283' });
    expect(r.status).toBe(400);
    expect(r.body.code).toBe('INVALID_EMAIL');
  });

  it('400 INVALID_EMAIL when the email is malformed', async () => {
    const r = await callGate({
      email: 'not-an-email',
      category: 'solicitor',
      sraNumber: '190283',
    });
    expect(r.status).toBe(400);
    expect(r.body.code).toBe('INVALID_EMAIL');
  });

  it('400 INVALID_CATEGORY when category is unsupported', async () => {
    const r = await callGate({
      email: 'a@b.co',
      category: 'trainee',
      sraNumber: '190283',
    });
    expect(r.status).toBe(400);
    expect(r.body.code).toBe('INVALID_CATEGORY');
  });

  it('400 INVALID_PROOF_URL for non-https proof URLs', async () => {
    const r = await callGate({
      email: 'a@b.co',
      category: 'solicitor',
      proofUrl: 'ftp://not-allowed',
    });
    expect(r.status).toBe(400);
    expect(r.body.code).toBe('INVALID_PROOF_URL');
  });

  it('200 GATE_OK when SRA is present and proof URL is unfixable junk', async () => {
    const r = await callGate({
      email: 'a@b.co',
      category: 'solicitor',
      sraNumber: '190283',
      proofUrl: 'not a url',
    });
    expect(r.status).toBe(200);
    expect(r.body.code).toBe('GATE_OK');
    expect(r.body.gateData).toMatchObject({ proofUrl: '' });
  });

  it('200 GATE_OK for proof-only LinkedIn URL without https://', async () => {
    const r = await callGate({
      email: 'a@b.co',
      category: 'solicitor',
      proofUrl: 'www.linkedin.com/in/foo',
    });
    expect(r.status).toBe(200);
    expect(r.body.code).toBe('GATE_OK');
    expect(r.body.gateData).toMatchObject({
      proofUrl: 'https://www.linkedin.com/in/foo',
    });
  });

  it('400 INVALID_PROOF_URL when proof-only and unfixable junk', async () => {
    const r = await callGate({
      email: 'a@b.co',
      category: 'solicitor',
      proofUrl: 'not a url',
    });
    expect(r.status).toBe(400);
    expect(r.body.code).toBe('INVALID_PROOF_URL');
  });

  it('400 MISSING_EVIDENCE when a solicitor supplies neither SRA nor proof URL', async () => {
    const r = await callGate({ email: 'a@b.co', category: 'solicitor' });
    expect(r.status).toBe(400);
    expect(r.body.code).toBe('MISSING_EVIDENCE');
  });

  it('400 MISSING_EVIDENCE when a PSRAS rep supplies neither PIN nor proof URL', async () => {
    const r = await callGate({ email: 'a@b.co', category: 'psras-accredited' });
    expect(r.status).toBe(400);
    expect(r.body.code).toBe('MISSING_EVIDENCE');
  });

  it('400 HONEYPOT_TRIGGERED when the hidden field is populated', async () => {
    const r = await callGate({
      email: 'a@b.co',
      category: 'solicitor',
      sraNumber: '190283',
      _hp: 'bot was here',
    });
    expect(r.status).toBe(400);
    expect(r.body.code).toBe('HONEYPOT_TRIGGERED');
  });
});

describe('POST /api/register/gate — happy paths', () => {
  it('issues a low-risk gateToken for the test solicitor (SRA 190283)', async () => {
    const r = await callGate({
      email: 'robertdavidcashman+psrtest001@gmail.com',
      category: 'solicitor',
      sraNumber: '190283',
    });
    expect(r.status).toBe(200);
    expect(r.body.ok).toBe(true);
    expect(r.body.code).toBe('GATE_OK');
    expect(typeof r.body.gateToken).toBe('string');
    expect(r.body.riskCategory).toBe('low');
    expect(r.body.pendingManualReview).toBe(false);
  });

  it('issues a low-risk gateToken for a solicitor supplying SRA + proof URL', async () => {
    const r = await callGate({
      email: 'a@b.co',
      category: 'solicitor',
      sraNumber: '190283',
      proofUrl: 'https://beta.sra.org.uk/consumers/register/person/?sraNumber=190283',
    });
    expect(r.status).toBe(200);
    expect(r.body.ok).toBe(true);
    expect(r.body.riskCategory).toBe('low');
  });

  it('issues a low-risk gateToken for a PSRAS rep supplying only a PIN', async () => {
    const r = await callGate({
      email: 'a@b.co',
      category: 'psras-accredited',
      pinNumber: 'PIN-12345',
    });
    expect(r.status).toBe(200);
    expect(r.body.ok).toBe(true);
    expect(r.body.riskCategory).toBe('low');
  });

  it('issues a pending-manual-review gateToken for a solicitor supplying only a proof URL', async () => {
    const r = await callGate({
      email: 'a@b.co',
      category: 'solicitor',
      proofUrl: 'https://example.com/me',
    });
    expect(r.status).toBe(200);
    expect(r.body.ok).toBe(true);
    expect(r.body.riskCategory).toBe('medium');
    expect(r.body.pendingManualReview).toBe(true);
  });
});

describe('POST /api/register/gate — email code wiring', () => {
  it('rejects with EMAIL_CODE_REQUIRED when verification is enabled but no code is sent', async () => {
    vi.stubEnv('REQUIRE_ENQUIRY_EMAIL_VERIFICATION', '1');
    const r = await callGate({
      email: 'a@b.co',
      category: 'solicitor',
      sraNumber: '190283',
    });
    expect(r.status).toBe(400);
    expect(r.body.code).toBe('EMAIL_CODE_REQUIRED');
  });

  it('ignores any legacy turnstileToken field in the request body and still mints a gate token', async () => {
    // Older clients may still send a `turnstileToken` field; the new gate must
    // accept the request and ignore the field rather than 400ing.
    const r = await callGate({
      email: 'legacy@example.com',
      category: 'solicitor',
      sraNumber: '190283',
      turnstileToken: 'this-field-should-be-ignored',
    });
    expect(r.status).toBe(200);
    expect(r.body.ok).toBe(true);
    expect(r.body.code).toBe('GATE_OK');
    expect(typeof r.body.gateToken).toBe('string');
  });
});

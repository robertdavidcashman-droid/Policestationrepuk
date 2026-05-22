/**
 * Integration tests for POST /api/register/send-code.
 *
 * Validates the structured error contract:
 *   - INVALID_EMAIL when email is missing / malformed
 *   - HONEYPOT_TRIGGERED is silently treated as success
 *   - EMAIL_VERIFICATION_DISABLED when the env flag is off
 *   - TURNSTILE_MISSING when Turnstile is on but no token was supplied
 *   - EMAIL_CODE_STORE_UNAVAILABLE when KV is down
 *   - EMAIL_CODE_SEND_FAILED when Resend rejects the email
 *   - EMAIL_CODE_SENT on the happy path
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
    return {
      zremrangebyscore: () => ops.push(() => 0),
      zcard: () => ops.push(() => 0),
      zadd: () => ops.push(() => 1),
      pexpire: () => ops.push(() => 1),
      get: () => ops.push(() => null),
      exec: async () => ops.map((fn) => fn()),
    };
  }
  zremrangebyscore(): Promise<number> {
    return Promise.resolve(0);
  }
}

let fakeKV: FakeKV | null;
let sendEnquiryEmailCodeMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fakeKV = new FakeKV();
  vi.stubEnv('ENABLE_TURNSTILE', '');
  vi.stubEnv('TURNSTILE_SECRET', '');
  vi.stubEnv('REQUIRE_ENQUIRY_EMAIL_VERIFICATION', '');
  sendEnquiryEmailCodeMock = vi.fn().mockResolvedValue(true);
  vi.resetModules();
  vi.doMock('@/lib/kv', () => ({
    getKV: () => fakeKV,
    skipKVInPrerender: () => false,
  }));
  vi.doMock('@/lib/email', () => ({
    sendEnquiryEmailCode: sendEnquiryEmailCodeMock,
  }));
  vi.spyOn(console, 'info').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.doUnmock('@/lib/kv');
  vi.doUnmock('@/lib/email');
  vi.restoreAllMocks();
});

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/register/send-code', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': '1.2.3.4',
    },
    body: JSON.stringify(body),
  });
}

async function callSendCode(body: unknown) {
  const { POST } = await import('@/app/api/register/send-code/route');
  const res = await POST(makeRequest(body));
  return {
    status: res.status,
    body: (await res.json()) as Record<string, unknown>,
  };
}

describe('POST /api/register/send-code', () => {
  it('400 INVALID_EMAIL when email is missing', async () => {
    const r = await callSendCode({});
    expect(r.status).toBe(400);
    expect(r.body.code).toBe('INVALID_EMAIL');
  });

  it('200 EMAIL_VERIFICATION_DISABLED when the env flag is off (default)', async () => {
    const r = await callSendCode({ email: 'a@b.co' });
    expect(r.status).toBe(200);
    expect(r.body.code).toBe('EMAIL_VERIFICATION_DISABLED');
    expect(r.body.sent).toBe(false);
  });

  it('honeypot returns silent success', async () => {
    const r = await callSendCode({ email: 'a@b.co', _hp: 'bot' });
    expect(r.status).toBe(200);
    expect(r.body.code).toBe('EMAIL_CODE_SENT');
    expect(r.body.sent).toBe(true);
    expect(sendEnquiryEmailCodeMock).not.toHaveBeenCalled();
  });

  it('200 EMAIL_CODE_SENT when verification is enabled and email sends', async () => {
    vi.stubEnv('REQUIRE_ENQUIRY_EMAIL_VERIFICATION', '1');
    const r = await callSendCode({ email: 'a@b.co' });
    expect(r.status).toBe(200);
    expect(r.body.code).toBe('EMAIL_CODE_SENT');
    expect(sendEnquiryEmailCodeMock).toHaveBeenCalledTimes(1);
    expect((sendEnquiryEmailCodeMock.mock.calls[0] as [string, string])[0]).toBe('a@b.co');
  });

  it('502 EMAIL_CODE_SEND_FAILED when Resend rejects', async () => {
    vi.stubEnv('REQUIRE_ENQUIRY_EMAIL_VERIFICATION', '1');
    sendEnquiryEmailCodeMock.mockResolvedValueOnce(false);
    const r = await callSendCode({ email: 'a@b.co' });
    expect(r.status).toBe(502);
    expect(r.body.code).toBe('EMAIL_CODE_SEND_FAILED');
  });

  it('503 EMAIL_CODE_STORE_UNAVAILABLE when KV cannot mint the code', async () => {
    vi.stubEnv('REQUIRE_ENQUIRY_EMAIL_VERIFICATION', '1');
    fakeKV = null;
    vi.doMock('@/lib/kv', () => ({
      getKV: () => null,
      skipKVInPrerender: () => false,
    }));
    vi.resetModules();
    vi.doMock('@/lib/email', () => ({
      sendEnquiryEmailCode: sendEnquiryEmailCodeMock,
    }));
    const r = await callSendCode({ email: 'a@b.co' });
    expect(r.status).toBe(503);
    expect(r.body.code).toBe('EMAIL_CODE_STORE_UNAVAILABLE');
  });

  it('400 TURNSTILE_MISSING when Turnstile is enabled but no token is supplied', async () => {
    vi.stubEnv('ENABLE_TURNSTILE', '1');
    vi.stubEnv('TURNSTILE_SECRET', 'secret');
    vi.stubEnv('REQUIRE_ENQUIRY_EMAIL_VERIFICATION', '1');
    const r = await callSendCode({ email: 'a@b.co' });
    expect(r.status).toBe(400);
    expect(r.body.code).toBe('TURNSTILE_MISSING');
  });
});

/**
 * URL normalization behaviour for POST /api/register.
 */

import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest';
import { INVALID_PROOF_URL_MESSAGE } from '@/lib/normalize-url';

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
  vi.resetModules();
  vi.doMock('@/lib/kv', () => ({
    getKV: () => fakeKV,
    skipKVInPrerender: () => false,
  }));
  vi.spyOn(console, 'info').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.doUnmock('@/lib/kv');
  vi.restoreAllMocks();
});

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': '1.2.3.4',
    },
    body: JSON.stringify(body),
  });
}

async function callRegister(body: unknown) {
  const { POST } = await import('@/app/api/register/route');
  const res = await POST(makeRequest(body));
  return {
    status: res.status,
    body: (await res.json()) as Record<string, unknown>,
  };
}

const baseBody = {
  fullName: 'Mohamed Sourbah',
  email: 'sourbah@orwillosolicitors.com',
  mobile: '07123456789',
  category: 'solicitor',
  confirmAccredited: true,
  confirmAccurate: true,
};

describe('POST /api/register — URL normalization', () => {
  it('400 when proof URL is sole evidence and unfixable', async () => {
    const r = await callRegister({
      ...baseBody,
      proofUrl: 'not a url',
    });
    expect(r.status).toBe(400);
    expect(r.body.error).toBe(INVALID_PROOF_URL_MESSAGE);
  });

  it('403 requiresGate (not URL 400) when SRA present and proof URL is unfixable', async () => {
    const r = await callRegister({
      ...baseBody,
      sraNumber: '190283',
      proofUrl: 'not a url',
    });
    expect(r.status).toBe(403);
    expect(r.body.requiresGate).toBe(true);
  });

  it('403 requiresGate (not URL 400) when professional profile URL lacks protocol', async () => {
    const r = await callRegister({
      ...baseBody,
      sraNumber: '190283',
      professionalProfileUrl: 'www.linkedin.com/in/mohamed-sourbah',
    });
    expect(r.status).toBe(403);
    expect(r.body.requiresGate).toBe(true);
  });

  it('403 requiresGate (not URL 400) when optional website URL is junk', async () => {
    const r = await callRegister({
      ...baseBody,
      sraNumber: '190283',
      websiteUrl: 'not a website',
    });
    expect(r.status).toBe(403);
    expect(r.body.requiresGate).toBe(true);
  });
});

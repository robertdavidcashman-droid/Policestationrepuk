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
  set(key: string, value: unknown, opts?: { ex?: number; nx?: boolean }): Promise<'OK' | null> {
    if (opts?.nx && this.store.has(key)) return Promise.resolve(null);
    this.store.set(key, { value, ttlSec: opts?.ex, setAt: Date.now() });
    return Promise.resolve('OK');
  }
  del(key: string): Promise<number> {
    return Promise.resolve(this.store.delete(key) ? 1 : 0);
  }
}

let fakeKV: FakeKV;
const ORIGINAL_SECRET = process.env.ADMIN_DECISION_TOKEN_SECRET;

beforeEach(() => {
  fakeKV = new FakeKV();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-13T10:00:00.000Z'));
  process.env.ADMIN_DECISION_TOKEN_SECRET =
    'unit-test-secret-must-be-at-least-16-chars-long';
  vi.resetModules();
  vi.doMock('@/lib/kv', () => ({
    getKV: () => fakeKV,
    skipKVInPrerender: () => false,
  }));
});

afterEach(() => {
  vi.useRealTimers();
  if (ORIGINAL_SECRET == null) {
    delete process.env.ADMIN_DECISION_TOKEN_SECRET;
  } else {
    process.env.ADMIN_DECISION_TOKEN_SECRET = ORIGINAL_SECRET;
  }
  vi.doUnmock('@/lib/kv');
  vi.restoreAllMocks();
});

describe('send-approval-token', () => {
  it('issues, peeks by jti, claims, finalizes, and rejects replay', async () => {
    const {
      issueSendApprovalToken,
      peekSendApprovalByJti,
      tryClaimSendApproval,
      finalizeSendApproval,
      peekSendApprovalRef,
    } = await import('@/lib/firm-outreach/outreach/send-approval-token');

    const { jti } = await issueSendApprovalToken({
      recipient: 'robertdavidcashman@gmail.com',
    });

    const peek = await peekSendApprovalByJti(jti);
    expect(peek.ok).toBe(true);

    const claim = await tryClaimSendApproval(jti);
    expect(claim.ok).toBe(true);

    const duplicateClaim = await tryClaimSendApproval(jti);
    expect(duplicateClaim.ok).toBe(false);
    if (!duplicateClaim.ok) expect(duplicateClaim.status).toBe(409);

    await finalizeSendApproval(jti);

    const replay = await peekSendApprovalRef(jti);
    expect(replay.ok).toBe(false);
    if (!replay.ok) expect(replay.status).toBe(410);
  });

  it('issues, peeks, and consumes a legacy signed token', async () => {
    const {
      issueSendApprovalToken,
      peekSendApprovalToken,
      consumeSendApprovalToken,
    } = await import('@/lib/firm-outreach/outreach/send-approval-token');

    const { token } = await issueSendApprovalToken({
      recipient: 'robertdavidcashman@gmail.com',
    });

    const peek = await peekSendApprovalToken(token);
    expect(peek.ok).toBe(true);

    const consumed = await consumeSendApprovalToken(token);
    expect(consumed.ok).toBe(true);

    const replay = await consumeSendApprovalToken(token);
    expect(replay.ok).toBe(false);
    if (!replay.ok) expect(replay.status).toBe(410);
  });

  it('rejects tampered signature', async () => {
    const { issueSendApprovalToken, verifySendApprovalTokenSignature } = await import(
      '@/lib/firm-outreach/outreach/send-approval-token'
    );
    const { token } = await issueSendApprovalToken({
      recipient: 'robertdavidcashman@gmail.com',
    });
    const bad = token.slice(0, -4) + 'xxxx';
    const r = verifySendApprovalTokenSignature(bad);
    expect(r.ok).toBe(false);
  });

  it('tracks approval email dedup by date', async () => {
    const {
      wasOutreachApprovalEmailSent,
      markOutreachApprovalEmailSent,
      outreachApprovalDate,
    } = await import('@/lib/firm-outreach/outreach/send-approval-token');

    const date = outreachApprovalDate();
    expect(await wasOutreachApprovalEmailSent(date)).toBe(false);
    await markOutreachApprovalEmailSent(date);
    expect(await wasOutreachApprovalEmailSent(date)).toBe(true);
  });
});

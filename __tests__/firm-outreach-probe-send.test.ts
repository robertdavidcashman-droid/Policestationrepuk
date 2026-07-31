import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  send: vi.fn(),
  domains: vi.fn(),
}));

vi.mock('@/lib/firm-outreach/email-provider', () => ({
  getEmailProvider: () => ({
    name: 'resend',
    validateConfiguration: async () => ({ configured: true, provider: 'resend', errors: [] }),
    send: mocks.send,
  }),
}));

vi.mock('@/lib/firm-outreach/outreach/from-address', async () => {
  const actual = await vi.importActual<typeof import('@/lib/firm-outreach/outreach/from-address')>(
    '@/lib/firm-outreach/outreach/from-address',
  );
  return {
    ...actual,
    fetchResendVerifiedDomains: () => mocks.domains(),
    resolveOutreachFromAddress: async (campaignId: string) =>
      actual.resolveFromAddressForCampaign(campaignId, await mocks.domains()),
  };
});

import { runOutreachSendProbes } from '@/lib/firm-outreach/outreach/probe-send';

describe('runOutreachSendProbes', () => {
  beforeEach(() => {
    mocks.send.mockReset();
    mocks.domains.mockReset();
    mocks.domains.mockResolvedValue(new Set(['policestationrepuk.org']));
    mocks.send.mockResolvedValue({ ok: true, providerMessageId: 'msg_probe' });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true })) as unknown as typeof fetch,
    );
  });

  it('sends one probe per campaign using verified from-addresses', async () => {
    const result = await runOutreachSendProbes({ to: 'owner@example.com' });
    expect(result.ok).toBe(true);
    expect(result.probes).toHaveLength(2);
    expect(result.probes.every((p) => p.ok)).toBe(true);
    expect(mocks.send).toHaveBeenCalledTimes(2);

    const froms = mocks.send.mock.calls.map((c) => c[0].from as string);
    expect(froms[0]).toContain('@policestationrepuk.org');
    expect(froms[1]).toContain('@policestationrepuk.org'); // PSA fallback
    expect(result.probes[1]?.usedFallback).toBe(true);
    expect(result.probes[1]?.preferredDomainVerified).toBe(false);
  });

  it('dry-run skips provider sends but still reports domain resolution', async () => {
    const result = await runOutreachSendProbes({ to: 'owner@example.com', dryRun: true });
    expect(result.ok).toBe(true);
    expect(mocks.send).not.toHaveBeenCalled();
    expect(result.probes.every((p) => p.skipped && p.reason === 'dry_run')).toBe(true);
  });

  it('retries PSA probe with DEFAULT_PSA_FROM_FALLBACK even when preferred domain looks verified', async () => {
    // Preferred PSA domain still listed as verified, but Resend rejects the send.
    mocks.domains.mockResolvedValue(
      new Set(['policestationrepuk.org', 'policestationagent.com']),
    );
    mocks.send
      .mockResolvedValueOnce({ ok: true, providerMessageId: 'msg_repuk' })
      .mockResolvedValueOnce({ ok: false, error: 'domain is not verified' })
      .mockResolvedValueOnce({ ok: true, providerMessageId: 'msg_psa_fallback' });

    const result = await runOutreachSendProbes({ to: 'owner@example.com' });
    expect(result.ok).toBe(true);
    expect(mocks.send).toHaveBeenCalledTimes(3);

    const psaPreferred = mocks.send.mock.calls[1]?.[0].from as string;
    const psaFallback = mocks.send.mock.calls[2]?.[0].from as string;
    expect(psaPreferred).toContain('@policestationagent.com');
    expect(psaFallback).toBe('Police Station Agent <noreply@policestationrepuk.org>');
    expect(result.probes[1]?.ok).toBe(true);
    expect(result.probes[1]?.usedFallback).toBe(true);
    expect(result.probes[1]?.messageId).toBe('msg_psa_fallback');
  });
});

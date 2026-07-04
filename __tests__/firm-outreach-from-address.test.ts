import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AGENT_COVER_KENT_CAMPAIGN_ID } from '@/lib/firm-outreach/campaign-scope';
import {
  clearVerifiedDomainsCache,
  DEFAULT_PSA_FROM_FALLBACK,
  isDomainNotVerifiedError,
  parseFromAddressDomain,
  resolveFromAddressForCampaign,
  VERIFIED_FALLBACK_DOMAIN,
} from '@/lib/firm-outreach/outreach/from-address';
import { FIRM_OUTREACH_CAMPAIGN_ID } from '@/lib/firm-outreach/site-config';

describe('from-address resolution', () => {
  const ENV = process.env;

  beforeEach(() => {
    clearVerifiedDomainsCache();
    process.env = { ...ENV };
    delete process.env.FIRM_OUTREACH_PSA_FROM_EMAIL;
    delete process.env.FIRM_OUTREACH_FROM_EMAIL;
  });

  afterEach(() => {
    process.env = { ...ENV };
    clearVerifiedDomainsCache();
  });

  it('parses domain from formatted from-address', () => {
    expect(parseFromAddressDomain('Police Station Agent <noreply@policestationagent.com>')).toBe(
      'policestationagent.com',
    );
  });

  it('detects Resend domain-not-verified errors', () => {
    expect(
      isDomainNotVerifiedError('The policestationagent.com domain is not verified.'),
    ).toBe(true);
    expect(isDomainNotVerifiedError('rate limit exceeded')).toBe(false);
  });

  it('uses RepUK verified from when PSA domain is not verified', () => {
    const verified = new Set([VERIFIED_FALLBACK_DOMAIN]);
    const resolved = resolveFromAddressForCampaign(AGENT_COVER_KENT_CAMPAIGN_ID, verified);
    expect(resolved.usedFallback).toBe(true);
    expect(resolved.from).toBe(DEFAULT_PSA_FROM_FALLBACK);
    expect(resolved.domain).toBe(VERIFIED_FALLBACK_DOMAIN);
  });

  it('uses PSA preferred from when policestationagent.com is verified', () => {
    const verified = new Set(['policestationagent.com', VERIFIED_FALLBACK_DOMAIN]);
    const resolved = resolveFromAddressForCampaign(AGENT_COVER_KENT_CAMPAIGN_ID, verified);
    expect(resolved.usedFallback).toBe(false);
    expect(resolved.domain).toBe('policestationagent.com');
  });

  it('respects FIRM_OUTREACH_PSA_FROM_EMAIL when domain verified', () => {
    process.env.FIRM_OUTREACH_PSA_FROM_EMAIL = 'PSA Custom <custom@policestationagent.com>';
    const verified = new Set(['policestationagent.com']);
    const resolved = resolveFromAddressForCampaign(AGENT_COVER_KENT_CAMPAIGN_ID, verified);
    expect(resolved.from).toBe('PSA Custom <custom@policestationagent.com>');
    expect(resolved.usedFallback).toBe(false);
  });

  it('keeps RepUK on verified policestationrepuk.org', () => {
    const verified = new Set([VERIFIED_FALLBACK_DOMAIN]);
    const resolved = resolveFromAddressForCampaign(FIRM_OUTREACH_CAMPAIGN_ID, verified);
    expect(resolved.usedFallback).toBe(false);
    expect(resolved.domain).toBe(VERIFIED_FALLBACK_DOMAIN);
  });

  it('normalizes nested Resend domain list payloads', async () => {
    const { fetchResendVerifiedDomains } = await import('@/lib/firm-outreach/outreach/from-address');
    clearVerifiedDomainsCache();
    const domains = await fetchResendVerifiedDomains(async () => ({
      data: {
        data: [
          { name: 'policestationrepuk.org', status: 'verified' },
          { name: 'policestationagent.com', status: 'not_started' },
        ],
      },
    }));
    expect(domains.has('policestationrepuk.org')).toBe(true);
    expect(domains.has('policestationagent.com')).toBe(false);
  });
});

describe('sendOutreachEmail domain retry', () => {
  const ENV = process.env;
  const sendMock = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    clearVerifiedDomainsCache();
    process.env = { ...ENV, RESEND_API_KEY: 're_test' };
    sendMock.mockReset();
  });

  afterEach(() => {
    process.env = { ...ENV };
    vi.restoreAllMocks();
    clearVerifiedDomainsCache();
  });

  it('retries PSA send with verified RepUK from after domain-not-verified error', async () => {
    sendMock
      .mockResolvedValueOnce({
        error: { message: 'The policestationagent.com domain is not verified.' },
        data: null,
      })
      .mockResolvedValueOnce({ error: null, data: { id: 'msg_retry_ok' } });

    vi.doMock('resend', () => ({
      Resend: vi.fn().mockImplementation(function ResendMock() {
        return {
          domains: {
            list: vi.fn().mockResolvedValue({
              data: [
                { name: 'policestationagent.com', status: 'verified' },
                { name: 'policestationrepuk.org', status: 'verified' },
              ],
            }),
          },
          emails: { send: sendMock },
        };
      }),
    }));

    const { sendOutreachEmail } = await import('@/lib/firm-outreach/outreach/send');
    const result = await sendOutreachEmail({
      prospect: {
        id: 'fop_test',
        firmKey: 'test',
        firmName: 'Test LLP',
        prospectType: 'firm',
        status: 'ready_to_send',
        sequenceStep: 0,
        sources: ['laa'],
        priorityScore: 0,
        campaignId: AGENT_COVER_KENT_CAMPAIGN_ID,
        enrichAttempts: 0,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        email: 'test@example.co.uk',
      },
      step: 0,
    });

    expect(result.ok).toBe(true);
    expect(result.messageId).toBe('msg_retry_ok');
    expect(sendMock).toHaveBeenCalledTimes(2);
    expect(sendMock.mock.calls[1]?.[0]?.from).toBe(DEFAULT_PSA_FROM_FALLBACK);
  });
});

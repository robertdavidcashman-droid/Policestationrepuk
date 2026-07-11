import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  checkOperatorNotifyFromAddress,
  checkPsaFromAddressFallback,
  runSendHealthChecks,
} from '@/lib/firm-outreach/verify-checks';
import { VERIFIED_FALLBACK_DOMAIN } from '@/lib/firm-outreach/outreach/from-address';

const ENV = process.env;

describe('firm-outreach verify checks', () => {
  beforeEach(() => {
    process.env = { ...ENV };
    delete process.env.FIRM_OUTREACH_FROM_EMAIL;
    delete process.env.RESEND_API_KEY;
  });

  afterEach(() => {
    process.env = { ...ENV };
  });

  it('checkPsaFromAddressFallback passes with RepUK-only verified domains', () => {
    expect(checkPsaFromAddressFallback().ok).toBe(true);
  });

  it('checkOperatorNotifyFromAddress resolves RepUK domain', () => {
    const result = checkOperatorNotifyFromAddress();
    expect(result.ok).toBe(true);
    expect(result.detail).toContain(VERIFIED_FALLBACK_DOMAIN);
  });

  it('runSendHealthChecks skips live Resend when API key absent', async () => {
    const results = await runSendHealthChecks();
    expect(results).toHaveLength(1);
    expect(results[0]?.name).toBe('send_health_resend_live');
    expect(results[0]?.ok).toBe(true);
  });

  it('runSendHealthChecks includes PSA campaign when API key present', async () => {
    process.env.RESEND_API_KEY = 're_test_missing_live';
    const results = await runSendHealthChecks();
    const psa = results.find((r) => r.name === 'send_health_psa_campaign_present');
    expect(psa?.ok).toBe(true);
    expect(psa?.detail).toContain('policestation');
  });
});

import { describe, expect, it } from 'vitest';
import { isEmailRecipientAllowed, previewEmailAllowlist } from '@/lib/email-allowlist';

describe('preview email allowlist', () => {
  it('blocks non-allowlisted recipients on preview deployments', () => {
    process.env.VERCEL_ENV = 'preview';
    process.env.NODE_ENV = 'production';
    process.env.PREVIEW_EMAIL_ALLOWLIST = '1';
    delete process.env.FIRM_OUTREACH_DRY_RUN;

    expect(isEmailRecipientAllowed('robertdavidcashman@gmail.com')).toBe(true);
    expect(isEmailRecipientAllowed('other@example.com')).toBe(false);
    expect(previewEmailAllowlist()).toContain('robertdavidcashman@gmail.com');
  });

  it('allows all recipients in dry-run local gates', () => {
    process.env.VERCEL_ENV = 'preview';
    process.env.FIRM_OUTREACH_DRY_RUN = '1';
    delete process.env.PREVIEW_EMAIL_ALLOWLIST;
    expect(isEmailRecipientAllowed('other@example.com')).toBe(true);
  });
});

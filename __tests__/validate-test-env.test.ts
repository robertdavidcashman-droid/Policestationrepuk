import { describe, expect, it } from 'vitest';
import { validateSafeTestEnv } from '@/lib/pipeline-env';

describe('validateSafeTestEnv', () => {
  it('rejects production hosts in audit base URL', () => {
    process.env.AUDIT_BASE_URL = 'https://policestationrepuk.org';
    process.env.FIRM_OUTREACH_DRY_RUN = '1';
    const result = validateSafeTestEnv();
    expect(result.ok).toBe(false);
    expect(result.errors.join(' ')).toContain('production host');
  });

  it('passes with local base URL and dry-run outreach', () => {
    process.env.AUDIT_BASE_URL = 'http://127.0.0.1:3100';
    process.env.FIRM_OUTREACH_DRY_RUN = '1';
    const result = validateSafeTestEnv();
    expect(result.ok).toBe(true);
  });
});

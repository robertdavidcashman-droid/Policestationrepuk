import { describe, expect, it } from 'vitest';
import {
  classifyError,
  isPermanentError,
  isRetryableError,
} from '@/lib/automation/errors';

describe('automation error classification', () => {
  it('classifies auth failures as permanent', () => {
    const c = classifyError('Unauthorized: invalid API key');
    expect(c.category).toBe('auth');
    expect(c.retryable).toBe(false);
    expect(isPermanentError('Unauthorized')).toBe(true);
  });

  it('classifies rate limits as retryable', () => {
    expect(classifyError('Too many requests').category).toBe('rate_limit');
    expect(isRetryableError('429 Too Many Requests')).toBe(true);
  });

  it('classifies network timeouts as retryable', () => {
    expect(classifyError('fetch failed: timeout').category).toBe('network');
  });

  it('classifies missing config as permanent', () => {
    expect(classifyError('BUFFER_API_KEY missing').category).toBe('config');
    expect(isPermanentError('BUFFER_API_KEY is not configured')).toBe(true);
  });

  it('classifies content supply issues', () => {
    expect(classifyError('No posts available after cooldown').category).toBe(
      'quota_supply',
    );
  });
});

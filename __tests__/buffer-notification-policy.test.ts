import { describe, expect, it } from 'vitest';
import {
  shouldSendSchedulerFailureEmail,
  shouldSendSchedulerFailureForError,
  shouldSendSchedulerSkippedEmail,
} from '@/lib/buffer/notification-policy';
import { schedulerFailureErrorKey } from '@/lib/buffer/scheduler-notification-digest';

describe('buffer notification policy', () => {
  it('does not send failure email when reconciled after cooldown', () => {
    expect(
      shouldSendSchedulerFailureEmail({
        ok: true,
        skipped: true,
        reconciled: true,
        reason: 'Buffer already has 5/5 posts scheduled for today (cooldown exhausted)',
      }),
    ).toBe(false);
  });

  it('does not send failure email when ok with skipped KV run', () => {
    expect(
      shouldSendSchedulerFailureEmail({
        ok: true,
        skipped: true,
        reason: 'Already scheduled for this date',
      }),
    ).toBe(false);
  });

  it('sends failure email for genuine final failure', () => {
    expect(
      shouldSendSchedulerFailureEmail({
        ok: false,
        reason: 'BUFFER_API_KEY is not configured',
      }),
    ).toBe(true);
  });

  it('does not send skipped email (log only)', () => {
    expect(
      shouldSendSchedulerSkippedEmail({
        ok: true,
        skipped: true,
        reason: 'Already scheduled for this date',
      }),
    ).toBe(false);
  });

  it('suppresses failure email for rate-limit errors during throw path', () => {
    expect(shouldSendSchedulerFailureForError('createPost failed: too many requests')).toBe(false);
  });

  it('normalizes error keys for idempotent digest', () => {
    expect(schedulerFailureErrorKey('No posts after cooldown (pool 28, cooldown 5d)')).toBe(
      'no-posts-after-cooldown-pool-28-cooldown-5d',
    );
  });
});

import { describe, expect, it } from 'vitest';
import {
  sendBufferDailyFailureEmail,
  sendBufferDailySuccessEmail,
  sendBufferSchedulerFailureEmail,
  sendBufferSchedulerSkippedEmail,
} from '@/lib/buffer/email';

describe('sendBufferSchedulerFailureEmail', () => {
  it('does not throw when RESEND_API_KEY is absent', async () => {
    const result = await sendBufferSchedulerFailureEmail({
      error: 'BUFFER_API_KEY is not configured',
      date: '2026-06-08',
      adminEmail: 'robertdavidcashman@gmail.com',
    });
    expect(typeof result).toBe('boolean');
  });
});

describe('sendBufferSchedulerSkippedEmail', () => {
  it('does not throw when RESEND_API_KEY is absent', async () => {
    const result = await sendBufferSchedulerSkippedEmail({
      reason: 'Already scheduled for this date',
      date: '2026-06-08',
      postCount: 5,
      adminEmail: 'robertdavidcashman@gmail.com',
    });
    expect(typeof result).toBe('boolean');
  });
});

describe('sendBufferDailySuccessEmail', () => {
  it('does not throw when RESEND_API_KEY is absent', async () => {
    const result = await sendBufferDailySuccessEmail({
      date: '2026-06-12',
      total: 15,
      sent: 15,
      feedCounts: { policestationrepuk: 5 },
      posts: [{ slug: 'test-post', feed: 'policestationrepuk', channelService: 'linkedin', dueAt: '2026-06-12T10:00:00.000Z' }],
      adminEmail: 'robertdavidcashman@gmail.com',
    });
    expect(typeof result).toBe('boolean');
  });
});

describe('sendBufferDailyFailureEmail', () => {
  it('does not throw when RESEND_API_KEY is absent', async () => {
    const result = await sendBufferDailyFailureEmail({
      date: '2026-06-12',
      total: 15,
      failed: 1,
      problems: [{ slug: 'night-post', status: 'scheduled', dueAt: '2026-06-13T02:00:00.000Z', issue: 'still_scheduled_past_due' }],
      adminEmail: 'robertdavidcashman@gmail.com',
    });
    expect(typeof result).toBe('boolean');
  });
});

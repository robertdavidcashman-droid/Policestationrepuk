import { describe, expect, it } from 'vitest';
import { sendBufferSchedulerFailureEmail, sendBufferSchedulerSkippedEmail } from '@/lib/buffer/email';

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

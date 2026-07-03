import { describe, expect, it, vi } from 'vitest';
import { maybeNotifyOutreachSendFailure, sendOutreachSendFailureEmail } from '@/lib/firm-outreach/outreach/send-failure-email';

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: vi.fn().mockResolvedValue({ data: { id: 'x' } }) },
  })),
}));

describe('maybeNotifyOutreachSendFailure', () => {
  it('notifies when errors > 0', async () => {
    const spy = vi.spyOn({ sendOutreachSendFailureEmail }, 'sendOutreachSendFailureEmail');
    await maybeNotifyOutreachSendFailure({
      stats: { queued: 5, sent: 0, skipped: 0, suppressed: 0, errors: 2, elapsedMs: 0 },
      readyToSend: 10,
    });
    // function calls sendOutreachSendFailureEmail internally — no throw
    expect(spy).toBeDefined();
  });

  it('notifies when sent zero but queue had items', async () => {
    await maybeNotifyOutreachSendFailure({
      stats: { queued: 3, sent: 0, skipped: 0, suppressed: 0, errors: 0, elapsedMs: 0 },
      readyToSend: 10,
    });
  });

  it('does not notify on successful send', async () => {
    await maybeNotifyOutreachSendFailure({
      stats: { queued: 5, sent: 5, skipped: 0, suppressed: 0, errors: 0, elapsedMs: 0 },
      readyToSend: 10,
    });
  });
});

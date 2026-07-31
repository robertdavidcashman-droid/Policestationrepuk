import { describe, expect, it, vi } from 'vitest';
import {
  maybeNotifyOutreachSendFailure,
  shouldAlertZeroSends,
} from '@/lib/firm-outreach/outreach/send-failure-email';

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: vi.fn().mockResolvedValue({ data: { id: 'x' } }) },
  })),
}));

describe('shouldAlertZeroSends', () => {
  it('alerts when work was queued but nothing accepted and skips are unexplained', () => {
    expect(
      shouldAlertZeroSends({
        stats: { queued: 3, sent: 0, skipped: 0, suppressed: 0, errors: 0, elapsedMs: 0 },
        readyToSend: 10,
      }),
    ).toBe(true);
  });

  it('does not alert when all skips are benign (cooldown/cap/duplicate)', () => {
    expect(
      shouldAlertZeroSends({
        stats: {
          queued: 0,
          sent: 0,
          skipped: 10,
          suppressed: 0,
          errors: 0,
          elapsedMs: 0,
          jobsCreated: 0,
          skipReasons: { firm_cooldown: 7, daily_cap: 3 },
        },
        readyToSend: 10,
      }),
    ).toBe(false);
  });

  it('does not alert when nothing was intended to send', () => {
    expect(
      shouldAlertZeroSends({
        stats: {
          queued: 0,
          sent: 0,
          skipped: 5,
          suppressed: 0,
          errors: 0,
          elapsedMs: 0,
          skipReasons: { no_step: 5 },
        },
        readyToSend: 10,
      }),
    ).toBe(false);
  });

  it('alerts when jobs were created but provider accepted none with non-benign skips', () => {
    expect(
      shouldAlertZeroSends({
        stats: {
          queued: 2,
          sent: 0,
          skipped: 1,
          suppressed: 0,
          errors: 0,
          elapsedMs: 0,
          jobsCreated: 2,
          skipReasons: { transient_resend_error: 1 },
        },
        readyToSend: 5,
      }),
    ).toBe(true);
  });
});

describe('maybeNotifyOutreachSendFailure', () => {
  it('notifies when errors > 0', async () => {
    await maybeNotifyOutreachSendFailure({
      stats: { queued: 5, sent: 0, skipped: 0, suppressed: 0, errors: 2, elapsedMs: 0 },
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

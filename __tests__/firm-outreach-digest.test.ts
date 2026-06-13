import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockBuildReport = vi.fn();
const mockGetDailySendCount = vi.fn();
const mockWasSent = vi.fn();
const mockMarkSent = vi.fn();
const mockResendSend = vi.fn();

vi.mock('@/lib/firm-outreach/outreach/activity-report', () => ({
  buildOutreachActivityReport: (...args: unknown[]) => mockBuildReport(...args),
}));

vi.mock('@/lib/firm-outreach/storage', () => ({
  getDailySendCount: (...args: unknown[]) => mockGetDailySendCount(...args),
}));

vi.mock('@/lib/firm-outreach/outreach/daily-digest', () => ({
  outreachDigestDate: () => '2026-06-11',
  wasOutreachDigestSent: (...args: unknown[]) => mockWasSent(...args),
  markOutreachDigestSent: (...args: unknown[]) => mockMarkSent(...args),
}));

vi.mock('resend', () => ({
  Resend: vi.fn(function ResendMock() {
    return { emails: { send: (...args: unknown[]) => mockResendSend(...args) } };
  }),
}));

describe('sendDailyOutreachDigest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = 're_test';
    process.env.FIRM_OUTREACH_DIGEST_EMAIL = 'robertdavidcashman@gmail.com';
    mockWasSent.mockResolvedValue(false);
    mockGetDailySendCount.mockResolvedValue(2);
    mockBuildReport.mockResolvedValue({
      report: {
        summary: {
          readyToSend: 3,
          sentToday: 2,
          sentLast7Days: 10,
          discovered: 100,
          totalSends: 20,
          noEmail: 5,
          excluded: 1,
          unsubscribed: 0,
          joinedWhatsApp: 0,
        },
        readyToSendProspects: [
          {
            prospectId: 'fop_1',
            firmName: 'Alpha LLP',
            prospectType: 'firm',
            email: 'crime@alpha.co.uk',
            county: 'Kent',
            priorityScore: 80,
            sources: ['laa'],
            updatedAt: '2026-06-11T08:00:00.000Z',
            suppressed: false,
          },
        ],
        sends: [
          {
            sendId: 'fos_1',
            prospectId: 'fop_9',
            firmName: 'Beta LLP',
            prospectType: 'firm',
            email: 'info@beta.co.uk',
            sequenceStep: 0,
            touchLabel: 'Initial invite',
            subject: 'Police station cover',
            sendStatus: 'sent',
            prospectStatus: 'sent',
            sentAt: `${new Date().toISOString().slice(0, 10)}T09:15:00.000Z`,
            suppressed: false,
          },
        ],
      },
    });
    mockResendSend.mockResolvedValue({ data: { id: 'msg_1' } });
  });

  it('skips when digest already sent today', async () => {
    mockWasSent.mockResolvedValue(true);
    vi.resetModules();
    const { sendDailyOutreachDigest } = await import('@/lib/firm-outreach/outreach/digest-email');
    const result = await sendDailyOutreachDigest();
    expect(result.sent).toBe(false);
    expect(result.reason).toBe('already_sent_today');
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  it('emails ready queue and receipts to owner address', async () => {
    vi.resetModules();
    const { sendDailyOutreachDigest } = await import('@/lib/firm-outreach/outreach/digest-email');
    const result = await sendDailyOutreachDigest();
    expect(result.sent).toBe(true);
    expect(mockResendSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'robertdavidcashman@gmail.com',
        subject: expect.stringContaining('sent today'),
        html: expect.stringContaining('crime@alpha.co.uk'),
      }),
    );
    expect(mockMarkSent).toHaveBeenCalledWith('2026-06-11');
  });
});

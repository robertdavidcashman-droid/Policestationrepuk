import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from '@/app/api/outreach/send-approved/route';

const mockTryClaim = vi.fn();
const mockFinalize = vi.fn();
const mockRelease = vi.fn();
const mockRunOutreach = vi.fn();
const mockBuildReport = vi.fn();
const mockConfirmEmail = vi.fn();

vi.mock('@/lib/firm-outreach/outreach/send-approval-token', () => ({
  tryClaimSendApproval: (...args: unknown[]) => mockTryClaim(...args),
  finalizeSendApproval: (...args: unknown[]) => mockFinalize(...args),
  releaseSendApprovalClaim: (...args: unknown[]) => mockRelease(...args),
}));

vi.mock('@/lib/firm-outreach/outreach/run-outreach', () => ({
  runFirmOutreach: (...args: unknown[]) => mockRunOutreach(...args),
}));

vi.mock('@/lib/firm-outreach/outreach/activity-report', () => ({
  buildOutreachActivityReport: (...args: unknown[]) => mockBuildReport(...args),
}));

vi.mock('@/lib/firm-outreach/outreach/send-confirmation-email', () => ({
  sendOutreachSendConfirmationEmail: (...args: unknown[]) => mockConfirmEmail(...args),
}));

vi.mock('@/lib/firm-outreach/constants', () => ({
  outreachSendEnabled: () => true,
}));

const ENV = process.env;

describe('outreach send-approved route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...ENV };
    mockTryClaim.mockResolvedValue({
      ok: true,
      payload: { action: 'send_batch', date: '2026-06-13', recipient: 'a@b.com', exp: 999, jti: 'j1' },
    });
    mockFinalize.mockResolvedValue(undefined);
    mockRelease.mockResolvedValue(undefined);
    mockRunOutreach.mockResolvedValue({
      queued: 5,
      sent: 5,
      skipped: 0,
      suppressed: 0,
      errors: 0,
      elapsedMs: 100,
    });
    mockBuildReport.mockResolvedValue({
      report: {
        summary: { readyToSend: 115 },
        sends: [
          {
            firmName: 'Alpha',
            email: 'a@alpha.co.uk',
            touchLabel: 'Initial invite',
            sentAt: `${new Date().toISOString().slice(0, 10)}T10:00:00.000Z`,
          },
        ],
      },
    });
    mockConfirmEmail.mockResolvedValue(true);
  });

  afterEach(() => {
    process.env = { ...ENV };
  });

  it('GET returns 405', async () => {
    const res = GET();
    expect(res.status).toBe(405);
  });

  it('POST redirects to result on success', async () => {
    const form = new FormData();
    form.set('approvalRef', '11111111-1111-4111-8111-111111111111');
    const res = await POST(
      new Request('http://localhost/api/outreach/send-approved', {
        method: 'POST',
        body: form,
      }),
    );
    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toContain('sent=5');
    expect(mockRunOutreach).toHaveBeenCalledOnce();
    expect(mockConfirmEmail).toHaveBeenCalledOnce();
    expect(mockFinalize).toHaveBeenCalledOnce();
    expect(mockRelease).not.toHaveBeenCalled();
  });

  it('POST redirects on expired link', async () => {
    mockTryClaim.mockResolvedValue({
      ok: false,
      status: 410,
      error: 'already used',
    });
    const form = new FormData();
    form.set('approvalRef', 'used-jti');
    const res = await POST(
      new Request('http://localhost/api/outreach/send-approved', {
        method: 'POST',
        body: form,
      }),
    );
    expect(res.headers.get('location')).toContain('expired-or-already-used');
    expect(mockRunOutreach).not.toHaveBeenCalled();
  });

  it('POST releases claim when send fails', async () => {
    mockRunOutreach.mockRejectedValue(new Error('send boom'));
    const form = new FormData();
    form.set('approvalRef', '11111111-1111-4111-8111-111111111111');
    const res = await POST(
      new Request('http://localhost/api/outreach/send-approved', {
        method: 'POST',
        body: form,
      }),
    );
    expect(res.headers.get('location')).toContain('send-failed');
    expect(mockRelease).toHaveBeenCalledOnce();
    expect(mockFinalize).not.toHaveBeenCalled();
  });
});

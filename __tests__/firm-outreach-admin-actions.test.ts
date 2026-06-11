import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { FirmProspect } from '@/lib/firm-outreach/types';

const mockGetProspect = vi.fn();
const mockSaveProspect = vi.fn();
const mockIsSuppressed = vi.fn();
const mockSaveSend = vi.fn();
const mockSendOutreachEmail = vi.fn();
const mockGetSuppressionsByEmails = vi.fn();
const mockGetDailySendCount = vi.fn();
const mockIncrementDailySendCount = vi.fn();
const mockIsDuplicateInitialSend = vi.fn();

vi.mock('@/lib/firm-outreach/storage', () => ({
  getProspect: (...args: unknown[]) => mockGetProspect(...args),
  saveProspect: (...args: unknown[]) => mockSaveProspect(...args),
  isSuppressed: (...args: unknown[]) => mockIsSuppressed(...args),
  isDuplicateInitialSend: (...args: unknown[]) => mockIsDuplicateInitialSend(...args),
  saveSend: (...args: unknown[]) => mockSaveSend(...args),
  getSuppressionsByEmails: (...args: unknown[]) => mockGetSuppressionsByEmails(...args),
  getDailySendCount: (...args: unknown[]) => mockGetDailySendCount(...args),
  incrementDailySendCount: (...args: unknown[]) => mockIncrementDailySendCount(...args),
  createSendRecord: (input: Record<string, unknown>) => ({
    id: 'fos_test',
    status: 'queued',
    createdAt: '2026-06-11T12:00:00Z',
    ...input,
  }),
}));

vi.mock('@/lib/firm-outreach/outreach/send', () => ({
  sendOutreachEmail: (...args: unknown[]) => mockSendOutreachEmail(...args),
}));

vi.mock('@/lib/firm-outreach/constants', () => ({
  dailySendCap: () => 30,
}));

function excludedProspect(overrides: Partial<FirmProspect> = {}): FirmProspect {
  return {
    id: 'fop_ex1',
    prospectType: 'firm',
    firmName: 'Brachers LLP',
    firmKey: 'brachers-llp',
    email: 'info@brachers.co.uk',
    sources: ['archive'],
    status: 'excluded',
    excludedReason: 'archive_only_not_on_laa_or_dscc',
    priorityScore: 10,
    sequenceStep: 0,
    campaignId: 'whatsapp_invite_v1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    enrichAttempts: 0,
    ...overrides,
  };
}

describe('canManualSendProspect', () => {
  it('allows send when email present and not suppressed', async () => {
    const { canManualSendProspect } = await import('@/lib/firm-outreach/outreach/admin-actions');
    const result = canManualSendProspect(excludedProspect(), false);
    expect(result.ok).toBe(true);
  });

  it('blocks suppressed emails', async () => {
    const { canManualSendProspect } = await import('@/lib/firm-outreach/outreach/admin-actions');
    const result = canManualSendProspect(excludedProspect(), true);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('suppressed');
  });

  it('blocks prospects without email', async () => {
    const { canManualSendProspect } = await import('@/lib/firm-outreach/outreach/admin-actions');
    const result = canManualSendProspect(excludedProspect({ email: undefined }), false);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('no_email');
  });

  it('blocks duplicate initial sends to the same email', async () => {
    const { canManualSendProspect } = await import('@/lib/firm-outreach/outreach/admin-actions');
    const result = canManualSendProspect(excludedProspect(), false, true);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('duplicate_email');
  });
});

describe('restoreExcludedProspect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSaveProspect.mockResolvedValue(undefined);
  });

  it('restores excluded prospect to ready_to_send with manual source', async () => {
    mockGetProspect.mockResolvedValue(excludedProspect());

    const { restoreExcludedProspect } = await import('@/lib/firm-outreach/outreach/admin-actions');
    const result = await restoreExcludedProspect('fop_ex1');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.prospect.status).toBe('ready_to_send');
    expect(result.prospect.excludedReason).toBeUndefined();
    expect(result.prospect.sources).toContain('manual');
    expect(mockSaveProspect).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'ready_to_send', excludedReason: undefined }),
      'excluded',
    );
  });

  it('rejects non-excluded prospects', async () => {
    mockGetProspect.mockResolvedValue(excludedProspect({ status: 'discovered', excludedReason: undefined }));

    const { restoreExcludedProspect } = await import('@/lib/firm-outreach/outreach/admin-actions');
    const result = await restoreExcludedProspect('fop_ex1');

    expect(result.ok).toBe(false);
    expect(result.error).toBe('not_excluded');
  });

  it('returns not_found when prospect missing', async () => {
    mockGetProspect.mockResolvedValue(null);

    const { restoreExcludedProspect } = await import('@/lib/firm-outreach/outreach/admin-actions');
    const result = await restoreExcludedProspect('missing');

    expect(result.ok).toBe(false);
    expect(result.error).toBe('not_found');
  });
});

describe('manualSendProspect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSaveProspect.mockResolvedValue(undefined);
    mockSaveSend.mockResolvedValue(undefined);
    mockIsSuppressed.mockResolvedValue(false);
    mockIsDuplicateInitialSend.mockResolvedValue(false);
    mockSendOutreachEmail.mockResolvedValue({
      ok: true,
      subject: 'Police station cover',
      messageId: 'msg_123',
    });
  });

  it('dry run does not persist send or update prospect', async () => {
    mockGetProspect.mockResolvedValue(excludedProspect());

    const { manualSendProspect } = await import('@/lib/firm-outreach/outreach/admin-actions');
    const result = await manualSendProspect('fop_ex1', { dryRun: true });

    expect(result.ok).toBe(true);
    expect(mockSaveProspect).not.toHaveBeenCalled();
    expect(mockSaveSend).not.toHaveBeenCalled();
  });

  it('sends and marks prospect as sent', async () => {
    mockGetProspect.mockResolvedValue(excludedProspect());

    const { manualSendProspect } = await import('@/lib/firm-outreach/outreach/admin-actions');
    const result = await manualSendProspect('fop_ex1');

    expect(result.ok).toBe(true);
    expect(mockSendOutreachEmail).toHaveBeenCalledWith(
      expect.objectContaining({ step: 0, dryRun: false }),
    );
    expect(mockSaveProspect).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'sent', sequenceStep: 0 }),
      'excluded',
    );
    expect(mockSaveSend).toHaveBeenCalled();
  });

  it('blocks suppressed recipients', async () => {
    mockGetProspect.mockResolvedValue(excludedProspect());
    mockIsSuppressed.mockResolvedValue(true);

    const { manualSendProspect } = await import('@/lib/firm-outreach/outreach/admin-actions');
    const result = await manualSendProspect('fop_ex1');

    expect(result.ok).toBe(false);
    expect(result.error).toBe('suppressed');
    expect(mockSendOutreachEmail).not.toHaveBeenCalled();
  });

  it('blocks duplicate initial sends to the same email address', async () => {
    mockGetProspect.mockResolvedValue(excludedProspect());
    mockIsDuplicateInitialSend.mockResolvedValue(true);

    const { manualSendProspect } = await import('@/lib/firm-outreach/outreach/admin-actions');
    const result = await manualSendProspect('fop_ex1');

    expect(result.ok).toBe(false);
    expect(result.error).toBe('duplicate_email');
    expect(mockSendOutreachEmail).not.toHaveBeenCalled();
  });
});

describe('excludeProspect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSaveProspect.mockResolvedValue(undefined);
  });

  it('marks prospect as excluded with manual reason', async () => {
    mockGetProspect.mockResolvedValue(
      excludedProspect({ status: 'ready_to_send', excludedReason: undefined }),
    );

    const { excludeProspect } = await import('@/lib/firm-outreach/outreach/admin-actions');
    const result = await excludeProspect('fop_ex1');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.prospect.status).toBe('excluded');
    expect(result.prospect.excludedReason).toBe('manual_admin_exclude');
    expect(mockSaveProspect).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'excluded' }),
      'ready_to_send',
    );
  });
});

describe('bulkSendProspects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSaveProspect.mockResolvedValue(undefined);
    mockSaveSend.mockResolvedValue(undefined);
    mockIsSuppressed.mockResolvedValue(false);
    mockIsDuplicateInitialSend.mockResolvedValue(false);
    mockGetDailySendCount.mockResolvedValue(0);
    mockIncrementDailySendCount.mockResolvedValue(1);
    mockSendOutreachEmail.mockResolvedValue({
      ok: true,
      subject: 'Police station cover',
      messageId: 'msg_123',
    });
  });

  it('respects daily cap and skips when exhausted', async () => {
    mockGetDailySendCount.mockResolvedValue(30);
    mockGetProspect.mockResolvedValue(
      excludedProspect({ status: 'ready_to_send', excludedReason: undefined }),
    );

    const { bulkSendProspects } = await import('@/lib/firm-outreach/outreach/admin-actions');
    const result = await bulkSendProspects(['fop_ex1'], { respectDailyCap: true });

    expect(result.sent).toBe(0);
    expect(result.skipped).toBe(1);
    expect(result.results[0].error).toBe('daily_cap_reached');
    expect(mockSendOutreachEmail).not.toHaveBeenCalled();
  });

  it('dry run does not increment daily count', async () => {
    mockGetProspect.mockResolvedValue(
      excludedProspect({ status: 'ready_to_send', excludedReason: undefined }),
    );

    const { bulkSendProspects } = await import('@/lib/firm-outreach/outreach/admin-actions');
    const result = await bulkSendProspects(['fop_ex1'], { dryRun: true });

    expect(result.sent).toBe(1);
    expect(mockIncrementDailySendCount).not.toHaveBeenCalled();
    expect(mockSaveSend).not.toHaveBeenCalled();
  });
});

describe('bulkExcludeProspects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSaveProspect.mockResolvedValue(undefined);
  });

  it('excludes multiple prospects', async () => {
    mockGetProspect.mockImplementation((id: string) =>
      Promise.resolve(
        excludedProspect({
          id,
          status: 'ready_to_send',
          excludedReason: undefined,
        }),
      ),
    );

    const { bulkExcludeProspects } = await import('@/lib/firm-outreach/outreach/admin-actions');
    const result = await bulkExcludeProspects(['fop_ex1', 'fop_ex2']);

    expect(result.excluded).toBe(2);
    expect(mockSaveProspect).toHaveBeenCalledTimes(2);
  });
});

describe('POST /api/admin/firm-outreach restore and send', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('restore_excluded returns prospect when authorised', async () => {
    const prospect = excludedProspect({ status: 'ready_to_send', excludedReason: undefined });
    vi.doMock('@/lib/admin-auth', () => ({
      requireAdmin: vi.fn().mockResolvedValue({ ok: true, email: 'admin@test.co.uk' }),
    }));
    vi.doMock('@/lib/firm-outreach/outreach/admin-actions', () => ({
      restoreExcludedProspect: vi.fn().mockResolvedValue({ ok: true, prospect }),
      manualSendProspect: vi.fn(),
      excludeProspect: vi.fn(),
      bulkSendProspects: vi.fn(),
      bulkExcludeProspects: vi.fn(),
    }));

    const { POST } = await import('@/app/api/admin/firm-outreach/route');
    const res = await POST(
      new Request('http://localhost/api/admin/firm-outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore_excluded', prospectId: 'fop_ex1' }),
      }),
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.prospect.status).toBe('ready_to_send');
  });

  it('manual_send returns 409 when suppressed', async () => {
    vi.doMock('@/lib/admin-auth', () => ({
      requireAdmin: vi.fn().mockResolvedValue({ ok: true, email: 'admin@test.co.uk' }),
    }));
    vi.doMock('@/lib/firm-outreach/outreach/admin-actions', () => ({
      restoreExcludedProspect: vi.fn(),
      manualSendProspect: vi.fn().mockResolvedValue({ ok: false, error: 'suppressed' }),
      excludeProspect: vi.fn(),
      bulkSendProspects: vi.fn(),
      bulkExcludeProspects: vi.fn(),
    }));

    const { POST } = await import('@/app/api/admin/firm-outreach/route');
    const res = await POST(
      new Request('http://localhost/api/admin/firm-outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'manual_send', prospectId: 'fop_ex1' }),
      }),
    );

    expect(res.status).toBe(409);
  });
});

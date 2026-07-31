import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockGetDailySendCount = vi.fn();
const mockListReady = vi.fn();
const mockListSent = vi.fn();
const mockSend = vi.fn();

vi.mock('../lib/firm-outreach/storage', () => ({
  addSuppression: vi.fn(),
  createSendRecord: vi.fn(() => ({ id: 'send-1' })),
  excludeProspectDuplicateEmail: vi.fn(),
  getDailySendCount: (...args: unknown[]) => mockGetDailySendCount(...args),
  getGlobalResendQuotaRemaining: vi.fn(async () => 100),
  incrementDailySendCount: vi.fn(),
  incrementResendSendCount: vi.fn(),
  isDuplicateInitialSend: vi.fn(async () => false),
  isSuppressed: vi.fn(async () => false),
  listProspectsByRecordStatus: vi.fn(async (status: string) => {
    if (status === 'ready_to_send') return mockListReady();
    if (status === 'sent') return mockListSent();
    return [];
  }),
  listProspectsForFirmKey: vi.fn(async () => []),
  saveOutreachRunLog: vi.fn(),
  saveProspect: vi.fn(),
  saveSend: vi.fn(),
  refreshProspectStatusSnapshotCache: vi.fn(),
  reserveDailySendSlot: vi.fn(async () => ({ ok: true, count: 1 })),
  releaseDailySendSlot: vi.fn(),
  reserveHourlySendSlot: vi.fn(async () => ({ ok: true, count: 1 })),
  releaseHourlySendSlot: vi.fn(),
  utcHourBucket: () => '2026-07-31T12',
  getProspect: vi.fn(),
}));

vi.mock('../lib/firm-outreach/outreach/send', () => ({
  sendOutreachEmail: (...args: unknown[]) => mockSend(...args),
}));

vi.mock('../lib/firm-outreach/run-lock', () => ({
  claimProspectSend: vi.fn(async () => true),
}));

vi.mock('../lib/firm-outreach/qualification', () => ({
  qualifyProspectForOutreach: () => ({ qualified: true }),
  resolveStatusWithQualification: (_p: unknown, status: string) => status,
}));

vi.mock('../lib/firm-outreach/enrichment/validator', () => ({
  isPlausibleOutreachEmail: () => true,
  validateEmailForSend: async () => ({ ok: true }),
}));

vi.mock('../lib/firm-outreach/constants', () => ({
  dailySendCap: () => 50,
  outreachSendEnabled: () => true,
  outreachEnabled: () => true,
}));

vi.mock('../lib/firm-outreach/pause-state', () => ({
  isOutreachSendAllowed: vi.fn(async () => true),
  isOutreachPaused: vi.fn(async () => false),
  getAdminPauseState: vi.fn(async () => null),
}));

vi.mock('../lib/firm-outreach/outreach/from-address', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/firm-outreach/outreach/from-address')>();
  return {
    ...actual,
    assertOutreachSendReady: vi.fn(async () => ({
      ok: true,
      from: 'PoliceStationRepUK <noreply@policestationrepuk.org>',
    })),
  };
});

function readyProspect(id: string) {
  return {
    id,
    firmKey: `firm-${id}`,
    firmName: `Firm ${id}`,
    email: `${id}@example.com`,
    status: 'ready_to_send',
    sequenceStep: 0,
    campaignId: 'whatsapp_invite_v1',
    prospectType: 'firm',
    sources: ['laa'] as string[],
    priorityScore: 0,
    updatedAt: new Date().toISOString(),
  };
}

describe('runFirmOutreach daily cap vs batch limit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.FIRM_OUTREACH_DRY_RUN = 'true';
    mockSend.mockResolvedValue({ ok: true, subject: 'Hello', messageId: 'msg-1' });
  });

  it('uses remaining daily cap on later ticks when batch limit is smaller', async () => {
    mockGetDailySendCount.mockResolvedValue(25);
    mockListReady.mockResolvedValue(
      Array.from({ length: 40 }, (_, i) => readyProspect(`p${i + 1}`)),
    );
    mockListSent.mockResolvedValue([]);

    const { runFirmOutreach } = await import('../lib/firm-outreach/outreach/run-outreach');
    const stats = await runFirmOutreach({ limit: 25 });

    expect(stats.sent).toBe(25);
    expect(mockSend).toHaveBeenCalledTimes(25);
  });
});

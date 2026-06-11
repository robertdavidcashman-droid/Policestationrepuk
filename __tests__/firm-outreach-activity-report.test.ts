import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { FirmOutreachSend, FirmProspect } from '@/lib/firm-outreach/types';

const mockCountProspectsByStatus = vi.fn();
const mockListAllSends = vi.fn();
const mockListAllSuppressions = vi.fn();
const mockGetProspectsByIds = vi.fn();
const mockGetSuppressionsByEmails = vi.fn();
const mockListProspectIdsByStatus = vi.fn();

vi.mock('@/lib/firm-outreach/storage', () => ({
  countProspectsByStatus: (...args: unknown[]) => mockCountProspectsByStatus(...args),
  listAllSends: (...args: unknown[]) => mockListAllSends(...args),
  listAllSuppressions: (...args: unknown[]) => mockListAllSuppressions(...args),
  getProspectsByIds: (...args: unknown[]) => mockGetProspectsByIds(...args),
  getSuppressionsByEmails: (...args: unknown[]) => mockGetSuppressionsByEmails(...args),
  listProspectIdsByStatus: (...args: unknown[]) => mockListProspectIdsByStatus(...args),
}));

describe('buildOutreachActivityReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCountProspectsByStatus.mockResolvedValue({
      discovered: 4547,
      ready_to_send: 42,
      sent: 1,
      excluded: 4,
      no_email: 0,
      joined_whatsapp: 0,
      bounced: 0,
      unsubscribed: 0,
      enriched: 0,
    });
    mockListAllSuppressions.mockResolvedValue([]);
    mockGetProspectsByIds.mockResolvedValue(new Map());
    mockGetSuppressionsByEmails.mockResolvedValue(new Map());
    mockListProspectIdsByStatus.mockResolvedValue([]);
  });

  it('loads ready-to-send prospect ids for admin queue (batched mget)', async () => {
    mockListAllSends.mockResolvedValue([]);
    mockListProspectIdsByStatus.mockImplementation((status: string) => {
      if (status === 'sent') return Promise.resolve([]);
      if (status === 'excluded') return Promise.resolve([]);
      if (status === 'ready_to_send') return Promise.resolve(['fop_ready1']);
      return Promise.resolve([]);
    });
    mockGetProspectsByIds.mockImplementation((ids: string[]) => {
      if (ids.includes('fop_ready1')) {
        return Promise.resolve(
          new Map([
            [
              'fop_ready1',
              {
                id: 'fop_ready1',
                prospectType: 'firm',
                firmName: 'Crime Defence LLP',
                firmKey: 'crime-defence',
                email: 'crime@defence.co.uk',
                sources: ['laa'],
                status: 'ready_to_send',
                priorityScore: 80,
                sequenceStep: 0,
                campaignId: 'whatsapp_invite_v1',
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-02T00:00:00Z',
                enrichAttempts: 0,
              },
            ],
          ]),
        );
      }
      return Promise.resolve(new Map());
    });

    const { buildOutreachActivityReport } = await import(
      '@/lib/firm-outreach/outreach/activity-report'
    );
    const { report } = await buildOutreachActivityReport();

    expect(mockListProspectIdsByStatus).toHaveBeenCalledWith('ready_to_send');
    expect(report.readyToSendProspects).toHaveLength(1);
    expect(report.readyToSendProspects[0].firmName).toBe('Crime Defence LLP');
  });

  it('loads excluded prospect ids for admin excluded tab (batched mget)', async () => {
    mockListAllSends.mockResolvedValue([]);
    mockListProspectIdsByStatus.mockImplementation((status: string) => {
      if (status === 'sent') return Promise.resolve([]);
      if (status === 'excluded') return Promise.resolve(['fop_ex1']);
      return Promise.resolve([]);
    });
    mockGetProspectsByIds.mockImplementation((ids: string[]) => {
      if (ids.includes('fop_ex1')) {
        return Promise.resolve(
          new Map([
            [
              'fop_ex1',
              {
                id: 'fop_ex1',
                prospectType: 'firm',
                firmName: 'Brachers LLP',
                firmKey: 'brachers',
                email: 'info@brachers.co.uk',
                sources: ['archive'],
                status: 'excluded',
                excludedReason: 'archive_only_not_on_laa_or_dscc',
                priorityScore: 0,
                sequenceStep: 0,
                campaignId: 'whatsapp_invite_v1',
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-02T00:00:00Z',
                enrichAttempts: 0,
              },
            ],
          ]),
        );
      }
      return Promise.resolve(new Map());
    });

    const { buildOutreachActivityReport } = await import(
      '@/lib/firm-outreach/outreach/activity-report'
    );
    const { report } = await buildOutreachActivityReport();

    expect(mockListProspectIdsByStatus).toHaveBeenCalledWith('excluded');
    expect(report.excludedProspects).toHaveLength(1);
    expect(report.excludedProspects[0].excludedReason).toBe('archive_only_not_on_laa_or_dscc');
  });

  it('uses countProspectsByStatus for summary counts, not bulk discovered loads', async () => {
    mockListAllSends.mockResolvedValue([]);

    const { buildOutreachActivityReport } = await import(
      '@/lib/firm-outreach/outreach/activity-report'
    );
    const { report } = await buildOutreachActivityReport();

    expect(mockCountProspectsByStatus).toHaveBeenCalledTimes(1);
    expect(mockListProspectIdsByStatus).not.toHaveBeenCalledWith('discovered');
    expect(mockListProspectIdsByStatus).toHaveBeenCalledWith('ready_to_send');
    expect(report.summary.discovered).toBe(4547);
    expect(report.summary.readyToSend).toBe(42);
  });

  it('loads sent, excluded, and ready prospect ids (batched mget)', async () => {
    mockListAllSends.mockResolvedValue([]);
    mockListProspectIdsByStatus.mockImplementation((status: string) => {
      if (status === 'sent') return Promise.resolve(['fop_a', 'fop_b']);
      if (status === 'excluded') return Promise.resolve([]);
      if (status === 'ready_to_send') return Promise.resolve([]);
      return Promise.resolve([]);
    });

    const { buildOutreachActivityReport } = await import(
      '@/lib/firm-outreach/outreach/activity-report'
    );
    await buildOutreachActivityReport();

    expect(mockListProspectIdsByStatus).toHaveBeenCalledWith('sent');
    expect(mockListProspectIdsByStatus).toHaveBeenCalledWith('excluded');
    expect(mockListProspectIdsByStatus).toHaveBeenCalledWith('ready_to_send');
    expect(mockGetProspectsByIds).toHaveBeenCalledWith(['fop_a', 'fop_b']);
  });

  it('builds send rows with batched prospect and suppression lookups', async () => {
    const send: FirmOutreachSend = {
      id: 'fos_test1',
      prospectId: 'fop_abc',
      firmName: 'Test LLP',
      prospectType: 'firm',
      email: 'crime@test.co.uk',
      campaignId: 'whatsapp_invite_v1',
      sequenceStep: 0,
      subject: 'Police station cover',
      status: 'sent',
      createdAt: '2026-01-01T00:00:00Z',
      sentAt: '2026-01-02T00:00:00Z',
    };
    const prospect: FirmProspect = {
      id: 'fop_abc',
      prospectType: 'firm',
      firmName: 'Test LLP',
      firmKey: 'test-llp',
      county: 'Kent',
      sources: ['archive'],
      status: 'sent',
      priorityScore: 80,
      sequenceStep: 0,
      campaignId: 'whatsapp_invite_v1',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-02T00:00:00Z',
      enrichAttempts: 0,
    };

    mockListAllSends.mockResolvedValue([send]);
    mockGetProspectsByIds.mockResolvedValue(new Map([['fop_abc', prospect]]));
    mockGetSuppressionsByEmails.mockResolvedValue(new Map());

    const { buildOutreachActivityReport } = await import(
      '@/lib/firm-outreach/outreach/activity-report'
    );
    const { report } = await buildOutreachActivityReport();

    expect(mockGetProspectsByIds).toHaveBeenCalledWith(['fop_abc']);
    expect(mockGetSuppressionsByEmails).toHaveBeenCalledWith(['crime@test.co.uk']);
    expect(report.sends).toHaveLength(1);
    expect(report.sends[0].county).toBe('Kent');
    expect(report.sends[0].sendStatus).toBe('sent');
  });

  it('completes quickly with large discovered count (no per-prospect fetches for counts)', async () => {
    mockListAllSends.mockResolvedValue([]);
    mockCountProspectsByStatus.mockResolvedValue({
      discovered: 5000,
      ready_to_send: 100,
      sent: 0,
      excluded: 0,
      no_email: 0,
      joined_whatsapp: 0,
      bounced: 0,
      unsubscribed: 0,
      enriched: 0,
    });

    const { buildOutreachActivityReport } = await import(
      '@/lib/firm-outreach/outreach/activity-report'
    );

    const start = Date.now();
    await buildOutreachActivityReport();
    expect(Date.now() - start).toBeLessThan(500);
  });

  it('computes sentToday and sentLast7Days from send timestamps', async () => {
    const now = new Date();
    const todayIso = now.toISOString();
    const oldIso = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();

    mockListAllSends.mockResolvedValue([
      {
        id: 'fos_today',
        prospectId: 'fop_1',
        firmName: 'A',
        prospectType: 'firm',
        email: 'a@test.co.uk',
        campaignId: 'c',
        sequenceStep: 0,
        subject: 's',
        status: 'sent',
        createdAt: todayIso,
        sentAt: todayIso,
      },
      {
        id: 'fos_old',
        prospectId: 'fop_2',
        firmName: 'B',
        prospectType: 'firm',
        email: 'b@test.co.uk',
        campaignId: 'c',
        sequenceStep: 0,
        subject: 's',
        status: 'sent',
        createdAt: oldIso,
        sentAt: oldIso,
      },
    ]);

    const { buildOutreachActivityReport } = await import(
      '@/lib/firm-outreach/outreach/activity-report'
    );
    const { report } = await buildOutreachActivityReport();

    expect(report.summary.sentToday).toBe(1);
    expect(report.summary.sentLast7Days).toBe(1);
  });
});

describe('computeSendWindowCounts', () => {
  it('counts sends in UTC day and 7-day window', async () => {
    const { computeSendWindowCounts } = await import(
      '@/lib/firm-outreach/outreach/activity-report'
    );
    const now = Date.now();
    const today = new Date(now).toISOString();
    const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString();
    const tenDaysAgo = new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString();

    const counts = computeSendWindowCounts([
      { sentAt: today },
      { sentAt: threeDaysAgo },
      { sentAt: tenDaysAgo },
    ]);

    expect(counts.sentToday).toBe(1);
    expect(counts.sentLast7Days).toBe(2);
  });
});

describe('GET /api/admin/firm-outreach', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('returns ok payload with report and counts when admin authorised', async () => {
    vi.doMock('@/lib/admin-auth', () => ({
      requireAdmin: vi.fn().mockResolvedValue({ ok: true, email: 'admin@test.co.uk' }),
    }));
    vi.doMock('@/lib/kv', () => ({
      getKV: vi.fn().mockReturnValue({}),
    }));
    vi.doMock('@/lib/firm-outreach/outreach/activity-report', () => ({
      buildOutreachActivityReport: vi.fn().mockResolvedValue({
        prospectCounts: { discovered: 10, ready_to_send: 2 },
        report: {
          generatedAt: '2026-06-11T12:00:00Z',
          summary: {
            totalSends: 1,
            sentToday: 0,
            sentLast7Days: 0,
            uniqueRecipients: 1,
            bySendStatus: { sent: 1 },
            waClicks: 0,
            joinedWhatsApp: 0,
            bounced: 0,
            complained: 0,
            unsubscribed: 0,
            pendingFollowUp1: 0,
            pendingFollowUp2: 0,
            readyToSend: 2,
            discovered: 10,
            noEmail: 0,
            excluded: 0,
          },
          sends: [],
          readyToSendProspects: [],
          excludedProspects: [],
          suppressions: [],
        },
      }),
      emptyOutreachActivityReport: vi.fn(),
      activityReportToCsv: vi.fn(),
    }));
    vi.doMock('@/lib/firm-outreach/constants', () => ({
      dailySendCap: () => 30,
      outreachPaused: () => false,
      outreachSendEnabled: () => true,
    }));

    const { GET } = await import('@/app/api/admin/firm-outreach/route');
    const res = await GET(new Request('http://localhost/api/admin/firm-outreach'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.counts.discovered).toBe(10);
    expect(json.report.summary.totalSends).toBe(1);
  });
});

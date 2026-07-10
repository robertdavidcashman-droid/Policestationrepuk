import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/custody-discovery/email', () => ({
  sendCustodyDiscoveryBatchEmail: vi.fn(async () => true),
}));

vi.mock('@/lib/custody-discovery/batch', () => ({
  newBatchId: vi.fn(() => 'batch_test'),
  saveBatch: vi.fn(async () => undefined),
  markBatchNotified: vi.fn(async () => undefined),
}));

const getFinding = vi.fn();

vi.mock('@/lib/custody-discovery/storage', () => ({
  getFinding: (id: string) => getFinding(id),
}));

const addToDailyNotifyBucket = vi.fn();
const getDailyNotifyBucket = vi.fn();
const findUnsentDailyNotifyBucket = vi.fn();
const markDailyNotifySent = vi.fn();
const shouldSendDailyDigest = vi.fn();
const dailyNotifyDate = vi.fn(() => '2026-06-07');

vi.mock('@/lib/custody-discovery/daily-notify', () => ({
  addToDailyNotifyBucket: (...args: unknown[]) => addToDailyNotifyBucket(...args),
  getDailyNotifyBucket: (...args: unknown[]) => getDailyNotifyBucket(...args),
  findUnsentDailyNotifyBucket: (...args: unknown[]) => findUnsentDailyNotifyBucket(...args),
  markDailyNotifySent: (...args: unknown[]) => markDailyNotifySent(...args),
  shouldSendDailyDigest: (...args: unknown[]) => shouldSendDailyDigest(...args),
  dailyNotifyDate: (...args: unknown[]) => dailyNotifyDate(...args),
}));

import { flushPendingDailyDigest, notifyIfNewFindings } from '@/lib/custody-discovery/notify';
import { sendCustodyDiscoveryBatchEmail } from '@/lib/custody-discovery/email';

const baseStats = {
  suitesScanned: 5,
  searchesRun: 30,
  numbersExtracted: 10,
  findingsCreated: 2,
  findingsUpdated: 0,
  findingsRejected: 5,
  conflictsFlagged: 0,
  officialPagesFetched: 0,
  batchCursor: 10,
  batchStartIndex: 5,
  batchTotal: 95,
  scannedSuiteIds: ['suite-a', 'suite-b'],
  elapsedMs: 5000,
};

function mockFinding(id: string, confidenceScore: number, overrides: Record<string, unknown> = {}) {
  return {
    id,
    custodySuiteName: 'Test Suite',
    possiblePhoneNumber: '01634 123 456',
    sourceDomain: 'example.com',
    confidenceScore,
    confidenceLevel: confidenceScore > 50 ? 'medium' : 'low',
    aiReview: {
      recommendation: 'hold' as const,
      aiConfidence: 80,
      whyPublish: '',
      whyNot: 'Needs human review of the custody excerpt.',
      evidence: {
        quote: 'Test Suite custody desk **01634 123 456**',
        section: 'Contact',
        sourceUrl: 'https://example.com',
        sourceTitle: 'Contact',
        source: 'page_fetch' as const,
        fetchedAt: '2026-06-07T10:00:00.000Z',
      },
      publishVerified: false,
      flags: [],
      model: 'gpt-4o-mini',
      reviewedAt: '2026-06-07T10:00:00.000Z',
    },
    ...overrides,
  };
}

const ENV = process.env;

describe('custody discovery batch notification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...ENV, CUSTODY_AI_AUTO_PUBLISH: 'false' };
    shouldSendDailyDigest.mockReturnValue(true);
    getDailyNotifyBucket.mockResolvedValue(null);
    findUnsentDailyNotifyBucket.mockResolvedValue(null);
    addToDailyNotifyBucket.mockImplementation(async (_date, ids: string[]) => ({
      date: '2026-06-07',
      findingIds: ids,
      suitesScanned: 5,
      conflictsFlagged: 0,
      elapsedMs: 5000,
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
    process.env = { ...ENV };
  });

  it('flushes a queued daily digest when a later run has no new findings', async () => {
    const bucket = {
      date: '2026-06-07',
      findingIds: ['f1', 'f2'],
      suitesScanned: 10,
      conflictsFlagged: 1,
      elapsedMs: 8000,
    };
    getDailyNotifyBucket.mockResolvedValue(bucket);
    findUnsentDailyNotifyBucket.mockResolvedValue({ date: '2026-06-07', bucket });
    getFinding.mockImplementation(async (id: string) => mockFinding(id, 75));

    const result = await notifyIfNewFindings({ newFindingIds: [], stats: baseStats });

    expect(result.emailed).toBe(true);
    expect(result.newCount).toBe(0);
    expect(result.notifyCount).toBe(2);
    expect(sendCustodyDiscoveryBatchEmail).toHaveBeenCalledTimes(1);
    expect(markDailyNotifySent).toHaveBeenCalledWith('2026-06-07');
  });

  it('does not email when no new findings and nothing is queued', async () => {
    getDailyNotifyBucket.mockResolvedValue(null);

    const result = await notifyIfNewFindings({ newFindingIds: [], stats: baseStats });
    expect(result.emailed).toBe(false);
    expect(result.newCount).toBe(0);
    expect(sendCustodyDiscoveryBatchEmail).not.toHaveBeenCalled();
  });

  it('skips email when confidence is below 30%', async () => {
    getFinding.mockImplementation(async (id: string) => mockFinding(id, 29));

    const result = await notifyIfNewFindings({
      newFindingIds: ['f1', 'f2'],
      stats: baseStats,
    });

    expect(result.emailed).toBe(false);
    expect(result.notifyCount).toBe(0);
    expect(result.belowThresholdCount).toBe(2);
    expect(sendCustodyDiscoveryBatchEmail).not.toHaveBeenCalled();
    expect(addToDailyNotifyBucket).not.toHaveBeenCalled();
  });

  it('queues high-confidence findings but waits until evening digest window', async () => {
    getFinding.mockImplementation(async (id: string) => mockFinding(id, 75));
    shouldSendDailyDigest.mockReturnValue(false);

    const result = await notifyIfNewFindings({
      newFindingIds: ['f1', 'f2'],
      stats: baseStats,
    });

    expect(result.emailed).toBe(false);
    expect(result.pendingDailyDigest).toBe(true);
    expect(result.notifyCount).toBe(2);
    expect(sendCustodyDiscoveryBatchEmail).not.toHaveBeenCalled();
    expect(addToDailyNotifyBucket).toHaveBeenCalled();
  });

  it('sends one daily digest when in send window and not yet notified', async () => {
    getFinding.mockImplementation(async (id: string) => mockFinding(id, 75));

    const result = await notifyIfNewFindings({
      newFindingIds: ['f1', 'f2'],
      stats: baseStats,
    });

    expect(result.emailed).toBe(true);
    expect(result.notifyCount).toBe(2);
    expect(sendCustodyDiscoveryBatchEmail).toHaveBeenCalledTimes(1);
    expect(sendCustodyDiscoveryBatchEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        batch: expect.objectContaining({ findingIds: ['f1', 'f2'] }),
        findings: expect.arrayContaining([
          expect.objectContaining({ id: 'f1', confidenceScore: 75 }),
          expect.objectContaining({ id: 'f2', confidenceScore: 75 }),
        ]),
      }),
    );
    expect(markDailyNotifySent).toHaveBeenCalledWith('2026-06-07');
  });

  it('force-sends a queued digest before the evening window', async () => {
    const bucket = {
      date: '2026-06-07',
      findingIds: ['f1'],
      suitesScanned: 5,
      conflictsFlagged: 0,
      elapsedMs: 5000,
    };
    getDailyNotifyBucket.mockResolvedValue(bucket);
    findUnsentDailyNotifyBucket.mockResolvedValue({ date: '2026-06-07', bucket });
    getFinding.mockImplementation(async (id: string) => mockFinding(id, 75));
    shouldSendDailyDigest.mockReturnValue(false);

    const result = await flushPendingDailyDigest(new Date(), { force: true });

    expect(result.emailed).toBe(true);
    expect(result.notifyCount).toBe(1);
    expect(sendCustodyDiscoveryBatchEmail).toHaveBeenCalledTimes(1);
  });

  it('respects forceDigest on notifyIfNewFindings with new findings', async () => {
    getFinding.mockImplementation(async (id: string) => mockFinding(id, 75));
    shouldSendDailyDigest.mockReturnValue(false);

    const result = await notifyIfNewFindings({
      newFindingIds: ['f1'],
      stats: baseStats,
      forceDigest: true,
    });

    expect(result.emailed).toBe(true);
    expect(result.pendingDailyDigest).toBe(false);
    expect(sendCustodyDiscoveryBatchEmail).toHaveBeenCalledTimes(1);
  });

  it('does not send a second email on the same day', async () => {
    getFinding.mockImplementation(async (id: string) => mockFinding(id, 80));
    getDailyNotifyBucket.mockResolvedValue({
      date: '2026-06-07',
      findingIds: ['f1'],
      suitesScanned: 5,
      conflictsFlagged: 0,
      elapsedMs: 5000,
      notifiedAt: '2026-06-07T19:00:00.000Z',
    });

    const result = await notifyIfNewFindings({
      newFindingIds: ['f2'],
      stats: baseStats,
    });

    expect(result.emailed).toBe(false);
    expect(sendCustodyDiscoveryBatchEmail).not.toHaveBeenCalled();
  });

  it('never emails rep-directory findings even when manual approval is enabled', async () => {
    getFinding.mockImplementation(async (id: string) =>
      mockFinding(id, 75, {
        sourceDomain: 'policestationreps.com',
        aiReview: {
          recommendation: 'hold' as const,
          aiConfidence: 40,
          whyPublish: '',
          whyNot: 'Rep directory listing.',
          evidence: {
            quote: 'Call 0845 switchboard',
            section: 'Contact',
            sourceUrl: 'https://policestationreps.com/station',
            sourceTitle: 'Rep directory',
            source: 'page_fetch' as const,
            fetchedAt: '2026-06-07T10:00:00.000Z',
          },
          publishVerified: false,
          flags: [],
          model: 'gpt-4o-mini',
          reviewedAt: '2026-06-07T10:00:00.000Z',
        },
      }),
    );

    const result = await notifyIfNewFindings({
      newFindingIds: ['rep1', 'rep2'],
      stats: baseStats,
    });

    expect(result.emailed).toBe(false);
    expect(result.notifyCount).toBe(0);
    expect(sendCustodyDiscoveryBatchEmail).not.toHaveBeenCalled();
    expect(addToDailyNotifyBucket).not.toHaveBeenCalled();
  });
});

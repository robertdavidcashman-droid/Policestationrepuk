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
const markDailyNotifySent = vi.fn();
const shouldSendDailyDigest = vi.fn();
const dailyNotifyDate = vi.fn(() => '2026-06-07');

vi.mock('@/lib/custody-discovery/daily-notify', () => ({
  addToDailyNotifyBucket: (...args: unknown[]) => addToDailyNotifyBucket(...args),
  getDailyNotifyBucket: (...args: unknown[]) => getDailyNotifyBucket(...args),
  markDailyNotifySent: (...args: unknown[]) => markDailyNotifySent(...args),
  shouldSendDailyDigest: (...args: unknown[]) => shouldSendDailyDigest(...args),
  dailyNotifyDate: (...args: unknown[]) => dailyNotifyDate(...args),
}));

import { notifyIfNewFindings } from '@/lib/custody-discovery/notify';
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

function mockFinding(id: string, confidenceScore: number) {
  return {
    id,
    custodySuiteName: 'Test Suite',
    possiblePhoneNumber: '01634 123 456',
    confidenceScore,
    confidenceLevel: confidenceScore > 50 ? 'medium' : 'low',
  };
}

describe('custody discovery batch notification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    shouldSendDailyDigest.mockReturnValue(true);
    getDailyNotifyBucket.mockResolvedValue(null);
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
  });

  it('flushes a queued daily digest when a later run has no new findings', async () => {
    getDailyNotifyBucket.mockResolvedValue({
      date: '2026-06-07',
      findingIds: ['f1', 'f2'],
      suitesScanned: 10,
      conflictsFlagged: 1,
      elapsedMs: 8000,
    });
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
});

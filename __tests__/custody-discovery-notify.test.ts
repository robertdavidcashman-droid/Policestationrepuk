import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/lib/custody-discovery/email', () => ({
  sendCustodyDiscoveryBatchEmail: vi.fn(async () => true),
}));

vi.mock('@/lib/custody-discovery/batch', () => ({
  newBatchId: vi.fn(() => 'batch_test'),
  saveBatch: vi.fn(async () => undefined),
  markBatchNotified: vi.fn(async () => undefined),
}));

vi.mock('@/lib/custody-discovery/storage', () => ({
  getFinding: vi.fn(async (id: string) => ({
    id,
    custodySuiteName: 'Test Suite',
    possiblePhoneNumber: '01634 123 456',
    confidenceScore: 75,
    confidenceLevel: 'medium',
  })),
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

describe('custody discovery batch notification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not email when no new findings', async () => {
    const result = await notifyIfNewFindings({ newFindingIds: [], stats: baseStats });
    expect(result.emailed).toBe(false);
    expect(result.newCount).toBe(0);
    expect(sendCustodyDiscoveryBatchEmail).not.toHaveBeenCalled();
  });

  it('sends one summary email per batch with new findings', async () => {
    const result = await notifyIfNewFindings({
      newFindingIds: ['f1', 'f2'],
      stats: baseStats,
    });
    expect(result.emailed).toBe(true);
    expect(result.newCount).toBe(2);
    expect(sendCustodyDiscoveryBatchEmail).toHaveBeenCalledTimes(1);
    expect(sendCustodyDiscoveryBatchEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        batch: expect.objectContaining({ findingIds: ['f1', 'f2'] }),
        findings: expect.any(Array),
      }),
    );
  });
});

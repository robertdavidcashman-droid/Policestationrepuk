import { describe, expect, it, beforeEach } from 'vitest';
import type { CustodySuite } from '@/lib/custody-discovery/types';

function suite(id: string): CustodySuite {
  return {
    id,
    forceName: 'Test Force',
    forceDomain: 'test.police.uk',
    county: 'Testshire',
    custodySuiteName: `Suite ${id}`,
    policeStationName: `Station ${id}`,
    address: '1 Test St',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe('custody discovery cursor completion', () => {
  beforeEach(async () => {
    const { resetCursorForTests } = await import('@/lib/custody-discovery/cursor');
    await resetCursorForTests();
  });

  it('does not advance cursor on peek; commits after work completes', async () => {
    const { peekSuiteBatch, commitSuiteCursor, resetCursorForTests } = await import(
      '@/lib/custody-discovery/cursor'
    );
    const suites = ['a', 'b', 'c', 'd', 'e'].map(suite);
    await resetCursorForTests();

    const firstPeek = await peekSuiteBatch(suites, 2);
    expect(firstPeek.batch).toHaveLength(2);
    expect(firstPeek.batchStartIndex).toBe(0);

    const secondPeek = await peekSuiteBatch(suites, 2);
    expect(secondPeek.batchStartIndex).toBe(firstPeek.batchStartIndex);

    await commitSuiteCursor((firstPeek.batchStartIndex + 1) % firstPeek.total);

    const thirdPeek = await peekSuiteBatch(suites, 2);
    expect(thirdPeek.batchStartIndex).toBe(1);
  });
});

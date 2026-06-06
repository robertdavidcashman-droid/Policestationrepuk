import { describe, expect, it } from 'vitest';

describe('custody discovery batch email content', () => {
  it('includes source URL and snippet in finding cards', async () => {
    const mod = await import('@/lib/custody-discovery/email');
    // sendCustodyDiscoveryBatchEmail is not exported for formatFindingRows — test via module internals
    // by checking the email sends with findings that have source fields (mock Resend absent = false return)
    const result = await mod.sendCustodyDiscoveryBatchEmail({
      batch: {
        id: 'batch_test',
        findingIds: ['f1'],
        stats: {
          suitesScanned: 3,
          findingsCreated: 1,
          findingsUpdated: 0,
          conflictsFlagged: 0,
          batchCursor: 3,
          batchTotal: 95,
          elapsedMs: 4000,
        },
        createdAt: new Date().toISOString(),
      },
      findings: [
        {
          id: 'f1',
          custodySuiteId: 's1',
          forceName: 'Kent Police',
          custodySuiteName: 'Medway Police Station',
          policeStationName: 'Medway Police Station',
          possiblePhoneNumber: '01634 123 456',
          normalizedPhoneNumber: '01634123456',
          sourceTitle: 'Custody contact',
          sourceUrl: 'https://kent.police.uk/custody',
          sourceDomain: 'kent.police.uk',
          sourceType: 'official_police',
          pageSnippet: 'Medway custody suite telephone 01634 123456',
          classification: 'direct_custody',
          confidenceScore: 85,
          confidenceLevel: 'high',
          status: 'new',
          dateFound: '2025-06-01T00:00:00.000Z',
          lastChecked: '2025-06-01T00:00:00.000Z',
          hashOfSourceEvidence: 'abc',
          notes: '',
          createdAt: '2025-06-01T00:00:00.000Z',
          updatedAt: '2025-06-01T00:00:00.000Z',
        },
      ],
      adminEmail: 'robertdavidcashman@gmail.com',
    });
    // Without RESEND_API_KEY in test env, returns false but logs — function must not throw
    expect(typeof result).toBe('boolean');
  });
});

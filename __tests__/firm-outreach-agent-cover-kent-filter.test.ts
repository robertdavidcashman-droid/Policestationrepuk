import { describe, expect, it } from 'vitest';
import { normalizeFirmName } from '@robertcashman/firm-outreach-core';
import { filterAgentCoverKentInputs } from '@/lib/firm-outreach/discovery/run-discovery';
import type { RawProspectInput } from '@/lib/firm-outreach/merge-prospects';

describe('filterAgentCoverKentInputs', () => {
  it('keeps geo-Kent rows and DSCC firms matching Kent LAA names', () => {
    const kentLaa = new Set([normalizeFirmName('Kent Crime Defence LLP')]);
    const inputs: RawProspectInput[] = [
      {
        prospectType: 'firm',
        firmName: 'Maidstone Solicitors',
        county: 'Kent',
        source: 'laa',
      },
      {
        prospectType: 'firm',
        firmName: 'Kent Crime Defence LLP',
        source: 'dscc',
      },
      {
        prospectType: 'firm',
        firmName: 'Manchester Crime Ltd',
        source: 'dscc',
      },
      {
        prospectType: 'solicitor',
        firmName: 'Kent Crime Defence LLP',
        forename: 'A',
        surname: 'B',
        source: 'dscc',
      },
    ];

    const kept = filterAgentCoverKentInputs(inputs, kentLaa).map((i) => i.firmName);
    expect(kept).toEqual(['Maidstone Solicitors', 'Kent Crime Defence LLP']);
  });
});

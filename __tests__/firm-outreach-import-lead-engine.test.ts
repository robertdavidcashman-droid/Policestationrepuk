import { describe, expect, it } from 'vitest';
import {
  csvRowsToObjects,
  mapLeadEngineEmailConfidence,
  parseCsvText,
  leadEngineRowToInput,
} from '@/lib/firm-outreach/import-lead-engine';

describe('lead engine CSV import helpers', () => {
  it('parses quoted CSV fields', () => {
    const rows = parseCsvText('firm_name,email,notes\n"Smith LLP","info@smith.co.uk","hello, world"\n');
    expect(rows).toHaveLength(2);
    expect(rows[1]).toEqual(['Smith LLP', 'info@smith.co.uk', 'hello, world']);
  });

  it('maps CSV rows to objects', () => {
    const csv = [
      'firm_name,email,source_type,source_provider,website,town,county',
      'Crime LLP,crime@firm.co.uk,paid_provider,hunter.io,https://firm.co.uk,Maidstone,Kent',
    ].join('\n');
    const rows = csvRowsToObjects(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].firm_name).toBe('Crime LLP');
    expect(rows[0].email).toBe('crime@firm.co.uk');
  });

  it('maps Hunter rows to paid_api confidence', () => {
    expect(
      mapLeadEngineEmailConfidence({
        firm_name: 'X',
        email: 'a@b.co',
        source_type: 'paid_provider',
        source_provider: 'hunter.io',
      }),
    ).toBe('paid_api');
  });

  it('maps public website rows to crawled confidence', () => {
    expect(
      mapLeadEngineEmailConfidence({
        firm_name: 'X',
        email: 'a@b.co',
        source_type: 'public_website',
        email_type: 'generic',
      }),
    ).toBe('crawled');
  });

  it('builds prospect input from lead engine row', () => {
    const input = leadEngineRowToInput(
      {
        firm_name: 'Crime LLP',
        email: 'crime@firm.co.uk',
        website: 'https://firm.co.uk',
        town: 'Maidstone',
        county: 'Kent',
        criminal_relevance_score: '80',
      },
      'laa',
    );
    expect(input?.firmName).toBe('Crime LLP');
    expect(input?.email).toBe('crime@firm.co.uk');
    expect(input?.emailConfidence).toBe('crawled');
    expect(input?.source).toBe('laa');
  });
});

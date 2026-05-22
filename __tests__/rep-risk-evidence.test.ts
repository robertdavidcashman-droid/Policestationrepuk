/**
 * Guards the eligibility risk scorer against the regression that blocked
 * SRA number 190283 (Robert David Cashman) at the gate stage.
 *
 * Core rule: a genuine solicitor / PSRAS rep who supplies ONE piece of
 * accreditation evidence (PIN, SRA number, or proof URL) must NOT trigger
 * any HIGH risk flag. Missing the other evidence type becomes a MEDIUM
 * "pending manual review" signal at most.
 */

import { describe, expect, it } from 'vitest';
import { scoreRepRisk } from '@/lib/rep-risk';

function baseInput(overrides: Partial<Parameters<typeof scoreRepRisk>[0]> = {}) {
  // NOTE: avoid names starting with "test" / "admin" / "john doe" — those
  // trip the FAKE_NAME_PATTERNS heuristic and push the score to "high"
  // independently of the evidence rules under test.
  return {
    email: 'alice@example.com',
    phone: '07700900000',
    name: 'Alice Example',
    accreditation: 'Solicitor',
    counties: [],
    stations: [],
    notes: '',
    publicProfileNotes: '',
    registeredAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    lastVerifiedDate: new Date().toISOString(),
    ipAddress: '1.2.3.4',
    firmName: 'Example LLP',
    professionalProfileUrl: 'https://example.com/alice',
    adminApproved: true,
    ...overrides,
  };
}

describe('scoreRepRisk — accreditation evidence is OR not AND', () => {
  it('does not flag HIGH when a solicitor supplies an SRA number only', () => {
    const r = scoreRepRisk(
      baseInput({ accreditation: 'Solicitor', sraNumber: '190283' }),
    );
    expect(r.highRiskFlags).not.toContain(
      'Solicitor claimed but no SRA number and no proof URL',
    );
    expect(r.category).not.toBe('high');
  });

  it('does not flag HIGH when a solicitor supplies a proof URL only', () => {
    const r = scoreRepRisk(
      baseInput({
        accreditation: 'Solicitor',
        accreditationProofFile: 'https://example.com/me',
      }),
    );
    expect(r.highRiskFlags).not.toContain(
      'Solicitor claimed but no SRA number and no proof URL',
    );
    expect(r.category).not.toBe('high');
  });

  it('flags HIGH when a solicitor supplies neither SRA nor proof URL', () => {
    const r = scoreRepRisk(baseInput({ accreditation: 'Solicitor' }));
    expect(r.highRiskFlags).toContain(
      'Solicitor claimed but no SRA number and no proof URL',
    );
    expect(r.category).toBe('high');
  });

  it('does not flag HIGH for PSRAS rep with only a PIN', () => {
    const r = scoreRepRisk(
      baseInput({
        accreditation: 'Fully accredited PSRAS police station representative',
        pinNumber: 'PIN-12345',
      }),
    );
    expect(r.highRiskFlags).not.toContain(
      'PSRAS claimed but no PIN and no proof of accreditation',
    );
    expect(r.category).not.toBe('high');
  });

  it('does not flag HIGH for PSRAS rep with only a proof URL', () => {
    const r = scoreRepRisk(
      baseInput({
        accreditation: 'Fully accredited PSRAS police station representative',
        accreditationProofFile: 'https://example.com/cert',
      }),
    );
    expect(r.highRiskFlags).not.toContain(
      'PSRAS claimed but no PIN and no proof of accreditation',
    );
    expect(r.category).not.toBe('high');
  });

  it('flags HIGH when PSRAS rep supplies neither PIN nor proof URL', () => {
    const r = scoreRepRisk(
      baseInput({
        accreditation: 'Fully accredited PSRAS police station representative',
      }),
    );
    expect(r.highRiskFlags).toContain(
      'PSRAS claimed but no PIN and no proof of accreditation',
    );
  });

  it('still flags ineligible terminology before any other check', () => {
    const r = scoreRepRisk(
      baseInput({
        accreditation: 'Probationary representative',
        sraNumber: '190283',
      }),
    );
    expect(r.category).toBe('ineligible');
  });
});

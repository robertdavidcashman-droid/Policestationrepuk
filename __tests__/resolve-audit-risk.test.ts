import { describe, expect, it } from 'vitest';
import {
  resolveAuditRiskAssessment,
  scoreRepRisk,
  type RepRiskAssessment,
} from '@/lib/rep-risk';

function highRiskHeuristic(): RepRiskAssessment {
  return scoreRepRisk({
    email: 'legacy@example.com',
    phone: '',
    name: 'Jane',
    accreditation: 'Accredited rep',
    counties: ['Kent'],
    stations: [],
    notes: '',
    status: 'verified-psras',
    adminApproved: true,
    isPublic: true,
    lastVerifiedDate: new Date().toISOString(),
  });
}

describe('resolveAuditRiskAssessment', () => {
  it('shows low risk for register-verified reps despite heuristic high flags', () => {
    const heuristic = highRiskHeuristic();
    expect(heuristic.category).toBe('high');

    const resolved = resolveAuditRiskAssessment(heuristic, {
      adminNotes:
        '[auto] Passed regulatory directory check (dscc) at 2026-01-01. DSCC accredited register: Jane Smith.',
      verificationStatus: 'verified-psras',
      adminApproved: true,
      isPublic: true,
      lastVerifiedDate: '2026-01-01T00:00:00.000Z',
      riskCategory: 'low',
      riskReasons: ['Verified on DSCC accredited register'],
    });

    expect(resolved.category).toBe('low');
    expect(resolved.highRiskFlags).toEqual([]);
  });

  it('shows low risk when DSCC PIN matches register name', () => {
    const heuristic = highRiskHeuristic();
    const resolved = resolveAuditRiskAssessment(
      heuristic,
      null,
      {
        matched: true,
        note: 'DSCC PIN 1650: name matched on accredited register — JONATHAN MARK SALTER.',
      },
    );
    expect(resolved.category).toBe('low');
    expect(resolved.highRiskFlags).toEqual([]);
  });

  it('shows low risk for publicly verified reps without register notes', () => {
    const heuristic = highRiskHeuristic();
    const resolved = resolveAuditRiskAssessment(heuristic, {
      adminNotes: 'Approved manually',
      verificationStatus: 'verified-psras',
      adminApproved: true,
      isPublic: true,
      lastVerifiedDate: '2026-01-01T00:00:00.000Z',
    });

    expect(resolved.category).toBe('low');
    expect(resolved.highRiskFlags).toEqual([]);
  });

  it('keeps heuristic risk for unverified pending reps', () => {
    const heuristic = highRiskHeuristic();
    const resolved = resolveAuditRiskAssessment(heuristic, {
      adminNotes: 'Held for review',
      verificationStatus: 'verification-submitted',
      adminApproved: false,
      isPublic: false,
      lastVerifiedDate: null,
    });

    expect(resolved.category).toBe('high');
    expect(resolved.highRiskFlags.length).toBeGreaterThan(0);
  });
});

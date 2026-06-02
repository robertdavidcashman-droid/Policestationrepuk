import { describe, expect, it } from 'vitest';
import { validateCustodyNumber } from '@/lib/custody-tips/validate';
import { computeConsensus, mergeConsensus } from '@/lib/custody-tips/corroboration';
import type { CustodyTip } from '@/lib/custody-tips/types';

function tip(partial: Partial<CustodyTip> & Pick<CustodyTip, 'numberDigits' | 'repEmail'>): CustodyTip {
  return {
    id: partial.id ?? `t_${Math.random().toString(36).slice(2)}`,
    stationId: partial.stationId ?? 'st1',
    stationSlug: partial.stationSlug ?? 'station-1',
    stationName: partial.stationName ?? 'Station 1',
    number: partial.number ?? partial.numberDigits,
    numberDigits: partial.numberDigits,
    repEmail: partial.repEmail,
    repName: partial.repName,
    createdAt: partial.createdAt ?? new Date().toISOString(),
    status: partial.status ?? 'active',
    source: partial.source ?? 'contribute_page',
  };
}

describe('validateCustodyNumber', () => {
  it('accepts a valid UK landline and formats it', () => {
    const r = validateCustodyNumber('01622604185');
    expect(r.ok).toBe(true);
    expect(r.digits).toBe('01622604185');
  });

  it('rejects 101 and 999', () => {
    expect(validateCustodyNumber('101').ok).toBe(false);
    expect(validateCustodyNumber('999').ok).toBe(false);
  });

  it('rejects mobiles and switchboards', () => {
    expect(validateCustodyNumber('07911 123456').ok).toBe(false);
    expect(validateCustodyNumber('08452 777444').ok).toBe(false);
  });

  it('rejects prose / non-numbers', () => {
    expect(validateCustodyNumber('call the front desk').ok).toBe(false);
    expect(validateCustodyNumber('').ok).toBe(false);
  });
});

describe('computeConsensus', () => {
  it('returns null with no tips', () => {
    expect(computeConsensus('st1', [])).toBeNull();
  });

  it('single rep -> unverified with caveat', () => {
    const c = computeConsensus('st1', [tip({ numberDigits: '01622604185', repEmail: 'a@x.com' })])!;
    expect(c.status).toBe('unverified');
    expect(c.confirmedBy).toBe(1);
    expect(c.conflict).toBe(false);
    expect(c.dateVerified).toBeNull();
  });

  it('two independent reps agreeing -> verified', () => {
    const c = computeConsensus('st1', [
      tip({ numberDigits: '01622604185', repEmail: 'a@x.com' }),
      tip({ numberDigits: '01622604185', repEmail: 'b@x.com' }),
    ])!;
    expect(c.status).toBe('verified');
    expect(c.confirmedBy).toBe(2);
    expect(c.dateVerified).not.toBeNull();
  });

  it('same rep twice does not self-corroborate', () => {
    const c = computeConsensus('st1', [
      tip({ numberDigits: '01622604185', repEmail: 'a@x.com' }),
      tip({ numberDigits: '01622604185', repEmail: 'a@x.com' }),
    ])!;
    expect(c.confirmedBy).toBe(1);
    expect(c.status).toBe('unverified');
  });

  it('one rep matching an official number -> verified', () => {
    const c = computeConsensus(
      'st1',
      [tip({ numberDigits: '01622604185', repEmail: 'a@x.com' })],
      '01622604185',
    )!;
    expect(c.status).toBe('verified');
  });

  it('flags a conflict when reps disagree, winner by count', () => {
    const c = computeConsensus('st1', [
      tip({ numberDigits: '01622604185', repEmail: 'a@x.com' }),
      tip({ numberDigits: '01622604185', repEmail: 'b@x.com' }),
      tip({ numberDigits: '01999999999', repEmail: 'c@x.com' }),
    ])!;
    expect(c.conflict).toBe(true);
    expect(c.numberDigits).toBe('01622604185');
    expect(c.status).toBe('verified');
  });
});

describe('mergeConsensus', () => {
  it('preserves the original verification date when the number is unchanged', () => {
    const prev = computeConsensus(
      'st1',
      [
        tip({ numberDigits: '01622604185', repEmail: 'a@x.com' }),
        tip({ numberDigits: '01622604185', repEmail: 'b@x.com' }),
      ],
      undefined,
      new Date('2026-01-01T00:00:00Z'),
    )!;
    const next = computeConsensus(
      'st1',
      [
        tip({ numberDigits: '01622604185', repEmail: 'a@x.com' }),
        tip({ numberDigits: '01622604185', repEmail: 'b@x.com' }),
        tip({ numberDigits: '01622604185', repEmail: 'c@x.com' }),
      ],
      undefined,
      new Date('2026-03-01T00:00:00Z'),
    )!;
    const merged = mergeConsensus(prev, next);
    expect(merged.dateVerified).toBe('2026-01-01');
    expect(merged.confirmedBy).toBe(3);
  });
});

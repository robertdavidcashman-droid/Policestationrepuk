import { describe, it, expect } from 'vitest';
import {
  isDialablePhone,
  migratePhoneProvenanceToVerification,
  stationVerificationKey,
} from '@/lib/station-verification';

describe('station-verification', () => {
  it('detects dialable vs prose phone values', () => {
    expect(isDialablePhone('01622 123456')).toBe(true);
    expect(isDialablePhone('')).toBe(false);
    expect(isDialablePhone('not publicly listed')).toBe(false);
  });

  it('migrates legacy phone provenance into verification records', () => {
    const provenance = {
      'PE234300019': {
        custodyPhone: {
          number: '0118 953 6000',
          source: 'legacy seed',
          verifiedAt: '2026-06-02',
          confidence: 'medium' as const,
          field: 'custodyPhone' as const,
        },
      },
    };
    const out = migratePhoneProvenanceToVerification(provenance, {});
    expect(out['PE234300019']?.fields?.custodyPhone?.dateVerified).toBe('2026-06-02');
  });

  it('uses stationId then id then slug for keys', () => {
    expect(
      stationVerificationKey({ id: 'id1', stationId: 'PE1', slug: 'foo' }),
    ).toBe('PE1');
    expect(stationVerificationKey({ id: 'id1', slug: 'foo' })).toBe('id1');
  });
});

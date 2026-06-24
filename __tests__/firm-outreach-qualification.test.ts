import { describe, expect, it } from 'vitest';
import {
  archiveFirmsToInputs,
  buildProspectFromInput,
  mergeProspect,
} from '@/lib/firm-outreach/merge-prospects';
import {
  buildCrimeRegistry,
  isOnCrimeRegistry,
  qualifyProspectForOutreach,
  resolveStatusWithQualification,
} from '@/lib/firm-outreach/qualification';
import type { FirmProspect } from '@/lib/firm-outreach/types';

const laaSample = [
  { firmName: 'Abraham Solicitors', category: 'Crime', postcode: 'LL11 1HR', town: 'Wrexham' },
  { firmName: 'Crime Defence LLP', category: 'Crime', postcode: 'ME14 1AB', town: 'Maidstone' },
];

const dsccSample = [
  { firm: 'Crime Defence LLP', forename: 'Jane', surname: 'Smith', title: 'Ms' },
];

function registry() {
  return buildCrimeRegistry(laaSample, dsccSample);
}

describe('crime registry', () => {
  it('matches LAA and DSCC firm names', () => {
    const reg = registry();
    expect(isOnCrimeRegistry('Abraham Solicitors', reg)).toBe(true);
    expect(isOnCrimeRegistry('Crime Defence LLP', reg)).toBe(true);
    expect(isOnCrimeRegistry('Brachers LLP', reg)).toBe(false);
  });
});

describe('archive import gating', () => {
  it('excludes Brachers-style firms not on LAA or DSCC', () => {
    const reg = registry();
    const inputs = archiveFirmsToInputs(
      [
        {
          name: 'Brachers LLP',
          sraNumber: '568123',
          postcode: 'ME19 4UA',
          email: 'info@brachers.co.uk',
          criminalLawPractice: true,
          policeStationWork: true,
        },
        {
          name: 'Abraham Solicitors',
          postcode: 'LL11 1HR',
          email: 'info@abrahamsolicitors.co.uk',
          criminalLawPractice: true,
        },
      ],
      reg,
    );
    expect(inputs).toHaveLength(1);
    expect(inputs[0].firmName).toBe('Abraham Solicitors');
    expect(inputs[0].source).toBe('laa');
  });

  it('ignores stale criminalLawPractice flags without registry match', () => {
    const reg = registry();
    const inputs = archiveFirmsToInputs(
      [
        {
          name: 'Browne Jacobson LLP',
          postcode: 'NG1 5DW',
          email: 'info@brownejacobson.com',
          criminalLawPractice: true,
        },
      ],
      reg,
    );
    expect(inputs).toHaveLength(0);
  });
});

describe('outreach qualification', () => {
  it('does not mark archive-only firms ready_to_send', () => {
    const prospect = buildProspectFromInput({
      prospectType: 'firm',
      firmName: 'Brachers LLP',
      postcode: 'ME19 4UA',
      email: 'info@brachers.co.uk',
      source: 'archive',
    })!;
    expect(prospect.status).toBe('discovered');
    expect(qualifyProspectForOutreach(prospect).qualified).toBe(false);
  });

  it('marks LAA firms with email ready_to_send', () => {
    const prospect = buildProspectFromInput({
      prospectType: 'firm',
      firmName: 'Abraham Solicitors',
      postcode: 'LL11 1HR',
      email: 'info@abrahamsolicitors.co.uk',
      source: 'laa',
    })!;
    expect(prospect.status).toBe('ready_to_send');
    expect(qualifyProspectForOutreach(prospect).qualified).toBe(true);
  });

  it('qualifies DSCC duty solicitors only', () => {
    const qualified = buildProspectFromInput({
      prospectType: 'solicitor',
      firmName: 'Crime Defence LLP',
      surname: 'Smith',
      source: 'dscc',
    })!;
    const unqualified = buildProspectFromInput({
      prospectType: 'solicitor',
      firmName: 'Random LLP',
      surname: 'Jones',
      source: 'archive',
    })!;
    expect(qualifyProspectForOutreach(qualified).qualified).toBe(true);
    expect(qualifyProspectForOutreach(unqualified).qualified).toBe(false);
  });

  it('qualifies directory listings', () => {
    const prospect = buildProspectFromInput({
      prospectType: 'firm',
      firmName: 'Listed Firm',
      postcode: 'ME14 1AB',
      email: 'crime@listed.co.uk',
      source: 'directory',
    })!;
    expect(prospect.status).toBe('ready_to_send');
  });

  it('promotes LAA prospect when archive email merges in', () => {
    const laa = buildProspectFromInput({
      prospectType: 'firm',
      firmName: 'Abraham Solicitors',
      postcode: 'LL11 1HR',
      source: 'laa',
    })!;
    const archive = buildProspectFromInput({
      prospectType: 'firm',
      firmName: 'Abraham Solicitors',
      postcode: 'LL11 1HR',
      email: 'info@abrahamsolicitors.co.uk',
      source: 'archive',
    })!;
    const merged = mergeProspect(laa, archive);
    expect(merged.sources).toContain('laa');
    expect(merged.email).toBe('info@abrahamsolicitors.co.uk');
    expect(merged.status).toBe('ready_to_send');
  });

  it('keeps archive-only legacy prospects unqualified even with registry corroboration at requalify', () => {
    const reg = registry();
    const legacy: Pick<FirmProspect, 'prospectType' | 'sources' | 'status' | 'firmName' | 'email'> = {
      prospectType: 'firm',
      firmName: 'Abraham Solicitors',
      sources: ['archive'],
      status: 'ready_to_send',
      email: 'info@abrahamsolicitors.co.uk',
    };
    expect(qualifyProspectForOutreach(legacy, reg).qualified).toBe(true);
    expect(
      resolveStatusWithQualification(
        { ...legacy, excludedReason: undefined, regulatoryNumber: undefined },
        'ready_to_send',
        reg,
      ),
    ).toBe('ready_to_send');
  });

  it('restores ready_to_send for website-verified excluded archive firms', () => {
    const kingsley: Pick<
      FirmProspect,
      | 'prospectType'
      | 'sources'
      | 'status'
      | 'firmName'
      | 'email'
      | 'excludedReason'
      | 'regulatoryNumber'
      | 'crimeWebsiteVerified'
    > = {
      prospectType: 'firm',
      firmName: 'Kingsley Napley LLP',
      sources: ['archive'],
      status: 'excluded',
      excludedReason: 'archive_only_not_on_laa_or_dscc',
      email: 'info@kingsleynapley.co.uk',
      regulatoryNumber: '500046',
      crimeWebsiteVerified: true,
    };
    expect(
      resolveStatusWithQualification(kingsley, 'ready_to_send'),
    ).toBe('ready_to_send');
  });

  it('downgrades unqualified ready_to_send to discovered', () => {
    const brachers: Pick<
      FirmProspect,
      'prospectType' | 'sources' | 'status' | 'firmName' | 'email' | 'excludedReason' | 'regulatoryNumber'
    > = {
      prospectType: 'firm',
      firmName: 'Brachers LLP',
      sources: ['archive'],
      status: 'ready_to_send',
      email: 'info@brachers.co.uk',
      excludedReason: undefined,
      regulatoryNumber: '568123',
    };
    expect(
      resolveStatusWithQualification(brachers, 'ready_to_send', registry()),
    ).toBe('discovered');
  });
});

describe('enrichment status gate', () => {
  it('does not promote non-crime firms after email found', () => {
    const prospect: FirmProspect = {
      id: 'fop_test',
      prospectType: 'firm',
      firmName: 'Brachers LLP',
      firmKey: 'brachers',
      postcode: 'ME19 4UA',
      email: 'info@brachers.co.uk',
      sources: ['archive'],
      status: 'discovered',
      priorityScore: 0,
      sequenceStep: 0,
      campaignId: 'wa-invite-v1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      enrichAttempts: 1,
    };
    prospect.status = resolveStatusWithQualification(prospect, 'ready_to_send');
    expect(prospect.status).toBe('discovered');
  });
});

describe('isPlausibleOutreachEmail junk domains', () => {
  it('rejects Wix Sentry crawler artefacts', async () => {
    const { isPlausibleOutreachEmail } = await import('@/lib/firm-outreach/enrichment/validator');
    expect(isPlausibleOutreachEmail('2062d0a4929b45348643784b5cb39c36@sentry.wixpress.com')).toBe(
      false,
    );
    expect(isPlausibleOutreachEmail('605a7baede844d278b89dc95ae0a9123@sentry-next.wixpress.com')).toBe(
      false,
    );
  });
});

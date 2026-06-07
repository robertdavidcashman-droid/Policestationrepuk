import { describe, expect, it } from 'vitest';
import {
  shouldPromotePoliceStationAgent,
  textMentionsKent,
} from '@/lib/policestationagent-promo';
import { isStationSlugInCoverage } from '@/lib/policestationagent-coverage';

describe('policestationagent promo gating', () => {
  it('promotes for Kent county or Kent in text', () => {
    expect(shouldPromotePoliceStationAgent({ county: 'Kent' })).toBe(true);
    expect(shouldPromotePoliceStationAgent({ countySlug: 'kent' })).toBe(true);
    expect(shouldPromotePoliceStationAgent({ text: 'my son was arrested in Kent' })).toBe(true);
    expect(textMentionsKent('arrested in Kent')).toBe(true);
  });

  it('does not promote for distant areas', () => {
    expect(shouldPromotePoliceStationAgent({ text: 'arrested in Liverpool' })).toBe(false);
    expect(shouldPromotePoliceStationAgent({ text: 'arrested in Manchester' })).toBe(false);
    expect(shouldPromotePoliceStationAgent({ county: 'Lancashire' })).toBe(false);
  });

  it('promotes covered non-Kent stations within drive radius', () => {
    expect(isStationSlugInCoverage('croydon-police-station')).toBe(true);
    expect(
      shouldPromotePoliceStationAgent({ text: 'arrested at Croydon police station' }),
    ).toBe(true);
  });

  it('excludes non-Kent stations beyond 45 min drive', () => {
    expect(isStationSlugInCoverage('colchester-police-station')).toBe(false);
    expect(isStationSlugInCoverage('manchester-piccadilly-police-station')).toBe(false);
  });
});

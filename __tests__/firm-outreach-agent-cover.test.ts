import { describe, expect, it } from 'vitest';
import { AGENT_COVER_KENT_CAMPAIGN_ID } from '@/lib/firm-outreach/campaign-scope';
import { filterKentInputs, isKentProspectInput } from '@/lib/firm-outreach/kent-filter';
import { buildProspectForCampaign } from '@/lib/firm-outreach/merge-prospects';
import { prospectIdForCampaign } from '@robertcashman/firm-outreach-core';
import { subjectForStep, buildOutreachEmailHtml } from '@/lib/firm-outreach/outreach/templates';
import type { FirmProspect } from '@/lib/firm-outreach/types';

describe('kent-filter', () => {
  it('matches Kent county', () => {
    expect(isKentProspectInput({ county: 'Kent', postcode: '' })).toBe(true);
  });

  it('matches TN postcodes', () => {
    expect(isKentProspectInput({ county: '', postcode: 'TN15 6ER' })).toBe(true);
  });

  it('rejects non-Kent', () => {
    expect(isKentProspectInput({ county: 'Lancashire', postcode: 'M1 1AA' })).toBe(false);
  });

  it('filterKentInputs keeps Kent only', () => {
    const out = filterKentInputs([
      { prospectType: 'firm', firmName: 'A', county: 'Kent', source: 'laa' },
      { prospectType: 'firm', firmName: 'B', county: 'Essex', source: 'laa' },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]!.firmName).toBe('A');
  });
});

describe('buildProspectForCampaign', () => {
  it('assigns agent_cover_kent_v1 campaign and distinct id', () => {
    const repuk = buildProspectForCampaign('whatsapp_invite_v1', {
      prospectType: 'firm',
      firmName: 'Test LLP',
      county: 'Kent',
      source: 'laa',
    });
    const kent = buildProspectForCampaign(AGENT_COVER_KENT_CAMPAIGN_ID, {
      prospectType: 'firm',
      firmName: 'Test LLP',
      county: 'Kent',
      source: 'laa',
    });
    expect(repuk?.campaignId).toBe('whatsapp_invite_v1');
    expect(kent?.campaignId).toBe(AGENT_COVER_KENT_CAMPAIGN_ID);
    expect(kent?.id).not.toBe(repuk?.id);
    const key = repuk!.firmKey;
    expect(kent?.id).toBe(prospectIdForCampaign(AGENT_COVER_KENT_CAMPAIGN_ID, key));
  });
});

describe('agent-cover templates', () => {
  const prospect = (): FirmProspect => ({
    id: 'fop_agent_test',
    firmKey: 'test-firm',
    firmName: 'Kent Test Solicitors LLP',
    prospectType: 'firm',
    status: 'ready_to_send',
    sequenceStep: 0,
    sources: ['laa'],
    priorityScore: 50,
    campaignId: AGENT_COVER_KENT_CAMPAIGN_ID,
    enrichAttempts: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    email: 'test@example.co.uk',
    county: 'Kent',
  });

  it('renders PSA subject and html for step 0', () => {
    const p = prospect();
    const subject = subjectForStep(p, 0);
    expect(subject.toLowerCase()).toContain('kent');
    const html = buildOutreachEmailHtml({
      prospect: p,
      step: 0,
      unsubscribeUrl: 'https://www.policestationagent.com/outreach/unsubscribe/t',
    });
    expect(html).toContain('Police Station Agent');
    expect(html).not.toContain('Join on WhatsApp');
  });
});

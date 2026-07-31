import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FirmProspect } from '@/lib/firm-outreach/types';

const prospects = vi.hoisted(() => {
  const ready: FirmProspect[] = [];
  const sent: FirmProspect[] = [];
  return { ready, sent };
});

vi.mock('@/lib/firm-outreach/storage', () => ({
  listProspectsByRecordStatus: async (status: string) => {
    if (status === 'ready_to_send') return prospects.ready;
    if (status === 'sent') return prospects.sent;
    return [];
  },
  listProspectsForFirmKey: async () => [],
}));

import { selectOutreachCandidates } from '@/lib/firm-outreach/outreach/candidate-selection';

function base(overrides: Partial<FirmProspect>): FirmProspect {
  return {
    id: overrides.id ?? 'fop_1',
    firmKey: overrides.firmKey ?? 'firm',
    firmName: overrides.firmName ?? 'Firm',
    prospectType: overrides.prospectType ?? 'firm',
    status: overrides.status ?? 'ready_to_send',
    sequenceStep: overrides.sequenceStep ?? 0,
    sources: overrides.sources ?? ['laa'],
    priorityScore: overrides.priorityScore ?? 10,
    campaignId: overrides.campaignId ?? 'whatsapp_invite_v1',
    enrichAttempts: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    email: overrides.email ?? 'info@example.co.uk',
    ...overrides,
  };
}

describe('selectOutreachCandidates', () => {
  beforeEach(() => {
    prospects.ready.length = 0;
    prospects.sent.length = 0;
  });

  it('excludes not-due sent prospects from the candidate pool', async () => {
    prospects.ready.push(
      base({ id: 'ready1', status: 'ready_to_send', sequenceStep: 0, priorityScore: 50 }),
    );
    prospects.sent.push(
      base({
        id: 'sent-recent',
        status: 'sent',
        sequenceStep: 0,
        lastEmailAt: new Date().toISOString(),
        priorityScore: 99,
      }),
    );

    const result = await selectOutreachCandidates({ campaignId: 'whatsapp_invite_v1' });
    expect(result.readyEligible).toBe(1);
    expect(result.followUpEligible).toBe(0);
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0]!.prospect.id).toBe('ready1');
    expect(result.candidates[0]!.step).toBe(0);
  });

  it('includes due follow-ups and prefers firms over solicitors', async () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    prospects.ready.push(
      base({
        id: 'sol1',
        prospectType: 'solicitor',
        status: 'ready_to_send',
        priorityScore: 100,
      }),
      base({
        id: 'firm1',
        prospectType: 'firm',
        status: 'ready_to_send',
        priorityScore: 10,
      }),
    );
    prospects.sent.push(
      base({
        id: 'fu1',
        status: 'sent',
        sequenceStep: 0,
        lastEmailAt: eightDaysAgo,
        priorityScore: 80,
      }),
    );

    const result = await selectOutreachCandidates({ campaignId: 'whatsapp_invite_v1' });
    expect(result.candidates.map((c) => c.prospect.id)).toEqual(['firm1', 'sol1', 'fu1']);
    expect(result.candidates[2]!.step).toBe(1);
  });

  it('does not return ready rows with undefined sequenceStep as no_step', async () => {
    prospects.ready.push(
      base({
        id: 'legacy',
        sequenceStep: undefined as unknown as number,
        status: 'ready_to_send',
      }),
    );
    const result = await selectOutreachCandidates({ campaignId: 'whatsapp_invite_v1' });
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0]!.step).toBe(0);
  });
});

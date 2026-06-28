import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  isOwnSiteUrl,
  OWN_SITE_DOMAINS,
} from '@/lib/firm-outreach/enrichment/website-discovery';
import { isPlausibleOutreachEmail } from '@/lib/firm-outreach/enrichment/validator';
import { scoreEmailCandidate } from '@/lib/firm-outreach/enrichment/email-extract';

describe('isOwnSiteUrl', () => {
  it('flags every operator-owned domain', () => {
    expect(isOwnSiteUrl('https://policestationrepuk.org/legal-services-directory')).toBe(true);
    expect(isOwnSiteUrl('https://www.policestationrepuk.com/about')).toBe(true);
    expect(isOwnSiteUrl('https://policestationagent.com/')).toBe(true);
    expect(isOwnSiteUrl('https://psrtrain.com/courses')).toBe(true);
    expect(isOwnSiteUrl('https://custodynote.com/pricing')).toBe(true);
  });

  it('does not flag genuine third-party firm websites', () => {
    expect(isOwnSiteUrl('https://smithsolicitors.co.uk/contact')).toBe(false);
    expect(isOwnSiteUrl('https://www.brachers.co.uk/')).toBe(false);
  });

  it('exposes the canonical own-site domain list', () => {
    expect(OWN_SITE_DOMAINS).toContain('policestationrepuk.org');
    expect(OWN_SITE_DOMAINS).toContain('custodynote.com');
  });
});

describe('isPlausibleOutreachEmail operator inbox rejection', () => {
  it('rejects operator inboxes that must never be an outreach target', () => {
    expect(isPlausibleOutreachEmail('robertdavidcashman@gmail.com')).toBe(false);
    expect(isPlausibleOutreachEmail('robertcashman@defencelegalservices.co.uk')).toBe(false);
  });

  it('still accepts a genuine firm inbox', () => {
    expect(isPlausibleOutreachEmail('info@takkandcompanymedway.co.uk')).toBe(true);
  });
});

describe('scoreEmailCandidate free-email handling', () => {
  it('returns 0 for a Gmail address on a solicitor prospect', () => {
    const score = scoreEmailCandidate('jane.doe@gmail.com', {
      prospectType: 'solicitor',
      surname: 'Doe',
      forename: 'Jane',
    });
    expect(score).toBe(0);
  });

  it('penalises but does not zero a free-email on a firm prospect', () => {
    const score = scoreEmailCandidate('jane.doe@gmail.com', {
      prospectType: 'firm',
      surname: 'Doe',
      forename: 'Jane',
    });
    expect(score).toBeGreaterThan(0);
  });

  it('scores an on-firm-domain solicitor email highly', () => {
    const score = scoreEmailCandidate('jane.doe@smithsolicitors.co.uk', {
      prospectType: 'solicitor',
      websiteUrl: 'https://smithsolicitors.co.uk',
      surname: 'Doe',
      forename: 'Jane',
    });
    expect(score).toBeGreaterThan(50);
  });
});

describe('cleanupNonFirmProspectEmails own-site reset', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('resets an own-site prospect, clearing email/website and moving to discovered', async () => {
    const ownSiteProspect = {
      id: 'p-own',
      prospectType: 'firm' as const,
      firmName: 'Directory Listing',
      firmKey: 'directory-listing',
      sources: ['laa'],
      priorityScore: 10,
      status: 'ready_to_send' as const,
      sequenceStep: 0,
      campaignId: 'c1',
      createdAt: '',
      updatedAt: '',
      email: 'directory@policestationrepuk.org',
      emailConfidence: 'medium' as const,
      emailScore: 40,
      alternativeEmails: [{ email: 'alt@policestationrepuk.org', score: 30, confidence: 'low' as const }],
      websiteUrl: 'https://policestationrepuk.org/legal-services-directory/category/solicitors',
    };

    const saved: Array<{ prospect: typeof ownSiteProspect; previousStatus?: string }> = [];

    vi.doMock('@/lib/firm-outreach/storage', () => ({
      listProspectsByStatus: vi.fn(async (status: string) =>
        status === 'ready_to_send' ? [ownSiteProspect] : [],
      ),
      getProspect: vi.fn(async (id: string) => (id === 'p-own' ? ownSiteProspect : null)),
      saveProspect: vi.fn(async (prospect: typeof ownSiteProspect, previousStatus?: string) => {
        saved.push({ prospect, previousStatus });
      }),
      listAllProspectIds: vi.fn(async () => ['p-own']),
    }));

    const { cleanupNonFirmProspectEmails } = await import(
      '@/lib/firm-outreach/cleanup-non-firm-emails'
    );

    const result = await cleanupNonFirmProspectEmails();

    expect(result.scanned).toBe(1);
    expect(result.targets).toHaveLength(1);
    expect(result.targets[0].reason).toBe('own_site_website');
    expect(result.reset).toBe(1);

    expect(saved).toHaveLength(1);
    const persisted = saved[0].prospect;
    expect(persisted.status).toBe('discovered');
    expect(persisted.email).toBeUndefined();
    expect(persisted.websiteUrl).toBeUndefined();
    expect(persisted.alternativeEmails).toBeUndefined();
    expect(persisted.emailScore).toBeUndefined();
    expect(saved[0].previousStatus).toBe('ready_to_send');
  });

  it('dry-run reports an own-site target without resetting', async () => {
    const ownSiteProspect = {
      id: 'p-own-2',
      prospectType: 'firm' as const,
      firmName: 'Directory Listing 2',
      firmKey: 'directory-listing-2',
      sources: ['laa'],
      priorityScore: 10,
      status: 'sent' as const,
      sequenceStep: 0,
      campaignId: 'c1',
      createdAt: '',
      updatedAt: '',
      email: 'directory@custodynote.com',
      websiteUrl: 'https://custodynote.com/contact',
    };

    const saveProspect = vi.fn();
    vi.doMock('@/lib/firm-outreach/storage', () => ({
      listProspectsByStatus: vi.fn(async (status: string) =>
        status === 'sent' ? [ownSiteProspect] : [],
      ),
      getProspect: vi.fn(async () => ownSiteProspect),
      saveProspect,
      listAllProspectIds: vi.fn(async () => ['p-own-2']),
    }));

    const { cleanupNonFirmProspectEmails } = await import(
      '@/lib/firm-outreach/cleanup-non-firm-emails'
    );

    const result = await cleanupNonFirmProspectEmails({ dryRun: true });
    expect(result.targets).toHaveLength(1);
    expect(result.targets[0].reason).toBe('own_site_website');
    expect(result.reset).toBe(0);
    expect(saveProspect).not.toHaveBeenCalled();
  });
});

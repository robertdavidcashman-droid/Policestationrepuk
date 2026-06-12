import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  buildFirmWebsiteSearchQueries,
  isDirectoryOrSocialUrl,
  pickFirmWebsiteFromResults,
  firmNameTokens,
} from '@/lib/firm-outreach/enrichment/website-discovery';

describe('firm-outreach website discovery', () => {
  it('flags directory and social URLs', () => {
    expect(isDirectoryOrSocialUrl('https://www.yell.com/biz/foo')).toBe(true);
    expect(isDirectoryOrSocialUrl('https://solicitors.lawsociety.org.uk/foo')).toBe(true);
    expect(isDirectoryOrSocialUrl('https://smithsolicitors.co.uk/contact')).toBe(false);
  });

  it('extracts meaningful firm name tokens', () => {
    expect(firmNameTokens('Smith & Jones Solicitors Ltd')).toEqual(['smith', 'jones']);
  });

  it('prefers URLs containing firm name tokens', () => {
    const picked = pickFirmWebsiteFromResults('Bracher Solicitors LLP', [
      { title: 'Yell listing', url: 'https://www.yell.com/brachers', snippet: '' },
      { title: 'Brachers LLP', url: 'https://www.brachers.co.uk/', snippet: '' },
    ]);
    expect(picked).toBe('https://www.brachers.co.uk/');
  });

  it('skips directory URLs even as fallback when token match exists elsewhere', () => {
    const picked = pickFirmWebsiteFromResults('Unknown Firm LLP', [
      { title: 'LinkedIn', url: 'https://www.linkedin.com/company/foo', snippet: '' },
      { title: 'Real site', url: 'https://example-law.co.uk/', snippet: '' },
    ]);
    expect(picked).toBe('https://example-law.co.uk/');
  });

  it('builds firm-specific search queries with region', () => {
    const queries = buildFirmWebsiteSearchQueries({
      firmName: 'Acme Solicitors',
      town: 'Maidstone',
      postcode: 'ME14 1AA',
    });
    expect(queries[0]).toContain('Acme Solicitors');
    expect(queries[0]).toContain('Maidstone');
    expect(queries.length).toBeGreaterThanOrEqual(2);
  });
});

describe('discoverFirmWebsiteViaSerper', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('returns null when Serper is not configured', async () => {
    vi.stubEnv('SERPER_API_KEY', '');
    const { discoverFirmWebsiteViaSerper } = await import(
      '@/lib/firm-outreach/enrichment/website-discovery'
    );
    const url = await discoverFirmWebsiteViaSerper({ firmName: 'Test Solicitors', town: 'Kent' });
    expect(url).toBeNull();
  });

  it('uses serper and picks a homepage', async () => {
    vi.stubEnv('SERPER_API_KEY', 'test-key');
    vi.doMock('@/lib/custody-discovery/search', () => ({
      isSerperConfigured: () => true,
      serperSearch: vi.fn().mockResolvedValue([
        {
          title: 'Crime Solicitors Kent',
          url: 'https://crimekent.example.co.uk/',
          snippet: 'criminal defence',
        },
      ]),
    }));

    const { discoverFirmWebsiteViaSerper } = await import(
      '@/lib/firm-outreach/enrichment/website-discovery'
    );
    const url = await discoverFirmWebsiteViaSerper({
      firmName: 'Crime Kent Solicitors',
      county: 'Kent',
    });
    expect(url).toBe('https://crimekent.example.co.uk/');
  });
});

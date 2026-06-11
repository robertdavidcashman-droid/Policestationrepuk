import { describe, expect, it } from 'vitest';
import { htmlIndicatesCrimePractice } from '@/lib/firm-outreach/crime-website-verify';
import { qualifyProspectForOutreach } from '@/lib/firm-outreach/qualification';

describe('crime website verification', () => {
  it('detects criminal defence content on Kingsley Napley-style pages', () => {
    const html = `
      <h1>Kingsley Napley LLP</h1>
      <p>Our criminal lawyers provide criminal defence and police station advice.</p>
    `;
    expect(htmlIndicatesCrimePractice(html)).toBe(true);
  });

  it('rejects Brachers-style general commercial homepages', () => {
    const html = `
      <h1>Trusted legal advice for your business, family and your future.</h1>
      <p>Family Law, Commercial Law, Employment Lawyers</p>
    `;
    expect(htmlIndicatesCrimePractice(html)).toBe(false);
  });

  it('qualifies prospects when crimeWebsiteVerified is set', () => {
    const q = qualifyProspectForOutreach({
      prospectType: 'firm',
      firmName: 'Kingsley Napley LLP',
      sources: ['archive'],
      status: 'excluded',
      excludedReason: 'archive_only_not_on_laa_or_dscc',
      crimeWebsiteVerified: true,
    });
    expect(q.qualified).toBe(true);
    expect(q.reason).toBe('website_crime_verified');
  });
});

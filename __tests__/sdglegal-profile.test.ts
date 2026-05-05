import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { loadDirectoryBlocklistFile, repMatchesDirectoryBlocklist } from '@/lib/directory-blocklist';
import type { Representative } from '@/lib/types';

/**
 * Steven Gilbert (SDG Legal) profile guard.
 *
 * The featured listing was first added 2026-04-25, removed 2026-05-02 at the
 * client's request, then restored 2026-05-05 with updated copy / coverage to
 * match the agreed profile preview:
 *   - bio = "I am available 24/7 and can cover all police stations in Devon and Cornwall."
 *   - all 19 Devon & Cornwall police stations covered
 *   - phone 07759 348024 (mobile per WhatsApp)
 *   - email enquiries@sdglegal.co.uk
 *   - website https://www.sdglegal.com
 *   - featured = true
 *
 * This test guards the data shape so accidental edits or scraper runs don't
 * regress the listing.
 */

interface RawRep {
  name: string;
  phone: string;
  email: string;
  county: string;
  counties?: string[];
  availability: string;
  accreditation: string;
  featured?: boolean;
  stations: string[];
  bio?: string;
  slug: string;
  websiteUrl?: string;
}

describe('Steven Gilbert (SDG Legal) profile', () => {
  const scrapedRepsPath = path.join(process.cwd(), 'data', 'scraped-reps.json');
  const reps = JSON.parse(fs.readFileSync(scrapedRepsPath, 'utf-8')) as RawRep[];
  const rep = reps.find((r) => r.slug === 'steven-gilbert-sdglegal');

  it('exists in data/scraped-reps.json', () => {
    expect(rep).toBeDefined();
  });

  it('has the agreed contact details', () => {
    expect(rep!.name).toBe('Steven Gilbert');
    expect(rep!.phone).toBe('07759 348024');
    expect(rep!.email).toBe('enquiries@sdglegal.co.uk');
    expect(rep!.websiteUrl).toBe('https://www.sdglegal.com');
  });

  it('is a featured 24/7 accredited rep', () => {
    expect(rep!.featured).toBe(true);
    expect(rep!.availability).toBe('24/7');
    expect(rep!.accreditation).toMatch(/Accredited/i);
  });

  it('has the agreed bio copy', () => {
    expect(rep!.bio).toBe(
      'I am available 24/7 and can cover all police stations in Devon and Cornwall.',
    );
  });

  it('covers Devon and Cornwall', () => {
    expect(rep!.county).toBe('Devon');
    expect(rep!.counties).toEqual(expect.arrayContaining(['Devon', 'Cornwall']));
  });

  it('lists all 19 Devon & Cornwall police stations', () => {
    expect(rep!.stations.length).toBe(19);
    const expected = [
      'Plymouth Charles Cross Police Station',
      'Exeter Police Station',
      'Torquay Police Station',
      'Newton Abbot Police Station',
      'Paignton Police Station',
      'Tiverton Police Station',
      'Okehampton Police Station',
      'Barnstaple Police Station',
      'Bideford Police Station',
      'Devon and Cornwall Headquarters',
      'Truro Police Station',
      'Bodmin Police Station',
      'St Austell Police Station',
      'Liskeard Police Station',
      'Launceston Police Station',
      'Falmouth Police Station',
      'Penzance Police Station',
      'Camborne Police Station',
      'Newquay Police Station',
    ];
    for (const s of expected) expect(rep!.stations).toContain(s);
  });

  it('every listed station exists in data/stations.json under Devon & Cornwall Police', () => {
    const stations = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'data', 'stations.json'), 'utf-8'),
    ) as Array<{ name: string; forceName?: string }>;
    const dcStations = new Set(
      stations
        .filter((s) => (s.forceName || '').toLowerCase().includes('devon and cornwall'))
        .map((s) => s.name),
    );
    for (const s of rep!.stations) {
      expect(dcStations.has(s)).toBe(true);
    }
  });

  it('is not blocklisted (so it renders in the public directory)', () => {
    const bl = loadDirectoryBlocklistFile();
    const asRep: Representative = {
      id: 'sg',
      slug: rep!.slug,
      name: rep!.name,
      email: rep!.email,
      phone: rep!.phone,
      county: rep!.county,
      availability: rep!.availability,
      accreditation: rep!.accreditation,
      notes: '',
      stations: rep!.stations,
    } as Representative;
    expect(repMatchesDirectoryBlocklist(asRep, bl)).toBe(false);
  });
});

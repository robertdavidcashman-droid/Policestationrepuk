import type { PoliceStation } from '@/lib/types';
import { classifyPhone } from '@/lib/station-search';

export const CAMPAIGN_HEADLINE = 'Help us to help you';
export const CAMPAIGN_TAGLINE =
  'Keep UK police station telephone numbers accurate — for reps, firms, and anyone calling custody.';

export const CAMPAIGN_PATH = '/HelpUsStationNumbers';

export const CAMPAIGN_WHY = [
  {
    title: 'Wrong number wastes time at 2am',
    body: 'Force switchboards, old custody desk lines, and generic 101 entries delay cover when minutes matter.',
  },
  {
    title: 'Numbers change when suites move',
    body: 'Stations merge, custody units relocate, and new direct lines are issued — our directory only stays current with your help.',
  },
  {
    title: 'Everyone benefits',
    body: 'Accredited reps, duty solicitors, firm staff, and families use these listings. One verified correction helps the whole community.',
  },
] as const;

export const CAMPAIGN_STEPS = [
  {
    n: 1,
    title: 'Find the station',
    body: 'Search the directory or open the station page you know.',
  },
  {
    n: 2,
    title: 'Submit the correct number',
    body: 'Custody desk, main line, non-emergency, or address — takes about two minutes.',
  },
  {
    n: 3,
    title: 'We review it',
    body: 'Every suggestion is checked before publishing to protect against spam and mistakes.',
  },
  {
    n: 4,
    title: 'It goes live for everyone',
    body: 'Approved updates appear on the station page and in directory search.',
  },
] as const;

export const CAMPAIGN_WHO = [
  'Accredited police station representatives',
  'Criminal defence solicitors and firm staff',
  'Anyone who has verified a number from signage or the custody desk',
] as const;

export const CAMPAIGN_FAQS = [
  {
    q: 'Who can report a police station phone number?',
    a: 'Anyone — reps, solicitors, firm staff, or members of the public who have a verified custody desk or main line number. You do not need an account.',
  },
  {
    q: 'Will my correction appear immediately?',
    a: 'No. All submissions are reviewed by an administrator before going live. This keeps the directory accurate and safe from malicious changes.',
  },
  {
    q: 'What should I include in my report?',
    a: 'Select the station, enter the correct number (custody, main, or non-emergency), and add a short note — e.g. "new custody desk number from signage" or "verified by calling today".',
  },
  {
    q: 'Why does this matter?',
    a: 'Out-of-hours cover depends on reaching the right custody suite quickly. An outdated switchboard number can delay attendance and waste public money.',
  },
] as const;

export interface StationPhoneStats {
  total: number;
  directLine: number;
  switchboard: number;
  generic: number;
  none: number;
  needsHelp: number;
}

export function computeStationPhoneStats(stations: PoliceStation[]): StationPhoneStats {
  let directLine = 0;
  let switchboard = 0;
  let generic = 0;
  let none = 0;

  for (const station of stations) {
    switch (classifyPhone(station)) {
      case 'station':
        directLine++;
        break;
      case 'switchboard':
        switchboard++;
        break;
      case 'generic':
        generic++;
        break;
      case 'none':
        none++;
        break;
    }
  }

  return {
    total: stations.length,
    directLine,
    switchboard,
    generic,
    none,
    needsHelp: switchboard + generic + none,
  };
}

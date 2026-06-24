import type { PoliceStation } from '@/lib/types';
import type { StationPhoneField } from '@/lib/station-phone-trust';

/** Aligned with verification + custody finding vocabulary — no parallel status system. */
export type ContactReviewStatus =
  | 'published'
  | 'needs_review'
  | 'unverified'
  | 'not_publicly_listed';

export type ContactConfidence = 'high' | 'medium' | 'low' | 'unknown';

export type ContactHealthBadgeId =
  | 'missing-source'
  | 'missing-custody'
  | 'duplicate'
  | 'low-confidence'
  | 'stale'
  | 'open-finding'
  | 'pending-update';

export interface ContactHealthBadge {
  id: ContactHealthBadgeId;
  label: string;
  tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
}

export interface StationContactSummary {
  stationId: string;
  slug: string;
  name: string;
  forceName: string;
  county: string;
  region: string;
  isCustody: boolean;
  mainPhone?: string;
  custodyPhone?: string;
  mainPublished: boolean;
  custodyPublished: boolean;
  custodyDisplayState: string;
  lastChecked?: string;
  sourceUrl?: string;
  confidence: ContactConfidence;
  badges: ContactHealthBadge[];
  openFindingCount: number;
  hasPendingUpdate: boolean;
}

export interface StationContactOverview {
  generatedAt: string;
  totalStations: number;
  custodyStations: number;
  publishedCustodyCount: number;
  missingCustodyCount: number;
  openFindings: number;
  pendingCommunityUpdates: number;
  staleCount: number;
  lowConfidenceCount: number;
}

export interface StationContactSnapshot {
  generatedAt: string;
  overview: StationContactOverview;
  stations: StationContactSummary[];
}

export type PublishablePhoneField = StationPhoneField;

export const STATION_CONTACT_DISCLAIMER =
  'Contact details are provided for general information only and may change without notice. For emergencies call 999. For non-emergencies call 101. Custody suite numbers are included only where publicly available from official or reliable public sources.';

export const CUSTODY_NOT_PUBLISHED_TEXT = 'Custody number: Not publicly published';

/** Standard English regions for directory filtering (derived from county at read time). */
export const COUNTY_TO_REGION: Record<string, string> = {
  bedfordshire: 'East of England',
  berkshire: 'South East',
  buckinghamshire: 'South East',
  cheshire: 'North West',
  cornwall: 'South West',
  'county durham': 'North East',
  cumbria: 'North West',
  derbyshire: 'East Midlands',
  devon: 'South West',
  dorset: 'South West',
  essex: 'East of England',
  gloucestershire: 'South West',
  'greater london': 'London',
  london: 'London',
  'greater manchester': 'North West',
  hampshire: 'South East',
  hertfordshire: 'East of England',
  kent: 'South East',
  lancashire: 'North West',
  leicestershire: 'East Midlands',
  lincolnshire: 'East Midlands',
  merseyside: 'North West',
  norfolk: 'East of England',
  'north yorkshire': 'Yorkshire and the Humber',
  northamptonshire: 'East Midlands',
  nottinghamshire: 'East Midlands',
  oxfordshire: 'South East',
  shropshire: 'West Midlands',
  somerset: 'South West',
  'south yorkshire': 'Yorkshire and the Humber',
  staffordshire: 'West Midlands',
  suffolk: 'East of England',
  surrey: 'South East',
  sussex: 'South East',
  'east sussex': 'South East',
  'west sussex': 'South East',
  tyne: 'North East',
  'tyne and wear': 'North East',
  warwickshire: 'West Midlands',
  'west midlands': 'West Midlands',
  'west yorkshire': 'Yorkshire and the Humber',
  wiltshire: 'South West',
  worcestershire: 'West Midlands',
};

export function deriveRegionForStation(station: PoliceStation): string {
  const county = (station.county ?? '').trim().toLowerCase();
  if (county) {
    const direct = COUNTY_TO_REGION[county];
    if (direct) return direct;
    for (const [key, region] of Object.entries(COUNTY_TO_REGION)) {
      if (county.includes(key) || key.includes(county)) return region;
    }
  }
  const force = (station.forceName ?? '').toLowerCase();
  if (force.includes('metropolitan') || force.includes('city of london')) return 'London';
  if (force.includes('devon') || force.includes('cornwall')) return 'South West';
  if (force.includes('kent') || force.includes('surrey') || force.includes('sussex')) return 'South East';
  return 'England & Wales';
}

export type FrontCounterStatus = 'open' | 'closed' | 'appointment_only' | 'unknown';

export type CustodyAvailabilityStatus = 'published' | 'not_published' | 'fallback_101' | 'n/a';

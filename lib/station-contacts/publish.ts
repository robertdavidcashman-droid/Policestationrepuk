import { getCustodyPhoneDisplay } from '@/lib/custody-discovery/display';
import { isDialablePhone } from '@/lib/station-phone-dialable';
import {
  isAlwaysPublishableForceContact,
  isVerifiedStationPhoneField,
  type StationPhoneField,
} from '@/lib/station-phone-trust';
import { classifyPhone } from '@/lib/station-search';
import type { PoliceStation } from '@/lib/types';
import {
  CUSTODY_NOT_PUBLISHED_TEXT,
  type ContactConfidence,
  type ContactReviewStatus,
} from './types';

const PHONE_FIELDS: StationPhoneField[] = [
  'phone',
  'custodyPhone',
  'custodyPhone2',
  'nonEmergencyPhone',
];

function fieldConfidence(station: PoliceStation, field: StationPhoneField): ContactConfidence {
  const meta = station.verificationMeta?.fields?.[field as 'phone' | 'custodyPhone' | 'custodyPhone2'];
  if (meta?.status === 'verified') return 'high';
  if (meta?.status === 'unverified') return 'low';
  if (station.verificationMeta?.custodyDiscovery?.status === 'verified' && field === 'custodyPhone') {
    return 'high';
  }
  if (station.verificationMeta?.custodyContribution?.status === 'verified' && field === 'custodyPhone') {
    return 'medium';
  }
  return 'unknown';
}

function fieldReviewStatus(station: PoliceStation, field: StationPhoneField): ContactReviewStatus {
  const meta = station.verificationMeta?.fields?.[field as 'phone' | 'custodyPhone' | 'custodyPhone2'];
  if (meta?.status === 'not_publicly_listed') return 'not_publicly_listed';
  const value = station[field]?.trim();
  if (!isDialablePhone(value)) return 'unverified';
  if (isPublicContactField(station, field)) return 'published';
  if (meta?.status === 'unverified') return 'needs_review';
  return 'unverified';
}

function custodyExplicitlyApproved(station: PoliceStation): boolean {
  const discovery = station.verificationMeta?.custodyDiscovery;
  if (discovery?.status === 'verified') return true;
  const contribution = station.verificationMeta?.custodyContribution;
  if (contribution?.status === 'verified') return true;
  const meta = station.verificationMeta?.fields?.custodyPhone;
  if (meta?.status === 'verified') return true;
  return false;
}

/** True when a phone field may be shown as a dialable station/custody line on public pages. */
export function isPublicContactField(
  station: PoliceStation,
  field: StationPhoneField,
): boolean {
  const value = station[field]?.trim();
  if (!isDialablePhone(value)) return false;

  if (field === 'custodyPhone' || field === 'custodyPhone2') {
    const meta = station.verificationMeta?.fields?.[field];
    if (meta?.status === 'not_publicly_listed') return false;
    if (!custodyExplicitlyApproved(station)) return false;
    return isVerifiedStationPhoneField(station, field, value);
  }

  if (isAlwaysPublishableForceContact(station, field, value)) return true;
  if (!isVerifiedStationPhoneField(station, field, value)) return false;

  const cls = classifyPhone(station);
  if (field === 'phone' && (cls === 'switchboard' || cls === 'generic')) {
    return isAlwaysPublishableForceContact(station, field, value);
  }

  return true;
}

export function getPublishedPhoneValue(
  station: PoliceStation,
  field: StationPhoneField,
): string | undefined {
  const value = station[field]?.trim();
  if (!value) return undefined;
  return isPublicContactField(station, field) ? value : undefined;
}

export function getPublishedPhoneFields(station: PoliceStation): StationPhoneField[] {
  return PHONE_FIELDS.filter((field) => Boolean(getPublishedPhoneValue(station, field)));
}

export function getCustodyPublicDisplay(station: PoliceStation): {
  published: boolean;
  number?: string;
  message: string;
  state: ReturnType<typeof getCustodyPhoneDisplay>['state'];
} {
  const display = getCustodyPhoneDisplay(station);
  const contribution = station.verificationMeta?.custodyContribution;
  const discovery = station.verificationMeta?.custodyDiscovery;

  if (custodyExplicitlyApproved(station) && station.custodyPhone) {
    const state =
      contribution?.status === 'verified'
        ? 'practice_reported'
        : discovery?.status === 'verified'
          ? 'verified'
          : display.state;
    return {
      published: true,
      number: station.custodyPhone,
      message: station.custodyPhone,
      state,
    };
  }

  return {
    published: false,
    message: CUSTODY_NOT_PUBLISHED_TEXT,
    state: display.state,
  };
}

export function getFieldPublicationMeta(
  station: PoliceStation,
  field: StationPhoneField,
): {
  status: ContactReviewStatus;
  confidence: ContactConfidence;
  sourceUrl?: string;
  lastChecked?: string;
  secondarySourceUrl?: string;
} {
  const meta = station.verificationMeta?.fields?.[field as 'phone' | 'custodyPhone' | 'custodyPhone2'];
  const discovery = station.verificationMeta?.custodyDiscovery;
  return {
    status: fieldReviewStatus(station, field),
    confidence: fieldConfidence(station, field),
    sourceUrl: meta?.sourceUrl ?? discovery?.sourceUrl ?? station.verificationMeta?.sourceUrl,
    lastChecked: meta?.dateVerified ?? station.verificationMeta?.dateVerified,
    secondarySourceUrl: station.secondarySourceUrl,
  };
}

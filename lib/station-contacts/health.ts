import { isCustodyStation } from '@/lib/custody-station';
import { isDialablePhone } from '@/lib/station-phone-dialable';
import { phonesEquivalent } from '@/lib/phone-format';
import type { PoliceStation } from '@/lib/types';
import { getCustodyPublicDisplay, getFieldPublicationMeta, getPublishedPhoneValue } from './publish';
import {
  deriveRegionForStation,
  type ContactHealthBadge,
  type ContactHealthBadgeId,
  type StationContactOverview,
  type StationContactSummary,
} from './types';

const STALE_MONTHS = 12;

export interface StationHealthContext {
  openFindingsByStationId?: Record<string, number>;
  pendingUpdateStationIds?: Set<string>;
}

function monthsSince(iso?: string): number | null {
  if (!iso) return null;
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return null;
  const diffMs = Date.now() - then;
  return diffMs / (1000 * 60 * 60 * 24 * 30.44);
}

function badge(id: ContactHealthBadgeId, label: string, tone: ContactHealthBadge['tone']): ContactHealthBadge {
  return { id, label, tone };
}

function hasHttpSource(station: PoliceStation, field: 'phone' | 'custodyPhone' | 'custodyPhone2'): boolean {
  const meta = station.verificationMeta?.fields?.[field];
  const url = meta?.sourceUrl?.trim() ?? station.verificationMeta?.sourceUrl?.trim() ?? '';
  return url.startsWith('http');
}

function dialableWithoutSource(station: PoliceStation): boolean {
  for (const field of ['phone', 'custodyPhone', 'custodyPhone2'] as const) {
    const value = station[field]?.trim();
    if (isDialablePhone(value) && getPublishedPhoneValue(station, field) && !hasHttpSource(station, field)) {
      return true;
    }
  }
  return false;
}

function hasDuplicateNumbers(station: PoliceStation): boolean {
  const values = [station.phone, station.custodyPhone, station.custodyPhone2]
    .map((v) => v?.trim())
    .filter((v): v is string => Boolean(v) && isDialablePhone(v));
  for (let i = 0; i < values.length; i++) {
    for (let j = i + 1; j < values.length; j++) {
      if (phonesEquivalent(values[i], values[j])) return true;
    }
  }
  return false;
}

function isStale(station: PoliceStation): boolean {
  const age = monthsSince(station.verificationMeta?.dateVerified);
  return age !== null && age > STALE_MONTHS;
}

function isLowConfidence(station: PoliceStation): boolean {
  for (const field of ['phone', 'custodyPhone', 'custodyPhone2'] as const) {
    const value = station[field]?.trim();
    if (!isDialablePhone(value)) continue;
    const meta = getFieldPublicationMeta(station, field);
    if (meta.status === 'needs_review' || meta.confidence === 'low') return true;
  }
  return false;
}

export function computeStationHealthBadges(
  station: PoliceStation,
  ctx: StationHealthContext = {},
): ContactHealthBadge[] {
  const badges: ContactHealthBadge[] = [];
  const custody = isCustodyStation(station);
  const custodyDisplay = getCustodyPublicDisplay(station);

  if (dialableWithoutSource(station)) {
    badges.push(badge('missing-source', 'Missing source', 'warning'));
  }
  if (custody && !custodyDisplay.published) {
    badges.push(badge('missing-custody', 'Missing custody', 'warning'));
  }
  if (hasDuplicateNumbers(station)) {
    badges.push(badge('duplicate', 'Duplicate numbers', 'danger'));
  }
  if (isLowConfidence(station)) {
    badges.push(badge('low-confidence', 'Low confidence', 'warning'));
  }
  if (isStale(station)) {
    badges.push(badge('stale', 'Stale (>12 mo)', 'info'));
  }
  const openCount = ctx.openFindingsByStationId?.[station.id] ?? 0;
  if (openCount > 0) {
    badges.push(badge('open-finding', `${openCount} open finding${openCount === 1 ? '' : 's'}`, 'info'));
  }
  if (ctx.pendingUpdateStationIds?.has(station.id)) {
    badges.push(badge('pending-update', 'Pending update', 'info'));
  }
  return badges;
}

export function buildStationContactSummary(
  station: PoliceStation,
  ctx: StationHealthContext = {},
): StationContactSummary {
  const custodyDisplay = getCustodyPublicDisplay(station);
  const mainMeta = getFieldPublicationMeta(station, 'phone');
  const custodyMeta = getFieldPublicationMeta(station, 'custodyPhone');
  const openFindingCount = ctx.openFindingsByStationId?.[station.id] ?? 0;

  return {
    stationId: station.id,
    slug: station.slug,
    name: station.name,
    forceName: station.forceName ?? '',
    county: station.county ?? '',
    region: deriveRegionForStation(station),
    isCustody: isCustodyStation(station),
    mainPhone: station.phone,
    custodyPhone: station.custodyPhone,
    mainPublished: Boolean(getPublishedPhoneValue(station, 'phone')),
    custodyPublished: custodyDisplay.published,
    custodyDisplayState: custodyDisplay.state,
    lastChecked: station.verificationMeta?.dateVerified,
    sourceUrl: station.verificationMeta?.sourceUrl ?? custodyMeta.sourceUrl ?? mainMeta.sourceUrl,
    confidence: custodyMeta.confidence !== 'unknown' ? custodyMeta.confidence : mainMeta.confidence,
    badges: computeStationHealthBadges(station, ctx),
    openFindingCount,
    hasPendingUpdate: ctx.pendingUpdateStationIds?.has(station.id) ?? false,
  };
}

export function buildStationContactOverview(
  summaries: StationContactSummary[],
  openFindingsTotal: number,
  pendingCommunityUpdates: number,
): StationContactOverview {
  const custodyStations = summaries.filter((s) => s.isCustody);
  return {
    generatedAt: new Date().toISOString(),
    totalStations: summaries.length,
    custodyStations: custodyStations.length,
    publishedCustodyCount: custodyStations.filter((s) => s.custodyPublished).length,
    missingCustodyCount: custodyStations.filter((s) => !s.custodyPublished).length,
    openFindings: openFindingsTotal,
    pendingCommunityUpdates,
    staleCount: summaries.filter((s) => s.badges.some((b) => b.id === 'stale')).length,
    lowConfidenceCount: summaries.filter((s) => s.badges.some((b) => b.id === 'low-confidence')).length,
  };
}

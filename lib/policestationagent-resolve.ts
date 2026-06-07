import stationsData from '@/data/stations.json';
import { extractUkPostcodeNorm, normaliseUkPostcode } from '@/lib/directory-search-engine';
import {
  countyNameToSlug,
  isKentBasedStation,
  isStationInCoverage,
} from '@/lib/policestationagent-coverage-core';
import {
  countySlugHasPsaCoverage,
  isStationSlugInCoverage,
} from '@/lib/policestationagent-coverage';
import { withDerivedCounty } from '@/lib/force-county';
import type { PoliceStation } from '@/lib/types';

const STATIONS = (stationsData as PoliceStation[]).map((s) => withDerivedCounty(s));

const KENT_TEXT_RE = /\bkent\b/i;

/** Bare "Kent" in user text — all Kent stations qualify. */
export function textMentionsKent(text: string): boolean {
  return KENT_TEXT_RE.test(text);
}

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s*police station\s*/gi, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function findStationByPostcode(text: string): PoliceStation | undefined {
  const pc = extractUkPostcodeNorm(text);
  if (!pc) return undefined;
  const norm = normaliseUkPostcode(pc);
  return STATIONS.find((s) => {
    const sp = (s.postcode || '').replace(/\s+/g, '').toUpperCase();
    return sp && (sp.startsWith(norm.slice(0, 4)) || sp.startsWith(norm.slice(0, 3)));
  });
}

function findStationByName(text: string): PoliceStation | undefined {
  const norm = normalizeName(text);
  if (norm.length < 4) return undefined;

  let best: PoliceStation | undefined;
  let bestLen = 0;

  for (const station of STATIONS) {
    const nameNorm = normalizeName(station.name);
    if (nameNorm.length < 4) continue;
    if (norm.includes(nameNorm) || nameNorm.includes(norm)) {
      if (nameNorm.length > bestLen) {
        best = station;
        bestLen = nameNorm.length;
      }
    }
  }
  return best;
}

/** Resolve a station from free text (assistant queries). */
export function resolveStationFromText(text: string): PoliceStation | undefined {
  return findStationByPostcode(text) ?? findStationByName(text);
}

export interface PsaPromoContext {
  station?: PoliceStation | null;
  stationSlug?: string | null;
  county?: string | null;
  countySlug?: string | null;
  postcode?: string | null;
  text?: string | null;
}

export function shouldPromotePoliceStationAgent(context?: PsaPromoContext): boolean {
  if (!context) return false;

  if (context.station) {
    return isStationInCoverage(context.station);
  }

  if (context.stationSlug && isStationSlugInCoverage(context.stationSlug)) {
    return true;
  }

  const countySlug =
    context.countySlug?.trim() ||
    (context.county ? countyNameToSlug(context.county) : '');
  if (countySlug && countySlugHasPsaCoverage(countySlug)) {
    return true;
  }

  if (context.text?.trim()) {
    const text = context.text.trim();
    if (textMentionsKent(text)) return true;

    const resolved = resolveStationFromText(text);
    if (resolved && isStationInCoverage(resolved)) return true;

    // Explicit non-Kent major cities — do not promote on county name alone
    if (/\b(manchester|liverpool|birmingham|leeds|sheffield|bristol|glasgow|edinburgh|cardiff|nottingham)\b/i.test(text)) {
      return false;
    }
  }

  if (context.postcode) {
    const st = findStationByPostcode(context.postcode);
    if (st && isStationInCoverage(st)) return true;
  }

  return false;
}

/** Export for tests — Kent-based station check without JSON index. */
export { isKentBasedStation, isStationInCoverage };

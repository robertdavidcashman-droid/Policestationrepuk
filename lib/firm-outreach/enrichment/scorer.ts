import type { FirmProspect } from '../types';

/** Rep density boost — counties with more published reps are prioritised. */
const REP_COUNTY_BOOST: Record<string, number> = {
  kent: 20,
  london: 15,
  essex: 12,
  surrey: 10,
  sussex: 10,
  hampshire: 10,
  'greater london': 15,
};

export function computeProspectPriority(prospect: FirmProspect): number {
  let score = prospect.priorityScore;

  if (prospect.emailScore) score += Math.round(prospect.emailScore / 4);
  if (prospect.sources.includes('laa')) score += 10;
  if (prospect.sources.includes('dscc')) score += 8;
  if (prospect.sources.includes('directory')) score += 25;
  if (prospect.websiteUrl) score += 5;
  if (prospect.prospectType === 'solicitor' && prospect.emailConfidence === 'crawled') score += 8;

  const county = (prospect.county ?? '').toLowerCase();
  for (const [key, boost] of Object.entries(REP_COUNTY_BOOST)) {
    if (county.includes(key)) {
      score += boost;
      break;
    }
  }

  if (prospect.emailConfidence === 'guessed') score -= 15;

  return score;
}

export function sortProspectsForSend(prospects: FirmProspect[]): FirmProspect[] {
  return [...prospects].sort(
    (a, b) => computeProspectPriority(b) - computeProspectPriority(a),
  );
}

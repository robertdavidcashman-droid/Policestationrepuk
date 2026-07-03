import { extractDomain } from './source-type';
import type { CustodyNumberFinding, CustodySourceType } from './types';

/**
 * Multi-source corroboration for auto-publishing.
 *
 * A single council or PCC page is not enough to publish a custody number,
 * but several *independent* trusted domains agreeing on the same landline
 * is strong deterministic evidence — stronger than any single AI opinion.
 */

/** Source types allowed to corroborate (or be corroborated). Never solicitor/unknown/archived. */
const TRUSTED_CORROBORATION_TYPES: ReadonlySet<CustodySourceType> = new Set([
  'official_police',
  'police_uk',
  'foi',
  'pdf',
  'pcc',
  'local_authority',
]);

export function isTrustedCorroboratingSource(finding: CustodyNumberFinding): boolean {
  return TRUSTED_CORROBORATION_TYPES.has(finding.sourceType);
}

export interface CorroborationAssessment {
  /** Distinct trusted domains (including the finding's own) agreeing on the same number. */
  independentDomains: string[];
  /** Different numbers reported by other trusted sources for the same suite. */
  conflictingTrustedNumbers: string[];
}

function findingDomain(f: CustodyNumberFinding): string {
  return (f.sourceDomain || extractDomain(f.sourceUrl)).toLowerCase().replace(/^www\./, '');
}

export function assessCorroboration(
  finding: CustodyNumberFinding,
  suiteFindings: CustodyNumberFinding[],
): CorroborationAssessment {
  const agreeing = new Set<string>();
  const conflicting = new Set<string>();

  if (isTrustedCorroboratingSource(finding)) {
    const own = findingDomain(finding);
    if (own) agreeing.add(own);
  }

  for (const f of suiteFindings) {
    if (f.id === finding.id) continue;
    if (f.status === 'rejected' || f.status === 'stale' || f.status === 'duplicate') continue;
    if (!isTrustedCorroboratingSource(f)) continue;
    const domain = findingDomain(f);
    if (!domain) continue;
    if (f.normalizedPhoneNumber === finding.normalizedPhoneNumber) {
      agreeing.add(domain);
    } else {
      conflicting.add(f.normalizedPhoneNumber);
    }
  }

  return {
    independentDomains: [...agreeing],
    conflictingTrustedNumbers: [...conflicting],
  };
}

export function minCorroboratingSources(): number {
  return Math.max(2, Number(process.env.CUSTODY_CORROBORATION_MIN_SOURCES ?? 2));
}

/**
 * AI/rule thresholds for the corroborated path. The more independent trusted
 * domains agree, the less we lean on the (source-quality-biased) AI score —
 * the deterministic gates (landline, custody wording, exact number in fetched
 * page text, no conflicts) always still apply.
 */
export function corroboratedThresholds(sourceCount: number): { minAi: number; minScore: number } {
  if (sourceCount >= 3) return { minAi: 60, minScore: 45 };
  return { minAi: 75, minScore: 60 };
}

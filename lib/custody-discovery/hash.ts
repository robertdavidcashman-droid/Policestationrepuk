import crypto from 'crypto';
import type { CustodyNumberFinding } from './types';

export function hashSourceEvidence(input: {
  custodySuiteId: string;
  normalizedPhoneNumber: string;
  sourceUrl: string;
  pageSnippet: string;
}): string {
  const payload = [
    input.custodySuiteId,
    input.normalizedPhoneNumber,
    input.sourceUrl.trim().toLowerCase(),
    input.pageSnippet.trim().slice(0, 500),
  ].join('|');
  return crypto.createHash('sha256').update(payload).digest('hex').slice(0, 32);
}

export function isDuplicateFinding(
  existing: CustodyNumberFinding,
  hash: string,
): boolean {
  return existing.hashOfSourceEvidence === hash;
}

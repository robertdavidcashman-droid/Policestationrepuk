import type { RawProspectInput } from './merge-prospects';

const KENT_POSTCODE_PREFIXES = ['TN', 'ME', 'CT', 'DA', 'BR'] as const;

export function isKentProspectInput(input: {
  county?: string;
  postcode?: string;
}): boolean {
  const county = (input.county ?? '').trim().toLowerCase();
  if (county.includes('kent')) return true;
  const pc = (input.postcode ?? '').trim().toUpperCase().replace(/\s+/g, '');
  if (!pc) return false;
  return KENT_POSTCODE_PREFIXES.some((prefix) => pc.startsWith(prefix));
}

export function filterKentInputs(inputs: RawProspectInput[]): RawProspectInput[] {
  return inputs.filter(isKentProspectInput);
}

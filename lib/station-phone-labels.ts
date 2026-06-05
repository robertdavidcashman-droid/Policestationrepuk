import type { StationPhoneEntry } from '@/lib/station-search';

/** Human-readable suffix for a directory phone line (includes unverified cue). */
export function stationPhoneEntryHint(entry: StationPhoneEntry): string {
  const parts: string[] = [entry.label];
  if (entry.className === 'switchboard') parts.push('force switchboard');
  else if (entry.className === 'generic') parts.push('non-emergency');
  if (!entry.verified) parts.push('unverified — please confirm or correct');
  return parts.join(' · ');
}

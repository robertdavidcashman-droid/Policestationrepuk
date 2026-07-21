/**
 * Deep-link helpers for one-tap “wrong number” / “not custody desk” feedback
 * into the UpdateStation queue.
 */

export type StationPhoneReportReason = 'wrong_number' | 'not_custody_desk';

export interface BuildStationPhoneReportUrlInput {
  stationId: string;
  /** Published number the user is reporting about. */
  number?: string;
  field?: 'phone' | 'custodyPhone' | 'custodyPhone2' | 'nonEmergencyPhone';
  reason?: StationPhoneReportReason;
}

function reasonNotes(reason: StationPhoneReportReason, number?: string): string {
  const quoted = number?.trim() ? ` (${number.trim()})` : '';
  if (reason === 'not_custody_desk') {
    return `Reported: this is not the custody desk number${quoted}. Please replace with the correct custody suite line if known.`;
  }
  return `Reported: this phone number is wrong or out of date${quoted}.`;
}

/** Build `/UpdateStation` URL with station + reason prefilled for the correction form. */
export function buildStationPhoneReportUrl(input: BuildStationPhoneReportUrlInput): string {
  const params = new URLSearchParams();
  params.set('station', input.stationId);
  const reason = input.reason ?? 'wrong_number';
  params.set('reason', reason);
  if (input.field) params.set('field', input.field);
  if (input.number?.trim()) params.set('number', input.number.trim());
  params.set('notes', reasonNotes(reason, input.number));
  return `/UpdateStation?${params.toString()}`;
}

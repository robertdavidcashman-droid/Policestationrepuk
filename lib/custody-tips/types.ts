/**
 * Rep-contributed custody desk numbers ("custody tips").
 *
 * Reps confirm / correct / add the custody number for stations they cover. A
 * number is published as `verified` once two independent reps agree (or one rep
 * agrees with an official/PSR number already on file). Verified numbers flow
 * into the live site via the existing station-override pipeline; the consensus
 * record additionally carries the trust metadata shown on the station page.
 *
 * Storage: Upstash KV (see ./storage.ts), mirroring lib/station-overrides.ts.
 */

export type CustodyTipStatus = 'active' | 'rejected' | 'superseded';

export type CustodyTipSource = 'register' | 'contribute_page' | 'reverify_email' | 'admin';

export interface CustodyTip {
  id: string;
  /** Canonical station key — the PoliceStation.id (same key station-overrides uses). */
  stationId: string;
  stationSlug: string;
  stationName: string;
  /** Display-formatted UK number, e.g. "01622 604 185". */
  number: string;
  /** Normalised digits for comparison, e.g. "01622604185". */
  numberDigits: string;
  /** Lower-cased submitter email (one corroboration vote per email). */
  repEmail: string;
  repName?: string;
  createdAt: string;
  status: CustodyTipStatus;
  source: CustodyTipSource;
  submitterIp?: string;
}

export type CustodyConsensusStatus = 'verified' | 'unverified';

/**
 * Per-station rollup derived from the tips. This is the overlay merged onto the
 * station at request time (number + trust metadata).
 */
export interface CustodyConsensus {
  stationId: string;
  /** Winning display number. */
  number: string;
  numberDigits: string;
  status: CustodyConsensusStatus;
  /** Distinct reps backing the winning number. */
  confirmedBy: number;
  /** Distinct backer emails (internal — never sent to public pages). */
  contributors: string[];
  /** True when reps disagree on the number (needs admin attention). */
  conflict: boolean;
  /** ISO date the number first reached `verified`. */
  dateVerified: string | null;
  lastSubmittedAt: string;
  updatedAt: string;
}

/** Distinct reps required for a number to auto-verify. */
export const CORROBORATION_THRESHOLD = 2;

import { CORROBORATION_THRESHOLD, type CustodyConsensus, type CustodyTip } from './types';

/**
 * Pure corroboration: derive the consensus number for a station from its tips.
 *
 * Rules:
 *  - Group active tips by normalised digits.
 *  - The winning number is the one with the most DISTINCT backing reps
 *    (tie-break: most recently submitted).
 *  - `verified` when the winner has >= CORROBORATION_THRESHOLD distinct reps,
 *    OR a single rep agrees with an official/PSR number already on file.
 *  - `conflict` when two or more distinct numbers each have rep support.
 *
 * Returns null when there are no usable tips.
 */
export function computeConsensus(
  stationId: string,
  tips: CustodyTip[],
  officialNumberDigits?: string,
  now: Date = new Date(),
): CustodyConsensus | null {
  const active = tips.filter((t) => t.status === 'active' && t.numberDigits);
  if (active.length === 0) return null;

  type Group = {
    number: string;
    numberDigits: string;
    emails: Set<string>;
    lastAt: string;
    firstAt: string;
  };
  const groups = new Map<string, Group>();

  for (const tip of active) {
    const g = groups.get(tip.numberDigits);
    if (g) {
      g.emails.add(tip.repEmail);
      if (tip.createdAt > g.lastAt) {
        g.lastAt = tip.createdAt;
        g.number = tip.number; // keep formatting from the latest submission
      }
      if (tip.createdAt < g.firstAt) g.firstAt = tip.createdAt;
    } else {
      groups.set(tip.numberDigits, {
        number: tip.number,
        numberDigits: tip.numberDigits,
        emails: new Set([tip.repEmail]),
        lastAt: tip.createdAt,
        firstAt: tip.createdAt,
      });
    }
  }

  const ranked = [...groups.values()].sort((a, b) => {
    if (a.emails.size !== b.emails.size) return b.emails.size - a.emails.size;
    return b.lastAt.localeCompare(a.lastAt);
  });

  const winner = ranked[0];
  const supportedNumbers = ranked.filter((g) => g.emails.size > 0);
  const conflict = supportedNumbers.length > 1;

  const matchesOfficial =
    !!officialNumberDigits && winner.numberDigits === officialNumberDigits;
  const verified = winner.emails.size >= CORROBORATION_THRESHOLD || matchesOfficial;

  const nowIso = now.toISOString();
  return {
    stationId,
    number: winner.number,
    numberDigits: winner.numberDigits,
    status: verified ? 'verified' : 'unverified',
    confirmedBy: winner.emails.size,
    contributors: [...winner.emails],
    conflict,
    dateVerified: verified ? nowIso.slice(0, 10) : null,
    lastSubmittedAt: winner.lastAt,
    updatedAt: nowIso,
  };
}

/** Merge a freshly computed consensus with the prior one to preserve dateVerified. */
export function mergeConsensus(
  prev: CustodyConsensus | null,
  next: CustodyConsensus,
): CustodyConsensus {
  if (!prev) return next;
  // Preserve the original verification date if the number is unchanged.
  if (
    next.status === 'verified' &&
    prev.status === 'verified' &&
    prev.numberDigits === next.numberDigits &&
    prev.dateVerified
  ) {
    return { ...next, dateVerified: prev.dateVerified };
  }
  return next;
}

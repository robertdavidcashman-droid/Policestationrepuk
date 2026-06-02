/**
 * Contributor reward: reps who contribute custody numbers earn a renewable free
 * featured month.
 *
 * Design:
 *  - Earned once a rep has active tips for >= CONTRIBUTOR_STATIONS_REQUIRED stations.
 *  - The featured boost is only visible to verified reps (the publication gate in
 *    lib/data.ts hides featured for unverified reps), so for an unverified rep we
 *    "bank" the reward and redeem it when they pass verification.
 *  - Renewable: re-confirming numbers later extends the month.
 *  - Never downgrades a paying/legacy featured rep to the contributor tier.
 */

import { getKV } from '@/lib/kv';
import {
  activateFeatured,
  getFeaturedStatus,
  isFeaturedActive,
  type FeaturedMeta,
} from '@/lib/featured';

export const CONTRIBUTOR_TIER = 'contributor';
export const CONTRIBUTOR_STATIONS_REQUIRED = 5;
export const CONTRIBUTOR_REWARD_DAYS = 30;

const REWARD_PREFIX = 'custodyreward:';

interface RewardState {
  email: string;
  earnedAt: string;
  redeemed: boolean;
  expiresAt?: string;
}

export interface ContributorRewardResult {
  eligible: boolean;
  stationCount: number;
  required: number;
  /** Featured boost is live now. */
  activated: boolean;
  /** Earned but banked until the rep is verified. */
  pending: boolean;
  /** Rep already has a paid/legacy featured listing — reward is moot. */
  alreadyFeatured: boolean;
  expiresAt?: string;
}

function rewardKey(email: string): string {
  return `${REWARD_PREFIX}${email.toLowerCase()}`;
}

function isPaidOrLegacyFeatured(meta: FeaturedMeta | null): boolean {
  if (!meta || !isFeaturedActive(meta)) return false;
  if (meta.isLegacyFeatured || meta.status === 'legacy' || meta.status === 'grandfathered') {
    return true;
  }
  return meta.tier !== undefined && meta.tier !== CONTRIBUTOR_TIER;
}

function nextExpiry(existing: FeaturedMeta | null, now: Date): string {
  const base =
    existing &&
    existing.tier === CONTRIBUTOR_TIER &&
    existing.expiresAt &&
    new Date(existing.expiresAt) > now
      ? new Date(existing.expiresAt)
      : now;
  return new Date(base.getTime() + CONTRIBUTOR_REWARD_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

async function saveRewardState(state: RewardState): Promise<void> {
  const kv = getKV();
  if (!kv) return;
  await kv.set(rewardKey(state.email), state);
}

export async function getRewardState(email: string): Promise<RewardState | null> {
  const kv = getKV();
  if (!kv) return null;
  return (await kv.get<RewardState>(rewardKey(email))) ?? null;
}

/**
 * Evaluate and (where possible) grant the contributor reward after a rep's tip
 * count changes. `repVerified` reflects whether the rep is publicly visible.
 */
export async function grantContributorReward(args: {
  email: string;
  stationCount: number;
  repVerified: boolean;
}): Promise<ContributorRewardResult> {
  const { email, stationCount, repVerified } = args;
  const result: ContributorRewardResult = {
    eligible: stationCount >= CONTRIBUTOR_STATIONS_REQUIRED,
    stationCount,
    required: CONTRIBUTOR_STATIONS_REQUIRED,
    activated: false,
    pending: false,
    alreadyFeatured: false,
  };
  if (!result.eligible) return result;

  const existing = await getFeaturedStatus(email);
  if (isPaidOrLegacyFeatured(existing)) {
    result.alreadyFeatured = true;
    return result;
  }

  const now = new Date();
  if (repVerified) {
    const expiresAt = nextExpiry(existing, now);
    await activateFeatured(email, { expiresAt, tier: CONTRIBUTOR_TIER });
    await saveRewardState({ email: email.toLowerCase(), earnedAt: now.toISOString(), redeemed: true, expiresAt });
    result.activated = true;
    result.expiresAt = expiresAt;
    return result;
  }

  // Bank it: redeem when the rep becomes verified.
  await saveRewardState({ email: email.toLowerCase(), earnedAt: now.toISOString(), redeemed: false });
  result.pending = true;
  return result;
}

/**
 * Redeem a banked reward once a rep becomes verified. Safe to call repeatedly.
 * Intended to be invoked from the rep verification/approval path.
 */
export async function redeemPendingContributorReward(
  email: string,
): Promise<{ activated: boolean; expiresAt?: string }> {
  const state = await getRewardState(email);
  if (!state || state.redeemed) return { activated: false };

  const existing = await getFeaturedStatus(email);
  if (isPaidOrLegacyFeatured(existing)) {
    await saveRewardState({ ...state, redeemed: true });
    return { activated: false };
  }

  const now = new Date();
  const expiresAt = nextExpiry(existing, now);
  await activateFeatured(email, { expiresAt, tier: CONTRIBUTOR_TIER });
  await saveRewardState({ ...state, redeemed: true, expiresAt });
  return { activated: true, expiresAt };
}

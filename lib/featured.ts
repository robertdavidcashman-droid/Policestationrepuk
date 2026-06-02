import { getKV, skipKVInPrerender } from './kv';
import type { Representative } from './types';

export const ROBERT_SLUG = 'robert-cashman';
export const ROBERT_EMAIL = 'robertdavidcashman@gmail.com';

export type FeaturedStatus = 'active' | 'cancelled' | 'expired' | 'grandfathered' | 'legacy';

export interface FeaturedMeta {
  email: string;
  activatedAt: string;
  emailSentToRep: boolean;
  emailSentToOwner: boolean;
  isFeatured?: boolean;
  isLegacyFeatured?: boolean;
  featuredStartDate?: string;
  featuredExpiryDate?: string | null;
  lemonSqueezyCustomerId?: string;
  lemonSqueezyOrderId?: string;
  lemonSqueezySubscriptionId?: string;
  lemonSqueezyVariantId?: string;
  lemonSqueezyProductId?: string;
  featuredPlanName?: string;
  featuredLastPaymentDate?: string;
  featuredLastWebhookEvent?: string;
  subscriptionId?: string;
  variantId?: string;
  customerId?: string;
  orderId?: string;
  productId?: string;
  status: FeaturedStatus;
  expiresAt?: string;
  renewsAt?: string;
  tier?: string;
}

let _featuredFlags: Map<string, FeaturedMeta> | null = null;
let _featuredFlagsAt = 0;
// 5 minute in-process cache. Lemon Squeezy webhooks call
// `invalidateFeaturedCache()` immediately on every subscription state change,
// so subscribers see featured boost activate within seconds; the longer TTL
// just prevents idle traffic from re-scanning KV every 60s. Override with
// FEATURED_CACHE_TTL_SECONDS.
const CACHE_MS =
  Math.max(30, Number(process.env.FEATURED_CACHE_TTL_SECONDS) || 300) * 1000;

export async function loadFeaturedFlags(): Promise<Map<string, FeaturedMeta>> {
  const now = Date.now();
  if (_featuredFlags && now - _featuredFlagsAt < CACHE_MS) {
    return _featuredFlags;
  }
  if (skipKVInPrerender()) {
    if (!_featuredFlags) {
      _featuredFlags = new Map();
      _featuredFlagsAt = now;
    }
    return _featuredFlags;
  }
  const map = new Map<string, FeaturedMeta>();
  const kv = getKV();
  if (!kv) { _featuredFlags = map; _featuredFlagsAt = now; return map; }
  try {
    const keys = await kv.keys('featured:*');
    if (keys.length === 0) { _featuredFlags = map; _featuredFlagsAt = now; return map; }
    const pipeline = kv.pipeline();
    for (const key of keys) pipeline.get(key);
    const results = await pipeline.exec<(FeaturedMeta | null)[]>();
    for (const row of results) {
      if (row && typeof row === 'object' && typeof row.email === 'string') {
        map.set(row.email.toLowerCase(), row);
      }
    }
  } catch (err) {
    console.error('[featured] Failed to load featured flags from KV:', err);
  }
  _featuredFlags = map;
  _featuredFlagsAt = now;
  return map;
}

export function invalidateFeaturedCache(): void {
  _featuredFlags = null;
  _featuredFlagsAt = 0;
}

export async function getFeaturedStatus(email: string): Promise<FeaturedMeta | null> {
  const kv = getKV();
  if (!kv) return null;
  try {
    return await kv.get<FeaturedMeta>(`featured:${email.toLowerCase()}`);
  } catch {
    return null;
  }
}

export interface ActivateFeaturedOptions {
  subscriptionId?: string;
  variantId?: string;
  customerId?: string;
  orderId?: string;
  productId?: string;
  tier?: string;
  renewsAt?: string;
  expiresAt?: string;
  lastPaymentAt?: string;
  lastWebhookEvent?: string;
}

export async function activateFeatured(
  email: string,
  opts: ActivateFeaturedOptions = {},
): Promise<FeaturedMeta> {
  const kv = getKV();
  if (!kv) throw new Error('KV not configured');
  const meta: FeaturedMeta = {
    email: email.toLowerCase(),
    activatedAt: new Date().toISOString(),
    emailSentToRep: false,
    emailSentToOwner: false,
    isFeatured: true,
    isLegacyFeatured: false,
    featuredStartDate: new Date().toISOString(),
    featuredExpiryDate: opts.expiresAt ?? null,
    lemonSqueezyCustomerId: opts.customerId,
    lemonSqueezyOrderId: opts.orderId,
    lemonSqueezySubscriptionId: opts.subscriptionId,
    lemonSqueezyVariantId: opts.variantId,
    lemonSqueezyProductId: opts.productId,
    featuredPlanName: opts.tier,
    featuredLastPaymentDate: opts.lastPaymentAt,
    featuredLastWebhookEvent: opts.lastWebhookEvent,
    status: 'active',
    subscriptionId: opts.subscriptionId,
    variantId: opts.variantId,
    customerId: opts.customerId,
    orderId: opts.orderId,
    productId: opts.productId,
    tier: opts.tier,
    renewsAt: opts.renewsAt,
    expiresAt: opts.expiresAt,
  };
  await kv.set(`featured:${email.toLowerCase()}`, meta);
  invalidateFeaturedCache();
  return meta;
}

export async function updateFeaturedSubscription(
  email: string,
  updates: Partial<
    Pick<
      FeaturedMeta,
      | 'status'
      | 'renewsAt'
      | 'expiresAt'
      | 'subscriptionId'
      | 'variantId'
      | 'customerId'
      | 'orderId'
      | 'productId'
      | 'tier'
      | 'isFeatured'
      | 'isLegacyFeatured'
      | 'featuredStartDate'
      | 'featuredExpiryDate'
      | 'lemonSqueezyCustomerId'
      | 'lemonSqueezyOrderId'
      | 'lemonSqueezySubscriptionId'
      | 'lemonSqueezyVariantId'
      | 'lemonSqueezyProductId'
      | 'featuredPlanName'
      | 'featuredLastPaymentDate'
      | 'featuredLastWebhookEvent'
    >
  >,
): Promise<FeaturedMeta | null> {
  const kv = getKV();
  if (!kv) return null;
  const existing = await kv.get<FeaturedMeta>(`featured:${email.toLowerCase()}`);
  if (!existing) return null;
  const updated: FeaturedMeta = {
    ...existing,
    ...updates,
  };
  await kv.set(`featured:${email.toLowerCase()}`, updated);
  invalidateFeaturedCache();
  return updated;
}

export async function cancelFeaturedSubscription(
  email: string,
  endsAt: string,
): Promise<FeaturedMeta | null> {
  return updateFeaturedSubscription(email, {
    isFeatured: true,
    status: 'cancelled',
    expiresAt: endsAt,
    featuredExpiryDate: endsAt,
  });
}

export async function expireFeaturedSubscription(email: string): Promise<FeaturedMeta | null> {
  return updateFeaturedSubscription(email, { isFeatured: false, status: 'expired' });
}

export function isFeaturedActive(meta: FeaturedMeta | null): boolean {
  if (!meta) return false;
  if (meta.isLegacyFeatured || meta.status === 'grandfathered' || meta.status === 'legacy') return true;
  if (!meta.status) return true;
  if (meta.status !== 'active' && meta.status !== 'cancelled') return false;
  if (meta.expiresAt) {
    return new Date(meta.expiresAt) > new Date();
  }
  return meta.status === 'active';
}

export async function markEmailsSent(email: string, flags: { rep?: boolean; owner?: boolean }): Promise<void> {
  const kv = getKV();
  if (!kv) return;
  const existing = await kv.get<FeaturedMeta>(`featured:${email.toLowerCase()}`);
  if (!existing) return;
  const updated = {
    ...existing,
    emailSentToRep: flags.rep ?? existing.emailSentToRep,
    emailSentToOwner: flags.owner ?? existing.emailSentToOwner,
  };
  await kv.set(`featured:${email.toLowerCase()}`, updated);
}

export async function grandfatherExistingFeaturedReps(reps: Representative[]): Promise<number> {
  const kv = getKV();
  if (!kv) return 0;
  let changed = 0;
  const now = new Date().toISOString();
  for (const rep of reps) {
    if (!rep.featured || !rep.email) continue;
    const key = `featured:${rep.email.toLowerCase()}`;
    const existing = await kv.get<FeaturedMeta>(key);
    if (existing?.isLegacyFeatured || existing?.status === 'legacy') continue;
    const meta: FeaturedMeta = {
      ...(existing ?? {
        email: rep.email.toLowerCase(),
        activatedAt: now,
        emailSentToRep: false,
        emailSentToOwner: false,
      }),
      email: rep.email.toLowerCase(),
      isFeatured: true,
      isLegacyFeatured: true,
      status: 'legacy',
      featuredStartDate: existing?.featuredStartDate ?? existing?.activatedAt ?? now,
      featuredExpiryDate: null,
      expiresAt: undefined,
      featuredLastWebhookEvent: existing?.featuredLastWebhookEvent ?? 'legacy_migration',
    };
    await kv.set(key, meta);
    changed++;
  }
  if (changed > 0) invalidateFeaturedCache();
  return changed;
}

export async function listFeaturedDebug() {
  const flags = await loadFeaturedFlags();
  return [...flags.values()]
    .map((meta) => ({
      email: meta.email,
      status: meta.status,
      isLegacyFeatured: Boolean(meta.isLegacyFeatured || meta.status === 'legacy'),
      activatedAt: meta.activatedAt,
      expiresAt: meta.expiresAt ?? meta.featuredExpiryDate ?? null,
      renewsAt: meta.renewsAt ?? null,
      tier: meta.tier ?? meta.featuredPlanName ?? null,
      subscriptionId: meta.subscriptionId ?? meta.lemonSqueezySubscriptionId ?? null,
      lastWebhookEvent: meta.featuredLastWebhookEvent ?? null,
    }))
    .sort((a, b) => {
      const aLegacy = a.isLegacyFeatured ? 1 : 0;
      const bLegacy = b.isLegacyFeatured ? 1 : 0;
      if (aLegacy !== bLegacy) return bLegacy - aLegacy;
      return a.email.localeCompare(b.email);
    });
}

export function applyFeaturedFlags(
  reps: Representative[],
  flags: Map<string, FeaturedMeta>,
): Representative[] {
  if (flags.size === 0) return reps;
  return reps.map((r) => {
    if (r.featured) return r;
    const meta = flags.get(r.email.toLowerCase());
    if (meta && isFeaturedActive(meta)) return { ...r, featured: true };
    return r;
  });
}

/**
 * Deterministic sort for featured reps:
 * 1. Robert Cashman always first
 * 2. Then by activatedAt DESC (newest first)
 * 3. Then by name ASC
 */
/** Free "contributor" perk ranks below paid/legacy featured listings. */
function isContributorTier(meta: FeaturedMeta | null | undefined): boolean {
  if (!meta) return false;
  if (meta.isLegacyFeatured || meta.status === 'legacy' || meta.status === 'grandfathered') {
    return false;
  }
  return meta.tier === 'contributor';
}

export function sortFeaturedReps(
  reps: Representative[],
  flags: Map<string, FeaturedMeta>,
): Representative[] {
  return [...reps].sort((a, b) => {
    const aIsRobert = a.slug === ROBERT_SLUG || a.email.toLowerCase() === ROBERT_EMAIL;
    const bIsRobert = b.slug === ROBERT_SLUG || b.email.toLowerCase() === ROBERT_EMAIL;
    if (aIsRobert && !bIsRobert) return -1;
    if (!aIsRobert && bIsRobert) return 1;

    const aMeta = flags.get(a.email.toLowerCase());
    const bMeta = flags.get(b.email.toLowerCase());

    // Paid / legacy featured outrank the free contributor tier.
    const aContrib = isContributorTier(aMeta) ? 1 : 0;
    const bContrib = isContributorTier(bMeta) ? 1 : 0;
    if (aContrib !== bContrib) return aContrib - bContrib;

    const aTime = aMeta?.activatedAt ? new Date(aMeta.activatedAt).getTime() : 0;
    const bTime = bMeta?.activatedAt ? new Date(bMeta.activatedAt).getTime() : 0;

    if (aTime !== bTime) return bTime - aTime;
    return a.name.localeCompare(b.name);
  });
}

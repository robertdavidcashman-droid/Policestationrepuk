import {
  buildRepAuditSnapshot,
  type RepAuditSnapshot,
} from '@/lib/admin/rep-audit-loader';

const TTL_MS = 50_000;

let cache: { at: number; data: RepAuditSnapshot } | null = null;

export function invalidateRepAuditCache(): void {
  cache = null;
}

export async function getRepAuditSnapshot(refresh = false): Promise<RepAuditSnapshot> {
  if (!refresh && cache && Date.now() - cache.at < TTL_MS) {
    return cache.data;
  }
  const data = await buildRepAuditSnapshot();
  cache = { at: Date.now(), data };
  return data;
}

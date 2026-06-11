import { paidDailyCap } from '../constants';
import { getPaidLookupCount, incrementPaidLookupCount } from '../storage';
import type { FirmProspectEmail } from '../types';

export interface PaidEnrichmentInput {
  firmName: string;
  domain?: string;
  postcode?: string;
}

async function canUsePaidLookup(): Promise<boolean> {
  const date = new Date().toISOString().slice(0, 10);
  const count = await getPaidLookupCount(date);
  return count < paidDailyCap();
}

async function trackPaidLookup(): Promise<void> {
  const date = new Date().toISOString().slice(0, 10);
  await incrementPaidLookupCount(date);
}

/** Hunter.io domain search — optional, env-gated. */
async function hunterDomainSearch(domain: string): Promise<FirmProspectEmail[]> {
  const key = process.env.HUNTER_API_KEY?.trim();
  if (!key) return [];

  const url = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${encodeURIComponent(key)}&limit=5`;
  const res = await fetch(url, { signal: AbortSignal.timeout(12_000) });
  if (!res.ok) return [];
  const data = (await res.json()) as {
    data?: { emails?: Array<{ value: string; type?: string; confidence?: number }> };
  };
  return (data.data?.emails ?? [])
    .filter((e) => e.value?.includes('@'))
    .map((e) => ({
      address: e.value.toLowerCase(),
      confidence: 'paid_api' as const,
      score: Math.min(90, 50 + (e.confidence ?? 0) / 2),
      source: 'hunter.io',
    }));
}

export async function paidEnrichEmails(
  input: PaidEnrichmentInput,
): Promise<FirmProspectEmail[]> {
  if (!(await canUsePaidLookup())) return [];
  if (!input.domain) return [];

  const hunter = await hunterDomainSearch(input.domain);
  if (hunter.length) await trackPaidLookup();
  return hunter;
}

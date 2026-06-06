import fs from 'fs';
import path from 'path';
import { slugMatchesSeed } from '@/lib/custody-station';
import { processSearchHit } from './crawler';
import { getFindingsForSuite } from './storage';
import type { CustodySuite } from './types';

type ForceCustodyFile = {
  source?: string;
  verifiedAt?: string;
  stations: Record<
    string,
    { custodyPhone: string; sourceUrl?: string; psrUrl?: string; suiteName?: string }
  >;
};

function loadForceJsonFiles(): ForceCustodyFile[] {
  const dir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dir)) return [];
  const out: ForceCustodyFile[] = [];
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('-custody-numbers.json')) continue;
    try {
      const data = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf-8')) as ForceCustodyFile;
      if (data.stations && typeof data.stations === 'object') out.push(data);
    } catch {
      /* skip invalid */
    }
  }
  return out;
}

function matchSuite(
  key: string,
  entry: { suiteName?: string },
  suites: CustodySuite[],
): CustodySuite | undefined {
  return suites.find((s) => {
    if (s.id === key || s.stationSlug === key) return true;
    if (slugMatchesSeed(key, s.stationSlug ?? '')) return true;
    if (entry.suiteName && s.custodySuiteName.toLowerCase().includes(entry.suiteName.toLowerCase().slice(0, 12))) {
      return true;
    }
    return false;
  });
}

/** Seed findings from committed official JSON (real source URLs, not hallucinated). */
export async function seedFindingsFromOfficialJson(
  suites: CustodySuite[],
): Promise<{ created: number; updated: number; rejected: number; newFindingIds: string[] }> {
  const files = loadForceJsonFiles();
  let created = 0;
  let updated = 0;
  let rejected = 0;
  const newFindingIds: string[] = [];

  for (const file of files) {
    const sourceUrl = file.source?.startsWith('http') ? file.source : '';
    for (const [key, entry] of Object.entries(file.stations)) {
      if (!entry.custodyPhone?.trim()) continue;
      const suite = matchSuite(key, entry, suites);
      if (!suite) continue;

      const url = entry.sourceUrl?.startsWith('http') ? entry.sourceUrl : sourceUrl;
      if (!url) {
        rejected++;
        continue;
      }

      const title = entry.suiteName ?? suite.custodySuiteName;
      const snippet = `${title} custody suite telephone ${entry.custodyPhone} — official force listing`;
      const existing = await getFindingsForSuite(suite.id);
      const outcome = await processSearchHit({
        suite,
        title,
        url,
        snippet,
        date: file.verifiedAt,
        existingFindings: existing,
      });

      if (outcome.action === 'created') {
        created++;
        if (outcome.finding?.id) newFindingIds.push(outcome.finding.id);
      } else if (outcome.action === 'duplicate') updated++;
      else rejected++;
    }
  }

  return { created, updated, rejected, newFindingIds };
}

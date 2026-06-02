import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

export interface CustodySeedEntry {
  name: string;
  slug: string;
  county?: string;
  phone?: string;
  custodySuite: boolean;
}

/** Parse custodySuite entries from scripts/generate-data.js (legacy curated list). */
export function loadCustodySeedFromGenerateData(rootDir?: string): CustodySeedEntry[] {
  const root = rootDir ?? resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const path = resolve(root, 'scripts/generate-data.js');
  const text = readFileSync(path, 'utf-8');
  const entries: CustodySeedEntry[] = [];
  const blockRe = /\{[^{}]*custodySuite:\s*true[^{}]*\}/g;
  for (const block of text.matchAll(blockRe)) {
    const b = block[0];
    const name = b.match(/name:\s*["']([^"']+)["']/)?.[1];
    const slug = b.match(/slug:\s*["']([^"']+)["']/)?.[1];
    const county = b.match(/county:\s*["']([^"']+)["']/)?.[1];
    const phone = b.match(/phone:\s*["']([^"']+)["']/)?.[1];
    if (name && slug) {
      entries.push({ name, slug, county, phone, custodySuite: true });
    }
  }
  return entries;
}

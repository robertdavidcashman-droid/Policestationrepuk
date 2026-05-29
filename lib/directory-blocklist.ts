import fs from 'fs';
import path from 'path';
import type { Representative } from './types';

export type DirectoryBlocklistFile = {
  emails?: string[];
  slugs?: string[];
  slugPrefixes?: string[];
  /** Normalised full names, e.g. "laurie learmont" (see normalizePersonName) */
  normalizedNames?: string[];
};

/** Canonical test account kept for Stripe / feature testing — never treat as smoke junk. */
export const KEPT_TEST_REP_EMAIL = 'test.rep@policestationrepuk.co.uk';

export type SmokeRepInput = Pick<Representative, 'email' | 'name' | 'slug' | 'notes'>;

let _cached: DirectoryBlocklistFile | null = null;

export function loadDirectoryBlocklistFile(): DirectoryBlocklistFile {
  if (_cached) return _cached;
  if (typeof window !== 'undefined') {
    _cached = {};
    return _cached;
  }
  const filePath = path.join(process.cwd(), 'data', 'directory-blocklist.json');
  if (!fs.existsSync(filePath)) {
    _cached = {};
    return _cached;
  }
  try {
    _cached = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as DirectoryBlocklistFile;
  } catch {
    _cached = {};
  }
  return _cached;
}

export function normalizePersonName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isKeptTestRep(email: string): boolean {
  return email.toLowerCase().trim() === KEPT_TEST_REP_EMAIL;
}

export function repMatchesDirectoryBlocklist(
  rep: Representative,
  bl: DirectoryBlocklistFile,
): boolean {
  if (isKeptTestRep(rep.email)) return false;

  const email = rep.email.toLowerCase();
  if (bl.emails?.some((e) => e.toLowerCase() === email)) return true;
  const slug = rep.slug.toLowerCase();
  if (bl.slugs?.some((s) => s.toLowerCase() === slug)) return true;
  for (const prefix of bl.slugPrefixes ?? []) {
    if (slug.startsWith(prefix.toLowerCase())) return true;
  }
  const nn = normalizePersonName(rep.name);
  for (const n of bl.normalizedNames ?? []) {
    if (nn === normalizePersonName(n) || nn === n.trim().toLowerCase()) return true;
  }
  return false;
}

/** RFC / reserved doc domains and CI registrations — never show in public directory. */
const RESERVED_DOC_EMAIL_SUFFIXES = [
  '@example.com',
  '@example.org',
  '@example.net',
  '@example.co.uk',
];

const SMOKE_EMAIL_LOCAL_PREFIXES = ['smoketest', 'cursor-test', 'audit-test'];

/**
 * E2E, API, and production smoke scripts POST real registrations to KV.
 * Hide those listings from the live directory and admin queues.
 * The kept test rep (`test.rep@…`) is explicitly excluded.
 */
export function matchesAutomatedSmokeRep(input: SmokeRepInput): boolean {
  const email = (input.email ?? '').toLowerCase().trim();
  if (!email) return false;
  if (isKeptTestRep(email)) return false;

  if (RESERVED_DOC_EMAIL_SUFFIXES.some((s) => email.endsWith(s))) return true;
  if (email.endsWith('@policestationrepuk.test')) return true;

  const local = email.split('@')[0] ?? '';
  if (SMOKE_EMAIL_LOCAL_PREFIXES.some((p) => local === p || local.startsWith(`${p}+`))) {
    return true;
  }

  const name = (input.name ?? '').trim();
  if (/^playwright test\b/i.test(name)) return true;
  if (/^api test\b/i.test(name)) return true;
  if (/^dup test\b/i.test(name)) return true;
  if (/^smoke test\b/i.test(name)) return true;
  if (/^cursor test rep\b/i.test(name)) return true;
  if (/\(DELETE ME\)/i.test(name)) return true;

  const notes = (input.notes ?? '').toLowerCase();
  if (notes.includes('automated playwright test submission')) return true;
  if (notes.includes('playwright api test')) return true;
  if (notes.includes('synthetic rep for production smoke test')) return true;
  if (notes.includes('synthetic smoke-test rep')) return true;
  if (notes.includes('safe to delete')) return true;

  const slug = (input.slug ?? '').toLowerCase();
  if (slug.startsWith('playwright-test-')) return true;
  if (slug.startsWith('api-test-')) return true;
  if (slug.startsWith('dup-test-')) return true;
  if (slug.startsWith('smoke-test-')) return true;

  return false;
}

export function repIsAutomatedDirectoryTest(rep: Representative): boolean {
  return matchesAutomatedSmokeRep(rep);
}

/**
 * Read mirrored site data from data/pages.json (output of scripts/crawl-site.js).
 * Used to render exact URL mirror with original titles, headings, content, images, links.
 */

import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const PAGES_PATH = path.join(DATA_DIR, 'pages.json');

export interface MirrorPage {
  url: string;
  path: string;
  title: string;
  headings: { level: number; text: string }[];
  content: string;
  links: { href: string; text: string }[];
  images: { src: string; alt: string }[];
  crawledAt: string;
  error?: string;
}

export interface MirrorPayload {
  baseUrl: string;
  crawledAt: string;
  count: number;
  pages: MirrorPage[];
}

let _cache: MirrorPayload | null = null;

function loadMirror(): MirrorPayload | null {
  if (_cache) return _cache;
  if (!fs.existsSync(PAGES_PATH)) return null;
  try {
    _cache = JSON.parse(fs.readFileSync(PAGES_PATH, 'utf-8')) as MirrorPayload;
    return _cache;
  } catch {
    return null;
  }
}

/** All crawled paths (including "/" as index). For static generation. */
export function getMirrorPaths(): string[] {
  const data = loadMirror();
  if (!data?.pages?.length) return [];
  return data.pages.map((p) => (p.path === '/' ? '/' : p.path.replace(/^\//, '')));
}

/** Get a single page by path. path "/" or "" for homepage. */
export function getMirrorPage(pathSlug: string): MirrorPage | null {
  const data = loadMirror();
  if (!data?.pages) return null;
  const norm = !pathSlug || pathSlug === '/' ? '/' : pathSlug.startsWith('/') ? pathSlug : `/${pathSlug}`;
  return data.pages.find((p) => p.path === norm) ?? null;
}

/** Nav links from crawl: use homepage links if available, else fallback. */
export function getMirrorNavLinks(): { href: string; text: string }[] {
  const home = getMirrorPage('/');
  if (home?.links?.length) {
    return home.links.slice(0, 24).map((l) => ({ href: l.href, text: l.text || l.href }));
  }
  return [
    { href: '/About', text: 'About' },
    { href: '/Contact', text: 'Contact' },
    { href: '/directory', text: 'Directory' },
    { href: '/FindYourRep', text: 'Find Your Rep' },
    { href: '/Resources', text: 'Resources' },
    { href: '/Join', text: 'Join' },
    { href: '/PoliceStationRepsByCounty', text: 'Police Station Reps by County' },
    { href: '/FAQ', text: 'FAQ' },
    { href: '/Privacy', text: 'Privacy' },
    { href: '/Terms', text: 'Terms' },
  ];
}

export function hasMirrorData(): boolean {
  return !!loadMirror();
}

/** Legacy county landing URLs — canonical /directory/{slug} is already in sitemap. */
const OMIT_SITEMAP_LEGACY_COUNTY_PATHS = new Set([
  'PoliceStationRepsKent',
  'PoliceStationRepsLondon',
  'PoliceStationRepsEssex',
  'PoliceStationRepsManchester',
  'PoliceStationRepsWestMidlands',
  'PoliceStationRepsWestYorkshire',
  'PoliceStationRepsSurrey',
  'PoliceStationRepsSussex',
  'PoliceStationRepsHampshire',
  'PoliceStationRepsNorfolk',
  'PoliceStationRepsSuffolk',
  'PoliceStationRepsBerkshire',
  'PoliceStationRepsHertfordshire',
]);

/**
 * Exclude junk crawl paths and duplicate legacy county URLs from sitemap (mirror mode).
 * `path` is without leading slash, as returned by getMirrorPaths().
 */
export function shouldIncludeMirrorPathInSitemap(path: string): boolean {
  if (!path || path === '/') return false;
  if (OMIT_SITEMAP_LEGACY_COUNTY_PATHS.has(path)) return false;

  let decoded: string;
  try {
    decoded = decodeURIComponent(path.replace(/\+/g, ' '));
  } catch {
    return false;
  }
  const lower = decoded.toLowerCase().trim();
  if (lower === 'not available' || lower === 'not publicly available') return false;
  if (/^not\s+available$/i.test(decoded.trim())) return false;
  if (/^not\s+publicly\s+available$/i.test(decoded.trim())) return false;
  // /register and its case variants — see app/api/register/gate. The page
  // exists as the destination of public CTAs but the registration form is
  // gated behind a server-issued one-shot token, so we do not want search
  // engines indexing it. robots.ts also disallows it.
  if (lower === 'register' || lower.startsWith('register/')) return false;
  return true;
}

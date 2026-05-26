import type { MetadataRoute } from 'next';
import {
  getAllCounties,
  getAllReps,
  getAllStations,
  getAllWikiArticles,
  getAllLegalUpdates,
} from '@/lib/data';
import { getAllBlogArticles } from '@/lib/blog/registry';
import { getMirrorPaths, hasMirrorData, shouldIncludeMirrorPathInSitemap } from '@/lib/mirror-data';
import { SITEMAP_PATHS } from '@/lib/sitemap-paths';
import { COUNTY_SEO_PAGES } from '@/lib/county-seo-pages';
import { LEGACY_EXACT_REDIRECTS } from '@/lib/legacy-exact-redirects';
import { SITE_URL as BASE } from '@/lib/seo-layer/config';
import {
  countRepsForStation,
  shouldIncludePoliceStationInSitemap,
} from '@/lib/station-indexing';

const now = new Date();

function safeLastModified(input: string | Date | undefined | null, fallback: Date): Date {
  if (input instanceof Date && !Number.isNaN(input.getTime())) return input;
  if (typeof input === 'string' && input.trim()) {
    const d = new Date(input);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return fallback;
}

/** Lowercase path segments that must not appear twice with different casing (SEO). */
const CANONICAL_PATH_LOWER = new Map<string, string>([
  ['directory', 'directory'],
  ['blog', 'Blog'],
]);

/**
 * `/register` is intentionally omitted from the sitemap. The page exists as a
 * destination for the public "Register free" CTAs but the registration form
 * itself is gated behind a server-issued one-shot eligibility token (see
 * app/api/register/gate). We do not want search engines indexing the gate
 * landing page; robots.ts also disallows it.
 */
const HIGH_PRIORITY_PAGES = [
  { path: '', priority: 1, freq: 'daily' as const },
  { path: 'directory', priority: 0.95, freq: 'daily' as const },
  { path: 'search', priority: 0.9, freq: 'daily' as const },
  { path: 'Blog', priority: 0.85, freq: 'daily' as const },
  { path: 'StationsDirectory', priority: 0.85, freq: 'weekly' as const },
  { path: 'FormsLibrary', priority: 0.8, freq: 'monthly' as const },
  { path: 'Resources', priority: 0.8, freq: 'monthly' as const },
  { path: 'About', priority: 0.7, freq: 'monthly' as const },
  { path: 'Contact', priority: 0.7, freq: 'monthly' as const },
  { path: 'FAQ', priority: 0.7, freq: 'monthly' as const },
  { path: 'CustodyNote', priority: 0.85, freq: 'weekly' as const },
  { path: 'Premium', priority: 0.75, freq: 'weekly' as const },
  { path: 'Forces', priority: 0.7, freq: 'monthly' as const },
  { path: 'Firms', priority: 0.7, freq: 'monthly' as const },
  { path: 'GetWork', priority: 0.7, freq: 'monthly' as const },
  { path: 'HowToBecomePoliceStationRep', priority: 0.85, freq: 'monthly' as const },
  { path: 'FindSupervisingSolicitor', priority: 0.8, freq: 'monthly' as const },
  { path: 'PoliceStationRates', priority: 0.7, freq: 'monthly' as const },
  { path: 'PACE', priority: 0.7, freq: 'monthly' as const },
  { path: 'WhatsApp', priority: 0.6, freq: 'monthly' as const },
  { path: 'GoFeatured', priority: 0.6, freq: 'monthly' as const },
  { path: 'PoliceStationCover', priority: 0.65, freq: 'monthly' as const },
  { path: 'PoliceStationRepJobsUK', priority: 0.8, freq: 'weekly' as const },
  { path: 'LegalUpdates', priority: 0.75, freq: 'weekly' as const },
  { path: 'Forum', priority: 0.5, freq: 'monthly' as const },
  { path: 'Wiki', priority: 0.8, freq: 'weekly' as const },
  { path: 'AboutFounder', priority: 0.6, freq: 'monthly' as const },
  { path: 'BeginnersGuide', priority: 0.7, freq: 'monthly' as const },
  { path: 'InterviewUnderCaution', priority: 0.7, freq: 'monthly' as const },
  { path: 'WhatDoesRepDo', priority: 0.7, freq: 'monthly' as const },
  { path: 'DutySolicitorVsRep', priority: 0.65, freq: 'monthly' as const },
  { path: 'CriminalLawCareerGuide', priority: 0.6, freq: 'monthly' as const },
  { path: 'DSCCRegistrationGuide', priority: 0.6, freq: 'monthly' as const },
  { path: 'PoliceDisclosureGuide', priority: 0.65, freq: 'monthly' as const },
  { path: 'PoliceStationRepPay', priority: 0.8, freq: 'monthly' as const },
  { path: 'CrownCourtFees', priority: 0.6, freq: 'monthly' as const },
  { path: 'MagistratesCourtFees', priority: 0.6, freq: 'monthly' as const },
  { path: 'PrepareForCIT', priority: 0.6, freq: 'monthly' as const },
  { path: 'AccreditedRepresentativeGuide', priority: 0.65, freq: 'monthly' as const },
  { path: 'BuildPortfolioGuide', priority: 0.6, freq: 'monthly' as const },
  { path: 'GettingStarted', priority: 0.65, freq: 'monthly' as const },
  { path: 'RepFAQMaster', priority: 0.6, freq: 'monthly' as const },
  { path: 'RepsHub', priority: 0.6, freq: 'monthly' as const },
  { path: 'SolicitorPoliceStationCoverUK', priority: 0.6, freq: 'monthly' as const },
  { path: 'KentPoliceStationReps', priority: 0.65, freq: 'monthly' as const },
  { path: 'EscapeFeeCalculator', priority: 0.65, freq: 'monthly' as const },
  { path: 'police-station-representative', priority: 0.9, freq: 'weekly' as const },
  { path: 'criminal-solicitor-police-station', priority: 0.9, freq: 'weekly' as const },
  { path: 'free-legal-advice-police-station', priority: 0.88, freq: 'weekly' as const },
  { path: 'police-station-rights-uk', priority: 0.88, freq: 'weekly' as const },
  { path: 'police-station-rep-kent', priority: 0.88, freq: 'weekly' as const },
  { path: 'police-station-rep-london', priority: 0.88, freq: 'weekly' as const },
  { path: 'police-station-rep-essex', priority: 0.88, freq: 'weekly' as const },
  { path: 'Privacy', priority: 0.3, freq: 'yearly' as const },
  { path: 'Terms', priority: 0.3, freq: 'yearly' as const },
  { path: 'Cookies', priority: 0.3, freq: 'yearly' as const },
  { path: 'GDPR', priority: 0.3, freq: 'yearly' as const },
  { path: 'DataProtection', priority: 0.3, freq: 'yearly' as const },
  { path: 'Accessibility', priority: 0.3, freq: 'yearly' as const },
  { path: 'Complaints', priority: 0.3, freq: 'yearly' as const },
];

const HIGH_PRIORITY_SET = new Set(HIGH_PRIORITY_PAGES.map((p) => p.path));
const HIGH_PRIORITY_LOWER = new Set(HIGH_PRIORITY_PAGES.map((p) => p.path.toLowerCase()));

/** Paths that are redirect sources — should never appear in sitemap. */
const REDIRECT_SOURCES = new Set(
  Object.keys(LEGACY_EXACT_REDIRECTS).map((k) => k.replace(/^\//, '')),
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    return await buildSitemap();
  } catch (err) {
    console.error('[sitemap] generation failed, returning static fallback:', err);
    return HIGH_PRIORITY_PAGES.map((p) => ({
      url: p.path ? `${BASE}/${p.path}` : BASE,
      lastModified: now,
      changeFrequency: p.freq,
      priority: p.priority,
    }));
  }
}

async function buildSitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = HIGH_PRIORITY_PAGES.map((p) => ({
    url: p.path ? `${BASE}/${p.path}` : BASE,
    lastModified: now,
    changeFrequency: p.freq,
    priority: p.priority,
  }));

  if (hasMirrorData()) {
    const paths = getMirrorPaths().filter(
      (p) =>
        p !== '/' &&
        !HIGH_PRIORITY_SET.has(p) &&
        !HIGH_PRIORITY_LOWER.has(p.toLowerCase()) &&
        !REDIRECT_SOURCES.has(p.toLowerCase()) &&
        shouldIncludeMirrorPathInSitemap(p),
    );
    for (const p of paths) {
      entries.push({
        url: `${BASE}/${p}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.5,
      });
    }
  } else {
    for (const p of SITEMAP_PATHS) {
      if (!HIGH_PRIORITY_SET.has(p)) {
        const lower = p.toLowerCase();
        const canonicalSeg = CANONICAL_PATH_LOWER.get(lower);
        const pathSeg = canonicalSeg ?? p;
        if (canonicalSeg && HIGH_PRIORITY_SET.has(canonicalSeg)) continue;
        entries.push({
          url: `${BASE}/${pathSeg}`,
          lastModified: now,
          changeFrequency: 'weekly',
          priority: 0.5,
        });
      }
    }
  }

  let counties: Awaited<ReturnType<typeof getAllCounties>> = [];
  let reps: Awaited<ReturnType<typeof getAllReps>> = [];
  let stations: Awaited<ReturnType<typeof getAllStations>> = [];
  let wikiArticles: Awaited<ReturnType<typeof getAllWikiArticles>> = [];
  let legalUpdates: Awaited<ReturnType<typeof getAllLegalUpdates>> = [];
  try {
    const batch = await Promise.all([
      getAllCounties(),
      getAllReps(),
      getAllStations(),
      getAllWikiArticles(),
      getAllLegalUpdates(),
    ]);
    [counties, reps, stations, wikiArticles, legalUpdates] = batch;
  } catch (dataErr) {
    console.error('[sitemap] dynamic data load failed, continuing with static paths only:', dataErr);
  }

  let blogPostUrls: MetadataRoute.Sitemap = [];
  try {
    const blogArticles = getAllBlogArticles();
    blogPostUrls = blogArticles
      .filter((a) => a.slug && String(a.slug).trim())
      .map((a) => ({
        url: `${BASE}/Blog/${a.slug}`,
        lastModified: safeLastModified(a.modified ?? a.published, now),
        changeFrequency: 'monthly' as const,
        priority: 0.58,
      }));
  } catch (blogErr) {
    console.error('[sitemap] blog URLs skipped:', blogErr);
  }
  const directoryCountyUrls = counties
    .filter((c) => c.slug && String(c.slug).trim())
    .map((c) => ({
      url: `${BASE}/directory/${c.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    }));
  const repUrls = reps
    .filter((r) => r.slug && String(r.slug).trim())
    .map((r) => ({
      url: `${BASE}/rep/${r.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));
  /** Omit thin station URLs (no reps + not custody) — reduces "Discovered – not indexed" noise. */
  const stationUrls: MetadataRoute.Sitemap = [];
  for (const s of stations) {
    if (!s.slug || !String(s.slug).trim()) continue;
    const repCount = countRepsForStation(s, reps, stations);
    if (!shouldIncludePoliceStationInSitemap(s, repCount)) continue;
    stationUrls.push({
      url: `${BASE}/police-station/${s.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: repCount > 0 ? 0.64 : 0.52,
    });
  }
  const wikiUrls = wikiArticles
    .filter((a) => a.slug && String(a.slug).trim())
    .map((a) => ({
      url: `${BASE}/Wiki/${a.slug}`,
      lastModified: safeLastModified(a.lastImprovedDate, now),
      changeFrequency: 'monthly' as const,
      priority: 0.65,
    }));
  const legalUpdateUrls = legalUpdates
    .filter((u) => u.slug && String(u.slug).trim())
    .map((u) => ({
      url: `${BASE}/LegalUpdates/${u.slug}`,
      lastModified: safeLastModified(u.publishedDate, now),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));

  // county-seo slugs are 308-redirected to /directory/{slug} by middleware — omit from sitemap
  // as the canonical /directory/ URLs are already included above.
  void COUNTY_SEO_PAGES;

  const extraPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/directory/counties`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
  ];

  const combined = [
    ...entries,
    ...directoryCountyUrls,
    ...repUrls,
    ...stationUrls,
    ...wikiUrls,
    ...legalUpdateUrls,
    ...blogPostUrls,
    ...extraPages,
  ];
  const seen = new Set<string>();
  return combined.filter((e) => {
    if (seen.has(e.url)) return false;
    seen.add(e.url);
    return true;
  });
}

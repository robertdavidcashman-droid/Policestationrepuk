import '@/styles/prose.css';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getMirrorPage, getMirrorPaths, hasMirrorData } from '@/lib/mirror-data';
import { getLiveSiteSingleSegmentPaths } from '@/lib/live-site-paths';
import { pathToTitle } from '@/lib/sitemap-paths';
import { getCountySlugSet } from '@/lib/county-slugs';
import { normalizeMirrorNavHref } from '@/lib/internal-link-normalize';
import { buildMetadata } from '@/lib/seo';
import { segmentCrawlContent } from '@/components/CrawlContent';

const SITE_TITLE = 'PoliceStationRepUK';

const MAIN_LINKS = [
  { href: '/', text: 'Home' },
  { href: '/Blog', text: 'Blog' },
  { href: '/CustodyNote', text: '🆕 Custody Note' },
  { href: '/directory', text: '🔍 Find a Rep' },
  { href: '/search', text: '🔎 Search' },
  { href: '/register', text: 'Join the Directory (Free)' },
  { href: '/StationsDirectory', text: '📞 Station Numbers' },
  { href: '/FormsLibrary', text: '📄 Forms' },
  { href: '/Resources', text: '🌐 Resources' },
  { href: '/Contact', text: 'Contact Us' },
  { href: '/About', text: 'About' },
  { href: '/FAQ', text: 'Help & FAQ' },
  { href: '/Privacy', text: 'Privacy' },
  { href: '/Terms', text: 'Terms' },
];

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-static';
export const revalidate = false;

/** Paths that have dedicated page files — exclude from [slug] catch-all (all casings). */
const DEDICATED_ROUTES = new Set([
  'About', 'about',
  'Account', 'account',
  /** Private admin dashboard — `app/admin/page.tsx` */
  'admin', 'Admin',
  'Accessibility', 'accessibility',
  'Blog', 'blog',
  'Complaints', 'complaints',
  'Contact', 'contact',
  'Cookies', 'cookies',
  'CustodyNote', 'custodynote',
  'DataProtection', 'dataprotection',
  'FAQ', 'faq',
  'Firms', 'firms',
  'Forces', 'forces',
  'FormsLibrary', 'formslibrary',
  'Forum', 'forum',
  'GDPR', 'gdpr',
  'GetWork', 'getwork',
  'GoFeatured', 'gofeatured',
  'HowToBecomePoliceStationRep', 'howtobecomepolicestationrep',
  'LegalUpdates', 'legalupdates',
  'PACE', 'pace',
  'PoliceStationCover', 'policestationcover',
  'PoliceStationRates', 'policestationrates',
  'PoliceStationRepJobsUK', 'policestationrepjobsuk',
  'Premium', 'premium',
  'Privacy', 'privacy',
  'Resources', 'resources',
  'StationsDirectory', 'stationsdirectory',
  'Terms', 'terms',
  'WhatsApp', 'whatsapp',
  'register', 'Register',
  'directory', 'Directory',
  /** New Legal Services Directory section — app/legal-services-directory/** */
  'legal-services-directory',
  'EscapeFeeCalculator', 'escapefeecalculator',
  'Wiki', 'wiki',
  /** Dedicated `app/search/page.tsx` — must not collide with [slug] static params */
  'search', 'Search',
  'PoliceStationRepsByCounty', 'policestationrepsbycounty',
  'Map', 'map',
  'PoliceStationRepsKent', 'policestationrepskent',
  'PoliceStationRepsLondon', 'policestationrepslondon',
  'PoliceStationRepsEssex', 'policestationrepsessex',
  'PoliceStationRepsManchester', 'policestationrepsmanchester',
  'PoliceStationRepsWestMidlands', 'policestationrepswestmidlands',
  'PoliceStationRepsWestYorkshire', 'policestationrepswestyorkshire',
  'PoliceStationRepsSurrey', 'policestationrepssurrey',
  'PoliceStationRepsSussex', 'policestationrepssussex',
  'PoliceStationRepsHampshire', 'policestationrepshampshire',
  'PoliceStationRepsNorfolk', 'policestationrepsnorfolk',
  'PoliceStationRepsSuffolk', 'policestationrepssuffolk',
  'PoliceStationRepsBerkshire', 'policestationrepsberkshire',
  'PoliceStationRepsHertfordshire', 'policestationrepshertfordshire',
  // New pages created from crawl data
  'AboutFounder', 'aboutfounder',
  'AccreditedRepresentativeGuide', 'accreditedrepresentativeguide',
  'Advertisers', 'advertisers',
  'Advertising', 'advertising',
  'BeginnersGuide', 'beginnersguide',
  'BuildPortfolioGuide', 'buildportfolioguide',
  'CriminalLawCareerGuide', 'criminallawcareerguide',
  'CrownCourtFees', 'crowncourtfees',
  'DSCCRegistrationGuide', 'dsccregistrationguide',
  'DutySolicitorVsRep', 'dutysolicitorvsrep',
  'FirmsWhatsAppGroup', 'firmswhatsappgroup',
  'GettingStarted', 'gettingstarted',
  'GravesendPoliceStationReps', 'gravesendpolicestationreps',
  'HowToBecome', 'howtobecome',
  'ICO', 'ico',
  'InterviewUnderCaution', 'interviewundercaution',
  'Join', 'join',
  'KentAgentCover', 'kentagentcover',
  'KentCustodySuites', 'kentcustodysuites',
  'KentPoliceStationReps', 'kentpolicestationreps',
  'MagistratesCourtFees', 'magistratescourtfees',
  'MaidstonePoliceStationReps', 'maidstonepolicestationreps',
  'MediaKit', 'mediakit',
  'MedwayPoliceStationReps', 'medwaypolicestationreps',
  'PoliceDisclosureGuide', 'policedisclosureguide',
  'PoliceStationRepPay', 'policestationreppay',
  'PrepareForCIT', 'prepareforcit',
  'RegionalDemandHeatmap', 'regionaldemandheatmap',
  'RepFAQMaster', 'repfaqmaster',
  'RepsHub', 'repshub',
  'SevenoaksPoliceStationReps', 'sevenoakspolicestationreps',
  'SolicitorPoliceStationCoverUK', 'solicitorpolicestationcoveruk',
  'Subscribe', 'subscribe',
  'SwanleyPoliceStationReps', 'swanleypolicestationreps',
  'TonbridgePoliceStationReps', 'tonbridgepolicestationreps',
  'WhatDoesRepDo', 'whatdoesrepdo',
  'police-station-representatives-directory-england-wales',
  'police-station-representative',
  'criminal-solicitor-police-station',
  'free-legal-advice-police-station',
  'police-station-rights-uk',
  'police-station-rep-kent',
  'police-station-rep-london',
  'police-station-rep-essex',
]);

/** Pre-render paths that have mirror content; rest served on demand. */
export function generateStaticParams() {
  const countySlugs = getCountySlugSet();
  const mirrorPaths = hasMirrorData()
    ? getMirrorPaths().filter(
        (p) =>
          p !== '/' &&
          !p.includes('/') &&
          !DEDICATED_ROUTES.has(p) &&
          !countySlugs.has(p),
      )
    : [];
  const livePaths = getLiveSiteSingleSegmentPaths().filter(
    (p) => !DEDICATED_ROUTES.has(p) && !countySlugs.has(p),
  );
  const combined = Array.from(new Set([...mirrorPaths, ...livePaths]));
  return combined.map((slug) => ({ slug }));
}

export const dynamicParams = true;

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const mirror = getMirrorPage(slug);
  const title = mirror?.title?.replace(/\s*\|\s*.*$/, '').trim() || pathToTitle(slug);
  const rawDesc =
    mirror?.content?.slice(0, 150) ||
    `${title} — ${SITE_TITLE}. Police station representatives directory.`;
  const description = rawDesc.length > 155
    ? (rawDesc.lastIndexOf(' ', 154) > 80 ? rawDesc.slice(0, rawDesc.lastIndexOf(' ', 154)) : rawDesc.slice(0, 154)) + '…'
    : rawDesc;
  return buildMetadata({
    title: mirror?.title || `${title} | ${SITE_TITLE}`,
    description,
    path: `/${slug}`,
  });
}

function Heading({ level, text }: { level: number; text: string }) {
  const Tag = `h${Math.min(level, 6)}` as 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  const styles: Record<number, string> = {
    2: 'text-2xl font-bold mt-10 mb-4 pb-2 border-b-2 border-[var(--gold-pale)] text-[var(--navy)]',
    3: 'text-xl font-semibold mt-8 mb-3 text-[var(--navy)]',
    4: 'text-lg font-semibold mt-6 mb-2 text-[var(--navy)]',
    5: 'text-base font-semibold mt-5 mb-2 text-[var(--navy)]',
    6: 'text-sm font-bold mt-4 mb-2 uppercase tracking-wide text-[var(--muted)]',
  };
  return (
    <Tag className={`tracking-tight first:mt-0 ${styles[Math.min(level, 6)] || styles[4]}`}>
      {text}
    </Tag>
  );
}

function ContentBlock({ content }: { content: string }) {
  const paragraphs = content
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphs.length <= 1 && content.length < 300) {
    return (
      <div className="max-w-none break-words leading-[1.8] text-[var(--muted)] whitespace-pre-line">
        {content}
      </div>
    );
  }

  return (
    <div className="max-w-none space-y-5 break-words leading-[1.8] text-[var(--muted)]">
      {paragraphs.map((p, i) => (
        <p key={i} className="whitespace-pre-line">{p}</p>
      ))}
    </div>
  );
}

export default async function SlugPage({ params }: PageProps) {
  const { slug } = await params;
  const mirror = getMirrorPage(slug);
  const title = pathToTitle(slug);

  const countySlugs = getCountySlugSet();
  const mirrorPaths = hasMirrorData()
    ? getMirrorPaths().filter(
        (p) => p !== '/' && !p.includes('/') && !DEDICATED_ROUTES.has(p) && !DEDICATED_ROUTES.has(p.toLowerCase()),
      )
    : [];
  const livePaths = getLiveSiteSingleSegmentPaths().filter(
    (p) => !DEDICATED_ROUTES.has(p) && !DEDICATED_ROUTES.has(p.toLowerCase()),
  );
  const allowedSlugs = Array.from(new Set([...mirrorPaths, ...livePaths])).filter((s) => !countySlugs.has(s));
  if (countySlugs.has(slug) || !allowedSlugs.includes(slug)) notFound();

  const page = mirror && !mirror.error ? mirror : null;
  const links = (page?.links ?? MAIN_LINKS.map((l) => ({ href: l.href, text: l.text }))).map((l) => ({
    href: normalizeMirrorNavHref(l.href),
    text: l.text || l.href,
  }));

  if (page && !('error' in page && page.error)) {
    const h1 = page.headings?.find((h) => h.level === 1)?.text ?? title;
    const segmented = segmentCrawlContent({
      title: h1,
      headings: page.headings,
      content: page.content,
    });

    return (
      <div className="page-container">
        <div className="mx-auto max-w-3xl">
          <header className="mb-8">
            <h1 className="text-h1 text-[var(--foreground)]">{h1}</h1>
          </header>

          <article className="content-section">
            {segmented.sections.length > 0 ? (
              <>
                {segmented.intro.length > 0 && (
                  <div className="mb-6 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)] sm:p-8">
                    <div className="space-y-4 leading-[1.8] text-[var(--muted)]">
                      {segmented.intro.map((p, i) => (
                        <p key={i} className="whitespace-pre-line">{p}</p>
                      ))}
                    </div>
                  </div>
                )}
                {segmented.sections.map((section, idx) => (
                  <section key={idx} className="mb-6 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)] sm:p-8">
                    <Heading level={section.level} text={section.text} />
                    {section.paragraphs.length > 0 && (
                      <div className="mt-3 space-y-4 leading-[1.8] text-[var(--muted)]">
                        {section.paragraphs.map((p, i) => (
                          <p key={i} className="whitespace-pre-line">{p}</p>
                        ))}
                      </div>
                    )}
                  </section>
                ))}
              </>
            ) : (
              <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)] sm:p-8">
                <ContentBlock content={page.content} />
              </div>
            )}
          </article>

          {'images' in page && Array.isArray(page.images) && page.images.length > 0 && (
            <section className="mt-10 grid gap-6 sm:grid-cols-2" aria-label="Images">
              {page.images.map((img: { src: string; alt: string }, i: number) => (
                <figure key={i} className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--card-border)] shadow-[var(--card-shadow)]">
                  <Image
                    src={img.src}
                    alt={img.alt || `Image related to ${title}`}
                    width={600}
                    height={256}
                    loading="lazy"
                    className="h-64 w-full object-cover"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                  {img.alt && (
                    <figcaption className="border-t border-[var(--border)] p-3 text-sm text-[var(--muted)]">
                      {img.alt}
                    </figcaption>
                  )}
                </figure>
              ))}
            </section>
          )}

          <nav className="mt-14 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)]" aria-label="Site links">
            <p className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">Quick links</p>
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
              {links.slice(0, 16).map((link, i) => (
                <li key={`${link.href}-${i}`}>
                  <Link
                    href={link.href}
                    className="text-sm font-medium text-[var(--foreground)] no-underline transition-colors hover:text-[var(--accent)] hover:underline"
                  >
                    {link.text || link.href}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10">
          <h1 className="text-h1 text-[var(--foreground)]">{title}</h1>
        </header>
        <section className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)] sm:p-8">
          <p className="leading-relaxed text-[var(--muted)]">
            This page is part of the PoliceStationRepUK site. Content is being updated. Use the links below to find a rep, register, or get in touch.
          </p>
        </section>
        <nav className="mt-14 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)]" aria-label="Site links">
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">Quick links</p>
          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            {MAIN_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm font-medium text-[var(--foreground)] no-underline transition-colors hover:text-[var(--accent)] hover:underline"
                >
                  {link.text}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
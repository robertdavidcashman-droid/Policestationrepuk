import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getRepBySlug, stripPrivateFields } from '@/lib/data';
import { buildMetadata, legalServiceSchema, breadcrumbSchema, personSchema } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { RepTrustBadges } from '@/components/RepTrustBadges';
import { DirectoryCredentialVerificationNotice } from '@/components/DirectoryCredentialVerificationNotice';
import { ReportProfileButton } from '@/components/ReportProfileButton';
import { phoneToTelHref } from '@/lib/phone';
import { availabilityBucket, isUrgentCoverCapable, profileCompleteness } from '@/lib/directory-ranking';
import { looksIneligible } from '@/lib/rep-status';
import { turnstileSiteKey } from '@/lib/turnstile';

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const { getAllRepPathSlugs } = await import('@/lib/data');
  return getAllRepPathSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const rep = await getRepBySlug(slug);
  if (!rep) return {};
  return buildMetadata({
    title: `${rep.name} | Police Station Representative`,
    description: `Accredited police station representative ${rep.name}. Covers ${rep.county}. ${rep.accreditation}. Contact direct for attendance and availability — operates under solicitor instruction where required.`,
    path: `/rep/${rep.slug}`,
  });
}

function availabilitySummary(raw: string): { label: string; detail: string; chip: string } {
  const b = availabilityBucket(raw);
  const map: Record<string, { label: string; detail: string }> = {
    '24-7': {
      label: 'Broad hours',
      detail: 'Listing indicates 24/7 or similar — confirm directly before instructing.',
    },
    'evenings-nights': {
      label: 'Evenings & nights',
      detail: 'Often suited to out-of-hours custody work — always confirm availability for your matter.',
    },
    weekends: {
      label: 'Weekends',
      detail: 'Weekend-oriented listing — contact the rep to confirm cover for your station and time.',
    },
    daytime: {
      label: 'Daytime / office hours',
      detail: 'Typical business-hours pattern — verify response times for urgent work.',
    },
    flexible: {
      label: 'Flexible / by arrangement',
      detail: 'Availability by agreement — message or call with your requirements.',
    },
    unknown: {
      label: 'Availability',
      detail: 'See contact details and ask the rep directly.',
    },
  };
  const m = map[b] || map.unknown;
  return { ...m, chip: m.label };
}

export default async function RepPage({ params }: PageProps) {
  try {
    return await renderRepPage(params);
  } catch (err) {
    // TEMP: surface the actual error in the rendered HTML so we can diagnose
    // the Wayne Thomas dynamic-rep 500. Remove once root cause is fixed.
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack || '' : '';
    if (message === 'NEXT_NOT_FOUND' || message === 'NEXT_HTTP_ERROR_FALLBACK;404') {
      throw err; // legitimate notFound(); let Next.js handle.
    }
    return (
      <pre style={{ whiteSpace: 'pre-wrap', padding: 20, fontFamily: 'monospace' }}>
        {`DIAG: caught error during /rep/[slug] render\n\n${message}\n\n${stack}`}
      </pre>
    );
  }
}

async function renderRepPage(params: PageProps['params']) {
  const { slug } = await params;
  const found = await getRepBySlug(slug);
  if (!found) notFound();

  const rep = stripPrivateFields(found);

  if (looksIneligible(rep.accreditation, rep.notes, rep.bio)) {
    notFound();
  }

  const avail = availabilitySummary(rep.availability || '');
  const urgentCapable = isUrgentCoverCapable(rep);
  const completeness = profileCompleteness(rep);

  const legalService = legalServiceSchema({
    name: rep.name,
    slug: rep.slug,
    counties: [rep.county].filter(Boolean),
    accreditation: rep.accreditation,
    phone: rep.phone,
  });
  const person = personSchema({
    name: rep.name,
    slug: rep.slug,
    phone: rep.phone,
    accreditation: rep.accreditation,
    counties: [rep.county].filter(Boolean),
  });
  const bc = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Directory', url: '/directory' },
    { name: rep.name, url: `/rep/${rep.slug}` },
  ]);

  return (
    <>
      <JsonLd data={legalService} />
      <JsonLd data={person} />
      <JsonLd data={bc} />

      <section className="relative overflow-hidden bg-[var(--navy)] pb-10 pt-8 sm:pb-14 sm:pt-12">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[var(--gold)]/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-16 left-0 h-48 w-48 rounded-full bg-white/5 blur-2xl"
          aria-hidden
        />
        <div className="page-container relative !py-0">
          <Breadcrumbs
            light
            items={[{ label: 'Home', href: '/' }, { label: 'Directory', href: '/directory' }, { label: rep.name }]}
          />
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
              {avail.chip}
            </span>
            <span className="rounded-full bg-[var(--navy-light)]/90 px-3 py-1 text-xs font-semibold text-white">
              {(rep.accreditation || '').includes('Duty')
                ? 'Duty solicitor'
                : (rep.accreditation || '').toLowerCase().includes('solicitor')
                  ? 'Solicitor'
                  : 'Verified police station representative'}
            </span>
            {urgentCapable && (
              <span className="rounded-full border border-emerald-400/40 bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-100">
                Often suitable for urgent / OOH enquiries
              </span>
            )}
          </div>
          <h1 className="mt-4 text-balance text-h1 text-white sm:max-w-3xl">{rep.name}</h1>
          <p className="mt-3 max-w-2xl text-lg text-white/90">
            {rep.county?.trim() ? `${rep.county}` : 'Coverage details below'}
            {rep.yearsExperience != null && rep.yearsExperience > 0 ? ` · ${rep.yearsExperience}+ years’ experience` : ''}
          </p>
          <div className="mt-4 max-w-2xl">
            <RepTrustBadges rep={rep} variant="profile" />
          </div>
          <p className="mt-3 max-w-2xl text-xs leading-relaxed text-white/70">
            This page is a directory listing. PoliceStationRepUK does not verify credentials or supervise cases — your firm
            remains responsible for instruction, checks, and compliance.
          </p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-5xl">
          <div className="-mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
            <div className="space-y-6">
              <DirectoryCredentialVerificationNotice />
              <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_8px_30px_-10px_rgba(15,23,42,0.12)] sm:p-8">
                <h2 className="text-lg font-bold text-[var(--navy)]">Availability summary</h2>
                <p className="mt-2 font-medium text-slate-800">{avail.label}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{avail.detail}</p>
                {rep.availability?.trim() && (
                  <p className="mt-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">From listing: </span>
                    {rep.availability}
                  </p>
                )}
              </section>

              {((rep.bio || rep.notes) ?? '').trim() ? (
                <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_8px_30px_-10px_rgba(15,23,42,0.12)] sm:p-8">
                  <h2 className="text-lg font-bold text-[var(--navy)]">About</h2>
                  <p className="mt-3 whitespace-pre-line leading-relaxed text-slate-600">{rep.bio || rep.notes}</p>
                </section>
              ) : null}

              {rep.stations && rep.stations.length > 0 ? (
                <StationCoverageSection stations={rep.stations} />
              ) : null}

              {rep.specialisms && rep.specialisms.length > 0 && (
                <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_8px_30px_-10px_rgba(15,23,42,0.12)] sm:p-8">
                  <h2 className="text-lg font-bold text-[var(--navy)]">Specialisms</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {rep.specialisms.map((s) => (
                      <span
                        key={s}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-[var(--navy)]"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {rep.languages && rep.languages.length > 0 && (
                <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_8px_30px_-10px_rgba(15,23,42,0.12)] sm:p-8">
                  <h2 className="text-lg font-bold text-[var(--navy)]">Languages</h2>
                  <p className="mt-3 text-slate-600">{rep.languages.join(', ')}</p>
                </section>
              )}

              <section className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-5 text-sm text-slate-600">
                <strong className="text-[var(--navy)]">Listing completeness:</strong> {completeness}% of common fields
                present. Higher scores usually mean easier due diligence — not an endorsement.
              </section>

              {completeness < 60 && (
                <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm">
                  <p className="font-semibold text-[var(--navy)]">Is this your profile?</p>
                  <p className="mt-1 leading-relaxed text-slate-600">
                    Adding more details — such as a bio, station coverage, and contact information — helps
                    solicitor firms find and instruct you. Updating your profile is free.
                  </p>
                  <Link href="/Contact" className="mt-3 inline-block text-sm font-semibold text-[var(--gold-link)] no-underline hover:text-[var(--gold)]">
                    Request a profile update →
                  </Link>
                </section>
              )}
            </div>

            <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
              <section className="rounded-2xl border-2 border-[var(--gold)]/30 bg-white p-6 shadow-lg shadow-[var(--navy)]/10">
                <h2 className="text-lg font-bold text-[var(--navy)]">Contact</h2>
                <p className="mt-1 text-xs text-slate-600">Reach out direct — your contract is with the firm / rep, not the directory.</p>
                <div className="mt-4 space-y-3">
                  {rep.phone ? (
                    <a href={phoneToTelHref(rep.phone)} className="btn-gold w-full text-center font-bold">
                      Call {rep.phone}
                    </a>
                  ) : null}
                  {rep.email ? (
                    <a href={`mailto:${rep.email}`} className="btn-outline w-full text-center font-semibold">
                      Send email
                    </a>
                  ) : null}
                  {rep.whatsappLink ? (
                    <a
                      href={rep.whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-outline w-full !border-emerald-300 !font-semibold !text-emerald-800 hover:!bg-emerald-50"
                    >
                      WhatsApp
                    </a>
                  ) : null}
                  {!rep.phone && !rep.email && (
                    <p className="text-sm text-slate-600">Use the directory search or your firm networks to reach this rep.</p>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[var(--card-shadow)]">
                <h2 className="text-lg font-bold text-[var(--navy)]">At a glance</h2>
                <dl className="mt-3 space-y-3 text-sm">
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Accreditation</dt>
                    <dd className="mt-0.5 font-medium text-slate-900">{rep.accreditation || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">County / area</dt>
                    <dd className="mt-0.5 font-medium text-slate-900">{rep.county || '—'}</dd>
                  </div>
                  {rep.yearsExperience != null && (
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Experience stated</dt>
                      <dd className="mt-0.5 font-medium text-slate-900">{rep.yearsExperience} years</dd>
                    </div>
                  )}
                </dl>
                <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
                  Postal address, PIN number and accreditation evidence are private and never
                  shown publicly.
                </p>
              </section>

              <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[var(--card-shadow)]">
                <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--navy)]">
                  See something wrong?
                </h2>
                <p className="mt-2 text-xs text-slate-600">
                  If this listing is inaccurate, impersonates someone else, or this person should
                  not be listed, please report it. PoliceStationRepUK admins review every report.
                </p>
                <div className="mt-3">
                  <ReportProfileButton
                    targetSlug={rep.slug}
                    targetEmail={rep.email}
                    turnstileSiteKey={turnstileSiteKey()}
                  />
                </div>
              </section>

              {rep.websiteUrl && (
                <a
                  href={rep.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full rounded-xl border border-slate-200 py-3 text-center text-sm font-semibold text-[var(--navy)] no-underline hover:bg-slate-50"
                >
                  External website →
                </a>
              )}
            </div>
          </div>

          <p className="mt-12 border-t border-slate-100 pt-8">
            <Link href="/directory" className="font-semibold text-[var(--gold-link)] no-underline hover:text-[var(--gold)]">
              ← Back to directory
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}

interface StationGroup {
  force: string;
  stations: string[];
}

function groupStationsByForce(stations: string[]): StationGroup[] {
  const forcePatterns = [
    /^([\w\s&]+Police)\s*\((.+)\)$/,
    /^([\w\s&]+Constabulary)\s*\((.+)\)$/,
    /^(Metropolitan Police Service)\s*\((.+)\)$/,
  ];

  const groups = new Map<string, string[]>();
  const ungrouped: string[] = [];

  for (const station of stations) {
    let matched = false;
    for (const pat of forcePatterns) {
      const m = station.match(pat);
      if (m) {
        const force = m[1].trim();
        const sub = m[2].trim();
        if (!groups.has(force)) groups.set(force, []);
        groups.get(force)!.push(sub);
        matched = true;
        break;
      }
    }
    if (!matched) ungrouped.push(station);
  }

  const result: StationGroup[] = [];
  for (const [force, subs] of groups) {
    result.push({ force, stations: subs.sort((a, b) => a.localeCompare(b)) });
  }
  result.sort((a, b) => b.stations.length - a.stations.length);

  if (ungrouped.length > 0) {
    result.push({ force: '', stations: ungrouped.sort((a, b) => a.localeCompare(b)) });
  }

  return result;
}

function StationCoverageSection({ stations }: { stations: string[] }) {
  const groups = groupStationsByForce(stations);
  const hasGroups = groups.some((g) => g.force);

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_8px_30px_-10px_rgba(15,23,42,0.12)] sm:p-8">
      <h2 className="text-lg font-bold text-[var(--navy)]">Station Coverage</h2>
      <p className="mt-1 text-sm text-slate-500">
        Stations covered by this representative — confirm availability before instruction.
      </p>

      <div className="mt-5 space-y-5">
        {hasGroups ? (
          groups.map((group) => (
            <div key={group.force || '_other'}>
              {group.force ? (
                <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-[var(--navy)]">
                  <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                  {group.force}
                  <span className="ml-1 text-xs font-normal text-slate-400">({group.stations.length})</span>
                </h3>
              ) : (
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Other stations
                </h3>
              )}
              <ul className="divide-y divide-slate-100 rounded-lg border border-slate-100 bg-slate-50/50">
                {group.stations.map((s) => (
                  <li key={s} className="px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-[var(--gold-pale)]/40">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-100 bg-slate-50/50">
            {stations.map((s) => (
              <li key={s} className="px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-[var(--gold-pale)]/40">
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-4 text-xs text-slate-400">
        {stations.length} station{stations.length !== 1 ? 's' : ''} listed
      </p>
    </section>
  );
}

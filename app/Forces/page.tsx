import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';
import { FORCE_TO_COUNTIES } from '@/lib/police-force-to-counties';

export const metadata = buildMetadata({
  title: 'UK Police Forces Directory — Stations by Force Area',
  description:
    'Browse UK police forces and their custody suites organised by region. Find station contact details, addresses, and accredited representatives covering each force area across England and Wales.',
  path: '/Forces',
});

const FORCES = [
  'Avon and Somerset Constabulary',
  'Bedfordshire Police',
  'British Transport Police',
  'Cambridgeshire Constabulary',
  'Cheshire Constabulary',
  'City of London Police',
  'Cleveland Police',
  'Cumbria Constabulary',
  'Derbyshire Constabulary',
  'Devon and Cornwall Police',
  'Dorset Police',
  'Durham Constabulary',
  'Dyfed-Powys Police',
  'Essex Police',
  'Gloucestershire Constabulary',
  'Greater Manchester Police',
  'Gwent Police',
  'Hampshire Constabulary',
  'Hertfordshire Constabulary',
  'Humberside Police',
  'Kent Police',
  'Lancashire Constabulary',
  'Leicestershire Police',
  'Lincolnshire Police',
  'Merseyside Police',
  'Metropolitan Police',
  'Ministry of Defence Police',
  'Norfolk Constabulary',
  'North Wales Police',
  'North Yorkshire Police',
  'Northamptonshire Police',
  'Northumbria Police',
  'Nottinghamshire Police',
  'South Wales Police',
  'South Yorkshire Police',
  'Staffordshire Police',
  'Suffolk Constabulary',
  'Surrey Police',
  'Sussex Police',
  'Thames Valley Police',
  'Warwickshire Police',
  'West Mercia Police',
  'West Midlands Police',
  'West Yorkshire Police',
  'Wiltshire Police',
];

const grouped = FORCES.reduce<Record<string, string[]>>((acc, force) => {
  const letter = force[0].toUpperCase();
  if (!acc[letter]) acc[letter] = [];
  acc[letter].push(force);
  return acc;
}, {});

const sortedLetters = Object.keys(grouped).sort();

function getForceCoverage(force: string): string[] {
  const key = force.toLowerCase().replace(/\s*(police|constabulary)\s*/gi, '').trim();
  return FORCE_TO_COUNTIES[key] ?? [];
}

export default function ForcesPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Police Forces' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">UK Police Forces Directory</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-300">
            Browse all {FORCES.length} police forces across England &amp; Wales. Select a force to
            find police stations and accredited representatives in that area.
          </p>
        </div>
      </section>

      <div className="page-container">

      <div className="mb-8 rounded-[var(--radius)] border border-yellow-200 bg-yellow-50 p-4 text-sm leading-relaxed text-yellow-800">
        Listings are provided for professional reference only. PoliceStationRepUK does not
        verify availability, does not arrange attendance, and does not recommend or endorse any
        individual listed.
      </div>

      <div className="space-y-10">
        {sortedLetters.map((letter) => (
          <section key={letter}>
            <h2 className="mb-4 text-lg font-semibold text-[var(--navy)]">{letter}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {grouped[letter].map((force) => (
                <Link
                  key={force}
                  href={{ pathname: '/StationsDirectory', query: { force } }}
                  className="group flex items-center gap-3 rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-4 no-underline shadow-[var(--card-shadow)] transition-all hover:border-[var(--gold)]/40 hover:shadow-[var(--card-shadow-hover)]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--gold)]/10 text-sm font-bold text-[var(--gold-link)]">
                    {force[0]}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-medium text-[var(--navy)] group-hover:text-[var(--gold-link)]">
                      {force}
                    </span>
                    <span className="block text-xs text-[var(--muted)]">
                      {getForceCoverage(force).length > 0
                        ? `Browse stations serving ${getForceCoverage(force).join(', ')}`
                        : 'Browse stations in this force area'}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-14 border-t border-[var(--border)] pt-10">
        <h2 className="text-h2 text-[var(--navy)]">Find a Station or Representative</h2>
        <p className="mt-2 text-[var(--muted)]">
          Search our directory for specific police stations or accredited representatives.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/StationsDirectory"
            className="btn-gold"
          >
            Station Directory
          </Link>
          <Link
            href="/directory"
            className="btn-outline"
          >
            Find a Rep
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}

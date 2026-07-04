import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';
import { PillarSeoLayout } from '@/components/PillarSeoLayout';
import { StationNumbersPromo } from '@/components/StationNumbersPromo';

export const metadata = buildMetadata({
  title: 'Police Station Rep London — Custody Cover',
  description:
    'Accredited reps for London custody suites. Free directory for criminal firms: Borough, Met, City, and surrounding areas.',
  path: '/police-station-rep-london',
});

const BC = [
  { name: 'Home', url: '/' },
  { name: 'Police station rep — London', url: '/police-station-rep-london' },
];

const FAQS = [
  {
    q: 'Does London include all Met custody suites?',
    a: 'Listings depend on representatives’ stated coverage. Filter by station and borough-level search to match your suite.',
  },
  {
    q: 'Can firms book overnight cover?',
    a: 'Availability is per rep. Many London reps specialise in out-of-hours attendance — check profiles and contact directly.',
  },
  {
    q: 'Is City of London separate?',
    a: 'City of London Police has its own footprint. Use station search to find reps who list City or relevant suites.',
  },
];

export default function PoliceStationRepLondonPage() {
  return (
    <PillarSeoLayout
      title="Police station rep London"
      breadcrumbItems={BC}
      quickAnswer="London criminal firms use PoliceStationRepUK to find accredited police station representatives for Met, City, and linked custody demand. Search the London county directory and filter by station for overnight and weekend cover."
      faqs={FAQS}
    >
      <h2 className="text-xl font-bold text-[var(--navy)]">High-volume custody market</h2>
      <p>
        <strong className="text-[var(--navy)]">London</strong> generates continuous{' '}
        <strong className="text-[var(--navy)]">police station representation</strong> demand: volume crime, financial
        crime, and cross-border cases. Firms need a reliable way to source{' '}
        <strong className="text-[var(--navy)]">accredited reps</strong> when fee earners are tied up in Crown Court or
        other arrests.
      </p>
      <h2 className="text-xl font-bold text-[var(--navy)]">Directory route</h2>
      <p>
        Start at{' '}
        <Link href="/directory/london" className="font-semibold text-[var(--navy)] underline">
          London directory results
        </Link>
        , then refine with{' '}
        <Link href="/search" className="font-semibold text-[var(--navy)] underline">
          advanced search
        </Link>{' '}
        for station-specific matches. Cross-link:{' '}
        <Link href="/PoliceStationRepsLondon" className="font-semibold text-[var(--navy)] underline">
          Police station reps London hub
        </Link>
        .
      </p>
      <h2 className="text-xl font-bold text-[var(--navy)]">Solicitor-focused positioning</h2>
      <p>
        This page targets the query pattern “<strong className="text-[var(--navy)]">police station rep London</strong>”
        for <strong className="text-[var(--navy)]">criminal solicitor</strong> SEO. Supporting content:{' '}
        <Link href="/criminal-solicitor-police-station" className="font-semibold text-[var(--navy)] underline">
          criminal solicitor police station cover
        </Link>{' '}
        and{' '}
        <Link href="/SolicitorPoliceStationCoverUK" className="font-semibold text-[var(--navy)] underline">
          solicitor police station cover UK
        </Link>
        .
      </p>
      <h2 className="text-xl font-bold text-[var(--navy)]">For reps covering London</h2>
      <p>
        Update your listing with boroughs, overnight availability, and accreditation.{' '}
        <Link href="/register" className="font-semibold text-[var(--navy)] underline">
          Join the directory
        </Link>
        .
      </p>
      <h2 className="text-xl font-bold text-[var(--navy)]">Quick facts (extractable)</h2>
      <ul className="list-inside list-disc space-y-2 pl-1">
        <li>
          <strong className="text-[var(--navy)]">Jurisdiction:</strong> England and Wales.
        </li>
        <li>
          <strong className="text-[var(--navy)]">Platform:</strong> PoliceStationRepUK — not a law firm.
        </li>
        <li>
          <strong className="text-[var(--navy)]">Intent:</strong> B2B matching for custody attendance.
        </li>
      </ul>
      <div className="not-prose mt-8">
        <StationNumbersPromo variant="section" countyFilter="London" />
      </div>
    </PillarSeoLayout>
  );
}

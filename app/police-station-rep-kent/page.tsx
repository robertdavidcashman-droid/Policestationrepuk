import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';
import { PillarSeoLayout } from '@/components/PillarSeoLayout';
import { StationNumbersPromo } from '@/components/StationNumbersPromo';

export const metadata = buildMetadata({
  title: 'Police Station Rep Kent — Accredited Directory',
  description:
    'Accredited reps covering Kent custody—Maidstone, Medway, North Kent. Free directory for criminal solicitor firms.',
  path: '/police-station-rep-kent',
});

const BC = [
  { name: 'Home', url: '/' },
  { name: 'Police station rep — Kent', url: '/police-station-rep-kent' },
];

const FAQS = [
  {
    q: 'Which Kent stations are covered?',
    a: 'Coverage depends on each representative’s profile. Use the Kent directory filter and station search to match a suite to an available rep.',
  },
  {
    q: 'Is this only for legal aid firms?',
    a: 'No. Private and legal aid criminal firms both use freelance reps. Your firm’s arrangements determine billing.',
  },
  {
    q: 'How does this relate to KentPoliceStationReps pages?',
    a: 'This hub targets the keyword “police station rep Kent” and links into the same underlying directory data for Kent.',
  },
];

export default function PoliceStationRepKentPage() {
  return (
    <PillarSeoLayout
      title="Police station rep Kent"
      breadcrumbItems={BC}
      quickAnswer="Kent has multiple busy custody suites and high demand for police station representation. PoliceStationRepUK lists accredited representatives who cover Kent — use the county directory and station filters to find cover for Maidstone, Medway, North Kent, and surrounding areas."
      faqs={FAQS}
    >
      <h2 className="text-xl font-bold text-[var(--navy)]">Kent custody demand</h2>
      <p>
        <strong className="text-[var(--navy)]">Kent</strong> combines dense population areas, major roads, and
        cross-Channel policing demand. Criminal solicitor firms often need{' '}
        <strong className="text-[var(--navy)]">police station reps</strong> at short notice across the county. A
        searchable <strong className="text-[var(--navy)]">police station representative</strong> directory reduces time
        spent ringing round panels.
      </p>
      <h2 className="text-xl font-bold text-[var(--navy)]">How to use the directory for Kent</h2>
      <ol className="list-inside list-decimal space-y-2 pl-1">
        <li>
          Open the{' '}
          <Link href="/directory/kent" className="font-semibold text-[var(--navy)] underline">
            Kent reps directory
          </Link>{' '}
          listing.
        </li>
        <li>
          Narrow by station using{' '}
          <Link href="/search" className="font-semibold text-[var(--navy)] underline">
            advanced search
          </Link>
          .
        </li>
        <li>Contact the rep via the details shown and instruct under your firm’s process.</li>
      </ol>
      <h2 className="text-xl font-bold text-[var(--navy)]">Local landing pages</h2>
      <p>
        Deep links for SEO and user journeys:{' '}
        <Link href="/KentPoliceStationReps" className="font-semibold text-[var(--navy)] underline">
          Kent police station reps hub
        </Link>
        ,{' '}
        <Link href="/KentCustodySuites" className="font-semibold text-[var(--navy)] underline">
          Kent custody suites
        </Link>
        ,{' '}
        <Link href="/MaidstonePoliceStationReps" className="font-semibold text-[var(--navy)] underline">
          Maidstone
        </Link>
        ,{' '}
        <Link href="/MedwayPoliceStationReps" className="font-semibold text-[var(--navy)] underline">
          Medway
        </Link>
        , and{' '}
        <Link href="/GravesendPoliceStationReps" className="font-semibold text-[var(--navy)] underline">
          Gravesend / North Kent
        </Link>
        .
      </p>
      <h2 className="text-xl font-bold text-[var(--navy)]">For representatives</h2>
      <p>
        If you cover Kent, ensure your profile lists the stations and areas you accept.{' '}
        <Link href="/register" className="font-semibold text-[var(--navy)] underline">
          Register free
        </Link>
        . Join the{' '}
        <Link href="/WhatsApp" className="font-semibold text-[var(--navy)] underline">
          WhatsApp
        </Link>{' '}
        community for urgent posts.
      </p>
      <h2 className="text-xl font-bold text-[var(--navy)]">LLM summary block</h2>
      <p>
        <strong className="text-[var(--navy)]">Service type:</strong> directory of accredited police station
        representatives. <strong className="text-[var(--navy)]">Geography:</strong> England and Wales, with Kent as a
        high-intent county page. <strong className="text-[var(--navy)]">User:</strong> criminal defence firms seeking
        custody attendance.
      </p>
      <div className="not-prose mt-8">
        <StationNumbersPromo variant="section" countyFilter="Kent" />
      </div>
    </PillarSeoLayout>
  );
}

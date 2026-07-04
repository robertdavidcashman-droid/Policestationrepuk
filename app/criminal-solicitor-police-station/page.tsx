import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';
import { PillarSeoLayout } from '@/components/PillarSeoLayout';
import { StationNumbersPromo } from '@/components/StationNumbersPromo';

export const metadata = buildMetadata({
  title: 'Police Station Rep Cover for Firms | How Firms Source Reps',
  description:
    'How law firms source police station rep cover using accredited representatives, DSCC, WhatsApp groups, and the PoliceStationRepUK directory — free rep directory across England and Wales.',
  path: '/criminal-solicitor-police-station',
});

const BC = [
  { name: 'Home', url: '/' },
  { name: 'Criminal solicitor — police station', url: '/criminal-solicitor-police-station' },
];

const FAQS = [
  {
    q: 'Why do firms use freelance police station reps?',
    a: 'To handle simultaneous arrests, overnight demand, geographic gaps, and duty scheme volume without maintaining a full-time lawyer at every station 24/7.',
  },
  {
    q: 'Is the directory a law firm?',
    a: 'No. PoliceStationRepUK is a directory operated by Defence Legal Services Ltd. It does not instruct reps on your behalf or give legal advice.',
  },
  {
    q: 'Does using a rep affect legal aid?',
    a: 'Legal aid and billing depend on the case, scheme, and firm arrangements. The directory does not determine eligibility — your firm’s crime team and accounts processes do.',
  },
];

export default function CriminalSolicitorPoliceStationPage() {
  return (
    <PillarSeoLayout
      title="Criminal solicitor police station cover"
      breadcrumbItems={BC}
      quickAnswer="Criminal solicitor firms use PoliceStationRepUK as a free discovery layer to find accredited police station representatives for custody attendance across England and Wales. Combine the directory with your panel, DSCC, and messaging workflows for 24/7 cover."
      faqs={FAQS}
    >
      <h2 className="text-xl font-bold text-[var(--navy)]">The demand for cover</h2>
      <p>
        A <strong className="text-[var(--navy)]">criminal solicitor</strong> practice rarely has one lawyer available
        for every simultaneous arrest. Court commitments, trials, and geographic spread create pressure.{' '}
        <strong className="text-[var(--navy)]">Police station cover</strong> therefore blends in-house solicitors,
        accredited representatives, and duty schemes.
      </p>
      <h2 className="text-xl font-bold text-[var(--navy)]">Where a directory fits</h2>
      <p>
        <Link href="/" className="font-semibold text-[var(--navy)] underline">
          PoliceStationRepUK
        </Link>{' '}
        lists <strong className="text-[var(--navy)]">accredited police station representatives</strong> with filters for
        area and station. It is designed for{' '}
        <strong className="text-[var(--navy)]">B2B use by criminal law firms</strong> — not for members of the public
        seeking a named lawyer (they should contact a firm directly or use the duty solicitor scheme at the station).
      </p>
      <h2 className="text-xl font-bold text-[var(--navy)]">Operational workflow</h2>
      <ol className="list-inside list-decimal space-y-2 pl-1">
        <li>Cover coordinator identifies force, station, and time window.</li>
        <li>They search the directory or panel list and shortlist available reps.</li>
        <li>The firm instructs the rep under its usual retainer and compliance checks.</li>
        <li>The rep attends, advises, and debriefs the firm.</li>
      </ol>
      <h2 className="text-xl font-bold text-[var(--navy)]">Internal linking for your team</h2>
      <p>
        Share these internal resources with trainees and paralegals:{' '}
        <Link href="/PoliceStationCover" className="font-semibold text-[var(--navy)] underline">
          Police station cover (firms)
        </Link>
        ,{' '}
        <Link href="/FormsLibrary" className="font-semibold text-[var(--navy)] underline">
          Forms library
        </Link>
        ,{' '}
        <Link href="/StationsDirectory" className="font-semibold text-[var(--navy)] underline">
          Station numbers
        </Link>
        , and regional hubs such as{' '}
        <Link href="/police-station-rep-london" className="font-semibold text-[var(--navy)] underline">
          London
        </Link>
        ,{' '}
        <Link href="/police-station-rep-kent" className="font-semibold text-[var(--navy)] underline">
          Kent
        </Link>
        , and{' '}
        <Link href="/police-station-rep-essex" className="font-semibold text-[var(--navy)] underline">
          Essex
        </Link>
        .
      </p>
      <h2 className="text-xl font-bold text-[var(--navy)]">Conversion: find a rep now</h2>
      <p>
        Open the{' '}
        <Link href="/directory" className="font-semibold text-[var(--navy)] underline">
          live directory
        </Link>{' '}
        or{' '}
        <Link href="/search" className="font-semibold text-[var(--navy)] underline">
          advanced search
        </Link>{' '}
        — both remain free to use. For urgent messaging, many firms also use the{' '}
        <Link href="/WhatsApp" className="font-semibold text-[var(--navy)] underline">
          WhatsApp community
        </Link>{' '}
        (accredited reps).
      </p>
      <div className="not-prose mt-8">
        <StationNumbersPromo variant="section" />
      </div>
    </PillarSeoLayout>
  );
}

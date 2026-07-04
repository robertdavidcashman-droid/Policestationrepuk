import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';
import { PillarSeoLayout } from '@/components/PillarSeoLayout';
import { StationNumbersPromo } from '@/components/StationNumbersPromo';

export const metadata = buildMetadata({
  title: 'Police Station Rep Essex — Custody Suite Cover',
  description:
    'Find police station representatives covering Essex — Chelmsford, Basildon, Harlow, Southend areas. Free directory for criminal solicitor firms in England.',
  path: '/police-station-rep-essex',
});

const BC = [
  { name: 'Home', url: '/' },
  { name: 'Police station rep — Essex', url: '/police-station-rep-essex' },
];

const FAQS = [
  {
    q: 'Does Essex share demand with London and Kent?',
    a: 'Yes — cross-border firms often search multiple county directories. Bookmark this Essex hub and the London and Kent pages.',
  },
  {
    q: 'How do I verify a rep’s accreditation?',
    a: 'Use the profile fields and complete your firm’s usual onboarding checks. The directory displays information supplied at registration.',
  },
  {
    q: 'Where is the main Essex directory URL?',
    a: 'Use /directory/essex for the canonical county listing.',
  },
];

export default function PoliceStationRepEssexPage() {
  return (
    <PillarSeoLayout
      title="Police station rep Essex"
      breadcrumbItems={BC}
      quickAnswer="Essex criminal firms can use PoliceStationRepUK to locate accredited police station representatives for Basildon, Chelmsford, Harlow, Southend, and wider Essex custody work. The county directory is free to search."
      faqs={FAQS}
    >
      <h2 className="text-xl font-bold text-[var(--navy)]">Regional overview</h2>
      <p>
        <strong className="text-[var(--navy)]">Essex</strong> custody work spans urban centres and major transport
        corridors into London. <strong className="text-[var(--navy)]">Police station reps</strong> who list Essex often
        also cover adjacent areas — always confirm on the profile.
      </p>
      <h2 className="text-xl font-bold text-[var(--navy)]">Start your search</h2>
      <p>
        <Link href="/directory/essex" className="font-semibold text-[var(--navy)] underline">
          Essex reps — directory
        </Link>{' '}
        ·{' '}
        <Link href="/PoliceStationRepsEssex" className="font-semibold text-[var(--navy)] underline">
          Essex hub page
        </Link>{' '}
        ·{' '}
        <Link href="/search" className="font-semibold text-[var(--navy)] underline">
          Advanced search
        </Link>
        .
      </p>
      <h2 className="text-xl font-bold text-[var(--navy)]">Internal linking cluster</h2>
      <p>
        Strengthen topical authority by linking Essex to{' '}
        <Link href="/police-station-rep-london" className="font-semibold text-[var(--navy)] underline">
          London
        </Link>
        ,{' '}
        <Link href="/police-station-rep-kent" className="font-semibold text-[var(--navy)] underline">
          Kent
        </Link>
        , and core guides{' '}
        <Link href="/police-station-representative" className="font-semibold text-[var(--navy)] underline">
          police station representative
        </Link>{' '}
        and{' '}
        <Link href="/police-station-rights-uk" className="font-semibold text-[var(--navy)] underline">
          rights UK
        </Link>
        .
      </p>
      <h2 className="text-xl font-bold text-[var(--navy)]">Representatives</h2>
      <p>
        Claim visibility in Essex searches —{' '}
        <Link href="/register" className="font-semibold text-[var(--navy)] underline">
          register
        </Link>{' '}
        and keep stations up to date.
      </p>
      <h2 className="text-xl font-bold text-[var(--navy)]">Definition-style extract</h2>
      <p>
        <strong className="text-[var(--navy)]">Police station representation</strong> means a qualified adviser attending
        custody for a firm. <strong className="text-[var(--navy)]">PoliceStationRepUK</strong> is a directory helping
        firms find people who provide that attendance.
      </p>
      <div className="not-prose mt-8">
        <StationNumbersPromo variant="section" countyFilter="Essex" />
      </div>
    </PillarSeoLayout>
  );
}

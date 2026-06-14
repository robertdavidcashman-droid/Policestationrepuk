import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Police Station Cover for Criminal Defence Firms',
  description:
    'Find reliable police station cover for your criminal defence firm. Search our free directory of accredited representatives or post urgent requests via our WhatsApp group.',
  path: '/PoliceStationCover',
});

const DIRECTORY_BENEFITS = [
  {
    icon: '🔍',
    title: 'Search by Location',
    desc: 'Find accredited reps by county, town, or police force area. Filter by availability and specialisms to find the right person for every job.',
  },
  {
    icon: '⚡',
    title: 'Instant Contact Details',
    desc: 'Every rep profile includes direct phone numbers and email addresses. No waiting for callbacks — contact reps directly and confirm attendance in minutes.',
  },
  {
    icon: '✓',
    title: 'Accredited Professionals',
    desc: 'All listed representatives hold PSRAS accreditation or are duty solicitors. We verify registration details when reps join the directory.',
  },
  {
    icon: '🆓',
    title: 'Completely Free',
    desc: 'There are no fees, commissions, or hidden costs for solicitor firms. Search the directory and contact reps as often as you need — always free.',
  },
];

const HOW_IT_WORKS = [
  { step: 1, title: 'Search the Directory', desc: 'Browse reps by county or use the search to find cover in the area you need.' },
  { step: 2, title: 'Contact the Rep Directly', desc: 'Call or email the representative using the contact details on their profile.' },
  { step: 3, title: 'Confirm & Instruct', desc: 'Agree terms, confirm the attendance, and instruct the rep to attend on your behalf.' },
];

export default function PoliceStationCoverPage() {
  return (
    <>
      {/* Navy header section */}
      <div className="bg-[var(--navy)] py-10">
        <div className="page-container">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Police Station Cover', href: '/PoliceStationCover' },
            ]}
          />
          <h1 className="mt-4 text-h1 text-white">
            Police Station Cover for Criminal Defence Firms
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-300">
            Need reliable police station cover? PoliceStationRepUK provides a free, searchable
            directory of accredited representatives across England &amp; Wales — available 24/7.
          </p>
        </div>
      </div>

      <div className="page-container pt-10">

      <section className="mb-10 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-slate-50 p-6">
        <h2 className="text-lg font-bold text-[var(--navy)]">Quick answer</h2>
        <p className="mt-2 text-base leading-relaxed text-[var(--muted)]">
          <strong className="text-[var(--navy)]">PoliceStationRepUK</strong> helps criminal defence firms find{' '}
          <strong className="text-[var(--navy)]">accredited police station representatives</strong> for custody
          attendance across England and Wales. Search by county or station, contact reps directly, and instruct under
          your firm&apos;s process. This directory does not provide legal advice to detainees.
        </p>
      </section>

      {/* What the Directory Offers */}
      <section className="mb-14">
        <h2 className="text-h2 mb-6 text-[var(--navy)]">What Our Directory Offers Firms</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {DIRECTORY_BENEFITS.map((b) => (
            <div
              key={b.title}
              className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)]"
            >
              <div className="mb-3 text-2xl">{b.icon}</div>
              <h3 className="font-semibold text-[var(--navy)]">{b.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mb-14">
        <h2 className="text-h2 mb-6 text-[var(--navy)]">How It Works</h2>
        <div className="grid gap-5 sm:grid-cols-3">
          {HOW_IT_WORKS.map((item) => (
            <div
              key={item.step}
              className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 text-center shadow-[var(--card-shadow)]"
            >
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border-2 border-[var(--gold)] text-sm font-bold text-[var(--gold)]">
                {item.step}
              </div>
              <h3 className="font-semibold text-[var(--navy)]">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Urgent Cover */}
      <section className="mb-14 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-8 shadow-[var(--card-shadow)]">
        <h2 className="text-h2 mb-4 text-[var(--navy)]">Need Urgent Cover?</h2>
        <p className="text-sm leading-relaxed text-[var(--muted)]">
          For urgent or out-of-hours cover requests, post directly to our{' '}
          <Link href="/WhatsApp" className="font-medium text-[var(--gold-link)] hover:underline">
            WhatsApp group
          </Link>
          . Accredited reps monitor the group 24/7 and can respond within minutes. This is the
          fastest way to find cover for overnight, weekend, and bank holiday attendances.
        </p>
      </section>

      {/* CTA */}
      <div className="rounded-[var(--radius-lg)] bg-[var(--navy)] p-8 text-center">
        <h2 className="text-h2 text-white">Find Cover Now</h2>
        <p className="mt-3 text-slate-300">
          Search our directory of accredited representatives or join the WhatsApp group for
          instant cover requests.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link href="/directory" className="btn-gold">
            Search the Directory
          </Link>
          <Link
            href="/WhatsApp"
            className="btn-outline !border-slate-500 !text-white hover:!border-[var(--gold)] hover:!text-[var(--gold)]"
          >
            Join WhatsApp Group
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}

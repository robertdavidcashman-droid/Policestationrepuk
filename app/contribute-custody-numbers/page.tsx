import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { getAllStations } from '@/lib/data';
import { isDialablePhone } from '@/lib/station-verification';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';
import { ContributeCustodyForm, type ContributeStation } from '@/components/ContributeCustodyForm';
import { CONTRIBUTOR_STATIONS_REQUIRED } from '@/lib/custody-tips/reward';

export const dynamic = 'force-dynamic';

export const metadata = buildMetadata({
  title: 'Contribute custody desk numbers — earn a free featured month',
  description:
    'Police station reps: confirm, correct or add custody desk numbers for the stations you cover. Contribute five and earn a free featured listing month.',
  path: '/contribute-custody-numbers',
});

export default async function ContributeCustodyNumbersPage() {
  const email = await getSession();
  const stations = await getAllStations();

  const slim: ContributeStation[] = stations
    .map((s) => ({
      id: s.id,
      name: s.name,
      forceName: s.forceName ?? s.county ?? '',
      current: isDialablePhone(s.custodyPhone) ? (s.custodyPhone as string) : '',
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[{ label: 'Home', href: '/' }, { label: 'Contribute custody numbers' }]}
          />
          <h1 className="mt-3 text-h1 text-white">Contribute custody desk numbers</h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-300">
            You dial these desks every day — help keep the directory accurate. Confirm or correct a
            number we already hold, or add one that&apos;s missing. Contribute{' '}
            {CONTRIBUTOR_STATIONS_REQUIRED} or more and earn a free featured month.
          </p>
        </div>
      </section>

      <div className="page-container">
        {email ? (
          <ContributeCustodyForm stations={slim} requiredForReward={CONTRIBUTOR_STATIONS_REQUIRED} />
        ) : (
          <div className="mx-auto max-w-xl rounded-xl border border-[var(--border)] bg-white p-8 text-center shadow-sm">
            <h2 className="text-h3 text-[var(--navy)]">Sign in to contribute</h2>
            <p className="mt-3 text-[var(--muted)]">
              Custody contributions are tied to your rep account so we can corroborate numbers and
              apply your free featured month.
            </p>
            <Link href="/Account" className="btn-primary mt-6 inline-block">
              Sign in to your rep account
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

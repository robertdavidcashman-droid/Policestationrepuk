import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { CommunityEligibilityCallout } from '@/components/CommunityEligibilityCallout';
import { DirectoryComplianceNotice } from '@/components/DirectoryComplianceNotice';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Police Station Rep Jobs & Vacancies UK',
  description:
    'Find police station representative jobs and vacancies across the UK. Salary information, qualification requirements, and how to start your career as a PSRAS-accredited rep.',
  path: '/PoliceStationRepJobsUK',
});

const QUALIFICATIONS = [
  {
    title: 'PSRAS Accredited Representative',
    desc: 'Fully accredited through the Police Station Representatives Accreditation Scheme — completed training, portfolio, and Critical Incident Test (CIT).',
  },
  {
    title: 'Duty Solicitor',
    desc: 'Qualified solicitor registered on the duty solicitor rota with the Defence Solicitor Call Centre (DSCC).',
  },
];

const SALARY_INFO = [
  { type: 'Employed (In-House)', range: '£24,000 – £32,000', note: 'Salary, pension, regular hours. Often includes on-call rota payments.' },
  { type: 'Freelance', range: '£40,000 – £60,000+', note: 'Variable income based on volume. Higher earning ceiling with flexible schedule.' },
];

const JOB_TYPES = [
  {
    title: 'In-House Representative',
    desc: 'Employed directly by a criminal defence firm. Regular salary, fixed hours (plus on-call), holiday pay, and pension contributions. Ideal for those starting out or preferring stability.',
  },
  {
    title: 'Freelance Representative',
    desc: 'Self-employed, taking instructions from multiple solicitor firms. Higher earning potential, flexible schedule, but requires your own accreditation and business management.',
  },
  {
    title: 'Agency / Panel Work',
    desc: 'Register with specialist legal recruitment agencies or DSCC panels. Work is allocated via rota systems, providing a steady stream of instructions.',
  },
];

export default function PoliceStationRepJobsUKPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Police Station Rep Jobs', href: '/PoliceStationRepJobsUK' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">
            Police Station Representative Jobs &amp; Vacancies UK
          </h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-300">
            Explore career opportunities as a police station representative. From employed positions
            to freelance work — find the right path for your legal career.
          </p>
        </div>
      </section>

      <div className="page-container">
        <div className="mb-8">
          <DirectoryComplianceNotice />
        </div>

      {/* Key Qualifications */}
      <section className="mb-14">
        <h2 className="text-h2 mb-6 text-[var(--navy)]">Key Qualifications Required</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {QUALIFICATIONS.map((q) => (
            <div
              key={q.title}
              className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)]"
            >
              <h3 className="font-semibold text-[var(--navy)]">{q.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{q.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-[var(--radius)] border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            <strong>Important:</strong> All police station representatives must either hold PSRAS
            accreditation or be a qualified duty solicitor. Representatives are regulated by the
            Solicitors Regulation Authority (SRA) and must be associated with an SRA-regulated firm.
          </p>
        </div>
      </section>

      {/* Salary Info */}
      <section className="mb-14">
        <h2 className="text-h2 mb-6 text-[var(--navy)]">Salary &amp; Earning Potential</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {SALARY_INFO.map((s) => (
            <div
              key={s.type}
              className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)]"
            >
              <p className="text-sm font-medium text-[var(--muted)]">{s.type}</p>
              <p className="mt-1 text-2xl font-bold text-[var(--navy)]">{s.range}</p>
              <p className="mt-2 text-xs text-[var(--muted)]">{s.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Job Types */}
      <section className="mb-14">
        <h2 className="text-h2 mb-6 text-[var(--navy)]">Types of Roles</h2>
        <div className="grid gap-5 sm:grid-cols-3">
          {JOB_TYPES.map((jt) => (
            <div
              key={jt.title}
              className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)]"
            >
              <h3 className="font-semibold text-[var(--navy)]">{jt.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{jt.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Latest Listings */}
      <section className="mb-14 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-8 shadow-[var(--card-shadow)]">
        <h2 className="text-h2 mb-4 text-[var(--navy)]">Latest Job Listings</h2>
        <p className="text-sm leading-relaxed text-[var(--muted)]">
          There are no vacancies posted at the moment. Check back regularly or join our{' '}
          <Link href="/WhatsApp" className="font-medium text-[var(--gold-link)] hover:underline">
            WhatsApp group
          </Link>{' '}
          for real-time job notifications from solicitor firms. Many firms post urgent cover
          requests directly to the group.
        </p>
      </section>

      {/* CTA */}
      <CommunityEligibilityCallout variant="compact" />
      <div className="mt-6 rounded-[var(--radius-lg)] bg-[var(--navy)] p-8 text-center">
        <h2 className="text-h2 text-white">Start Getting Work Today</h2>
        <p className="mt-3 text-slate-300">
          Register your free profile, join the WhatsApp group, and start receiving instructions
          from criminal defence firms across the UK.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/register"
            className="btn-gold no-underline"
          >
            Register Free
          </Link>
          <Link
            href="/WhatsApp"
            className="btn-outline !border-slate-500 !text-white hover:!border-[var(--gold)] hover:!text-[var(--gold)] no-underline"
          >
            Join WhatsApp Group
          </Link>
          <Link
            href="/GetWork"
            className="btn-outline !border-slate-500 !text-white hover:!border-[var(--gold)] hover:!text-[var(--gold)] no-underline"
          >
            Get Work Guide
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}

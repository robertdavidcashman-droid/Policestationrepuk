import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ContentReliabilityNotice } from '@/components/ContentReliabilityNotice';
import { ResolvedContentSources } from '@/components/ContentSourcesFooter';
import { REP_FAQ_GROUPS } from '@/lib/rep-faq-master';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Police Station Representative FAQ | PoliceStationRepUK',
  description:
    'Comprehensive answers to the most common questions about becoming and working as an accredited police station representative.',
  path: '/RepFAQMaster',
});

export default function RepFAQMasterPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Police Station Representative FAQ' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">Police station representative FAQs</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-300">
            Practical answers for people exploring or working in police station representation. General information only —
            not legal advice.
          </p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-4xl space-y-12 pb-12 pt-8">
          <ContentReliabilityNotice />
          {REP_FAQ_GROUPS.map((group) => (
            <section key={group.title} className="scroll-mt-8">
              <h2 className="text-h2 text-[var(--navy)]">{group.title}</h2>
              <dl className="mt-6 space-y-6">
                {group.items.map((item) => (
                  <div
                    key={item.q}
                    className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6"
                  >
                    <dt className="text-base font-bold text-[var(--navy)]">{item.q}</dt>
                    <dd className="mt-2 text-[var(--muted)] leading-relaxed">{item.a}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}

          <section className="rounded-xl border border-slate-200 bg-slate-50/80 p-6 text-sm text-[var(--muted)]">
            <p>
              For deeper guides, see the{' '}
              <Link href="/Blog" className="font-semibold text-[var(--navy)] underline decoration-[var(--gold)] underline-offset-2">
                blog
              </Link>
              ,{' '}
              <Link href="/Wiki" className="font-semibold text-[var(--navy)] underline decoration-[var(--gold)] underline-offset-2">
                wiki
              </Link>
              , and{' '}
              <Link href="/HowToBecomePoliceStationRep" className="font-semibold text-[var(--navy)] underline decoration-[var(--gold)] underline-offset-2">
                how to become a rep
              </Link>
              . Last updated: March 2026.
            </p>
          </section>

          <ResolvedContentSources className="mb-10" context={{ kind: 'page', path: '/RepFAQMaster' }} />

          <section className="rounded-[var(--radius-lg)] bg-[var(--navy)] p-8 text-center">
            <h2 className="text-xl font-bold text-white">Need help?</h2>
            <p className="mt-2 text-slate-300">
              Find an accredited police station representative or get in touch with our team.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link href="/directory" className="btn-gold no-underline">
                Find a rep
              </Link>
              <Link href="/Contact" className="btn-outline no-underline">
                Contact us
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

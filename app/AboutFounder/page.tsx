import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';
import { POLICESTATIONAGENT_HOME_HREF } from '@/lib/policestationagent-promo';

export const metadata = buildMetadata({
  title: 'About the Founder — Robert Cashman | PoliceStationRepUK',
  description:
    'Meet Robert Cashman — duty solicitor, higher rights advocate, and founder of PoliceStationRepUK. Learn about the vision behind the UK\u2019s free police station representative directory.',
  path: '/AboutFounder',
});

const CREDENTIALS = [
  {
    title: 'Duty solicitor',
    detail: 'Qualified duty solicitor on the national rota, with experience across police station and court work.',
  },
  {
    title: 'Higher rights of audience',
    detail: 'Qualified to advocate in the Crown Court in criminal proceedings.',
  },
  {
    title: 'Experience',
    detail: 'Over three decades in criminal defence, with extensive police station and advocacy practice.',
  },
  {
    title: 'Based in Kent',
    detail: 'Serving Kent and surrounding areas, including cross-border and Met-border police station work where instructed.',
  },
];

export default function AboutFounderPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'About the Founder' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">Robert Cashman</h1>
          <p className="mt-2 text-base font-medium text-white/95 sm:text-lg">
            Duty solicitor · Higher rights advocate · Founder of PoliceStationRepUK
          </p>
          <ul className="mt-6 grid max-w-2xl gap-3 sm:grid-cols-2" aria-label="Key credentials">
            {CREDENTIALS.map((c) => (
              <li
                key={c.title}
                className="rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm backdrop-blur-sm"
              >
                <span className="block font-semibold text-[var(--gold)]">{c.title}</span>
                <span className="mt-1 block leading-relaxed text-slate-200/95">{c.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-4xl space-y-10 pb-12 pt-8">
          <section className="space-y-4">
            <h2 className="text-h2 text-[var(--navy)]">Background and experience</h2>
            <p className="text-[var(--muted)] leading-relaxed">
              Robert Cashman is a duty solicitor with substantial experience in criminal defence.
            </p>
            <p className="text-[var(--muted)] leading-relaxed">
              Based in Kent, he has represented clients at police stations across England and Wales, from
              straightforward interviews to complex serious crime matters. As a duty solicitor, Robert is part of the
              national duty solicitor scheme administered by the Legal Aid Agency, providing advice to those detained by
              police who qualify for legal assistance.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-h2 text-[var(--navy)]">Higher rights of audience</h2>
            <p className="text-[var(--muted)] leading-relaxed">
              Robert holds higher rights of audience (criminal proceedings), qualifying him to appear as an advocate in
              the Crown Court. This sits alongside his police station and magistrates&apos; court practice.
            </p>
            <p className="text-[var(--muted)] leading-relaxed">
              That broader court experience often helps when cases move beyond the police station — for example when
              advising on disclosure, bail, or how interview answers may be used later in proceedings.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-h2 text-[var(--navy)]">Mission: PoliceStationRepUK</h2>
            <p className="text-[var(--muted)] leading-relaxed">
              Robert founded PoliceStationRepUK to connect criminal defence firms with qualified, accredited police station
              representatives across England and Wales. Having worked alongside many representatives, he saw the need for
              a clear directory where firms could find reliable cover and where reps could show availability and
              coverage.
            </p>
            <blockquote className="rounded-xl border-l-4 border-[var(--gold)] bg-slate-50/80 px-5 py-4 text-[var(--muted)]">
              <p className="italic leading-relaxed">
                &ldquo;Police station work is the foundation of criminal defence. A good representative can make the
                difference between a fair outcome and an injustice. This directory exists to help people find quality
                representation.&rdquo;
              </p>
              <footer className="mt-2 text-sm font-semibold text-[var(--navy)] not-italic">— Robert Cashman</footer>
            </blockquote>
          </section>

          <section className="space-y-4">
            <h2 className="text-h2 text-[var(--navy)]">Areas of expertise</h2>
            <ul className="list-disc space-y-2 pl-5 text-[var(--muted)] leading-relaxed marker:text-[var(--gold)]">
              <li>Police station advice and representation under PACE</li>
              <li>Serious crime including violence, drugs, and fraud</li>
              <li>Crown Court advocacy and higher court work</li>
              <li>Legal aid billing and compliance</li>
              <li>Training and mentoring new representatives</li>
            </ul>
            <p className="text-[var(--muted)] leading-relaxed">
              To find Robert in the public directory, see{' '}
              <Link href="/rep/robert-cashman" className="font-semibold text-[var(--navy)] underline decoration-[var(--gold)] underline-offset-2 hover:text-[var(--gold-hover)]">
                his representative profile
              </Link>
              .
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-h2 text-[var(--navy)]">Join the directory</h2>
            <p className="text-[var(--muted)] leading-relaxed">
              Accredited police station representatives can{' '}
              <Link href="/register" className="font-semibold text-[var(--navy)] underline decoration-[var(--gold)] underline-offset-2 hover:text-[var(--gold-hover)]">
                register for free
              </Link>{' '}
              and connect with firms looking for cover.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-h2 text-[var(--navy)]">Police station solicitor services</h2>
            <p className="text-[var(--muted)] leading-relaxed">
              Robert&apos;s duty solicitor and police station agent work for firms and clients is separate from
              PoliceStationRepUK. For that service, visit{' '}
              <a
                href={POLICESTATIONAGENT_HOME_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[var(--navy)] underline decoration-[var(--gold)] underline-offset-2 hover:text-[var(--gold-hover)]"
              >
                policestationagent.com
              </a>
              .
            </p>
          </section>

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
              <a
                href={POLICESTATIONAGENT_HOME_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-lg border-2 border-white/40 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white no-underline transition-colors hover:border-[var(--gold)] hover:bg-white/15"
              >
                policestationagent.com
              </a>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ContentReliabilityNotice } from '@/components/ContentReliabilityNotice';
import { ResolvedContentSources } from '@/components/ContentSourcesFooter';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Police Station Representative FAQ | PoliceStationRepUK',
  description:
    'Comprehensive answers to the most common questions about becoming and working as an accredited police station representative.',
  path: '/RepFAQMaster',
});

const FAQ_GROUPS: { title: string; items: { q: string; a: string }[] }[] = [
  {
    title: 'The basics',
    items: [
      {
        q: 'What is a police station representative?',
        a: 'An accredited professional who attends police stations to advise and assist suspects and volunteers, usually instructed by a criminal defence firm. Work is governed by PACE and professional standards.',
      },
      {
        q: 'What is the difference between a rep and a duty solicitor?',
        a: 'A duty solicitor is a solicitor on the legal aid duty rota. A police station rep is usually an accredited representative (e.g. PSRAS) who attends under a firm’s instruction. Some people are both. The important point is who holds the contract with the client and who supervises the case.',
      },
      {
        q: 'Can a police station rep go to court?',
        a: 'Police station accreditation is for custody work. Court advocacy requires separate rights of audience and is not implied by rep accreditation alone.',
      },
      {
        q: 'Is advice from a police station rep free?',
        a: 'For legally aided clients, advice at the police station is funded through legal aid subject to eligibility. Private clients pay under their agreement with the firm. The directory does not provide legal advice — contact a solicitor.',
      },
    ],
  },
  {
    title: 'Becoming a rep',
    items: [
      {
        q: 'How do I become a police station representative?',
        a: 'Typically you complete the PSRAS pathway through an approved assessment organisation (Cardiff or Datalaw), secure supervision at a Standard Crime Contract firm, pass the written stage, portfolio, and Critical Incidents Test, and are added to the Police Station Register via ADMIN 2. Reps cannot join the duty solicitor rota — they attend on a firm\'s instruction. Check the latest LAA Police Station Register Arrangements and PSRAS guidance.',
      },
      {
        q: 'What qualifications do I need?',
        a: 'Requirements depend on the accreditation route. You will need to complete the relevant police station representative qualification and maintain CPD. Check the latest DSCC and PSRAS guidance.',
      },
      {
        q: 'How much does accreditation cost?',
        a: 'Costs vary by provider and whether you study independently or with employer support. Treat published figures as indicative and confirm with your training provider.',
      },
      {
        q: 'How long does accreditation take?',
        a: 'Several months is common, depending on course format, assessments, and registration steps. Plan for supervision and insurance from day one.',
      },
    ],
  },
  {
    title: 'Working as a rep',
    items: [
      {
        q: 'How much do police station representatives earn?',
        a: 'Earnings depend on volume, region, anti-social hours, and the deal with each firm (percentage of fixed fee, hourly rate, or flat fee). See our pay overview for indicative legal aid figures.',
      },
      {
        q: 'Do I need a DSCC PIN number?',
        a: 'If you intend to take legally aided police station work, your firm adds you to the Police Station Register via ADMIN 2 and you receive a DSCC PIN. The PIN identifies you on attendances and in the firm\'s monthly LAA claim — it is not the same as being on the duty solicitor rota. Confirm arrangements with your supervising firm and the LAA.',
      },
      {
        q: 'Can I work for multiple firms?',
        a: 'Many reps are freelance and work for several firms, subject to conflict checks, insurance, and each firm’s terms. Put agreements in writing.',
      },
      {
        q: 'What hours do police station reps work?',
        a: 'Custody is 24/7. Many reps offer evenings, nights, and weekends; others are daytime-only. Set clear availability with instructing firms.',
      },
    ],
  },
  {
    title: 'At the police station',
    items: [
      {
        q: 'What happens when I arrive at the station?',
        a: 'You identify yourself, establish who you act for, obtain disclosure as appropriate, advise the client in private, and support them through interview or other procedures in line with PACE.',
      },
      {
        q: 'What is disclosure?',
        a: 'In this context, the information the police disclose to the defence about the allegation and evidence — enough to advise on interview, not necessarily everything the Crown will eventually rely on.',
      },
      {
        q: 'Can I intervene during interview?',
        a: 'You can advise on legal points and objections (e.g. inappropriate questioning). The precise boundaries depend on circumstances; serious issues may require the interviewing officer to pause.',
      },
      {
        q: 'What if my client wants to make no comment?',
        a: 'You explain the right to silence and the risk of adverse inferences in certain cases, then the client decides. You do not answer for them.',
      },
    ],
  },
];

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
          {FAQ_GROUPS.map((group) => (
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

import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';
import { PillarSeoLayout } from '@/components/PillarSeoLayout';
import { ContentReliabilityNotice } from '@/components/ContentReliabilityNotice';
import { ResolvedContentSources } from '@/components/ContentSourcesFooter';
import { PoliceStationAgentKentCta } from '@/components/PoliceStationAgentKentCta';

export const metadata = buildMetadata({
  title: 'Legal Advice at the Police Station (UK) | Legal Aid Guide',
  description:
    'How legal-aid-funded advice at the police station works in England and Wales: PACE rights, who provides advice, and why PoliceStationRepUK is a directory — not a legal aid provider.',
  path: '/free-legal-advice-police-station',
});

const BC = [
  { name: 'Home', url: '/' },
  { name: 'Legal aid at the police station', url: '/free-legal-advice-police-station' },
];

const FAQS = [
  {
    q: 'Can I get a solicitor for free at the police station?',
    a: 'If you are entitled to advice under the legal aid scheme at the police station, advice is typically provided without charge to you in that context. Eligibility and scope follow LAA rules.',
  },
  {
    q: 'Is PoliceStationRepUK a legal aid provider?',
    a: 'No. We are a directory platform. Legal aid is delivered by solicitor firms and schemes — not by this website.',
  },
  {
    q: 'Should I answer police questions without advice?',
    a: 'You should always take legal advice before deciding how to respond in interview. General information on our site is not a substitute for a lawyer.',
  },
];

export default function FreeLegalAdvicePoliceStationPage() {
  return (
    <>
    <PillarSeoLayout
      title="Legal advice at the police station (England & Wales)"
      breadcrumbItems={BC}
      quickAnswer="In England and Wales, suspects at a police station usually have a right to legal aid-funded advice for police-station work, delivered by a solicitor or accredited representative instructed by a firm. PoliceStationRepUK does not provide that advice — it helps firms find representatives."
      faqs={FAQS}
    >
      <ContentReliabilityNotice className="not-prose mb-8" />
      <h2 className="text-xl font-bold text-[var(--navy)]">The right to legal advice</h2>
      <p>
        If you are <strong className="text-[var(--navy)]">arrested</strong> or attending a{' '}
        <strong className="text-[var(--navy)]">voluntary interview under caution</strong>, you should understand your
        rights under PACE. One of the most important is access to{' '}
        <strong className="text-[var(--navy)]">legal advice</strong> before interview in most circumstances.
      </p>
      <h2 className="text-xl font-bold text-[var(--navy)]">How advice is delivered</h2>
      <p>
        Advice is given by a qualified criminal defence lawyer or an{' '}
        <Link href="/police-station-representative" className="font-semibold text-[var(--navy)] underline">
          accredited police station representative
        </Link>{' '}
        acting for a firm. The <strong className="text-[var(--navy)]">duty solicitor scheme</strong> can also provide
        cover where applicable. Which route applies depends on your circumstances and local arrangements.
      </p>
      <h2 className="text-xl font-bold text-[var(--navy)]">Legal aid at the police station</h2>
      <p>
        Many people receive <strong className="text-[var(--navy)]">police station advice and assistance</strong>{' '}
        under legal aid without a contribution in that setting. Rules change over time; your adviser explains what
        applies to you. This page is <strong className="text-[var(--navy)]">not legal advice</strong>.
      </p>
      <h2 className="text-xl font-bold text-[var(--navy)]">If you are not the suspect</h2>
      <p>
        Family members should encourage the detainee to use their rights and contact a{' '}
        <Link href="/criminal-solicitor-police-station" className="font-semibold text-[var(--navy)] underline">
          criminal solicitor
        </Link>{' '}
        firm as soon as possible. Our{' '}
        <Link href="/FAQ" className="font-semibold text-[var(--navy)] underline">
          FAQ
        </Link>{' '}
        answers common process questions at a high level.
      </p>
      <div className="my-6 rounded-[var(--radius-lg)] bg-[var(--navy)] p-6 text-center">
        <p className="text-sm font-semibold text-white">
          Need a solicitor at the police station? Ask for the duty solicitor or contact a criminal defence firm where the
          station is — not via this directory.
        </p>
        <PoliceStationAgentKentCta
          className="mt-3 text-sm text-slate-300"
          linkClassName="font-semibold text-[var(--gold)] underline"
          placement="free_advice_page"
        />
      </div>
      <h2 className="text-xl font-bold text-[var(--navy)]">For firms reading this page</h2>
      <p>
        Trainees often search “free legal advice police station” when drafting client care notes. Point them to{' '}
        <Link href="/police-station-rights-uk" className="font-semibold text-[var(--navy)] underline">
          police station rights UK
        </Link>{' '}
        and{' '}
        <Link href="/InterviewUnderCaution" className="font-semibold text-[var(--navy)] underline">
          interview under caution
        </Link>{' '}
        for structured internal training — still general information only.
      </p>
    </PillarSeoLayout>
    <div className="page-container pb-12">
      <div className="mx-auto max-w-3xl">
        <ResolvedContentSources context={{ kind: 'page', path: '/free-legal-advice-police-station' }} />
      </div>
    </div>
    </>
  );
}

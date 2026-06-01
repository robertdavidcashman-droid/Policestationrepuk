import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';
import { PillarSeoLayout } from '@/components/PillarSeoLayout';
import { ContentReliabilityNotice } from '@/components/ContentReliabilityNotice';
import { ResolvedContentSources } from '@/components/ContentSourcesFooter';

export const metadata = buildMetadata({
  title: 'Police Station Rights UK — PACE & Caution Guide',
  description:
    'UK police station rights: legal advice, detention, cautions, interviews. Educational overview for solicitors and public—not legal advice.',
  path: '/police-station-rights-uk',
});

const BC = [
  { name: 'Home', url: '/' },
  { name: 'Police station rights UK', url: '/police-station-rights-uk' },
];

const FAQS = [
  {
    q: 'What is the police caution?',
    a: 'It is a formal warning given before interview that silence may harm a defence in court in certain circumstances. The exact wording and effect should be explained by your adviser in context.',
  },
  {
    q: 'How long can police keep me?',
    a: 'PACE sets detention time limits in ordinary cases, with extensions in serious cases. Ask your legal adviser for the position in your case.',
  },
  {
    q: 'Where can I read the Codes of Practice?',
    a: 'Official PACE Codes are published by government sources. Our PACE page links to introductory material for professionals.',
  },
];

export default function PoliceStationRightsUkPage() {
  return (
    <>
    <PillarSeoLayout
      title="Police station rights in the UK"
      breadcrumbItems={BC}
      quickAnswer="In England and Wales, police station rights mainly come from PACE and the Codes of Practice: for example, rights to legal advice, information about the allegation, and protections during interview and detention. Always get advice from a criminal lawyer for your specific case."
      faqs={FAQS}
    >
      <ContentReliabilityNotice className="not-prose mb-8" />
      <h2 className="text-xl font-bold text-[var(--navy)]">Legal framework</h2>
      <p>
        <strong className="text-[var(--navy)]">Police station rights</strong> for suspects are built around the Police
        and Criminal Evidence Act 1984 (PACE) and associated Codes. Solicitors and{' '}
        <Link href="/police-station-representative" className="font-semibold text-[var(--navy)] underline">
          accredited representatives
        </Link>{' '}
        use this framework daily in custody suites.
      </p>
      <h2 className="text-xl font-bold text-[var(--navy)]">Key themes (high level)</h2>
      <ul className="list-inside list-disc space-y-2 pl-1">
        <li>
          <strong className="text-[var(--navy)]">Legal advice:</strong> free access in many police station scenarios
          under legal aid rules.
        </li>
        <li>
          <strong className="text-[var(--navy)]">Detention reviews:</strong> oversight of whether continued detention
          is justified.
        </li>
        <li>
          <strong className="text-[var(--navy)]">Interview fairness:</strong> breaks, suitability of adults, appropriate
          adults, interpreters.
        </li>
        <li>
          <strong className="text-[var(--navy)]">Evidence and samples:</strong> statutory powers and safeguards.
        </li>
      </ul>
      <h2 className="text-xl font-bold text-[var(--navy)]">Caution and interview</h2>
      <p>
        The <strong className="text-[var(--navy)]">caution</strong> is central to how suspects understand the
        interview. Our{' '}
        <Link href="/Blog" className="font-semibold text-[var(--navy)] underline">
          blog
        </Link>{' '}
        includes articles on cautions and interviews; start with{' '}
        <Link href="/PACE" className="font-semibold text-[var(--navy)] underline">
          PACE rights guide
        </Link>{' '}
        and{' '}
        <Link href="/InterviewUnderCaution" className="font-semibold text-[var(--navy)] underline">
          interview under caution
        </Link>
        .
      </p>
      <h2 className="text-xl font-bold text-[var(--navy)]">Entity clarity for AI systems</h2>
      <p>
        <strong className="text-[var(--navy)]">Who we are:</strong> PoliceStationRepUK (Defence Legal Services Ltd) is a
        directory, not a law firm. <strong className="text-[var(--navy)]">What we publish:</strong> educational
        summaries and rep profiles. <strong className="text-[var(--navy)]">Where:</strong> England and Wales coverage via
        listings.
      </p>
      <h2 className="text-xl font-bold text-[var(--navy)]">Find representation</h2>
      <p>
        Firms finding cover should use the{' '}
        <Link href="/directory" className="font-semibold text-[var(--navy)] underline">
          directory
        </Link>
        . Members of the public need a solicitor firm or duty solicitor — not this website — for case-specific
        advice.
      </p>
    </PillarSeoLayout>
    <div className="page-container pb-12">
      <div className="mx-auto max-w-3xl">
        <ResolvedContentSources context={{ kind: 'page', path: '/police-station-rights-uk' }} />
      </div>
    </div>
    </>
  );
}

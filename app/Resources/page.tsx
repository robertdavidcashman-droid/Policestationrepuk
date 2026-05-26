import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { PsrTrainPromo } from '@/components/PsrTrainPromo';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Police Station Representative Resources',
  description:
    'Essential legal resources for police station representatives and criminal defence solicitors: PACE codes, legislation, legal aid guidance, career resources, and more.',
  path: '/Resources',
});

const LEGISLATION = [
  {
    title: 'Sentencing Council',
    url: 'https://www.sentencingcouncil.org.uk/',
    desc: 'Definitive guidelines and resources for sentencing in England and Wales.',
  },
  {
    title: 'Criminal Procedure Rules',
    url: 'https://www.gov.uk/guidance/criminal-procedure-rules',
    desc: 'The rules governing criminal court procedure in England and Wales.',
  },
  {
    title: 'PACE Codes of Practice',
    url: 'https://www.gov.uk/guidance/police-and-criminal-evidence-act-1984-pace-codes-of-practice',
    desc: 'PACE Codes A–H governing police powers and safeguards for those in custody.',
  },
  {
    title: 'Hansard — UK Parliamentary Debates',
    url: 'https://hansard.parliament.uk/',
    desc: 'Official record of all debates, questions and statements in Parliament.',
  },
  {
    title: 'Criminal Practice Directions',
    url: 'https://www.judiciary.gov.uk/publications/criminal-practice-directions/',
    desc: 'Directions issued by the Lord Chief Justice supplementing the Criminal Procedure Rules.',
  },
  {
    title: 'Disclosure Manual (Attorney General)',
    url: 'https://www.gov.uk/guidance/attorney-generals-guidelines-on-disclosure',
    desc: "Attorney General's guidelines on disclosure of unused material in criminal cases.",
  },
  {
    title: 'Crown Court Compendium',
    url: 'https://www.judiciary.gov.uk/publications/crown-court-compendium/',
    desc: 'Guidance for judges, counsel and legal advisers in Crown Court proceedings.',
  },
  {
    title: "Victims' Code",
    url: 'https://www.gov.uk/government/publications/the-code-of-practice-for-victims-of-crime',
    desc: 'The statutory code setting out the services and information victims of crime are entitled to.',
  },
  {
    title: 'Youth Justice Legal Centre',
    url: 'https://yjlc.uk/',
    desc: 'Resources and guidance on the youth justice system in England and Wales.',
  },
  {
    title: 'BAILII (British and Irish Legal Information Institute)',
    url: 'https://www.bailii.org/',
    desc: 'Free access to case law, legislation and other legal materials from the UK and Ireland.',
  },
];

const STATUTES = [
  {
    title: 'Sentencing Act 2026 — Key Changes',
    href: '/Blog/sentencing-act-2026-key-changes',
    desc: 'Presumption to suspend sentences of 12 months or less, three-year suspended sentences, strengthened community sentences, and what it means for reps.',
    external: false,
  },
  {
    title: 'Sentencing Act 2026 (legislation.gov.uk)',
    url: 'https://legislation.gov.uk/ukpga/2026/2/data.html',
    desc: 'Full text of the Sentencing Act 2026 on legislation.gov.uk.',
  },
  {
    title: 'Legislation.gov.uk',
    url: 'https://www.legislation.gov.uk/',
    desc: 'Official database of all UK legislation, including primary and secondary law.',
  },
  {
    title: 'Police and Criminal Evidence Act 1984 (PACE)',
    url: 'https://www.legislation.gov.uk/ukpga/1984/60/contents',
    desc: 'The foundational statute governing police powers and rights of suspects.',
  },
  {
    title: 'Criminal Justice Act 2003',
    url: 'https://www.legislation.gov.uk/ukpga/2003/44/contents',
    desc: "Major reform of the criminal justice system affecting bail, sentencing and evidence.",
  },
  {
    title: 'Youth Justice and Criminal Evidence Act 1999',
    url: 'https://www.legislation.gov.uk/ukpga/1999/23/contents',
    desc: 'Provisions for special measures for vulnerable witnesses and youth offenders.',
  },
  {
    title: 'Human Rights Act 1998',
    url: 'https://www.legislation.gov.uk/ukpga/1998/42/contents',
    desc: 'Incorporates the European Convention on Human Rights into UK law.',
  },
  {
    title: 'Prosecution of Offences Act 1985',
    url: 'https://www.legislation.gov.uk/ukpga/1985/23/contents',
    desc: 'Establishes the Crown Prosecution Service and sets out prosecution powers.',
  },
  {
    title: 'Serious Crime Act 2007',
    url: 'https://www.legislation.gov.uk/ukpga/2007/27/contents',
    desc: 'Offences of encouraging or assisting crime; asset recovery; organised crime.',
  },
];

const LEGAL_AID = [
  {
    title: 'Legal Aid Agency',
    url: 'https://www.gov.uk/government/organisations/legal-aid-agency',
    desc: 'The LAA commissions and administers legal aid in England and Wales.',
  },
  {
    title: 'Criminal Legal Aid (Providers)',
    url: 'https://www.gov.uk/topic/legal-aid-for-providers/criminal-legal-aid',
    desc: 'Topic hub for guidance and updates for criminal legal aid providers on GOV.UK.',
  },
  {
    title: 'Criminal Legal Aid Manual',
    url: 'https://www.gov.uk/guidance/criminal-legal-aid-manual',
    desc: 'Comprehensive guidance on criminal legal aid eligibility, scope, and billing.',
  },
  {
    title: 'Criminal Bills Assessment Manual',
    url: 'https://www.gov.uk/guidance/criminal-bills-assessment-manual',
    desc: 'How the LAA assesses bills submitted by criminal legal aid providers.',
  },
  {
    title: 'Standard Crime Contract 2022',
    url: 'https://www.gov.uk/government/publications/standard-crime-contract-2022',
    desc: 'The current standard contract for criminal legal aid providers.',
  },
  {
    title: 'Police Station Register Arrangements 2025',
    url: 'https://www.gov.uk/guidance/police-station-representatives-and-duty-solicitors',
    desc: 'Guidance on the duty solicitor and police station rep scheme arrangements.',
  },
  {
    title: 'Check Legal Aid Eligibility',
    url: 'https://www.gov.uk/check-legal-aid',
    desc: 'Official online means test tool to quickly assess eligibility.',
  },
];

const CAREER = [
  {
    title: 'How to Become a Police Station Representative',
    href: '/HowToBecomePoliceStationRep',
    desc: "Complete guide to the qualifications, accreditation and steps needed to become an accredited rep.",
    external: false,
  },
  {
    title: 'How to Find a Supervising Solicitor',
    href: '/FindSupervisingSolicitor',
    desc: 'Why supervision is hard to secure, what SCC firms want, and how to approach firms professionally.',
    external: false,
  },
  {
    title: "Beginner's Guide for New Reps",
    href: '/BeginnersGuide',
    desc: 'Essential reading for those new to police station representation work.',
    external: false,
  },
  {
    title: 'Get Work as a Police Station Rep',
    href: '/GetWork',
    desc: 'Proven strategies to build and grow your freelance police station practice.',
    external: false,
  },
  {
    title: 'Custody Note App',
    href: '/CustodyNote',
    desc: 'Structured attendance note software for Windows and Mac — built for criminal defence professionals.',
    external: false,
  },
  {
    title: 'DSCC Registration Guide',
    href: '/DSCCRegistrationGuide',
    desc: 'How to register with the Defence Solicitor Call Centre (DSCC).',
    external: false,
  },
];

type ResourceItem = {
  title: string;
  url?: string;
  href?: string;
  desc: string;
  external?: boolean;
};

const cardClass =
  'group flex flex-col rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-4 no-underline shadow-[var(--card-shadow)] transition-all hover:-translate-y-0.5 hover:border-[var(--gold)]/40 hover:shadow-[var(--card-shadow-hover)]';

function ResourceCard({ item }: { item: ResourceItem }) {
  const href = item.external === false ? item.href! : item.url!;
  const isExternal = item.external !== false;

  const inner = (
    <>
      <p className="font-medium text-[var(--navy)] group-hover:text-[var(--gold-link)]">
        {item.title}
        {isExternal && <span className="ml-1 text-xs text-[var(--muted)]">↗</span>}
      </p>
      <p className="mt-1 flex-1 text-sm leading-relaxed text-[var(--muted)]">{item.desc}</p>
    </>
  );

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cardClass}
      >
        {inner}
      </a>
    );
  }

  return (
    <Link href={href} className={cardClass}>
      {inner}
    </Link>
  );
}

export default function ResourcesPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Resources', href: '/Resources' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">Knowledge Centre &amp; Resources</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-white">
            Curated resources for police station representatives and criminal defence solicitors
            across England &amp; Wales — legislation, legal aid guidance, career tools, and more.
          </p>
          <p className="mt-3 text-sm text-slate-300">
            General information only — not legal advice. Always follow your regulator, insurer, and
            supervising solicitor on live cases.
          </p>
        </div>
      </section>

      {/* Quick access bar */}
      <section className="border-b border-[var(--border)] bg-slate-50 py-6">
        <div className="page-container !py-0">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { href: '/Wiki', label: 'Rep Wiki', desc: 'In-depth guides and scenarios' },
              { href: '/FormsLibrary', label: 'Forms Library', desc: 'CRM1–CRM18A legal aid forms' },
              { href: '/StationsDirectory', label: 'Station Numbers', desc: 'Custody suite phone directory' },
              { href: '/Blog', label: 'Professional Blog', desc: 'Practical articles for the profession' },
            ].map((q) => (
              <Link
                key={q.href}
                href={q.href}
                className="flex flex-col rounded-lg border border-[var(--card-border)] bg-white p-4 no-underline shadow-sm transition-all hover:-translate-y-0.5 hover:border-[var(--gold)]/40 hover:shadow-md"
              >
                <p className="font-semibold text-[var(--navy)]">{q.label}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{q.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="page-container">

      <section className="mb-12">
        <h2 className="text-h2 mb-2 text-[var(--navy)]">Career &amp; Professional Development</h2>
        <p className="mb-6 text-sm text-[var(--muted)]">Guides for becoming and succeeding as a police station representative.</p>
        <PsrTrainPromo variant="card" campaign="training_resources" className="mb-6 max-w-xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CAREER.map((item) => (
            <ResourceCard key={item.href} item={item} />
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-h2 mb-2 text-[var(--navy)]">Key Legislation &amp; Guidance</h2>
        <p className="mb-6 text-sm text-[var(--muted)]">Essential statutory and non-statutory sources for criminal defence practice.</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LEGISLATION.map((item) => (
            <ResourceCard key={item.url} item={item} />
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-h2 mb-2 text-[var(--navy)]">UK Legislation &amp; Statutes</h2>
        <p className="mb-6 text-sm text-[var(--muted)]">Primary legislation most relevant to police station representation work.</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STATUTES.map((item) => (
            <ResourceCard key={item.href ?? item.url} item={item} />
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-h2 mb-2 text-[var(--navy)]">Legal Aid &amp; Forms</h2>
        <p className="mb-6 text-sm text-[var(--muted)]">LAA guidance, contracts, and billing resources.</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LEGAL_AID.map((item) => (
            <ResourceCard key={item.url} item={item} />
          ))}
        </div>
      </section>

      <div className="mt-2 border-t border-[var(--border)] pt-10">
        <div className="grid gap-4 sm:grid-cols-3">
          <Link
            href="/FormsLibrary"
            className="block rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 no-underline shadow-[var(--card-shadow)] hover:border-[var(--gold)]/40"
          >
            <p className="font-medium text-[var(--navy)]">📄 Forms Library</p>
            <p className="mt-1 text-sm text-[var(--muted)]">CRM1–CRM18A legal aid forms</p>
          </Link>
          <Link
            href="/StationsDirectory"
            className="block rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 no-underline shadow-[var(--card-shadow)] hover:border-[var(--gold)]/40"
          >
            <p className="font-medium text-[var(--navy)]">📞 Station Numbers</p>
            <p className="mt-1 text-sm text-[var(--muted)]">UK police station contact directory</p>
          </Link>
          <Link
            href="/directory"
            className="block rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 no-underline shadow-[var(--card-shadow)] hover:border-[var(--gold)]/40"
          >
            <p className="font-medium text-[var(--navy)]">🔍 Find a Rep</p>
            <p className="mt-1 text-sm text-[var(--muted)]">Search accredited representatives</p>
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}

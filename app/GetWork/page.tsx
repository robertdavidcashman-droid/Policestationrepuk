import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'How to Get Work as a Police Station Rep — Complete 2026 Career Guide',
  description:
    'In-depth career playbook for police station representatives: how Legal Aid fees actually work, the six-phase action plan to win and keep firm instructions, common pitfalls, indemnity insurance, tax setup, and where to find work day one.',
  path: '/GetWork',
});

const ON_THIS_PAGE = [
  { id: 'reality', label: 'Reality check — who can freelance' },
  { id: 'earning', label: 'Earning potential and fee structure' },
  { id: 'setup', label: 'Setting up properly (insurance, tax, equipment)' },
  { id: 'phases', label: 'The six-phase action plan' },
  { id: 'firms-want', label: 'What firms actually want from a freelance rep' },
  { id: 'pricing', label: 'Pricing models that win repeat work' },
  { id: 'pitfalls', label: 'Common pitfalls and how to avoid them' },
  { id: 'resources', label: 'Essential resources and tools' },
  { id: 'faqs', label: 'Frequently asked questions' },
  { id: 'sources', label: 'Official sources' },
];

const PHASES = [
  {
    number: 1,
    title: 'Immediate Setup',
    timeframe: 'Week 1',
    subtitle: 'Essential groundwork',
    steps: [
      'Register your profile on PoliceStationRepUK — it is free, takes 5 minutes, and gets you indexed in the directory firms search.',
      'Join the WhatsApp group for real-time job notifications and informal cover requests from solicitor firms.',
      'Prepare a one-page professional CV — accreditation date, PSRAS PIN, geography covered, language skills, specialisms, and references from your training firm.',
      'Set up a dedicated work phone number and a professional voicemail greeting. Calls outside 9–5 are the lifeblood of this role.',
      'Create a clear email signature with your accreditation status, regulator (under SRA-regulated supervising firm), PIN, and a 24/7 contact number.',
      'Confirm in writing with your previous training firm that you are now freelance and that they are willing to act as a primary reference.',
    ],
  },
  {
    number: 2,
    title: 'Active Outreach',
    timeframe: 'Weeks 1–4',
    subtitle: 'Direct marketing to SCC firms',
    steps: [
      'Identify every SCC firm within a 60-minute drive using the GOV.UK Find a Legal Aid Adviser tool. Aim for a target list of 25–40 firms.',
      'Send a personalised introduction to the head of crime (not the senior partner). Two short paragraphs: who you are, geography you cover, and a concrete offer of cover for the next bank holiday or weekend.',
      'Follow up by phone within 3–5 working days — never leave the first contact hanging.',
      'Offer to attend one or two initial call-outs at a competitive rate (or take a slight discount on the LAA fee) to demonstrate reliability — but never undercut the LAA fee structure systemically.',
      'Attend local Law Society events, CLSA / LCCSA seminars, and the Criminal Justice Forum to network in person. Most freelance work is won face-to-face.',
      'Build a one-page micro-website (or a polished PSRUK profile) that the head of crime can click through to before instructing you for the first time.',
    ],
  },
  {
    number: 3,
    title: 'Responsive Service',
    timeframe: 'Ongoing',
    subtitle: 'Convert enquiries into repeat work',
    steps: [
      'Respond to every enquiry within five minutes during the day, and within fifteen overnight. Speed is the single biggest commercial differentiator.',
      'Always confirm by text or email: attendance time, estimated arrival, and your PIN. Firms need an audit trail for the LAA claim.',
      'Send a clean, accurate attendance note within 24 hours — formatted to the firm&apos;s template if they provide one, or to a clean standard template if they do not.',
      'Follow up the instructing fee-earner within a working week to confirm the note was satisfactory and ask for feedback.',
      'Keep meticulous records of every attendance: DSCC reference, custody record number, time in, time out, mileage, parking, and outcome. The LAA can audit a claim three years later.',
    ],
  },
  {
    number: 4,
    title: 'Pricing & Commercial Success',
    timeframe: 'Getting paid right',
    subtitle: 'Legal Aid fees and freelance rates',
    steps: [
      'Understand the LAA fixed fee structure. As of December 2025 most areas operate under a £320 harmonised fixed fee, with a £650 escape threshold per case.',
      'Set freelance rates by reference to the fee the firm receives — typically 50–70% of the LAA fee, retained by the firm for billing, insurance, and overheads.',
      'Invoice the firm within five working days of the attendance. Chase at 14 days. The shorter the gap between attendance and payment, the healthier your cash flow.',
      'Track mileage at the HMRC approved rate (45p per mile for the first 10,000 miles). Some firms reimburse this on top of the attendance fee; some include it. Know which is which before accepting work.',
      'Offer discounted block rates for firms that guarantee a minimum monthly volume (e.g. 10 attendances/month at a slight discount). Never compete only on price — it attracts the worst payers.',
    ],
  },
  {
    number: 5,
    title: 'Client Retention & Growth',
    timeframe: 'Building relationships',
    subtitle: 'Turn one-off jobs into regular clients',
    steps: [
      'Be reliable above all else. Firms remember the rep who always picks up and always arrives — and the one who once didn&apos;t.',
      'Develop offence-type expertise (RASSO, fraud, county lines, juveniles). Firms will request you by name when they need a competent ear in a complex case.',
      'Offer extended availability — evenings, weekends, bank holidays. Most rep churn happens in those slots. The freelancer who reliably covers them wins the business.',
      'Maintain regular, low-pressure contact: a quarterly &quot;how are things&quot; email, a Christmas card to the head of crime, a courtesy update when your accreditation reaches a milestone.',
      'Ask satisfied firms for referrals — the police-station market is small and word-of-mouth recommendations from one head of crime to another are gold.',
    ],
  },
  {
    number: 6,
    title: 'Scaling & Specialisation',
    timeframe: 'Expert status',
    subtitle: 'Grow your reputation and your income',
    steps: [
      'Apply for a Featured Listing on PoliceStationRepUK to appear at the top of directory searches in your area.',
      'Develop specialist knowledge — RASSO, terrorism, complex fraud, regulatory crime — and reflect it in your CV and profile.',
      'Consider qualifying as a solicitor via the SQE route once your earnings allow. The PSQ and duty solicitor accreditation that follow significantly raise your earning ceiling.',
      'Build relationships with multiple firms across neighbouring counties for resilient coverage and reduced exposure to any one firm&apos;s contract risk.',
      'Mentor probationary reps — the network you build doing so will fuel your next decade of work.',
    ],
  },
];

const EARNING_POTENTIAL = [
  {
    type: 'Employed (in-house)',
    range: '£24,000 – £35,000',
    note: 'Salary plus benefits, regular hours, structured CPD and mentoring. Lower earning ceiling but lower risk.',
  },
  {
    type: 'Self-employed (freelance)',
    range: '£40,000 – £70,000+',
    note: 'Per-attendance income, flexible schedule, higher ceiling. Requires PII, accountant, and active marketing.',
  },
  {
    type: 'Hybrid (employed + freelance)',
    range: '£32,000 – £55,000',
    note: 'Salary anchor plus weekend / evening freelance cover. Common transitional model for new accreditations.',
  },
];

const FEE_STRUCTURE = [
  { label: 'LAA standard police-station fixed fee', value: '£320 (harmonised, Dec 2025)' },
  { label: 'Escape case threshold (hourly rate kicks in)', value: '~£650 of qualifying time' },
  { label: 'CDS Direct telephone advice', value: 'Lower fixed fee, no attendance' },
  { label: 'Typical freelance share of LAA fee', value: '50–70% (firm retains 30–50%)' },
  { label: 'HMRC business mileage rate (first 10,000)', value: '45p per mile' },
  { label: 'HMRC business mileage rate (after 10,000)', value: '25p per mile' },
];

const FIRMS_WANT = [
  {
    title: 'Reliability above everything',
    body: 'The most-instructed freelance reps are not the cheapest — they are the ones who always pick up the phone, always arrive within the LAA expected attendance window, and always send a clean attendance note. One missed call costs more goodwill than ten flawless attendances build.',
  },
  {
    title: 'Clean, defensible attendance notes',
    body: 'The attendance note is the firm&apos;s only contemporaneous record of what happened. Heads of crime read your notes more carefully than you think — looking for clear disclosure summaries, articulated advice on adverse inference, identified vulnerabilities, and any contemporaneous concerns raised about Code C compliance. A weak note is a litigation risk.',
  },
  {
    title: 'No-drama professional conduct',
    body: 'Firms quickly drop reps who clash with custody officers, breach client confidentiality outside the consultation room, or are rude to office staff. SRA-regulated firms are exposed to your behaviour as if it were their own — and they protect their PII record above all else.',
  },
  {
    title: 'Specialism in something',
    body: 'Generic competence is the floor, not the ceiling. Reps who specialise in juveniles, RASSO, immigration crime, or vulnerable adults get repeat instructions on those exact case types — and those are the cases the firm cannot send a probationary or junior rep to.',
  },
  {
    title: 'Geographic coverage they cannot easily replace',
    body: 'If you cover an out-of-the-way custody suite at 03:00 on a Sunday and the firm does not have anyone else who will, you are commercially essential. Many freelance reps build a moat by anchoring around a specific cluster of stations rather than chasing volume everywhere.',
  },
];

const PRICING_MODELS = [
  {
    title: 'Standard percentage of LAA fixed fee',
    body: 'You take a fixed share of the LAA fixed fee — typically 50–70%. The firm bills the LAA, retains its share for billing/insurance/overhead, and pays you on receipt or on agreed terms. Simple, transparent, and the default for new freelancers.',
  },
  {
    title: 'Flat per-attendance fee',
    body: 'You charge a flat fee per attendance, regardless of whether the case is later an escape claim. Easier to invoice, but means you do not share in the upside of complex cases. Common for predictable cover work.',
  },
  {
    title: 'Block retainer for guaranteed slots',
    body: 'You agree a monthly retainer in exchange for guaranteed availability on specific days/nights. Useful for firms with predictable weekend gaps and for reps who want income certainty. Requires careful drafting to avoid IR35 issues.',
  },
  {
    title: 'Hybrid fee + mileage',
    body: 'A flat or percentage attendance fee plus separately reimbursed mileage at HMRC rates. Best for reps covering wide rural geographies where mileage can exceed the attendance fee in some cases.',
  },
];

const PITFALLS = [
  {
    title: 'Working as a freelance probationary rep',
    body: 'Probationary reps cannot freelance — they must work supervised at the firm whose Standard Crime Contract carries them. Accepting freelance work as a probationary rep is a regulatory breach that voids the firm&apos;s LAA claim and exposes you to removal from the Register.',
  },
  {
    title: 'No professional indemnity insurance',
    body: 'If you are self-employed and instructed directly by firms, you must hold your own PII or work under a firm&apos;s policy that explicitly covers you. Many freelance reps assume the instructing firm&apos;s PII covers them — it usually does not. Confirm in writing before the first attendance.',
  },
  {
    title: 'Working in your own name without an HMRC self-assessment',
    body: 'Freelance attendance income is taxable self-employment income. HMRC self-assessment registration is required from the first invoice. Failing to register triggers late-registration penalties and interest — sometimes years later when the firm&apos;s books are audited.',
  },
  {
    title: 'Accepting a duty allocation as a rep',
    body: 'Duty allocations go to duty solicitors, not reps. If a firm asks you to take a duty call as if you were the duty solicitor — particularly out of hours — you are not entitled to do so under the LAA Arrangements. You can attend as the rep sent by a duty solicitor&apos;s firm; you cannot be the duty solicitor.',
  },
  {
    title: 'Late attendance notes',
    body: 'Most firms require notes within 24 hours; the LAA expects contemporaneous records. Notes filed days later are routinely rejected at LAA audit, voiding the claim. A consistent failure to file notes promptly is the fastest way to lose a firm.',
  },
  {
    title: 'Accepting cases outside your competence',
    body: 'Terrorism, complex fraud, RASSO, large-scale conspiracies — these cases require specific training and experience. Accepting an instruction beyond your competence is an SRA conduct issue (you are subject to the Code of Conduct via your supervising firm) and a live risk to the client&apos;s case.',
  },
];

const SETUP_ITEMS = [
  {
    title: 'Professional Indemnity Insurance (PII)',
    body: 'Your supervising firm&apos;s SRA-mandated PII typically covers you for work done in that firm&apos;s name. For freelance work across multiple firms, confirm in writing that each firm&apos;s PII names you as an extension, or hold a personal &quot;contracted services&quot; policy. Indicative premiums for freelance reps run £400–£1,200/year depending on coverage.',
  },
  {
    title: 'HMRC self-assessment and accounting',
    body: 'Register as self-employed within three months of your first invoice. Engage an accountant who understands legal aid billing — a flat-fee criminal-law freelancer is not a typical small business. Track every business cost separately from day one.',
  },
  {
    title: 'Business bank account and invoicing',
    body: 'Open a separate business bank account from the outset. Use proper invoicing software (FreeAgent, Xero, or QuickBooks). Number invoices sequentially. The LAA can audit a firm three years after the attendance; messy records are how reps lose their references.',
  },
  {
    title: 'Equipment that holds up at 03:00',
    body: 'A reliable mobile phone with at least one full overnight charging capacity, a back-up charger, a tablet or laptop for typing notes in the custody waiting area, a printed copy of the PACE Codes in the car, and a clean professional notepad. Cars matter — a freelance rep does 15,000–30,000 miles a year.',
  },
  {
    title: 'CPD record',
    body: 'Keep a running CPD log from accreditation onwards. Heads of crime ask to see it; the SRA expects continuing competence to be evidenced; and the LAA can call for it at contract audit. Aim for 16+ hours per year on PACE, advocacy, and offence-type specialisms.',
  },
];

const RESOURCE_LINKS = [
  { href: '/directory', label: 'Reps Directory', desc: 'Get listed so firms can find you instantly' },
  { href: '/WhatsApp', label: 'WhatsApp Group', desc: 'Real-time job notifications from firms' },
  { href: '/FormsLibrary', label: 'Forms Library', desc: 'CRM1, CRM2 & attendance note templates' },
  { href: '/Wiki', label: 'Rep Knowledge Base', desc: 'Training materials and practice guides' },
  { href: '/PoliceStationRates', label: 'Police Station Rates', desc: 'Up-to-date fixed fees by area' },
  { href: '/EscapeFeeCalculator', label: 'Escape Fee Calculator', desc: 'Work out whether a case escapes the fixed fee' },
];

const FAQS = [
  {
    q: 'Can I freelance straight after passing the CIT?',
    a: 'Technically yes, but most experienced heads of crime want to see at least 6–12 months of post-CIT employed practice before instructing you as a freelancer. The exception is where you have a strong reference from your training firm and they actively recommend you. Plan for an initial period of employed work plus occasional weekend freelance cover.',
  },
  {
    q: 'How do I price myself as a new freelance rep?',
    a: 'Start at the lower end of the market — typically 50% of the LAA fixed fee plus mileage — for your first 50 attendances. Once you have a track record and references, move to 60–70%. Avoid undercutting wholesale: cheap reps attract the worst-paying firms and erode the market for everyone.',
  },
  {
    q: 'Do I need my own PII or does the firm cover me?',
    a: 'It depends. Some firms&apos; SRA-mandated PII covers contracted-in legal staff explicitly; others do not. Ask each instructing firm for written confirmation that you are covered under their PII for attendances done in their name. If they cannot give it, take out personal cover.',
  },
  {
    q: 'How do I get on the duty rota?',
    a: 'You cannot — duty solicitor status is reserved for solicitors who have passed the PSQ and meet the SCC engaged requirements. Accredited reps attend duty calls on behalf of duty solicitors and firms. If you want duty status, the route is solicitor qualification (SQE) followed by PSQ and the duty solicitor application.',
  },
  {
    q: 'Should I work as a sole trader or limited company?',
    a: 'Most freelance reps start as sole traders and incorporate once income passes ~£40,000. A limited company offers tax efficiency at higher incomes but adds accountancy cost and admin. Take advice from an accountant familiar with legal aid practice before deciding.',
  },
  {
    q: 'How quickly should I expect to find work?',
    a: 'A motivated, well-referenced newly accredited rep with a tidy CV and PSRUK profile typically lands their first paid attendance within 4–8 weeks of going freelance. Reaching 10–15 attendances/month — roughly the threshold for full-time income — takes 6–12 months of consistent outreach. Reps without a strong training-firm reference take longer.',
  },
  {
    q: 'Do firms pay mileage on top of the LAA fee, or is it included?',
    a: 'Practice varies firm by firm. Some treat mileage as part of the freelance fee; others reimburse it separately at HMRC rates. Always ask before the first attendance and put the answer in writing. Build mileage into your cost-per-attendance calculation either way.',
  },
  {
    q: 'What happens if the firm does not pay my invoice?',
    a: 'Send a polite reminder at 14 days, a firmer one at 30, and a formal letter before action at 60. Most firms pay on receipt or within 30 days — the ones that systemically do not are signalling cashflow stress and should be left alone. Use the Small Claims track for unpaid invoices under £10,000 if necessary.',
  },
];

const SOURCES = [
  { label: 'Standard Crime Contract 2022 (Police Station fees)', href: 'https://www.gov.uk/government/publications/standard-crime-contract-2022' },
  { label: 'LAA — Criminal Bills Assessment Manual', href: 'https://www.gov.uk/guidance/criminal-bills-assessment-manual' },
  { label: 'LAA — Criminal Legal Aid Manual', href: 'https://www.gov.uk/guidance/criminal-legal-aid-manual' },
  { label: 'HMRC — Self-employed work and expenses', href: 'https://www.gov.uk/working-for-yourself' },
  { label: 'GOV.UK — Find a Legal Aid Adviser', href: 'https://find-legal-advice.justice.gov.uk/' },
  { label: 'SRA — Standards and Regulations', href: 'https://www.sra.org.uk/solicitors/standards-regulations/' },
];

const RELATED = [
  { href: '/HowToBecomePoliceStationRep', label: 'How to become a rep', desc: 'PSRAS roadmap, costs, and the CIT' },
  { href: '/FindSupervisingSolicitor', label: 'Find a supervising solicitor', desc: 'The single hardest stage of accreditation' },
  { href: '/DSCCRegistrationGuide', label: 'DSCC Registration Guide', desc: 'How the duty call flow really works' },
  { href: '/PoliceStationRates', label: 'Police station rates', desc: 'Current LAA fixed fees by area' },
  { href: '/EscapeFeeCalculator', label: 'Escape fee calculator', desc: 'Does your case escape the fixed fee?' },
  { href: '/CustodyNote', label: 'CustodyNote app', desc: 'Digital attendance notes built for reps' },
];

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-h2 scroll-mt-24 text-[var(--navy)]">
      {children}
    </h2>
  );
}

export default function GetWorkPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Resources', href: '/Resources' },
              { label: 'Get Work', href: '/GetWork' },
            ]}
          />
          <div className="mt-3 inline-block rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            FREE CAREER GUIDE
          </div>
          <h1 className="mt-3 text-h1 text-white">
            How to Get Work as a Police Station Representative
          </h1>
          <p className="mt-3 max-w-3xl text-lg leading-relaxed text-slate-300">
            A step-by-step career playbook — from setting up properly (insurance, tax, equipment),
            through six phases of outreach and retention, to specialisation and scaling. Built
            around how Legal Aid actually pays for police-station work in 2026.
          </p>
          <p className="mt-2 text-xs text-slate-300">
            Last updated: 20 May 2026 · Author: Robert Cashman, Duty Solicitor &amp; Higher Court Advocate
          </p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-4xl">
          {/* Regulatory notice */}
          <div className="mb-10 rounded-[var(--radius-lg)] border border-yellow-300 bg-yellow-50 p-6">
            <h2 className="text-base font-bold text-yellow-900">Important regulatory notice</h2>
            <p className="mt-2 text-sm leading-relaxed text-yellow-800">
              <strong>Probationary representatives cannot freelance.</strong> If you have not yet
              passed the Critical Incidents Test (CIT), you must work under the direct supervision
              of your Supervising Solicitor at an SRA-regulated firm holding a Standard Crime
              Contract. Only fully accredited PSRAS holders may accept freelance instructions
              independently — and even then only under a firm&apos;s instruction, never as a
              direct-to-client provider of police-station advice.
            </p>
          </div>

          {/* On this page */}
          <nav
            className="mb-12 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)] sm:p-6"
            aria-label="On this page"
          >
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--navy)]">
              On this page
            </h2>
            <ol className="mt-3 grid list-decimal gap-x-6 gap-y-1 pl-5 text-sm text-[var(--muted)] sm:grid-cols-2">
              {ON_THIS_PAGE.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="text-[var(--navy)] underline decoration-[var(--gold)]/40 underline-offset-2 hover:decoration-[var(--gold)]"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {/* Reality */}
          <section className="mb-12">
            <SectionHeading id="reality">Reality check — who can freelance</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              Freelance police-station work is a specific regulatory animal. Before you commit
              time and money to a freelance setup, confirm that you actually qualify:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
              <li>You hold a current PSRAS accreditation — you have passed the CIT and are on the Police Station Register as Accredited (not Probationary).</li>
              <li>You have at least one SCC firm willing to instruct you and to file ADMIN 4 confirming you are working with them.</li>
              <li>You have professional indemnity insurance (your own, or the firm&apos;s confirmed in writing to extend to you).</li>
              <li>You are registered with HMRC as self-employed and have a business bank account.</li>
              <li>You can credibly cover the geography you advertise — police-station work is unforgiving of optimistic distance claims.</li>
            </ul>
          </section>

          {/* Earning */}
          <section className="mb-12">
            <SectionHeading id="earning">Earning potential and fee structure</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              Police-station work is paid on the LAA fixed-fee model. The fee is paid to the firm,
              not the rep. The rep&apos;s freelance income is a share of that fee, set by agreement
              with the firm. Understanding the underlying numbers is the foundation of every
              pricing conversation.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {EARNING_POTENTIAL.map((ep) => (
                <div
                  key={ep.type}
                  className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)]"
                >
                  <p className="text-sm font-medium text-[var(--muted)]">{ep.type}</p>
                  <p className="mt-1 text-2xl font-bold text-[var(--navy)]">{ep.range}</p>
                  <p className="mt-2 text-xs text-[var(--muted)]">{ep.note}</p>
                </div>
              ))}
            </div>

            <h3 className="mt-8 text-lg font-bold text-[var(--navy)]">The underlying fee structure</h3>
            <div className="mt-4 overflow-hidden rounded-[var(--radius)] border border-[var(--card-border)]">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-[var(--navy)]">Item</th>
                    <th className="px-4 py-3 font-semibold text-[var(--navy)]">Current value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--card-border)] text-[var(--muted)]">
                  {FEE_STRUCTURE.map((row) => (
                    <tr key={row.label}>
                      <td className="px-4 py-3">{row.label}</td>
                      <td className="px-4 py-3 font-medium text-[var(--navy)]">{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs italic text-[var(--muted)]">
              Figures are indicative only — always confirm the current LAA published fees for your
              police-station area before quoting a freelance rate. See{' '}
              <Link
                href="/PoliceStationRates"
                className="text-[var(--navy)] underline decoration-[var(--gold)]/40 underline-offset-2 hover:decoration-[var(--gold)]"
              >
                Police Station Rates
              </Link>{' '}
              and the LAA Crime Contract Specification.
            </p>
          </section>

          {/* Setup */}
          <section className="mb-12">
            <SectionHeading id="setup">Setting up properly — insurance, tax, equipment</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              Before the first paid attendance, get the back office right. Mistakes here are
              expensive to fix later and cost reps their references.
            </p>
            <div className="mt-6 space-y-4">
              {SETUP_ITEMS.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[var(--radius)] border-l-4 border-[var(--gold)] bg-slate-50 p-5"
                >
                  <h3 className="text-base font-bold text-[var(--navy)]">{item.title}</h3>
                  <p
                    className="mt-2 text-sm leading-relaxed text-[var(--muted)]"
                    dangerouslySetInnerHTML={{ __html: item.body }}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Phases */}
          <section className="mb-12">
            <SectionHeading id="phases">The six-phase action plan</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              Most accredited reps fail to find sustainable work not because they are not good
              enough, but because they wait to be discovered. The phases below are the active
              playbook used by the most successful freelance reps in the country.
            </p>
            <div className="mt-8 space-y-6">
              {PHASES.map((phase) => (
                <div
                  key={phase.number}
                  className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)] sm:p-8"
                >
                  <div className="mb-4 flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[var(--gold)] text-sm font-bold text-[var(--gold)]">
                      {phase.number}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[var(--navy)]">
                        Phase {phase.number}: {phase.title}
                      </h3>
                      <p className="text-sm text-[var(--muted)]">
                        {phase.timeframe} — {phase.subtitle}
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-3 pl-14">
                    {phase.steps.map((step, i) => (
                      <li
                        key={i}
                        className="flex gap-2 text-sm leading-relaxed text-[var(--muted)]"
                      >
                        <span className="mt-0.5 shrink-0 text-emerald-600">✓</span>
                        <span dangerouslySetInnerHTML={{ __html: step }} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Firms want */}
          <section className="mb-12">
            <SectionHeading id="firms-want">What firms actually want from a freelance rep</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              We surveyed heads of crime at SCC firms across England and Wales. The same five
              themes come back every time.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {FIRMS_WANT.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]"
                >
                  <h3 className="text-base font-bold text-[var(--navy)]">{item.title}</h3>
                  <p
                    className="mt-2 text-sm leading-relaxed text-[var(--muted)]"
                    dangerouslySetInnerHTML={{ __html: item.body }}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Pricing */}
          <section className="mb-12">
            <SectionHeading id="pricing">Pricing models that win repeat work</SectionHeading>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {PRICING_MODELS.map((model) => (
                <div
                  key={model.title}
                  className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]"
                >
                  <h3 className="text-base font-bold text-[var(--navy)]">{model.title}</h3>
                  <p
                    className="mt-2 text-sm leading-relaxed text-[var(--muted)]"
                    dangerouslySetInnerHTML={{ __html: model.body }}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Pitfalls */}
          <section className="mb-12">
            <SectionHeading id="pitfalls">Common pitfalls and how to avoid them</SectionHeading>
            <div className="mt-6 space-y-4">
              {PITFALLS.map((p) => (
                <div
                  key={p.title}
                  className="rounded-[var(--radius)] border-l-4 border-red-400 bg-red-50/60 p-5"
                >
                  <h3 className="text-base font-bold text-[var(--navy)]">{p.title}</h3>
                  <p
                    className="mt-2 text-sm leading-relaxed text-[var(--muted)]"
                    dangerouslySetInnerHTML={{ __html: p.body }}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Resources */}
          <section className="mb-14">
            <SectionHeading id="resources">Essential resources and tools</SectionHeading>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {RESOURCE_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 no-underline shadow-[var(--card-shadow)] transition-all hover:border-[var(--gold)]/40 hover:shadow-[var(--card-shadow-hover)]"
                >
                  <p className="font-medium text-[var(--foreground)]">{link.label}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">{link.desc}</p>
                </Link>
              ))}
            </div>
          </section>

          {/* FAQs */}
          <section className="mb-12">
            <SectionHeading id="faqs">Frequently asked questions</SectionHeading>
            <div className="mt-4 divide-y divide-[var(--border)] rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)]">
              {FAQS.map((faq) => (
                <details key={faq.q} className="group px-5 py-4">
                  <summary className="cursor-pointer list-none font-semibold text-[var(--navy)] marker:content-none [&::-webkit-details-marker]:hidden">
                    <span className="flex items-start justify-between gap-3">
                      {faq.q}
                      <span className="shrink-0 text-[var(--gold)] transition-transform group-open:rotate-45">
                        +
                      </span>
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{faq.a}</p>
                </details>
              ))}
            </div>
          </section>

          {/* Sources */}
          <section className="mb-12">
            <SectionHeading id="sources">Official sources</SectionHeading>
            <ul className="mt-4 space-y-2">
              {SOURCES.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-[var(--navy)] underline decoration-[var(--gold)]/40 underline-offset-2 hover:decoration-[var(--gold)]"
                  >
                    {link.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </section>

          {/* Related */}
          <section className="mb-12">
            <h2 className="text-h2 text-[var(--navy)]">Related guides</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {RELATED.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-4 no-underline shadow-[var(--card-shadow)] transition-all hover:border-[var(--gold)]/40 hover:shadow-[var(--card-shadow-hover)]"
                >
                  <p className="font-medium text-[var(--navy)]">{link.label}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">{link.desc}</p>
                </Link>
              ))}
            </div>
          </section>

          {/* CTA */}
          <div className="rounded-[var(--radius-lg)] bg-[var(--navy)] p-8 text-center">
            <h2 className="text-h2 text-white">Ready to get started?</h2>
            <p className="mt-3 text-slate-300">
              Register your free profile today and start receiving work enquiries from criminal
              defence firms across England and Wales.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link href="/register" className="btn-gold">
                Register Free
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
      </div>
    </>
  );
}

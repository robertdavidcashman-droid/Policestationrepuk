import Link from 'next/link';
import { PsrTrainPromo } from '@/components/PsrTrainPromo';

const GUIDES = [
  {
    title: 'PSRAS Written Exam Guide',
    body: 'Format (4 of 5 questions, 50% pass), LAA exemptions, examination topics mapped to SRA standards, open-book rules, and structured study plan.',
    href: '/PrepareForWrittenExam',
  },
  {
    title: 'PSRAS Portfolio Guide',
    body: 'Nine case studies, probationary deadlines, case report blueprint, breadth matrix, assessor fail patterns, and submission workflow.',
    href: '/BuildPortfolioGuide',
  },
  {
    title: 'PSRAS CIT Exam Guide',
    body: 'Critical Incidents Test preparation: audio role-play format, Content/Confidence/Control marking, syllabus modules, and exam-day tips.',
    href: '/PrepareForCIT',
  },
  {
    title: 'How to Become a Police Station Rep',
    body: 'Complete PSRAS accreditation roadmap: eligibility, supervision, costs, timelines, and career progression.',
    href: '/HowToBecomePoliceStationRep',
  },
  {
    title: 'Find a Supervising Solicitor',
    body: 'Practical guide to securing PSRAS supervision: why firms say no, employment vs paid supervision, outreach that works, and official SRA/LAA requirements.',
    href: '/FindSupervisingSolicitor',
  },
  {
    title: 'Get Work as a Police Station Rep',
    body: 'Comprehensive business development guide: setting up as a freelance rep, active outreach strategies, firm relationship building, pricing structures, service delivery excellence, client retention techniques, and scaling your practice.',
    href: '/GetWork',
  },
  {
    title: 'Police Station Work - Complete Wiki',
    body: 'Extensive knowledge base covering: interview techniques, PACE compliance, disclosure procedures, legal aid claims, station-specific intelligence, common problems and solutions, billing best practices, and professional development.',
    href: '/Wiki',
  },
];

const INCLUDED = [
  'Complete "How to Become a Rep" guide',
  'Complete "Get Work as a Rep" guide',
  'Full Rep Wiki knowledge base',
  'All resources & templates',
];

const FREE_REASONS = [
  'No payment required',
  'Full access for all users',
  'Community-driven content',
  'Regularly updated guides',
];

export function HomeTrainingResources() {
  return (
    <section className="section-pad bg-white" aria-label="Training resources">
      <div className="page-container !py-0">
        <div className="text-center">
          <h2 className="text-h2 mt-0 text-[var(--navy)]">
            Training Guides &amp; Resources
          </h2>
          <p className="mt-2 text-[var(--muted)]">
            Access training guides, Rep Wiki, and professional resources — all completely free
          </p>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/Wiki" className="btn-gold !text-sm">
            Browse Resources →
          </Link>
        </div>

        {/* What's Available */}
        <div className="mt-10">
          <h3 className="text-lg font-bold text-[var(--navy)]">What&apos;s Available</h3>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {GUIDES.map((g) => (
              <Link
                key={g.href}
                href={g.href}
                className="group card-surface no-underline transition-shadow hover:shadow-[var(--card-shadow-hover)] hover:border-[var(--gold)]/40"
              >
                <h4 className="text-base font-bold text-[var(--navy)] group-hover:text-[var(--navy-light)]">
                  {g.title}
                </h4>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{g.body}</p>
              </Link>
            ))}
            <PsrTrainPromo variant="card" campaign="homepage_training" />
          </div>
        </div>

        {/* What's Included + Why It's Free */}
        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          <div>
            <h3 className="text-lg font-bold text-[var(--navy)]">What&apos;s Included</h3>
            <ul className="mt-3 space-y-2">
              {INCLUDED.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-[var(--muted)]">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs text-emerald-700">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--navy)]">Why It&apos;s Free</h3>
            <ul className="mt-3 space-y-2">
              {FREE_REASONS.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-[var(--muted)]">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-700">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

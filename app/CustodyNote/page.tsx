import Image from 'next/image';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import {
  CUSTODYNOTE_ANYWHERE_HREF,
  CUSTODYNOTE_ANYWHERE_NAME,
  CUSTODYNOTE_ANYWHERE_TAGLINE,
  CUSTODYNOTE_DISCOUNT_CODE,
  CUSTODYNOTE_DISCOUNT_PCT,
  CUSTODYNOTE_DOWNLOAD_HREF,
  CUSTODYNOTE_MEMBER_PRICE_GBP,
  CUSTODYNOTE_PRICE_GBP,
  CUSTODYNOTE_PRICING_HREF,
  CUSTODYNOTE_VERSION,
} from '@/lib/custodynote-promo';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: `CustodyNote — UK Police Station Attendance Note Software (£${CUSTODYNOTE_PRICE_GBP}/mo)`,
  description:
    `CustodyNote: PACE-aligned Windows software for criminal solicitors and accredited police station reps — structured custody, voluntary and telephone notes, PDF export, LAA billing fields, offline-first. £${CUSTODYNOTE_PRICE_GBP}/mo (PSR UK readers £${CUSTODYNOTE_MEMBER_PRICE_GBP}/mo with code ${CUSTODYNOTE_DISCOUNT_CODE}). 30-day free trial, no credit card.`,
  path: '/CustodyNote',
});

const CUSTODYNOTE_PRICING = CUSTODYNOTE_PRICING_HREF;
const CUSTODYNOTE_DOWNLOAD = CUSTODYNOTE_DOWNLOAD_HREF;
const DISCOUNT_CODE = CUSTODYNOTE_DISCOUNT_CODE;
const SUBSCRIPTION_GBP = CUSTODYNOTE_PRICE_GBP;
const MEMBER_GBP = CUSTODYNOTE_MEMBER_PRICE_GBP;
const APP_VERSION = CUSTODYNOTE_VERSION;

const RECORD_TYPES = [
  {
    name: 'Attendance',
    subtitle: 'Full attendance form',
    desc: 'Complete police station attendance record with all 16 sections — from arrival through to billing.',
    detail: '16 sections',
  },
  {
    name: 'Telephone Advice',
    subtitle: 'INVB / Telephone',
    desc: 'Streamlined form for telephone advice sessions with LAA code support built in.',
    detail: 'LAA code support',
  },
  {
    name: 'Quick Capture',
    subtitle: 'Grab details on the go',
    desc: 'Rapid note-taking when you need to capture essential details quickly.',
    detail: 'Fast entry',
  },
];

const FEATURE_CARDS = [
  {
    name: 'Structured records',
    desc: 'Purpose-built workflows for full attendances, telephone advice, and rapid note capture so you are not adapting generic Word templates mid-job.',
  },
  {
    name: 'PDF-ready output',
    desc: 'Turn working notes into a clean PDF record you can save, print, or send to the instructing firm without another rewrite.',
  },
  {
    name: 'Billing and firm admin',
    desc: 'Keep fee codes, time recording, declarations, and firm-level billing details together with the case record instead of splitting them across apps.',
  },
];

const SCREENSHOTS = [
  {
    src: '/images/custodynote/custodynote-app-dashboard.png',
    title: 'Dashboard — one screen, every workflow',
    desc: 'Launch a Custody Attendance, Voluntary Attendance, Telephone Advice, Quick Capture, or Quick Email — all from the main dashboard.',
  },
  {
    src: '/images/custodynote/cn-attendance-form.png',
    title: 'Case Reference & Arrival',
    desc: 'Section 1 of 16: structured fields for attendance type, file reference, instruction details, and arrival time — with every section just one tab away.',
  },
  {
    src: '/images/custodynote/cn-custody-record.png',
    title: 'Custody Record',
    desc: 'Section 3: capture custody number, custody record review, and client details from the custody record — all structured and searchable.',
  },
] as const;

const EXTRA_SCREENSHOTS = [
  {
    src: '/images/custodynote/cn-disclosure.png',
    title: 'Offences & Disclosure',
    desc: 'Section 4: matter type selection, offence details, date qualifiers, and mode of trial — mapped to LAA requirements.',
  },
  {
    src: '/images/custodynote/cn-interview.png',
    title: 'Consultation checklist',
    desc: 'Section 6: structured compliance checklist for conflict checks, confidentiality, free representation advice, client welfare, and custody record review.',
  },
] as const;

const FORM_SECTIONS = [
  'Case Reference & Arrival',
  'Journey to Station',
  'Custody Record',
  'Offences',
  'Disclosure & Evidence',
  'Consultation',
  'Interview',
  'Outcome',
  'Time Recording & Fees',
  'LAA Declaration',
  'Admin & Billing',
  'Consents & Retainer',
  'Third Party Authority',
  'Authorities',
  'Communications Log',
  'Supervisor Review',
];

const LAA_FEATURES = [
  'LAA outcome codes, stage reached & fee codes built in',
  'Structured notes mapped to LAA requirements',
  'Sufficient benefit test',
  'PACE reviews (1st / 2nd / 3rd)',
  'Fee rates updated to 2025 — £320 fixed fee, £650 escape',
  'DSCC PIN included in PDF export',
  'Client and fee earner declarations',
  'Automatic escape fee detection',
  'Editable fee rates',
  'Local encrypted backup of all records',
];

const SECURITY_FEATURES = [
  {
    title: 'Encrypted Backup',
    desc: 'All records are encrypted at rest and in transit. Your client data is protected at every stage.',
  },
  {
    title: 'Fully Offline',
    desc: 'Works without internet — perfect for police station custody areas with no signal. No connection required.',
  },
  {
    title: 'Your Data, Your Machine',
    desc: 'Records stay on your device. No cloud dependency required. You control where your data lives.',
  },
  {
    title: 'Cloud backup available',
    desc: 'Optional cloud backup is available alongside the core app, while the main workflow remains fully usable on your own machine.',
  },
];

const BILLING_FEATURES = [
  {
    title: 'Firm Tracking & Billing',
    desc: 'Track which firm instructed you and manage billing per firm. See at a glance what you are owed.',
  },
  {
    title: 'Bill Every Firm Accurately',
    desc: 'Automatic time tracking and fee calculation based on LAA rates. No more spreadsheets or guesswork.',
  },
  {
    title: 'Reports & Analytics',
    desc: 'Generate reports for your attendances, earnings, and firm breakdown. Understand your business at a glance.',
  },
  {
    title: 'Save Hours Every Week',
    desc: 'Structured forms mean less time writing up notes and more time for clients. One form, one workflow.',
  },
  {
    title: 'PDF Export',
    desc: 'Export attendance records as professional PDF documents — ready to send to firms or archive.',
  },
];

const PRICING_FEATURES = [
  'Full attendance notes with all 16 sections',
  'Telephone advice & quick capture modes',
  'LAA-ready with built-in codes & declarations',
  'Secure & offline — works without internet',
  'PDF export with DSCC PIN',
  'Firm tracking & billing',
  'Reports & analytics',
  'Local encrypted backup included',
];

export default function CustodyNotePage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'CustodyNote' },
            ]}
          />
          <div className="mb-4 mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-white bg-[var(--navy-light)] px-3 py-1 text-xs font-medium text-white">
              Available Now
            </span>
            <span className="inline-flex items-center rounded-full border border-white bg-[var(--navy-light)] px-3 py-1 text-xs font-medium text-white">
              Desktop App
            </span>
            <span className="inline-flex items-center rounded-full bg-green-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
              30-Day Free Trial
            </span>
          </div>

          <h1 className="text-h1 text-white">
            PACE attendance notes that match how UK custody work actually runs
          </h1>

          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-white">
            CustodyNote is Windows software built for criminal defence solicitors and accredited
            police station representatives. Disclosure → advice → interview → outcome in one
            structured record — offline at the custody desk, PDF for the firm file, LAA-oriented
            billing fields built in. No more rewriting the same facts at 2am.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white bg-[var(--navy-light)] px-3 py-1.5 text-xs font-medium text-white">
              <span className="text-green-300">✓</span> Supports LAA codes
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white bg-[var(--navy-light)] px-3 py-1.5 text-xs font-medium text-white">
              <span className="text-green-300">✓</span> Works offline
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white bg-[var(--navy-light)] px-3 py-1.5 text-xs font-medium text-white">
              <span className="text-green-300">✓</span> Encrypted backup
            </span>
          </div>

          <div className="mt-8 rounded-[var(--radius-lg)] border-2 border-[var(--gold)] bg-[var(--navy-light)] p-5">
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--gold)]">
              Simple, all-in-one pricing
            </p>
            <p className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">
              £{SUBSCRIPTION_GBP}
              <span className="text-base font-medium text-white/80">/month</span>
              <span className="mx-2 text-white/40">·</span>
              <span className="text-[var(--gold)]">PSR UK readers £{MEMBER_GBP}/mo</span>
            </p>
            <p className="mt-2 text-sm text-white/85">
              One plan, everything included — notes, billing, PDF export, AES-256 encryption and
              optional UK cloud backup. 30-day free trial, no credit card. Cancel anytime. Save more
              with 6-month or annual billing at checkout on custodynote.com.
            </p>
            <p className="mt-3 text-sm text-slate-300">
              {CUSTODYNOTE_DISCOUNT_PCT}% off for PoliceStationRepUK readers — use code{' '}
              <span className="rounded bg-[var(--gold)] px-2.5 py-0.5 font-mono text-sm text-[var(--navy)]">
                {DISCOUNT_CODE}
              </span>{' '}
              at checkout on custodynote.com.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={CUSTODYNOTE_DOWNLOAD}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold inline-flex min-h-[44px] items-center no-underline"
            >
              Download Free 30-Day Trial →
            </a>
            <a
              href={CUSTODYNOTE_PRICING}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline inline-flex min-h-[44px] items-center !border-white !text-white no-underline hover:!bg-white hover:!text-[var(--navy)]"
            >
              View Pricing
            </a>
          </div>
          <p className="mt-3 text-xs text-slate-300">
            No credit card for trial · Windows 10+ · £{SUBSCRIPTION_GBP}/mo (PSR UK £{MEMBER_GBP}/mo) · Cancel any time · v{APP_VERSION}
          </p>

          <div className="mt-6 rounded-[var(--radius-lg)] border border-white/25 bg-white/5 p-4 sm:p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--gold)]">
              Not on Windows?
            </p>
            <p className="mt-2 text-sm font-semibold text-white">
              {CUSTODYNOTE_ANYWHERE_NAME} — coming soon
            </p>
            <p className="mt-1 text-xs leading-relaxed text-white/85">
              {CUSTODYNOTE_ANYWHERE_TAGLINE}. Mac, Chromebook, iPad and Android — the planned
              browser-based version. Register interest so the team can email you when an
              early-access build is ready.
            </p>
            <a
              href={CUSTODYNOTE_ANYWHERE_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex min-h-[40px] items-center rounded-lg border border-[var(--gold)] px-4 py-2 text-xs font-bold !text-[var(--gold)] no-underline transition-colors hover:bg-[var(--gold)] hover:!text-[var(--navy)]"
            >
              Register interest in {CUSTODYNOTE_ANYWHERE_NAME} →
            </a>
          </div>
        </div>
      </section>

      <div className="page-container">

      <section className="mb-14">
        <h2 className="text-h2 mb-2 text-[var(--navy)]">The actual app — see it before you try it</h2>
        <p className="mb-6 max-w-2xl text-[var(--muted)]">
          Real screenshots from the Custody Note desktop app. Every section is purpose-built for police station work — not adapted from a generic template.
        </p>
        <div className="grid gap-5 lg:grid-cols-3">
          {SCREENSHOTS.map((shot) => (
            <article
              key={shot.title}
              className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[var(--card-shadow)]"
            >
              <div className="border-b border-[var(--card-border)] bg-slate-50 p-3">
                <Image
                  src={shot.src}
                  alt={shot.title}
                  width={1536}
                  height={960}
                  className="h-auto w-full rounded-[var(--radius)] border border-slate-200"
                />
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-[var(--navy)]">{shot.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{shot.desc}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {EXTRA_SCREENSHOTS.map((shot) => (
            <article
              key={shot.title}
              className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[var(--card-shadow)]"
            >
              <div className="border-b border-[var(--card-border)] bg-slate-50 p-3">
                <Image
                  src={shot.src}
                  alt={shot.title}
                  width={1536}
                  height={960}
                  className="h-auto w-full rounded-[var(--radius)] border border-slate-200"
                />
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-[var(--navy)]">{shot.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{shot.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 3 Record Types */}
      <section className="mb-14">
        <h2 className="text-h2 mb-2 text-[var(--navy)]">3 record types</h2>
        <p className="mb-6 max-w-2xl text-[var(--muted)]">
          Choose the right form for the job. Each record type is designed for a specific workflow.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {RECORD_TYPES.map((rt) => (
            <div
              key={rt.name}
              className="group flex flex-col rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)] transition-all hover:-translate-y-0.5 hover:border-[var(--gold)]/40 hover:shadow-[var(--card-shadow-hover)]"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[var(--navy)]">{rt.name}</h3>
                <span className="rounded-full bg-[var(--gold)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--gold-link)]">
                  {rt.detail}
                </span>
              </div>
              <p className="mb-2 text-sm font-medium text-[var(--navy)]">{rt.subtitle}</p>
              <p className="flex-1 text-sm leading-relaxed text-[var(--muted)]">{rt.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* One app for attendances, advice & billing */}
      <section className="mb-14">
        <h2 className="text-h2 mb-2 text-[var(--navy)]">
          One app for attendances, advice &amp; billing
        </h2>
        <p className="mb-6 max-w-2xl text-[var(--muted)]">
          Stop juggling spreadsheets, Word documents, handwritten notes, and separate billing files.
          Custody Note brings the working note and the finished record into a single workflow.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {FEATURE_CARDS.map((fc) => (
            <div
              key={fc.name}
              className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)]"
            >
              <h3 className="text-base font-semibold text-[var(--navy)]">{fc.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{fc.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 16 sections */}
      <section className="mb-14">
        <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-8 shadow-[var(--card-shadow)]">
          <h2 className="text-h2 text-center text-[var(--navy)]">
            16 sections. One form. No switching.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-[var(--muted)]">
            Every aspect of a police station attendance covered in a single, logical flow — from
            initial instructions through to billing and supervisor review.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {FORM_SECTIONS.map((section, i) => (
              <div
                key={section}
                className="flex items-start gap-3 rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--background)] p-3"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--gold)]/10 text-xs font-bold text-[var(--gold-link)]">
                  {i + 1}
                </span>
                <span className="text-sm font-medium text-[var(--navy)]">{section}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LAA record-keeping */}
      <section className="mb-14">
        <h2 className="text-h2 mb-2 text-[var(--navy)]">
          Designed to support LAA record-keeping
        </h2>
        <p className="mb-6 max-w-2xl text-[var(--muted)]">
          CustodyNote captures the information you need for Legal Aid Agency compliance. Every field
          is mapped to LAA requirements so your records are audit-ready from day one.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {LAA_FEATURES.map((feature) => (
            <div
              key={feature}
              className="flex items-start gap-3 rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-[var(--card-shadow)]"
            >
              <span className="mt-0.5 text-green-600">✓</span>
              <span className="text-sm text-[var(--navy)]">{feature}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Security */}
      <section className="mb-14">
        <h2 className="text-h2 mb-2 text-[var(--navy)]">
          Your records are too important to risk
        </h2>
        <p className="mb-6 max-w-2xl text-[var(--muted)]">
          Client records demand the highest levels of security. CustodyNote is built with data
          protection at its core.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {SECURITY_FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)]"
            >
              <h3 className="font-semibold text-[var(--navy)]">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Freelance Reps Use Custody Note */}
      <section className="mb-14">
        <h2 className="text-h2 mb-2 text-[var(--navy)]">
          Why Freelance Reps Use Custody Note
        </h2>
        <p className="mb-6 max-w-2xl text-[var(--muted)]">
          Less admin, more organised records, more time for clients.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BILLING_FEATURES.map((f) => (
            <div
              key={f.title}
              className="group flex flex-col rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)] transition-all hover:-translate-y-0.5 hover:border-[var(--gold)]/40 hover:shadow-[var(--card-shadow-hover)]"
            >
              <h3 className="font-semibold text-[var(--navy)]">{f.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--muted)]">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Simple Pricing */}
      <section className="mb-14">
        <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-8 shadow-[var(--card-shadow)] sm:p-10">
          <h2 className="text-h2 text-center text-[var(--navy)]">Simple Pricing</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-[var(--muted)]">
            One desktop subscription, a free 30-day trial, and no need to stitch together extra tools
            just to get from attendance to invoice.
          </p>
          <div className="mx-auto mt-8 max-w-md">
            <div className="rounded-[var(--radius-lg)] border-2 border-[var(--gold)]/40 bg-[var(--gold)]/5 p-6">
              <p className="mb-1 text-center text-xs font-bold uppercase tracking-wider text-[var(--gold-link)]">
                One plan · everything included
              </p>
              <p className="text-center text-3xl font-extrabold text-[var(--navy)]">
                £{SUBSCRIPTION_GBP}<span className="text-base font-normal text-[var(--muted)]">/mo</span>
              </p>
              <p className="mt-1 text-center text-sm font-semibold text-[var(--gold-link)]">
                PSR UK readers £{MEMBER_GBP}/mo with code {DISCOUNT_CODE}
              </p>
              <p className="mt-2 text-center text-sm text-[var(--muted)]">
                30-day free trial included · no credit card to try · cancel anytime
              </p>
              <p className="mt-1 text-center text-xs text-[var(--muted)]">
                Save more with 6-month or annual billing at checkout on custodynote.com.
              </p>
              <ul className="mt-6 space-y-3">
                {PRICING_FEATURES.map((pf) => (
                  <li key={pf} className="flex items-start gap-2 text-sm text-[var(--navy)]">
                    <span className="mt-0.5 text-green-600">✓</span>
                    {pf}
                  </li>
                ))}
              </ul>
              <a
                href={CUSTODYNOTE_PRICING}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold mt-6 flex min-h-[44px] items-center justify-center no-underline"
              >
                View Pricing & Trial →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="mb-14 rounded-[var(--radius-lg)] bg-[var(--navy)] p-8 text-center sm:p-10">
        <h2 className="text-h2 text-white">Ready to try CustodyNote?</h2>
        <p className="mx-auto mt-3 max-w-xl text-slate-300">
          Start a 30-day free trial today — no credit card, all features included. £{SUBSCRIPTION_GBP}/mo
          after the trial. PSR UK readers pay £{MEMBER_GBP}/mo with code{' '}
          <span className="rounded bg-[var(--gold)] px-2.5 py-0.5 font-mono text-sm text-[var(--navy)]">
            {DISCOUNT_CODE}
          </span>{' '}
          ({CUSTODYNOTE_DISCOUNT_PCT}% off) at checkout on custodynote.com.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <a
            href={CUSTODYNOTE_DOWNLOAD}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold inline-flex min-h-[44px] items-center no-underline"
          >
            Download Free 30-Day Trial →
          </a>
          <a
            href={CUSTODYNOTE_PRICING}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline inline-flex min-h-[44px] items-center !border-white !text-white no-underline hover:!bg-white hover:!text-[var(--navy)]"
          >
            View pricing & trial →
          </a>
        </div>
        <p className="mt-3 text-xs text-[var(--muted)]">
          No credit card for trial · Windows 10+ · £{SUBSCRIPTION_GBP}/mo (PSR UK £{MEMBER_GBP}/mo) · Cancel any time · v{APP_VERSION}
        </p>
      </section>

      {/* Related */}
      <section className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/directory"
          className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 no-underline shadow-[var(--card-shadow)] transition-colors hover:border-[var(--gold)]/40"
        >
          <p className="font-medium text-[var(--navy)]">Find a Rep</p>
          <p className="mt-1 text-sm text-[var(--muted)]">Browse accredited representatives</p>
        </Link>
        <Link
          href="/register"
          className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 no-underline shadow-[var(--card-shadow)] transition-colors hover:border-[var(--gold)]/40"
        >
          <p className="font-medium text-[var(--navy)]">Register Free</p>
          <p className="mt-1 text-sm text-[var(--muted)]">Join the directory</p>
        </Link>
        <Link
          href="/FormsLibrary"
          className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 no-underline shadow-[var(--card-shadow)] transition-colors hover:border-[var(--gold)]/40"
        >
          <p className="font-medium text-[var(--navy)]">Forms Library</p>
          <p className="mt-1 text-sm text-[var(--muted)]">CRM &amp; LAA forms</p>
        </Link>
      </section>
    </div>
    </>
  );
}

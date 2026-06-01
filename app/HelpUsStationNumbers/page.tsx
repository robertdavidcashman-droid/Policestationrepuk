import Link from 'next/link';
import { getAllStations } from '@/lib/data';
import { JsonLd } from '@/components/JsonLd';
import {
  GuideFaqs,
  GuideHero,
  GuideSectionHeading,
  GuideToc,
  StructuredGuideShell,
} from '@/components/StructuredGuideLayout';
import { buildMetadata, breadcrumbSchema, faqPageSchema } from '@/lib/seo';
import {
  CAMPAIGN_FAQS,
  CAMPAIGN_HEADLINE,
  CAMPAIGN_PATH,
  CAMPAIGN_STEPS,
  CAMPAIGN_TAGLINE,
  CAMPAIGN_WHO,
  CAMPAIGN_WHY,
  computeStationPhoneStats,
} from '@/lib/station-numbers-campaign';

export const metadata = buildMetadata({
  title: 'Help Us to Help You — Report Police Station Phone Numbers',
  description:
    'Help us to help you: report up-to-date UK police station custody desk and main line numbers. Community corrections reviewed before publishing — for reps, firms, and the public.',
  path: CAMPAIGN_PATH,
  keywords: [
    'report police station phone number',
    'custody suite telephone UK',
    'police station numbers directory',
    'help us to help you station numbers',
  ],
});

const ON_THIS_PAGE = [
  { id: 'why', label: 'Why it matters' },
  { id: 'stats', label: 'Directory snapshot' },
  { id: 'how', label: 'How it works' },
  { id: 'who', label: 'Who can help' },
  { id: 'report', label: 'Report a number' },
  { id: 'faqs', label: 'FAQs' },
] as const;

export default async function HelpUsStationNumbersPage() {
  const stations = await getAllStations();
  const stats = computeStationPhoneStats(stations);

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Station Directory', url: '/StationsDirectory' },
          { name: CAMPAIGN_HEADLINE, url: CAMPAIGN_PATH },
        ])}
      />
      <JsonLd data={faqPageSchema([...CAMPAIGN_FAQS])} />

      <GuideHero
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Station Directory', href: '/StationsDirectory' },
          { label: CAMPAIGN_HEADLINE },
        ]}
        title={CAMPAIGN_HEADLINE}
        description={CAMPAIGN_TAGLINE}
      />

      <StructuredGuideShell sourcesContext={{ kind: 'page', path: CAMPAIGN_PATH }}>
        <GuideToc items={ON_THIS_PAGE} />

        <section className="mb-12">
          <GuideSectionHeading id="why">Why it matters</GuideSectionHeading>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            PoliceStationRepUK lists telephone numbers and addresses for custody suites across
            England &amp; Wales. When a number is wrong, everyone loses time — especially at night
            when firms are trying to reach custody or instruct cover.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {CAMPAIGN_WHY.map((item) => (
              <div
                key={item.title}
                className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]"
              >
                <h3 className="font-bold text-[var(--navy)]">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {stats.total > 0 && (
          <section className="mb-12">
            <GuideSectionHeading id="stats">Directory snapshot</GuideSectionHeading>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Stations listed', value: stats.total },
                { label: 'Direct line shown', value: stats.directLine },
                { label: 'Switchboard / 101 only', value: stats.switchboard + stats.generic },
                { label: 'No number held', value: stats.none },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-4 text-center shadow-[var(--card-shadow)]"
                >
                  <p className="text-2xl font-extrabold text-[var(--navy)]">{item.value}</p>
                  <p className="mt-1 text-xs font-medium text-[var(--muted)]">{item.label}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-[var(--muted)]">
              {stats.needsHelp} listings could use a verified direct custody or main line number.
              If you know one, please report it.
            </p>
          </section>
        )}

        <section className="mb-12">
          <GuideSectionHeading id="how">How it works</GuideSectionHeading>
          <ol className="mt-6 space-y-4">
            {CAMPAIGN_STEPS.map((step) => (
              <li
                key={step.n}
                className="flex gap-4 rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--navy)] text-sm font-bold text-white">
                  {step.n}
                </span>
                <div>
                  <h3 className="font-bold text-[var(--navy)]">{step.title}</h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="who">Who can help</GuideSectionHeading>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
            {CAMPAIGN_WHO.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-[var(--muted)]">
            You do not need to register on the site. We only ask for your name and email so we can
            follow up if we need clarification — those details are kept private.
          </p>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="report">Report a number</GuideSectionHeading>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            Use the correction form to select a station and enter the up-to-date custody desk, main
            line, non-emergency number, or address.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/UpdateStation" className="btn-gold no-underline">
              Report a phone number or address
            </Link>
            <Link href="/StationsDirectory" className="btn-outline no-underline">
              Browse station directory
            </Link>
          </div>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="faqs">Frequently asked questions</GuideSectionHeading>
          <GuideFaqs faqs={CAMPAIGN_FAQS} />
        </section>
      </StructuredGuideShell>
    </>
  );
}

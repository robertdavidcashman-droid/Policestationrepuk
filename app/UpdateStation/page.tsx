import { Suspense } from 'react';
import { getAllStations } from '@/lib/data';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { JsonLd } from '@/components/JsonLd';
import { StationsDataContributeCta } from '@/components/StationsDataContributeCta';
import { StationUpdateForm } from '@/components/StationUpdateForm';
import type { StationStub } from '@/components/StationUpdateForm';
import { buildMetadata, breadcrumbSchema, faqPageSchema } from '@/lib/seo';
import { UPDATE_STATION_FAQS } from '@/lib/stations-seo';

export const metadata = buildMetadata({
  title: 'Report Wrong Police Station Phone Number or Address — UK',
  description:
    'Submit an up-to-date custody desk, main line, or non-emergency telephone number for a UK police station. Community corrections are reviewed before publishing.',
  path: '/UpdateStation',
  keywords: [
    'report police station phone number',
    'correct custody suite telephone',
    'police station address correction UK',
  ],
});

export const dynamic = 'force-static';

export default async function UpdateStationPage() {
  const stations = await getAllStations();

  const stubs: StationStub[] = stations.map((s) => ({
    id: s.id,
    name: s.name,
    address: s.address || '',
    postcode: s.postcode || '',
    phone: s.phone || '',
    custodyPhone: s.custodyPhone || '',
    nonEmergencyPhone: s.nonEmergencyPhone || '',
  }));

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Station Directory', url: '/StationsDirectory' },
          { name: 'Report correction', url: '/UpdateStation' },
        ])}
      />
      <JsonLd data={faqPageSchema([...UPDATE_STATION_FAQS])} />

      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Station Directory', href: '/StationsDirectory' },
              { label: 'Report correction' },
            ]}
          />
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Report an up-to-date police station telephone number
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Help keep the UK stations directory accurate. Enter the correct custody desk, main line,
            non-emergency number, or address — we review every submission before it appears on the site.
          </p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-2xl">
          <StationsDataContributeCta variant="slim" className="mb-6" />

          <div className="mb-8 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <svg
              className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
            <div className="text-sm leading-relaxed text-amber-800">
              <p className="font-semibold">How this works</p>
              <p className="mt-1">
                Your suggestion is reviewed by an administrator before it goes live — this protects the
                directory from outdated or malicious changes. Your name and email are kept private.
              </p>
            </div>
          </div>
        </div>

        <Suspense
          fallback={
            <div className="mx-auto max-w-2xl py-12 text-center text-sm text-[var(--muted)]">
              Loading form…
            </div>
          }
        >
          <StationUpdateForm stations={stubs} />
        </Suspense>
      </div>
    </>
  );
}

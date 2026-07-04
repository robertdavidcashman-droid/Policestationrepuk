import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/JsonLd';
import { HomeHero } from '@/components/HomeHero';
import { HomeCustodyNote } from '@/components/HomeCustodyNote';
import { ToolsForRepsSection } from '@/components/ToolsForRepsSection';
import { HomeRecentlyJoined } from '@/components/HomeRecentlyJoined';
import { HomeTrainingResources } from '@/components/HomeTrainingResources';
import { HomeFeaturedCarousel } from '@/components/HomeFeaturedCarousel';
import { RepSpotlight } from '@/components/RepSpotlight';
import { HomeWhyChoose } from '@/components/HomeWhyChoose';
import { HomeTestimonials } from '@/components/HomeTestimonials';
import { HomeBlogPreview } from '@/components/HomeBlogPreview';
import { HomeRegisterCta } from '@/components/HomeRegisterCta';
import { HomeQuickSearch } from '@/components/HomeQuickSearch';
import { HomeStationSearch } from '@/components/HomeStationSearch';
import { HomeTopLocations } from '@/components/HomeTopLocations';
import { HomeCommunityWhatsAppPromo } from '@/components/HomeCommunityWhatsAppPromo';
import { HomeKentSpotlight } from '@/components/HomeKentSpotlight';
import { HomeAIAssistant } from '@/components/HomeAIAssistant';
import { HomeSeoConversionHub } from '@/components/HomeSeoConversionHub';
import { HomeHomepageFaq } from '@/components/HomeHomepageFaq';
import { FeaturedListingAdvert } from '@/components/FeaturedListingAdvert';
import { FeaturedListingFaq } from '@/components/FeaturedListingFaq';
import { DirectoryCredentialVerificationNotice } from '@/components/DirectoryCredentialVerificationNotice';
import { LegalDirectoryPromo } from '@/components/legal-directory/LegalDirectoryPromo';
import { getAllReps, getAllCounties, getFeaturedRepsSorted } from '@/lib/data';
import {
  organizationSchema,
  faqPageSchema,
  directoryServiceLocalBusinessSchema,
} from '@/lib/seo';
import { HOMEPAGE_FAQS } from '@/lib/homepage-faqs';
import { selectTopCountiesForHomepage } from '@/lib/home-top-locations';
import { getStationPhonePublicStats } from '@/lib/station-phone-stats-server';
import { SITE_NAME, SITE_URL, socialPreviewImageUrl } from '@/lib/seo-layer/config';

export const metadata: Metadata = {
  title: 'Find a Police Station Rep — UK Representative Directory',
  description:
    'Free UK directory of police station representatives and station telephone numbers. Search reps by county or station; report updated custody desk numbers. Join free.',
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: 'Find a Police Station Rep — UK Representative Directory',
    description:
      'Free UK directory of accredited police station representatives and station telephone numbers. Search reps by county or station; report updated custody desk numbers.',
    url: SITE_URL,
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_GB',
    images: [
      {
        url: socialPreviewImageUrl(),
        width: 1200,
        height: 630,
        alt: 'Find a police station representative — UK directory',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Find a Police Station Rep — UK Directory',
    description: 'Free directory of police station reps and station phone numbers across England & Wales.',
    images: [socialPreviewImageUrl()],
  },
};

export const dynamic = 'force-dynamic';

const UK_FORCES_COUNT = 42;
const MARKETING_REPS_DISPLAY = 300;
const MARKETING_STATIONS_DISPLAY = 500;

export default async function HomePage() {
  const [reps, counties, featuredReps, phoneStats] = await Promise.all([
    getAllReps(),
    getAllCounties(),
    getFeaturedRepsSorted(),
    getStationPhonePublicStats(),
  ]);
  const topCountiesForLinks = selectTopCountiesForHomepage(counties, reps, 12);
  const directLinesDisplay =
    phoneStats.directLine >= 100 ? `${Math.floor(phoneStats.directLine / 50) * 50}+` : String(phoneStats.directLine);

  return (
    <>
      <JsonLd data={organizationSchema()} />
      <JsonLd data={faqPageSchema(HOMEPAGE_FAQS)} />
      <JsonLd data={directoryServiceLocalBusinessSchema() as Record<string, unknown>} />

      <HomeHero />

      <div className="cv-auto">
        <HomeStationSearch stats={phoneStats} />
      </div>

      {/* Trust stats strip */}
      <section className="border-b border-[var(--border)] bg-white py-8 sm:py-10" aria-label="Site statistics">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 text-center sm:grid-cols-4">
            {[
              { value: `${MARKETING_REPS_DISPLAY}+`, label: 'Registered Reps' },
              { value: `${MARKETING_STATIONS_DISPLAY}+`, label: 'Stations Listed' },
              { value: directLinesDisplay, label: 'Direct Lines' },
              { value: String(UK_FORCES_COUNT), label: 'Police Forces' },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-extrabold leading-none text-[var(--navy)] sm:text-3xl">{s.value}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="cv-auto bg-[var(--navy)]">
        <HomeSeoConversionHub />
      </div>

      <div className="cv-auto">
        <HomeQuickSearch
          counties={counties.map((c) => c.name)}
        />
      </div>

      <HomeCustodyNote />

      <HomeTopLocations counties={topCountiesForLinks} />

      <HomeCommunityWhatsAppPromo />

      <HomeRecentlyJoined reps={reps} />

      {/* Free, fairly-rotating spotlight — placement cannot be bought */}
      <RepSpotlight reps={reps} />

      <div className="cv-auto">
        <LegalDirectoryPromo variant="section" />
      </div>

      <div className="page-container py-8">
        <FeaturedListingAdvert />
        <FeaturedListingFaq className="mt-6" />
      </div>

      {featuredReps.length > 0 && (
        <div className="page-container pt-6 pb-0">
          <DirectoryCredentialVerificationNotice />
        </div>
      )}

      <HomeFeaturedCarousel featuredReps={featuredReps} />

      <HomeKentSpotlight />

      <div className="cv-auto">
        <HomeWhyChoose />
      </div>

      <div className="cv-auto">
        <HomeTestimonials />
      </div>

      <div className="cv-auto">
        <HomeBlogPreview />
      </div>

      <ToolsForRepsSection />

      <div className="cv-auto">
        <HomeTrainingResources />
      </div>

      <div className="cv-auto">
        <HomeRegisterCta />
      </div>

      <div className="cv-auto">
        <HomeHomepageFaq />
      </div>

      <div className="cv-auto">
        <HomeAIAssistant />
      </div>

      {/* Platform disclaimer */}
      <section className="border-t border-[var(--gold)]/20 bg-[var(--gold-pale)] py-4" aria-label="Platform notice">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <p className="text-xs leading-relaxed text-[var(--navy)]/80">
            <strong className="font-bold text-[var(--navy)]">PoliceStationRepUK is a directory</strong> — not a law
            firm, agency, or provider of legal services. It connects criminal defence firms with accredited
            representatives. Any engagement is a direct contract between the instructing firm and the
            representative. Firms retain responsibility for instruction, supervision, and regulatory compliance.{' '}
            <Link href="/About" className="font-semibold text-[var(--navy)] underline">Learn more about the directory</Link>
          </p>
        </div>
      </section>
    </>
  );
}

import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { PsrTrainPromo } from '@/components/PsrTrainPromo';
import { WikiArticleIndex } from '@/components/WikiArticleIndex';
import { buildMetadata } from '@/lib/seo';
import { getAllWikiArticles } from '@/lib/data';

export const metadata = buildMetadata({
  title: 'Premium Guides for Police Station Reps',
  description:
    'Browse 45+ free training articles and guides for police station representatives — professional development, PACE, billing, and more.',
  path: '/Premium',
});

export default async function PremiumPage() {
  const allArticles = await getAllWikiArticles();
  const totalArticles = allArticles.length;

  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Training Guides & Resources' },
            ]}
          />
          <div className="mb-3 mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            FREE WHILST TESTING
          </div>
          <h1 className="text-h1 text-white">Training Guides &amp; Resources</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-white">
            Browse all {totalArticles} training articles and guides — completely free. Each card
            opens the full article in the Rep Knowledge Base. Articles are reference material; partner
            exam prep on PSR Train adds timed practice questions.
          </p>
          <PsrTrainPromo variant="inline" campaign="premium_wiki" className="mt-6 !border-white/20 !bg-white/10 [&_h3]:!text-white [&_p]:!text-slate-200" />
        </div>
      </section>

      <div className="page-container">
        <div className="mb-10 flex flex-wrap gap-3">
          <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
            Beginner
          </span>
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            Intermediate
          </span>
          <span className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
            Advanced
          </span>
        </div>

        <WikiArticleIndex articles={allArticles} variant="cards" />

        <div className="mt-14 border-t border-[var(--border)] pt-10">
          <h2 className="text-h2 text-[var(--navy)]">More Resources</h2>
          <p className="mt-2 text-[var(--muted)]">
            Explore additional resources to support your police station representation practice.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/Resources" className="btn-gold">
              Legal Resources
            </Link>
            <Link href="/FormsLibrary" className="btn-outline">
              Forms Library
            </Link>
            <Link href="/Wiki" className="btn-outline">
              Knowledge base (A–Z)
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

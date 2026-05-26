import Link from 'next/link';
import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { WikiArticleIndex } from '@/components/WikiArticleIndex';
import { CustodyNotePagePromo } from '@/components/CustodyNotePagePromo';
import { buildMetadata } from '@/lib/seo';
import { getAllWikiArticles } from '@/lib/data';

export const metadata: Metadata = buildMetadata({
  title: 'Rep Knowledge Base | PoliceStationRepUK',
  description:
    'Free knowledge base for police station representatives: interview techniques, PACE codes, adverse inference, fitness for interview, digital evidence basics, client management, legal aid claiming, and professional development.',
  path: '/Wiki',
});

export default async function WikiPage() {
  const allArticles = await getAllWikiArticles();
  const totalArticles = allArticles.length;

  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs light items={[{ label: 'Home', href: '/' }, { label: 'Knowledge Base' }]} />
          <div className="mt-3 flex items-center gap-3">
            <h1 className="text-h1 text-white">Rep Knowledge Base</h1>
            <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
              FREE
            </span>
          </div>
          <p className="mt-3 max-w-2xl text-lg text-slate-300">
            {totalArticles} articles covering everything a police station representative needs to
            know — from getting started to advanced interview techniques and legal aid claiming.
          </p>
        </div>
      </section>

      <div className="page-container">
        <CustodyNotePagePromo variant="compact" className="mb-10" />

        <WikiArticleIndex articles={allArticles} variant="list" />

        <section className="mx-auto mt-12 max-w-5xl rounded-[var(--radius-lg)] bg-[var(--navy)] p-8 text-center">
          <h2 className="text-xl font-bold text-white">Want to contribute an article?</h2>
          <p className="mt-2 text-slate-300">
            If you have experience as a police station representative and would like to share
            knowledge with the community, get in touch.
          </p>
          <Link href="/Contact" className="btn-gold mt-5">
            Contact Us
          </Link>
        </section>
      </div>
    </>
  );
}

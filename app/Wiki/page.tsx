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

        <section className="mb-10">
          <h2 className="text-h2 mb-4 text-[var(--navy)]">Featured reference guides</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { href: '/CommonOffencesGuide', label: 'Common Offences Guide', desc: 'Actus reus, mens rea, defences & sentencing' },
              { href: '/BeginnersGuide', label: "Beginner's Guide", desc: 'Custody lifecycle and PACE rights' },
              { href: '/PACE', label: 'PACE Codes', desc: 'Codes A–H summaries' },
              { href: '/Resources', label: 'Knowledge Centre', desc: 'Career guides, forms, and rates' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-4 no-underline shadow-[var(--card-shadow)] transition-all hover:border-[var(--gold)]/40 hover:shadow-[var(--card-shadow-hover)]"
              >
                <p className="font-medium text-[var(--navy)]">{item.label}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{item.desc}</p>
              </Link>
            ))}
          </div>
        </section>

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

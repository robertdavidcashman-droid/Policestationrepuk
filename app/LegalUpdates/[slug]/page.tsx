import '@/styles/prose.css';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ContentReliabilityNotice } from '@/components/ContentReliabilityNotice';
import { buildMetadata } from '@/lib/seo';
import { getAllLegalUpdates, getLegalUpdateBySlug } from '@/lib/data';
import { markdownToHtml } from '@/lib/markdown';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const updates = await getAllLegalUpdates();
  return updates.map((u) => ({ slug: u.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getLegalUpdateBySlug(slug);
  if (!article) return {};
  return buildMetadata({
    title: `${article.title} | Legal Updates`,
    description: article.excerpt,
    path: `/LegalUpdates/${article.slug}`,
  });
}

function categoryColor(cat: string) {
  switch (cat) {
    case 'Legal Updates':
      return 'border-blue-200 bg-blue-50 text-blue-700';
    case 'Practice Tips':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'PACE Updates':
      return 'border-purple-200 bg-purple-50 text-purple-700';
    case 'Fees & Billing':
      return 'border-yellow-200 bg-yellow-50 text-yellow-700';
    default:
      return 'border-gray-200 bg-gray-50 text-gray-700';
  }
}

function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default async function LegalUpdateArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getLegalUpdateBySlug(slug);
  if (!article) notFound();

  const contentHtml = markdownToHtml(article.content);

  return (
    <>
      {/* Navy header */}
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Legal Updates', href: '/LegalUpdates' },
              { label: article.title, href: `/LegalUpdates/${article.slug}` },
            ]}
          />
          <h1 className="mt-4 text-h1 text-white">{article.title}</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-300">
            {article.excerpt}
          </p>

          {/* Meta row */}
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <span
              className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${categoryColor(article.category)}`}
            >
              {article.category}
            </span>
            <span className="text-sm text-[var(--muted)]">
              By {article.author}
            </span>
            <span className="text-sm text-[var(--muted)]">
              {formatDate(article.publishedDate)}
            </span>
            {article.views > 0 && (
              <span className="text-sm text-[var(--muted)]">
                {article.views.toLocaleString()} views
              </span>
            )}
          </div>

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-slate-600 px-2.5 py-0.5 text-xs text-slate-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Article body */}
      <div className="page-container">
        <ContentReliabilityNotice className="mx-auto mb-6 max-w-3xl" />
        <article
          className="wiki-prose mx-auto max-w-3xl"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />

        {/* Back link */}
        <div className="mx-auto mt-12 max-w-3xl border-t border-[var(--border)] pt-8">
          <Link
            href="/LegalUpdates"
            className="text-sm font-medium text-[var(--gold-link)] no-underline hover:underline"
          >
            ← Back to all Legal Updates
          </Link>
        </div>
      </div>
    </>
  );
}

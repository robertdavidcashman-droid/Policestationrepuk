import '@/styles/prose.css';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { marked } from 'marked';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ContentReliabilityNotice } from '@/components/ContentReliabilityNotice';
import { buildMetadata } from '@/lib/seo';
import { getAllWikiArticles, getWikiArticleBySlug, getWikiArticlesByCategory } from '@/lib/data';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const articles = await getAllWikiArticles();
  return articles
    .filter((a) => typeof a.slug === 'string' && a.slug.length > 0)
    .map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getWikiArticleBySlug(slug);
  if (!article) return {};
  return buildMetadata({
    title: `${article.title} | PoliceStationRepUK`,
    description: article.excerpt,
    path: `/Wiki/${article.slug}`,
  });
}

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: 'bg-emerald-100 text-emerald-800',
  Intermediate: 'bg-yellow-100 text-yellow-800',
  Advanced: 'bg-red-100 text-red-800',
};

const FACT_CHECK_LABELS: Record<string, { label: string; className: string }> = {
  verified: { label: 'Fact-Checked', className: 'bg-emerald-100 text-emerald-800' },
  pending: { label: 'Pending Review', className: 'bg-yellow-100 text-yellow-800' },
  unverified: { label: 'Unverified', className: 'bg-slate-100 text-slate-600' },
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function renderMarkdown(content: string): string {
  marked.setOptions({
    gfm: true,
    breaks: false,
  });
  const raw = marked.parse(content) as string;
  return raw
    .replace(/<script[\s>]/gi, '&lt;script ')
    .replace(/<\/script>/gi, '&lt;/script&gt;')
    .replace(/on\w+\s*=/gi, '');
}

export default async function WikiArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getWikiArticleBySlug(slug);
  if (!article) notFound();

  const relatedArticles = (await getWikiArticlesByCategory(article.category))
    .filter((a) => a.slug !== article.slug)
    .slice(0, 5);

  const html = renderMarkdown(article.content);
  const difficulty = DIFFICULTY_COLORS[article.difficulty] ?? 'bg-slate-100 text-slate-700';
  const factCheck = FACT_CHECK_LABELS[article.factCheckStatus] ?? FACT_CHECK_LABELS.unverified;

  return (
    <>
      {/* Navy header */}
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Knowledge Base', href: '/Wiki' },
              { label: article.title },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">{article.title}</h1>
          <p className="mt-3 max-w-3xl text-lg text-white">{article.excerpt}</p>

          {/* Meta pills */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--gold-pale)] px-3 py-1 text-xs font-bold text-[var(--gold-link)]">
              {article.category}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${difficulty}`}>
              {article.difficulty}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${factCheck.className}`}>
              ✓ {factCheck.label}
            </span>
            {article.wordCount > 0 && (
              <span className="rounded-full bg-[var(--navy-light)] px-3 py-1 text-xs font-medium text-white">
                {article.wordCount.toLocaleString()} words
              </span>
            )}
            <span className="rounded-full bg-[var(--navy-light)] px-3 py-1 text-xs font-medium text-white">
              {article.views.toLocaleString()} views
            </span>
            {article.lastImprovedDate && (
              <span className="rounded-full bg-[var(--navy-light)] px-3 py-1 text-xs font-medium text-white">
                Updated {formatDate(article.lastImprovedDate)}
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-5xl lg:grid lg:grid-cols-[1fr_280px] lg:gap-10">
          {/* Article body */}
          <div className="min-w-0">
            <ContentReliabilityNotice className="mb-6" />
            <article
              className="wiki-prose"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>

          {/* Sidebar */}
          <aside className="mt-10 lg:mt-0">
            {/* Article info card */}
            <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white p-5 shadow-[var(--card-shadow)]">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)]">
                Article Info
              </h2>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-[var(--muted)]">Published</dt>
                  <dd className="font-medium text-[var(--navy)]">{formatDate(article.publishedDate)}</dd>
                </div>
                {article.lastImprovedDate && (
                  <div className="flex justify-between">
                    <dt className="text-[var(--muted)]">Last Updated</dt>
                    <dd className="font-medium text-[var(--navy)]">{formatDate(article.lastImprovedDate)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-[var(--muted)]">Difficulty</dt>
                  <dd className="font-medium text-[var(--navy)]">{article.difficulty}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--muted)]">Status</dt>
                  <dd className="font-medium text-[var(--navy)]">{factCheck.label}</dd>
                </div>
              </dl>

              {/* Tags */}
              {article.tags.length > 0 && (
                <div className="mt-5 border-t border-[var(--border)] pt-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)]">Tags</h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {article.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-[var(--card-border)] bg-[var(--gold-pale)] px-2.5 py-0.5 text-xs font-medium text-[var(--navy)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Related articles */}
            {relatedArticles.length > 0 && (
              <div className="mt-6 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white p-5 shadow-[var(--card-shadow)]">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)]">
                  Related Articles
                </h2>
                <ul className="mt-3 space-y-2">
                  {relatedArticles.map((related) => (
                    <li key={related.slug}>
                      <Link
                        href={`/Wiki/${related.slug}`}
                        className="inline-flex items-start gap-1.5 text-sm text-[var(--navy)] no-underline transition-colors hover:text-[var(--gold-hover)]"
                      >
                        <span className="mt-0.5 text-xs text-[var(--gold)]">→</span>
                        {related.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Back to KB */}
            <div className="mt-6">
              <Link
                href="/Wiki"
                className="inline-flex items-center gap-2 rounded-[var(--radius)] bg-[var(--navy)] px-4 py-2.5 text-sm font-semibold text-white no-underline transition-colors hover:bg-[var(--navy)]/90"
              >
                ← Back to Knowledge Base
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

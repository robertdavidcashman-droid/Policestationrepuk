import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { BlogArticleMarkdown } from '@/components/BlogArticleMarkdown';
import { buildMetadata, blogPostingSchema, breadcrumbSchema, faqPageSchema } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import { getAllBlogPosts, getBlogPostBySlug, getFullBlogArticle, getBlogRelatedForSlug } from '@/lib/blog-data';
import { SITE_URL } from '@/lib/seo-layer/config';
import { categoryLabel } from '@/lib/blog/categories';
import type { BlogCategoryId } from '@/lib/blog/types';
import { getTopicClusterForSlug } from '@/lib/blog/topic-clusters';
import { BlogDiscoveryLinks } from '@/components/BlogDiscoveryLinks';
import { BlogAuthorBio } from '@/components/BlogAuthorBio';
import { BlogBottomAd } from '@/components/BlogBottomAd';
import { BlogCustodyNotePromo } from '@/components/BlogCustodyNotePromo';
import { PsrTrainPromo } from '@/components/PsrTrainPromo';
import { prefersPsrTrainBlogPromo } from '@/lib/blog-partner-promo';

export const dynamic = 'force-static';
export const revalidate = false;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllBlogPosts().map((p) => ({ slug: p.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const article = getFullBlogArticle(slug);
  if (!article) return {};
  const imageUrl = `${SITE_URL}${article.image.src}`;
  return buildMetadata({
    title: article.metaTitle,
    description: article.metaDescription,
    path: `/Blog/${slug}`,
    ogType: 'article',
    publishedTime: article.published,
    modifiedTime: article.modified,
    ogImage: {
      url: imageUrl,
      width: article.image.width,
      height: article.image.height,
      alt: article.image.alt,
    },
  });
}

function CategoryPills({ categories }: { categories: BlogCategoryId[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((id) => (
        <Link
          key={id}
          href={`/Blog?cat=${id}`}
          className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold text-white no-underline backdrop-blur-sm transition-colors hover:border-[var(--gold)]/60 hover:bg-white/15"
        >
          {categoryLabel(id)}
        </Link>
      ))}
    </div>
  );
}

export default async function BlogArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  const article = getFullBlogArticle(slug);
  if (!post || !article) notFound();

  const related = getBlogRelatedForSlug(slug, article.relatedSlugs);
  const topicCluster = getTopicClusterForSlug(slug);
  const imageUrl = `${SITE_URL}${article.image.src}`;
  const psrTrainFocus = prefersPsrTrainBlogPromo({
    slug,
    title: article.title,
    primaryKeyword: article.primaryKeyword,
    categories: article.categories,
  });

  const bc = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Blog', url: '/Blog' },
    { name: article.title, url: `/Blog/${slug}` },
  ]);

  const articleSchema = blogPostingSchema({
    title: article.title,
    slug,
    description: article.metaDescription,
    datePublished: article.published,
    dateModified: article.modified,
    imageUrl,
  });

  const faqLd =
    article.faqs && article.faqs.length > 0 ? faqPageSchema(article.faqs.map((f) => ({ q: f.q, a: f.a }))) : null;

  const pub = new Date(article.published);
  const mod = new Date(article.modified);

  return (
    <>
      <JsonLd data={bc} />
      <JsonLd data={articleSchema} />
      {faqLd && <JsonLd data={faqLd} />}
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Blog', href: '/Blog' },
              { label: article.title },
            ]}
          />
          <div className="mt-4">
            <CategoryPills categories={article.categories} />
          </div>
          <h1 className="mt-4 text-h1 text-white">{article.title}</h1>
          <p className="mt-2 text-sm text-slate-300">
            Published{' '}
            <time dateTime={article.published}>{pub.toLocaleDateString('en-GB', { dateStyle: 'long' })}</time>
            {' · '}
            Updated{' '}
            <time dateTime={article.modified}>{mod.toLocaleDateString('en-GB', { dateStyle: 'long' })}</time>
          </p>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-200">{article.summary}</p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-3xl">
          <figure className="mt-8 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[var(--card-shadow)]">
            <Image
              src={article.image.src}
              alt={article.image.alt}
              width={article.image.width}
              height={article.image.height}
              className="h-auto w-full object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
            <figcaption className="px-4 py-2 text-center text-xs text-[var(--muted)]">
              {article.image.alt}
            </figcaption>
          </figure>

          <div className="mt-8 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--gold-pale)] p-5 sm:p-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-[var(--navy)]">At a glance</p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              Primary topic focus: <span className="font-medium text-[var(--navy)]">{article.primaryKeyword}</span>. This
              article is for criminal defence professionals and accredited representatives. It is general information,
              not legal advice.
            </p>
          </div>

          <article className="mt-10">
            <BlogArticleMarkdown markdown={article.bodyMarkdown} />
          </article>

          {psrTrainFocus ? (
            <PsrTrainPromo variant="inline" campaign="blog_article" className="mt-10" />
          ) : (
            <BlogCustodyNotePromo />
          )}

          {article.faqs && article.faqs.length > 0 && (
            <section className="mt-12 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 sm:p-8 shadow-[var(--card-shadow)]">
              <h2 className="text-xl font-bold text-[var(--navy)]">Frequently asked questions</h2>
              <dl className="mt-6 space-y-6">
                {article.faqs.map((f, i) => (
                  <div key={i}>
                    <dt className="font-semibold text-[var(--navy)]">{f.q}</dt>
                    <dd className="mt-2 leading-relaxed text-[var(--muted)]">{f.a}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <section className="mt-12">
            <h2 className="text-lg font-bold text-[var(--navy)]">Related articles</h2>
            <ul className="mt-4 space-y-3">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/Blog/${r.slug}`}
                    className="font-medium text-[var(--gold-link)] no-underline hover:text-[var(--gold)] hover:underline"
                  >
                    {r.title}
                  </Link>
                  <p className="mt-1 text-sm text-[var(--muted)]">{r.excerpt}</p>
                </li>
              ))}
            </ul>
          </section>

          {topicCluster && (
            <section className="mt-12 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--gold-pale)]/40 p-6 sm:p-8">
              <h2 className="text-lg font-bold text-[var(--navy)]">More in this topic cluster</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{topicCluster.title}</p>
              <p className="mt-4">
                <Link
                  href={topicCluster.pillarPath}
                  className="text-sm font-semibold text-[var(--gold-link)] no-underline hover:underline"
                >
                  {topicCluster.pillarLabel} →
                </Link>
              </p>
              <ul className="mt-4 space-y-2">
                {topicCluster.relatedSlugs.map((s) => {
                  const p = getBlogPostBySlug(s);
                  if (!p) return null;
                  return (
                    <li key={s}>
                      <Link
                        href={`/Blog/${s}`}
                        className="text-sm font-medium text-[var(--navy)] no-underline hover:text-[var(--gold-hover)] hover:underline"
                      >
                        {p.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <div className="mt-12">
            <BlogAuthorBio />
          </div>

          <BlogDiscoveryLinks categories={article.categories} />

          <aside className="mt-12 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--navy)] p-6 text-white sm:p-8">
            <h2 className="text-lg font-bold">Need cover or want to be found?</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              PoliceStationRepUK is a free directory connecting criminal defence firms with accredited
              police station representatives across England and Wales. The contract for any work is
              between the instructing firm and the representative.
            </p>
            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
              <Link href="/directory" className="btn-gold inline-flex justify-center !no-underline sm:inline-flex">
                Find reps — directory
              </Link>
              <Link
                href="/register"
                className="inline-flex justify-center rounded-lg border-2 border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white no-underline backdrop-blur-sm transition-colors hover:border-[var(--gold)] hover:bg-white/15 sm:inline-flex"
              >
                Join the directory
              </Link>
              <Link
                href="/PoliceStationCover"
                className="inline-flex justify-center rounded-lg border-2 border-white/30 bg-transparent px-4 py-2.5 text-sm font-semibold text-white no-underline transition-colors hover:border-[var(--gold)] sm:inline-flex"
              >
                Police station cover for firms
              </Link>
            </div>
          </aside>

          <BlogBottomAd />

          <p className="mt-10">
            <Link href="/Blog" className="font-medium text-[var(--gold-link)] no-underline hover:text-[var(--gold)]">
              ← Back to blog
            </Link>
          </p>

          <footer className="mt-10 border-t border-[var(--card-border)] pt-6 text-sm text-[var(--muted)]">
            <p>
              <span className="font-semibold text-[var(--navy)]">PoliceStationRepUK</span> — editorial team. Content is
              for professional readers; it does not create a retainer or adviser–client relationship.
              PoliceStationRepUK is a directory — it does not provide regulated legal services.
            </p>
            <p className="mt-4">
              Need a solicitor or police station agent cover? See{' '}
              <a
                href="https://www.policestationagent.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[var(--gold-link)] underline underline-offset-2 hover:text-[var(--gold)]"
              >
                policestationagent.com
              </a>{' '}
              (separate from this directory).
            </p>
          </footer>
        </div>
      </div>
    </>
  );
}

import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { JsonLd } from '@/components/JsonLd';
import { BlogBottomAd } from '@/components/BlogBottomAd';
import { BlogPartnerToolsPromo } from '@/components/BlogPartnerToolsPromo';
import { buildMetadata, breadcrumbSchema } from '@/lib/seo';
import { getAllBlogPosts } from '@/lib/blog-data';
import { BLOG_CATEGORIES, categoryLabel } from '@/lib/blog/categories';
import type { BlogCategoryId } from '@/lib/blog/types';

export const metadata = buildMetadata({
  title: 'Blog — Police Station Reps & Criminal Defence',
  description:
    'Practical articles for freelance police station reps and criminal defence firms: briefing, attendance, out-of-hours cover, and accreditation.',
  path: '/Blog',
});

const FEATURED_SLUGS = [
  'what-does-a-freelance-police-station-representative-do',
  'how-firms-can-instruct-freelance-police-station-reps',
  'police-station-attendance-checklist',
];

type SearchParams = Promise<{ cat?: string }>;

function isCategory(v: string | undefined): v is BlogCategoryId {
  return !!v && (BLOG_CATEGORIES as { id: BlogCategoryId }[]).some((c) => c.id === v);
}

export default async function BlogPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const catFilter = isCategory(sp.cat) ? sp.cat : null;

  const posts = getAllBlogPosts();
  const featured = FEATURED_SLUGS.map((s) => posts.find((p) => p.slug === s)).filter(Boolean) as typeof posts;
  const filtered = catFilter ? posts.filter((p) => p.categories.includes(catFilter)) : posts;

  const bc = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Blog', url: '/Blog' },
  ]);

  return (
    <>
      <JsonLd data={bc} />
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Blog' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">Police station representation — professional blog</h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-200">
            Practical guidance for <strong className="font-semibold text-white">freelance accredited representatives</strong>{' '}
            and <strong className="font-semibold text-white">criminal defence firms</strong> that instruct outsourced
            police station cover. We focus on briefing quality, attendance discipline, communication, and building
            reliable networks — not generic legal theory.
          </p>
          <p className="mt-4 max-w-2xl text-sm text-slate-300">
            Articles are written in UK English for professional readers. They provide general information, not legal
            advice. Always follow your regulator, insurer, and supervising solicitor requirements on live cases.
          </p>
          <p className="mt-4 text-sm text-slate-400">
            <a href="/rss.xml" className="font-medium text-[var(--gold)] no-underline hover:underline">
              RSS feed
            </a>{' '}
            for syndication and discovery.
          </p>
        </div>
      </section>

      <div className="page-container py-10 sm:py-12">
        <BlogPartnerToolsPromo className="mt-0" />

        <div className="mt-10 flex flex-col gap-3 border-b border-[var(--card-border)] pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--muted)]">Browse by topic</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Filter articles — or view everything below.</p>
          </div>
          <nav aria-label="Blog categories" className="flex flex-wrap gap-2">
            <Link
              href="/Blog"
              className={`rounded-full px-4 py-2 text-sm font-semibold no-underline transition-colors ${
                !catFilter
                  ? 'bg-[var(--navy)] text-white'
                  : 'border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--navy)] hover:border-[var(--gold)]/50'
              }`}
            >
              All articles
            </Link>
            {BLOG_CATEGORIES.map((c) => (
              <Link
                key={c.id}
                href={`/Blog?cat=${c.id}`}
                className={`rounded-full px-4 py-2 text-sm font-semibold no-underline transition-colors ${
                  catFilter === c.id
                    ? 'bg-[var(--navy)] text-white'
                    : 'border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--navy)] hover:border-[var(--gold)]/50'
                }`}
              >
                {c.label}
              </Link>
            ))}
          </nav>
        </div>

        {!catFilter && (
          <section className="mt-10" aria-labelledby="featured-heading">
            <h2 id="featured-heading" className="text-xl font-bold text-[var(--navy)]">
              Featured guides
            </h2>
            <div className="mt-5 grid gap-5 lg:grid-cols-3">
              {featured.map((post) => (
                <Link
                  key={post.slug}
                  href={`/Blog/${post.slug}`}
                  className="group flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] no-underline shadow-[var(--card-shadow)] transition-all hover:-translate-y-0.5 hover:border-[var(--gold)]/40 hover:shadow-[var(--card-shadow-hover)]"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-[var(--navy)]">
                    <Image
                      src={post.image.src}
                      alt={post.image.alt}
                      width={1200}
                      height={675}
                      className="h-full w-full object-cover opacity-95 transition-opacity group-hover:opacity-100"
                      sizes="(max-width: 1024px) 100vw, 33vw"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="font-semibold leading-snug text-[var(--navy)] group-hover:text-[var(--gold-link)]">
                      {post.title}
                    </p>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--muted)]">{post.excerpt}</p>
                    <p className="mt-4 text-xs font-medium text-[var(--gold-link)]">Read article →</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-12" aria-labelledby="all-posts-heading">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="all-posts-heading" className="text-xl font-bold text-[var(--navy)]">
              {catFilter ? `${categoryLabel(catFilter)}` : 'All articles'}
            </h2>
            <p className="text-sm text-[var(--muted)]">
              {filtered.length} article{filtered.length === 1 ? '' : 's'}
              {catFilter ? ` · ` : ''}
              {catFilter ? (
                <Link href="/Blog" className="font-medium text-[var(--gold-link)] hover:underline">
                  Clear filter
                </Link>
              ) : null}
            </p>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((post) => (
              <Link
                key={post.slug}
                href={`/Blog/${post.slug}`}
                className="group flex flex-col overflow-hidden rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] no-underline shadow-[var(--card-shadow)] transition-all hover:-translate-y-0.5 hover:border-[var(--gold)]/40 hover:shadow-[var(--card-shadow-hover)]"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-[var(--navy)]">
                  <Image
                    src={post.image.src}
                    alt={post.image.alt}
                    width={768}
                    height={432}
                    className="h-full w-full object-cover opacity-95 transition-opacity group-hover:opacity-100"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    loading="lazy"
                  />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <time
                    dateTime={post.published}
                    className="text-xs font-medium uppercase tracking-wide text-[var(--gold-link)]"
                  >
                    {new Date(post.published).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </time>
                  <p className="mt-2 font-semibold leading-snug text-[var(--navy)] group-hover:text-[var(--gold-link)]">
                    {post.title}
                  </p>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--muted)]">{post.excerpt}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {post.categories.map((id) => (
                      <span
                        key={id}
                        className="rounded-full bg-[var(--gold-pale)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--navy)]"
                      >
                        {categoryLabel(id)}
                      </span>
                    ))}
                  </div>
                  <p className="mt-4 text-xs font-medium text-[var(--gold-link)]">Read article →</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <div className="mt-14">
          <BlogBottomAd />
        </div>

        <div className="mt-10 grid gap-6 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 sm:grid-cols-2 sm:p-8">
          <div>
            <h2 className="text-lg font-bold text-[var(--navy)]">For firms needing cover</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              Search accredited representatives by area, browse custody-focused guides, or read how firms build
              out-of-hours panels.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Link href="/directory" className="btn-gold inline-flex justify-center !px-4 !py-2.5 !text-sm !no-underline">
                Directory
              </Link>
              <Link
                href="/PoliceStationCover"
                className="inline-flex justify-center rounded-lg border-2 border-[var(--navy)]/15 px-4 py-2.5 text-sm font-semibold text-[var(--navy)] no-underline hover:border-[var(--gold-hover)]"
              >
                Firm cover
              </Link>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--navy)]">For freelance representatives</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              List accurate coverage and accreditation so firms can instruct with confidence. Update your profile when
              your hours or counties change.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Link href="/register" className="btn-gold inline-flex justify-center !px-4 !py-2.5 !text-sm !no-underline">
                Register free
              </Link>
              <Link
                href="/GetWork"
                className="inline-flex justify-center rounded-lg border-2 border-[var(--navy)]/15 px-4 py-2.5 text-sm font-semibold text-[var(--navy)] no-underline hover:border-[var(--gold-hover)]"
              >
                Get work
              </Link>
              <Link
                href="/RepsHub"
                className="inline-flex justify-center rounded-lg border-2 border-[var(--navy)]/15 px-4 py-2.5 text-sm font-semibold text-[var(--navy)] no-underline hover:border-[var(--gold-hover)]"
              >
                Reps hub
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

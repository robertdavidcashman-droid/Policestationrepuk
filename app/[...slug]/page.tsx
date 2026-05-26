import '@/styles/prose.css';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getMirrorPage, getMirrorPaths, hasMirrorData } from '@/lib/mirror-data';
import { getLiveSiteMultiSegmentPaths } from '@/lib/live-site-paths';
import { isUsableBlogMirror, resolveBlogArticle } from '@/lib/blog-article-resolve';
import { normalizeDirectoryNavPath } from '@/lib/internal-link-normalize';

const SITE_TITLE = 'PoliceStationRepUK';

const MAIN_LINKS = [
  { href: '/', text: 'Home' },
  { href: '/directory', text: 'Find a Rep' },
  { href: '/search', text: 'Search directory' },
  { href: '/CustodyNote', text: 'Custody Note' },
  { href: '/register', text: 'Register' },
  { href: '/Contact', text: 'Contact' },
  { href: '/About', text: 'About' },
  { href: '/Resources', text: 'Resources' },
  { href: '/StationsDirectory', text: 'Stations' },
  { href: '/FAQ', text: 'FAQ' },
  { href: '/Privacy', text: 'Privacy' },
  { href: '/Terms', text: 'Terms' },
];

/** Human-readable title for multi-segment path (e.g. Blog/My-Post) */
function multiPathToTitle(pathNorm: string): string {
  return pathNorm
    .replace(/\//g, ' ')
    .replace(/-/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^\s+/, '')
    .replace(/\s+/g, ' ')
    .trim() || pathNorm;
}

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export const dynamic = 'force-static';
export const revalidate = false;

/** Pre-render multi-segment paths from mirror and live-site-map; rest on demand. */
export function generateStaticParams() {
  const mirrorPaths = hasMirrorData() ? getMirrorPaths().filter((p) => p !== '/' && p.includes('/')) : [];
  const liveMulti = getLiveSiteMultiSegmentPaths();
  const pathStrings = Array.from(new Set([...mirrorPaths.map((p) => p.replace(/^\//, '')), ...liveMulti]));
  return pathStrings.map((pathNorm) => ({ slug: pathNorm.split('/') }));
}

export const dynamicParams = true;

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const pathStr = '/' + slug.join('/');
  const mirror = getMirrorPage(pathStr);
  const pathNorm = slug.join('/');
  const isBlog = slug[0]?.toLowerCase() === 'blog';
  const blogKey = isBlog ? slug.slice(1).join('/') : '';

  let title =
    mirror?.title?.replace(/\s*\|\s*.*$/, '').trim() ||
    multiPathToTitle(pathNorm);
  let description =
    (mirror && isUsableBlogMirror(mirror) ? mirror.content?.slice(0, 150) : null) ||
    `${title} — ${SITE_TITLE}. Police station representatives directory.`;

  if (isBlog && blogKey && (!mirror || !isUsableBlogMirror(mirror))) {
    const fb = resolveBlogArticle(pathStr, blogKey);
    if (fb.kind === 'fallback') {
      title = fb.data.title;
      description = `${fb.data.intro.slice(0, 150)}…`;
    }
  }

  if (description.length > 155) {
    const cut = description.lastIndexOf(' ', 154);
    description = (cut > 80 ? description.slice(0, cut) : description.slice(0, 154)) + '…';
  }

  return {
    title: `${title} | ${SITE_TITLE}`,
    description,
    alternates: { canonical: pathStr },
  };
}

function Heading({ level, text }: { level: number; text: string }) {
  const Tag = `h${Math.min(level, 6)}` as 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  const styles: Record<number, string> = {
    2: 'text-2xl font-bold mt-10 mb-4 pb-2 border-b-2 border-[var(--gold-pale)] text-[var(--navy)]',
    3: 'text-xl font-semibold mt-8 mb-3 text-[var(--navy)]',
    4: 'text-lg font-semibold mt-6 mb-2 text-[var(--navy)]',
    5: 'text-base font-semibold mt-5 mb-2 text-[var(--navy)]',
    6: 'text-sm font-bold mt-4 mb-2 uppercase tracking-wide text-[var(--muted)]',
  };
  return (
    <Tag className={`tracking-tight first:mt-0 ${styles[Math.min(level, 6)] || styles[4]}`}>
      {text}
    </Tag>
  );
}

function sanitizeSiteLink(href: string): string | null {
  if (!href || href.startsWith('mailto:') || href.startsWith('tel:')) return null;
  if (href.startsWith('http') && !href.includes('policestationrepuk')) return null;
  try {
    if (href.startsWith('http')) {
      const u = new URL(href);
      return normalizeDirectoryNavPath(u.pathname + (u.search || ''));
    }
  } catch {
    return null;
  }
  const raw = href.startsWith('/') ? href : `/${href}`;
  return normalizeDirectoryNavPath(raw.split('#')[0]);
}

const INTERNAL_NAV = [
  { href: '/directory', text: 'Find a representative' },
  { href: '/search', text: 'Search directory' },
  { href: '/Resources', text: 'Resources' },
  { href: '/Wiki', text: 'Rep Wiki' },
  { href: '/LegalUpdates', text: 'Legal updates' },
  { href: '/Contact', text: 'Contact' },
];

export default async function CatchAllSlugPage({ params }: PageProps) {
  const { slug } = await params;
  const pathStr = '/' + slug.join('/');
  const pathNorm = slug.join('/');

  const mirror = getMirrorPage(pathStr);

  const mirrorPaths = hasMirrorData() ? getMirrorPaths().filter((p) => p !== '/' && p.includes('/')) : [];
  const liveMulti = getLiveSiteMultiSegmentPaths();
  const allowedPaths = Array.from(new Set([...mirrorPaths.map((p) => p.replace(/^\//, '')), ...liveMulti]));
  if (!allowedPaths.includes(pathNorm)) notFound();

  const isBlog = slug[0]?.toLowerCase() === 'blog';
  const blogKey = isBlog ? slug.slice(1).join('/') : '';

  if (isBlog && blogKey) {
    const resolved = resolveBlogArticle(pathStr, blogKey);

    if (resolved.kind === 'fallback') {
      const { data } = resolved;
      return (
      <div className="page-container">
        <div className="mx-auto max-w-3xl">
          <p className="mb-6 text-sm text-[var(--muted)]">
            <Link href="/Blog" className="font-medium text-[var(--accent)] no-underline hover:underline">
              ← Back to Blog
            </Link>
          </p>
          <figure className="mb-8 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--card-border)] shadow-[var(--card-shadow)]">
            <Image
              src="/blog-feature.svg"
              alt="PoliceStationRepUK article illustration"
              width={1200}
              height={630}
              sizes="(max-width: 768px) 100vw, 48rem"
              className="h-auto w-full"
              priority
            />
          </figure>
          <header className="mb-8">
            <h1 className="text-h1 text-[var(--foreground)]">{data.title}</h1>
            <p className="mt-3 text-sm text-[var(--muted)]">Professional guide · PoliceStationRepUK</p>
          </header>
          <article className="content-section">
            <div className="mb-8 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)] sm:p-8">
              <p className="leading-[1.8] text-[var(--muted)]">{data.intro}</p>
            </div>
            {data.sections.map((sec, idx) => (
              <section
                key={idx}
                className="mb-6 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)] sm:p-8"
              >
                <h2 className="text-2xl font-bold text-[var(--navy)]">{sec.heading}</h2>
                <div className="mt-4 space-y-4 leading-[1.8] text-[var(--muted)]">
                  {sec.paragraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </section>
            ))}
          </article>
          <nav className="mt-14 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)]" aria-label="Related on this site">
            <p className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">On this site</p>
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
              {INTERNAL_NAV.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm font-medium text-[var(--foreground)] no-underline hover:text-[var(--accent)] hover:underline">
                    {link.text}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
      );
    }
  }

  const page = mirror && !mirror.error ? mirror : null;
  const title = page?.headings?.[0]?.text ?? multiPathToTitle(pathNorm);
  const rawLinks = page?.links ?? [];
  const mapped = rawLinks
    .map((l) => {
      const h = sanitizeSiteLink(l.href);
      return h ? { href: h, text: l.text || h } : null;
    })
    .filter(Boolean) as { href: string; text: string }[];
  const links = mapped.length > 0 ? mapped : MAIN_LINKS.map((l) => ({ href: l.href, text: l.text }));

  if (page && !('error' in page && page.error) && (!isBlog || isUsableBlogMirror(page))) {
    const h1 = page.headings?.find((h) => h.level === 1)?.text ?? title;
    const subHeadings = page.headings?.filter((h) => h.level > 1) ?? [];
    const contentParagraphs = page.content
      .split(/\n{2,}/)
      .map((p: string) => p.trim())
      .filter(Boolean);
    const chunkSize = subHeadings.length > 0
      ? Math.ceil(contentParagraphs.length / (subHeadings.length + 1))
      : contentParagraphs.length;

    return (
      <div className="page-container">
        <div className="mx-auto max-w-3xl">
          {isBlog && (
            <p className="mb-6 text-sm text-[var(--muted)]">
              <Link href="/Blog" className="font-medium text-[var(--accent)] no-underline hover:underline">
                ← Back to Blog
              </Link>
            </p>
          )}
          <header className="mb-8">
            <h1 className="text-h1 text-[var(--foreground)]">{h1}</h1>
            {isBlog && (
              <p className="mt-3 text-sm text-[var(--muted)]">Published on PoliceStationRepUK</p>
            )}
          </header>

          {isBlog && (!('images' in page) || !Array.isArray(page.images) || page.images.length === 0) && (
            <figure className="mb-8 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--card-border)] shadow-[var(--card-shadow)]">
            <Image
              src="/blog-feature.svg"
              alt="PoliceStationRepUK article illustration"
              width={1200}
              height={630}
              sizes="(max-width: 768px) 100vw, 48rem"
              className="h-auto w-full"
            />
            </figure>
          )}

          <article className="content-section">
            {subHeadings.length > 0 ? (
              <>
                {contentParagraphs.length > 0 && chunkSize > 0 && (
                  <div className="mb-6 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)] sm:p-8">
                    <div className="space-y-4 leading-[1.8] text-[var(--muted)]">
                      {contentParagraphs.slice(0, chunkSize).map((p: string, i: number) => (
                        <p key={i} className="whitespace-pre-line">{p}</p>
                      ))}
                    </div>
                  </div>
                )}
                {subHeadings.map((h, idx) => {
                  const start = chunkSize * (idx + 1);
                  const end = chunkSize * (idx + 2);
                  const sectionParas = contentParagraphs.slice(start, end);
                  return (
                    <section key={idx} className="mb-6 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)] sm:p-8">
                      <Heading level={h.level} text={h.text} />
                      {sectionParas.length > 0 && (
                        <div className="mt-3 space-y-4 leading-[1.8] text-[var(--muted)]">
                          {sectionParas.map((p: string, i: number) => (
                            <p key={i} className="whitespace-pre-line">{p}</p>
                          ))}
                        </div>
                      )}
                    </section>
                  );
                })}
              </>
            ) : (
              <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)] sm:p-8">
                <div className="space-y-5 leading-[1.8] text-[var(--muted)]">
                  {contentParagraphs.map((p: string, i: number) => (
                    <p key={i} className="whitespace-pre-line">{p}</p>
                  ))}
                </div>
              </div>
            )}
          </article>

          {'images' in page && Array.isArray(page.images) && page.images.length > 0 && (
            <section className="mt-10 grid gap-6 sm:grid-cols-2" aria-label="Images">
              {page.images.map((img: { src: string; alt: string }, i: number) => (
                <figure key={i} className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--card-border)] shadow-[var(--card-shadow)]">
                  <Image
                    src={img.src}
                    alt={img.alt || `Image for this page`}
                    width={600}
                    height={256}
                    loading="lazy"
                    className="h-64 w-full object-cover"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                  {img.alt && (
                    <figcaption className="border-t border-[var(--border)] p-3 text-sm text-[var(--muted)]">
                      {img.alt}
                    </figcaption>
                  )}
                </figure>
              ))}
            </section>
          )}

          <nav className="mt-14 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)]" aria-label="Site links">
            <p className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">Quick links</p>
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
              {links.slice(0, 16).map((link, i) => (
                <li key={`${link.href}-${i}`}>
                  <Link
                    href={link.href}
                    className="text-sm font-medium text-[var(--foreground)] no-underline transition-colors hover:text-[var(--accent)] hover:underline"
                  >
                    {link.text || link.href}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10">
          <h1 className="text-h1 text-[var(--foreground)]">{multiPathToTitle(pathNorm)}</h1>
        </header>
        <section className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)] sm:p-8">
          <p className="leading-relaxed text-[var(--muted)]">
            This page is part of the PoliceStationRepUK site. Content is being updated. Use the links below to find a rep, register, or get in touch.
          </p>
        </section>
        <nav className="mt-14 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)]" aria-label="Site links">
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">Quick links</p>
          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            {MAIN_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm font-medium text-[var(--foreground)] no-underline transition-colors hover:text-[var(--accent)] hover:underline"
                >
                  {link.text}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}

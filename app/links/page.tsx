import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { JsonLd } from '@/components/JsonLd';
import { CopyLinkButton } from '@/components/CopyLinkButton';
import { LINKS_HUB_SECTIONS } from '@/lib/links-hub';
import { buildMetadata, breadcrumbSchema } from '@/lib/seo';
import { SITE_URL } from '@/lib/seo-layer/config';

export const metadata = buildMetadata({
  title: 'Quick Links — PoliceStationRepUK & Partner Sites',
  description:
    'Short links to find a police station rep, join WhatsApp, register on the directory, and our partner sites Custody Note, PSR Train, and Police Station Agent.',
  path: '/links',
});

export default function LinksHubPage() {
  const hubUrl = `${SITE_URL}/links`;
  const bc = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Quick Links', url: '/links' },
  ]);

  return (
    <>
      <JsonLd data={bc} />
      <section className="bg-[var(--navy)] pb-10 pt-8 sm:pb-12 sm:pt-10">
        <div className="page-container !py-0">
          <Breadcrumbs light items={[{ label: 'Home', href: '/' }, { label: 'Quick Links' }]} />
          <h1 className="mt-4 text-h1 text-white">Quick links</h1>
          <p className="mt-3 max-w-2xl text-lg text-white/90">
            One page for your bio, email signature, or business card — directory, community, and our
            partner sites.
          </p>
          <div className="mt-5 max-w-md">
            <CopyLinkButton
              url={hubUrl}
              label="Copy this page link"
              copiedLabel="Copied!"
              shareTitle="PoliceStationRepUK — quick links"
              shareText="PoliceStationRepUK — find reps, join the community, and useful links:"
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            />
          </div>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-2xl space-y-10 py-10">
          {LINKS_HUB_SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-bold text-[var(--navy)]">{section.title}</h2>
              <ul className="mt-4 space-y-3">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
                      {item.external ? (
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-base font-semibold text-[var(--navy)] no-underline hover:text-[var(--gold-link)]"
                        >
                          {item.label} ↗
                        </a>
                      ) : (
                        <Link
                          href={item.href}
                          className="text-base font-semibold text-[var(--navy)] no-underline hover:text-[var(--gold-link)]"
                        >
                          {item.label}
                        </Link>
                      )}
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <p className="text-sm text-slate-500">
            Short county URLs use <code className="rounded bg-slate-200 px-1.5 py-0.5 text-sm text-slate-800">/go/kent</code> style paths.
            Main directory shortcut:{' '}
            <Link href="/find" className="font-medium text-[var(--gold-link)]">
              {SITE_URL}/find
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}

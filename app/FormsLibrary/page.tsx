import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';
import { getAllFormDocuments } from '@/lib/data';
import { CustodyNotePagePromo } from '@/components/CustodyNotePagePromo';
import type { FormDocument } from '@/lib/types';

export const metadata = buildMetadata({
  title: 'PDF Forms Library for Police Station Representatives',
  description:
    'Access all CRM criminal legal aid forms and LAA billing forms. We link directly to official GOV.UK sources so you always get the latest versions.',
  path: '/FormsLibrary',
});

function FormCard({ form }: { form: FormDocument }) {
  return (
    <div className="flex flex-col rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]">
      <div className="mb-3 flex items-center gap-2">
        {form.isFeatured && (
          <span className="rounded bg-[var(--gold)]/10 px-2 py-0.5 text-xs font-bold text-[var(--gold-link)]">
            Featured
          </span>
        )}
      </div>
      <p className="font-medium text-[var(--navy)]">{form.title}</p>
      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-[var(--muted)]">{form.description}</p>
      <a
        href={form.fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 text-xs font-medium text-[var(--gold-link)] no-underline hover:underline"
      >
        Download / View Form →
      </a>
    </div>
  );
}

export default async function FormsLibraryPage() {
  const forms = await getAllFormDocuments();

  const grouped: Record<string, FormDocument[]> = {};
  for (const form of forms) {
    const cat = form.category || 'Other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(form);
  }

  const categoryDescriptions: Record<string, string> = {
    'Legal Aid Application': 'Forms for applying for criminal legal aid, advice, assistance, and reviews.',
    'Billing & Payments': 'Forms for claiming payment, requesting prior authority, and fee applications.',
    'Client & Case Management': 'Forms and templates for managing clients and case records.',
    Other: 'Additional forms and documents.',
  };

  const categoryOrder = ['Legal Aid Application', 'Billing & Payments', 'Client & Case Management', 'Other'];
  const sortedCategories = Object.keys(grouped).sort(
    (a, b) => (categoryOrder.indexOf(a) === -1 ? 99 : categoryOrder.indexOf(a)) - (categoryOrder.indexOf(b) === -1 ? 99 : categoryOrder.indexOf(b))
  );

  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Forms Library', href: '/FormsLibrary' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">Criminal Legal Aid Forms</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-300">
            Access all CRM forms and documents via official GOV.UK sources. We link directly so you
            always get the latest versions.
          </p>
          <a
            href="https://www.gov.uk/government/collections/criminal-legal-aid-forms"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-500 px-4 py-2 text-sm font-medium text-white no-underline transition-colors hover:border-[var(--gold)] hover:text-[var(--gold)]"
          >
            Browse all forms on GOV.UK ↗
          </a>
        </div>
      </section>

      <div className="page-container">
        <CustodyNotePagePromo variant="full" className="mb-10" />

        {sortedCategories.map((category) => (
          <section key={category} className="mb-12">
            <h2 className="text-h2 mb-2 text-[var(--navy)]">{category}</h2>
            <p className="mb-6 text-sm text-[var(--muted)]">
              {categoryDescriptions[category] ?? ''}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {grouped[category].map((form) => (
                <FormCard key={form.id} form={form} />
              ))}
            </div>
          </section>
        ))}

        {/* Additional Resources */}
        <section className="border-t border-[var(--border)] pt-10">
          <h2 className="text-h2 mb-6 text-[var(--navy)]">Additional Resources</h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <Link
              href="/StationsDirectory"
              className="block rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 no-underline shadow-[var(--card-shadow)] hover:border-[var(--gold)]/40"
            >
              <p className="font-medium text-[var(--navy)]">📞 Station Phone Numbers</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Find contact details for any UK police station
              </p>
            </Link>
            <Link
              href="/Resources"
              className="block rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 no-underline shadow-[var(--card-shadow)] hover:border-[var(--gold)]/40"
            >
              <p className="font-medium text-[var(--navy)]">🌐 Legal Resources</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                PACE codes, CPS guidance, and more
              </p>
            </Link>
            <Link
              href="/CustodyNote"
              className="block rounded-[var(--radius)] border border-[var(--gold)]/40 bg-[var(--gold-pale)] p-5 no-underline shadow-[var(--card-shadow)] hover:border-[var(--gold)]"
            >
              <p className="font-medium text-[var(--navy)]">Custody Note software</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Structured digital attendance notes — Windows and Mac
              </p>
            </Link>
            <Link
              href="/directory"
              className="block rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 no-underline shadow-[var(--card-shadow)] hover:border-[var(--gold)]/40"
            >
              <p className="font-medium text-[var(--navy)]">🔍 Find a Rep</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Search our directory of accredited reps
              </p>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}

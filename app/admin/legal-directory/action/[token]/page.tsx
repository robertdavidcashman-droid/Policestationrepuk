import Link from 'next/link';
import { peekLegalDirectoryAdminToken } from '@/lib/legal-directory/admin-action-token';
import { getListingById } from '@/lib/legal-directory/storage';
import { formatListingDetailsHtml } from '@/lib/legal-directory/listing-email-html';
import { LegalDirectoryTokenEditForm } from '@/components/legal-directory/LegalDirectoryTokenEditForm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function LegalDirectoryActionPage({ params }: PageProps) {
  const { token } = await params;
  const peek = await peekLegalDirectoryAdminToken(token);

  if (!peek.ok) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
          <h1 className="text-xl font-bold text-amber-900">Link unavailable</h1>
          <p className="mt-3 text-sm text-amber-900/90">{peek.error}</p>
          <Link
            href="/admin/legal-directory"
            className="mt-6 inline-block rounded-lg bg-amber-900 px-5 py-2.5 text-sm font-semibold text-white no-underline hover:bg-amber-800"
          >
            Open admin
          </Link>
        </div>
      </main>
    );
  }

  const listing = await getListingById(peek.payload.listingId);
  if (!listing || listing.status === 'deleted') {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-slate-900">Listing not found</h1>
        <p className="mt-2 text-sm text-slate-600">This listing may already have been removed.</p>
      </main>
    );
  }

  if (peek.payload.action === 'amend') {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Legal Services Directory — admin
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Amend listing</h1>
        <p className="mt-2 text-sm text-slate-600">
          Update <strong>{listing.businessName}</strong>. Changes publish immediately.
        </p>
        <div className="mt-8">
          <LegalDirectoryTokenEditForm listing={listing} token={token} />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Legal Services Directory — admin
      </p>
      <h1 className="mt-1 text-2xl font-bold text-slate-900">Delete listing</h1>
      <p className="mt-2 text-sm text-slate-600">
        Confirm removal of <strong>{listing.businessName}</strong> from the public directory.
      </p>

      <section
        className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        dangerouslySetInnerHTML={{ __html: formatListingDetailsHtml(listing) }}
      />

      <form
        method="POST"
        action="/api/admin/legal-directory/action"
        className="mt-6 rounded-xl border-2 border-red-200 bg-red-50 p-5"
      >
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="action" value="delete" />
        <p className="text-sm text-red-900">
          This removes the listing from public search. The record is kept as deleted for audit.
        </p>
        <button
          type="submit"
          className="mt-4 inline-block rounded-lg border border-red-800 bg-red-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-800"
        >
          Confirm delete
        </button>
        <Link
          href="/admin/legal-directory"
          className="ml-3 inline-block rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 no-underline hover:border-slate-400"
        >
          Cancel
        </Link>
      </form>
    </main>
  );
}

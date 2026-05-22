import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{ ok?: string; detail?: string }>;
}

const ERROR_MESSAGES: Record<string, string> = {
  'missing-token': 'No decision token was supplied.',
  'invalid-token':
    'The decision link could not be verified. The signature is invalid or the token secret has been rotated.',
  'expired-or-already-used':
    'This decision link has already been used or has expired. If the rep is still in the queue, action them from /admin instead.',
  'token-storage-unavailable':
    'Storage is temporarily unavailable. Please try again, or action this decision from /admin.',
  'review-write-failed':
    'Could not write the review record. Please retry from /admin so the change definitely persists.',
};

export default async function DecisionResultPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const ok = sp?.ok ?? 'error';
  const detail = sp?.detail;

  if (ok === 'approved') {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <h1 className="text-2xl font-bold text-emerald-900">Approved &amp; published</h1>
          <p className="mt-3 text-sm text-emerald-900/90">
            {detail ? <strong>{detail}</strong> : 'The rep'} has been marked as
            verified, admin-approved and publicly visible. The directory will pick
            this up on the next ISR refresh (within 60 seconds).
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/admin"
              className="inline-block rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white no-underline hover:bg-emerald-800"
            >
              Back to admin
            </Link>
            <Link
              href="/directory"
              className="inline-block rounded-lg border border-emerald-300 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-900 no-underline hover:border-emerald-400"
            >
              View directory
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (ok === 'declined') {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
          <h1 className="text-2xl font-bold text-rose-900">Declined</h1>
          <p className="mt-3 text-sm text-rose-900/90">
            {detail ? <strong>{detail}</strong> : 'The rep'} has been marked as
            rejected and will not appear in the directory. A polite &ldquo;we could not
            list your profile&rdquo; email has been sent to the applicant. The{' '}
            <code>newrep:</code> row was kept for audit, so you can re-approve from{' '}
            <Link href="/admin" className="font-semibold text-rose-900 underline">
              /admin
            </Link>{' '}
            if needed.
          </p>
          <Link
            href="/admin"
            className="mt-6 inline-block rounded-lg bg-rose-800 px-5 py-2.5 text-sm font-semibold text-white no-underline hover:bg-rose-900"
          >
            Back to admin
          </Link>
        </div>
      </main>
    );
  }

  const message =
    (detail && ERROR_MESSAGES[detail]) ||
    'The decision link could not be processed.';

  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
        <h1 className="text-xl font-bold text-amber-900">Could not action decision</h1>
        <p className="mt-3 text-sm text-amber-900/90">{message}</p>
        <Link
          href="/admin"
          className="mt-6 inline-block rounded-lg bg-amber-900 px-5 py-2.5 text-sm font-semibold text-white no-underline hover:bg-amber-800"
        >
          Open admin queue
        </Link>
      </div>
    </main>
  );
}

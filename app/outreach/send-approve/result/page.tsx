import Link from 'next/link';

interface PageProps {
  searchParams: Promise<{ sent?: string; skipped?: string; errors?: string; detail?: string }>;
}

export default async function SendApproveResultPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const detail = params.detail?.trim();

  if (detail === 'in-progress') {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-blue-900">Send in progress</h1>
        <p className="mt-3 text-sm text-slate-600">
          Your batch is already being sent. This can take a few minutes — check your inbox
          for the confirmation email, or open the admin dashboard.
        </p>
        <Link href="/admin/firm-outreach" className="mt-6 inline-block text-blue-700 font-semibold">
          Open admin dashboard
        </Link>
      </main>
    );
  }

  if (detail === 'missing-token' || detail === 'invalid-token' || detail === 'expired-or-already-used') {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-amber-900">Send not completed</h1>
        <p className="mt-3 text-sm text-slate-600">
          {detail === 'expired-or-already-used'
            ? 'This link has already been used or has expired.'
            : 'The send request could not be verified.'}
        </p>
        <Link href="/admin/firm-outreach" className="mt-6 inline-block text-blue-700 font-semibold">
          Open admin dashboard
        </Link>
      </main>
    );
  }

  if (detail === 'send-disabled' || detail === 'send-failed') {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-red-800">Send blocked</h1>
        <p className="mt-3 text-sm text-slate-600">
          Outreach sends are disabled or the batch failed. Check the admin dashboard and
          Vercel logs.
        </p>
        <Link href="/admin/firm-outreach" className="mt-6 inline-block text-blue-700 font-semibold">
          Open admin dashboard
        </Link>
      </main>
    );
  }

  const sent = Number(params.sent ?? 0);
  const skipped = Number(params.skipped ?? 0);
  const errors = Number(params.errors ?? 0);

  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-xl font-bold text-emerald-900">Batch complete</h1>
      <p className="mt-3 text-sm text-slate-700">
        Sent <strong>{sent}</strong> email(s).
        {skipped > 0 ? ` Skipped ${skipped}.` : ''}
        {errors > 0 ? ` Errors ${errors}.` : ''}
      </p>
      <p className="mt-2 text-sm text-slate-500">A confirmation email has been sent to you.</p>
      <Link
        href="/admin/firm-outreach"
        className="mt-6 inline-block rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white no-underline hover:bg-emerald-600"
      >
        Open admin dashboard
      </Link>
    </main>
  );
}

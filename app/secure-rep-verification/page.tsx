import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export const dynamic = 'force-dynamic';

export default function SecureRepVerificationLandingPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  return <ResolvePage searchParams={searchParams} />;
}

async function ResolvePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = (params.token || '').trim();

  return (
    <section className="bg-slate-50 py-10">
      <div className="page-container">
        <div className="mx-auto max-w-3xl">
          <Breadcrumbs
            items={[{ label: 'Home', href: '/' }, { label: 'Secure verification' }]}
          />

          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
            <p className="text-xs font-bold uppercase tracking-widest">Private — admin invite only</p>
            <h1 className="mt-2 text-h2 text-amber-900">Secure Verification</h1>
            <p className="mt-3 text-sm leading-relaxed">
              This is a private verification form. Information submitted here is used to verify your
              identity, accreditation status and suitability for inclusion in the PoliceStationRepUK
              directory. Your address, PIN number, uploaded documents and verification material
              will <strong>not</strong> be published in the public directory.
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-[var(--navy)]">How to access this form</h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              The secure verification form is only available via a private link issued by the
              PoliceStationRepUK admin team after they review your initial enquiry. We do not
              publish the link, and this page is excluded from search engines.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              If you have <strong>not</strong> received an invitation:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm leading-relaxed text-[var(--muted)]">
              <li>
                Submit an enquiry via the{' '}
                <Link href="/register" className="text-[var(--gold-link)] underline">
                  public application form
                </Link>
                .
              </li>
              <li>The admin team will email a private verification link if you are eligible.</li>
              <li>
                If you have already submitted an enquiry but not yet heard back, please{' '}
                <Link href="/Contact" className="text-[var(--gold-link)] underline">
                  contact us
                </Link>
                .
              </li>
            </ul>

            {token ? (
              <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <p className="font-semibold">That token is invalid, expired, or already used.</p>
                <p className="mt-1">
                  Please request a new verification link from the admin team. Tokens are
                  single-use and expire after 30 days. Visit the token URL directly from the
                  admin email &mdash; do not share it.
                </p>
              </div>
            ) : null}

            <p className="mt-6 text-xs text-[var(--muted)]">
              Note: PoliceStationRepUK only lists fully accredited PSRAS police station
              representatives, duty solicitors and solicitors. We do not accept probationary
              representatives, trainees, students or any unaccredited applicants.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

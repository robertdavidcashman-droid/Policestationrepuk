import { notFound, redirect } from 'next/navigation';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { previewVerificationToken } from '@/lib/rep-verification';
import { SecureVerificationForm } from './SecureVerificationForm';
import { turnstileSiteKey } from '@/lib/turnstile';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function TokenVerificationPage({ params }: PageProps) {
  const { token } = await params;
  if (!token || token.length < 16 || token.length > 80) {
    notFound();
  }

  const record = await previewVerificationToken(token);
  if (!record || record.usedAt) {
    // Redirect to the landing page with an explanatory message rather than 404 — that way
    // the admin can confirm where the failure happens.
    redirect(`/secure-rep-verification?token=${encodeURIComponent(token)}`);
  }

  const expires = Date.parse(record.expiresAt);
  if (Number.isFinite(expires) && expires < Date.now()) {
    redirect(`/secure-rep-verification?token=${encodeURIComponent(token)}`);
  }

  return (
    <section className="bg-slate-50 py-10">
      <div className="page-container">
        <div className="mx-auto max-w-4xl">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Secure verification' },
            ]}
          />

          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
            <p className="text-xs font-bold uppercase tracking-widest">Private &mdash; admin invite only</p>
            <h1 className="mt-2 text-h2 text-amber-900">Secure Verification Form</h1>
            <p className="mt-3 text-sm leading-relaxed">
              This is a private verification form. Information submitted here is used to verify
              your identity, accreditation status and suitability for inclusion in the
              PoliceStationRepUK directory. Your address, PIN number, uploaded documents and
              verification material will <strong>not</strong> be published in the public directory.
            </p>
            <p className="mt-2 text-xs leading-relaxed">
              Token issued for: <strong>{record.email}</strong>. Expires: {record.expiresAt}.
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <SecureVerificationForm
              token={token}
              email={record.email}
              turnstileSiteKey={turnstileSiteKey()}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

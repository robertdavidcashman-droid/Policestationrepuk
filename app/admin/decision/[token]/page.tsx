import Link from 'next/link';
import { peekDecisionToken } from '@/lib/admin-decision-token';
import { getKV } from '@/lib/kv';
import { getReview } from '@/lib/admin-review';

/**
 * Admin "decision" interstitial — opened by clicking Approve / Decline in the
 * held-for-review email.
 *
 * IMPORTANT: This GET endpoint must NEVER mutate state. Email clients (Gmail,
 * Outlook, Apple Mail, anti-phishing scanners) silently prefetch every link
 * the moment a message arrives, so a GET that approves/declines would fire
 * before you've even seen the email. We only PEEK the token here; the
 * action is committed by a POST to /api/admin/decision after the human
 * clicks "Confirm".
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{ token: string }>;
}

interface NewRepRow {
  email?: string;
  name?: string;
  phone?: string;
  accreditation?: string;
  counties?: string;
  stations?: string;
  availability?: string;
  message?: string;
  pin_number?: string;
  dscc_pin?: string;
  sra_number?: string;
  firm_name?: string;
  proof_url?: string;
  professional_profile_url?: string;
  registeredAt?: string;
}

async function loadNewRep(email: string): Promise<NewRepRow | null> {
  const kv = getKV();
  if (!kv) return null;
  try {
    return await kv.get<NewRepRow>(`newrep:${email}`);
  } catch {
    return null;
  }
}

function row(label: string, value: string | undefined): string | null {
  if (!value) return null;
  return `${label}|${value}`;
}

export default async function DecisionInterstitialPage({ params }: PageProps) {
  const { token } = await params;

  const peek = await peekDecisionToken(token);
  if (!peek.ok) {
    const guidance =
      peek.status === 410
        ? 'This decision link has already been used or has expired. Open the admin queue to action this submission manually.'
        : 'This decision link could not be verified. Open the admin queue to action this submission manually.';
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
          <h1 className="text-xl font-bold text-amber-900">Link unavailable</h1>
          <p className="mt-3 text-sm text-amber-900/90">{peek.error || guidance}</p>
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

  const { payload } = peek;
  const [newrep, review] = await Promise.all([
    loadNewRep(payload.email),
    getReview(payload.email),
  ]);

  const isApprove = payload.action === 'approve';
  const accentBg = isApprove ? '#059669' : '#b91c1c';
  const accentBgHover = isApprove ? '#047857' : '#991b1b';
  const headline = isApprove ? 'Approve and publish' : 'Decline this application';
  const verb = isApprove ? 'Approve' : 'Decline';

  const summaryRows = [
    row('Name', newrep?.name),
    row('Email', newrep?.email ?? payload.email),
    row('Phone', newrep?.phone),
    row('Category', payload.category),
    row('Accreditation', newrep?.accreditation),
    row('DSCC / PIN', newrep?.dscc_pin || newrep?.pin_number),
    row('SRA number', newrep?.sra_number),
    row('Firm', newrep?.firm_name),
    row('Counties', newrep?.counties),
    row('Stations', newrep?.stations),
    row('Availability', newrep?.availability),
    row('Proof URL', newrep?.proof_url),
    row('Professional profile', newrep?.professional_profile_url),
    row('Registered at', newrep?.registeredAt),
    row('Risk category', review?.riskCategory ?? undefined),
  ].filter(Boolean) as string[];

  const riskReasons = review?.riskReasons ?? [];

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        PoliceStationRepUK admin
      </p>
      <h1 className="mt-1 text-2xl font-bold text-slate-900">{headline}</h1>
      <p className="mt-2 text-sm text-slate-600">
        Confirm below to {isApprove ? 'publish' : 'decline'}{' '}
        <strong>{newrep?.name || payload.email}</strong>. This is the last step — your
        click will commit the change immediately.
      </p>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">
          Submission summary
        </h2>
        <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-[160px_1fr]">
          {summaryRows.map((entry) => {
            const [label, value] = entry.split('|');
            return (
              <div
                key={label}
                className="contents text-sm"
              >
                <dt className="font-semibold text-slate-600">{label}</dt>
                <dd className="break-words text-slate-900">{value}</dd>
              </div>
            );
          })}
        </dl>
        {newrep?.message ? (
          <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700">
            <p className="font-semibold text-slate-600">Public notes / bio</p>
            <p className="mt-1 whitespace-pre-line">{newrep.message}</p>
          </div>
        ) : null}
        {riskReasons.length ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-semibold">Risk flags</p>
            <ul className="mt-1 list-disc pl-5">
              {riskReasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <form
        method="POST"
        action="/api/admin/decision"
        className="mt-6 rounded-xl border-2 border-slate-200 bg-slate-50 p-5"
      >
        <input type="hidden" name="token" value={token} />
        <p className="text-sm text-slate-700">
          {isApprove ? (
            <>
              Approving will set <code>verificationStatus</code> to the verified status
              for this category, mark the profile <code>adminApproved</code> and{' '}
              <code>isPublic</code>, and stamp{' '}
              <code>lastVerifiedDate</code> to now. The profile will appear publicly on the
              next ISR refresh (within 60 seconds).
            </>
          ) : (
            <>
              Declining will set <code>verificationStatus</code> to <code>rejected</code>,
              clear <code>adminApproved</code> and <code>isPublic</code>, and email the
              applicant a polite &ldquo;we could not list your profile&rdquo; message. The{' '}
              <code>newrep:</code> row is kept for audit; you can re-approve from{' '}
              <Link href="/admin" className="font-semibold text-blue-700">/admin</Link> at
              any time.
            </>
          )}
        </p>
        <button
          type="submit"
          style={{ backgroundColor: accentBg, borderColor: accentBgHover }}
          className="mt-4 inline-block rounded-lg border px-5 py-2.5 text-sm font-bold text-white no-underline shadow-sm hover:brightness-110"
        >
          Confirm {verb}
        </button>
        <Link
          href="/admin"
          className="ml-3 inline-block rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 no-underline hover:border-slate-400"
        >
          Cancel
        </Link>
      </form>

      <p className="mt-6 text-xs text-slate-500">
        Token jti <code className="font-mono">{payload.jti}</code> · expires{' '}
        {new Date(payload.exp * 1000).toLocaleString('en-GB')}.
      </p>
    </main>
  );
}

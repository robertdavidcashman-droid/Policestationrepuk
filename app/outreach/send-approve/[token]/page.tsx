import Link from 'next/link';
import { dailySendCap } from '@/lib/firm-outreach/constants';
import { getDailySendCount } from '@/lib/firm-outreach/storage';
import { buildOutreachActivityReport } from '@/lib/firm-outreach/outreach/activity-report';
import {
  normalizeSendApprovalRef,
  peekSendApprovalRef,
} from '@/lib/firm-outreach/outreach/send-approval-token';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function SendApproveInterstitialPage({ params }: PageProps) {
  const { token: rawRef } = await params;
  const approvalRef = normalizeSendApprovalRef(rawRef);

  const peek = await peekSendApprovalRef(approvalRef);
  if (!peek.ok) {
    const guidance =
      peek.status === 410
        ? 'This send link has already been used or has expired.'
        : 'This send link could not be verified.';
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
          <h1 className="text-xl font-bold text-amber-900">Link unavailable</h1>
          <p className="mt-3 text-sm text-amber-900/90">{peek.error || guidance}</p>
          <Link
            href="/admin/firm-outreach"
            className="mt-6 inline-block rounded-lg bg-amber-900 px-5 py-2.5 text-sm font-semibold text-white no-underline hover:bg-amber-800"
          >
            Open firm outreach admin
          </Link>
        </div>
      </main>
    );
  }

  const cap = dailySendCap();
  const utcDate = new Date().toISOString().slice(0, 10);
  const sentTodayKv = await getDailySendCount(utcDate);
  const { report } = await buildOutreachActivityReport();
  const sentToday = Math.max(report.summary.sentToday, sentTodayKv);
  const remaining = Math.max(0, cap - sentToday);
  const readyCount = report.summary.readyToSend;

  if (remaining === 0) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <h1 className="text-xl font-bold text-emerald-900">Daily cap reached</h1>
          <p className="mt-3 text-sm text-emerald-900/90">
            You have already sent {sentToday} email(s) today (cap {cap}). No further sends
            are available until tomorrow.
          </p>
          <Link
            href="/admin/firm-outreach"
            className="mt-6 inline-block rounded-lg bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white no-underline hover:bg-emerald-700"
          >
            Open admin dashboard
          </Link>
        </div>
      </main>
    );
  }

  const preview = report.readyToSendProspects.slice(0, 8);

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        PoliceStationRepUK firm outreach
      </p>
      <h1 className="mt-1 text-2xl font-bold text-slate-900">Ready to send</h1>
      <p className="mt-2 text-sm text-slate-600">
        Confirm below to send up to <strong>{remaining}</strong> WhatsApp invitation
        email(s) today ({readyCount} in queue, cap {cap}).
      </p>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Queue preview</h2>
        {preview.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">No prospects are currently ready to send.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm text-slate-800">
            {preview.map((r) => (
              <li key={r.prospectId}>
                <strong>{r.firmName}</strong> — {r.email} ({r.county})
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-xs text-slate-500">
          Sent today so far: {sentToday} / {cap}
        </p>
      </section>

      <form
        method="POST"
        action="/api/outreach/send-approved"
        className="mt-6 rounded-xl border-2 border-emerald-200 bg-emerald-50 p-5"
      >
        <input type="hidden" name="approvalRef" value={approvalRef} />
        <p className="text-sm text-slate-700">
          This will send initial invites (and any due follow-ups) from the ready queue,
          respecting suppressions and duplicate-email rules. You will receive a confirmation
          email when complete.
        </p>
        <button
          type="submit"
          className="mt-4 inline-block rounded-lg border border-emerald-800 bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700"
        >
          Confirm — Ready to send
        </button>
        <Link
          href="/admin/firm-outreach"
          className="ml-3 inline-block rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 no-underline hover:border-slate-400"
        >
          Cancel
        </Link>
      </form>

      <p className="mt-6 text-xs text-slate-500">
        Link expires {new Date(peek.payload.exp * 1000).toLocaleString('en-GB')}.
      </p>
    </main>
  );
}

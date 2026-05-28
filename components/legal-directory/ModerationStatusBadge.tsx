import type { LegalDirectoryListingStatus } from '@/lib/legal-directory/types';

const LABELS: Record<LegalDirectoryListingStatus, string> = {
  draft: 'Draft',
  pending_review: 'Pending review',
  approved: 'Approved',
  rejected: 'Rejected',
  flagged_for_review: 'Flagged',
  pending_update: 'Pending update',
  deletion_requested: 'Deletion requested',
  suspended: 'Suspended',
  deleted: 'Deleted',
  rejected_spam: 'Spam rejected',
};

const STYLES: Record<string, string> = {
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  pending_review: 'bg-amber-100 text-amber-900 border-amber-300',
  flagged_for_review: 'bg-red-100 text-red-800 border-red-300',
  pending_update: 'bg-blue-100 text-blue-800 border-blue-300',
  deletion_requested: 'bg-orange-100 text-orange-900 border-orange-300',
  rejected_spam: 'bg-slate-200 text-slate-800 border-slate-400',
  default: 'bg-slate-100 text-slate-700 border-slate-300',
};

export function ModerationStatusBadge({ status }: { status: LegalDirectoryListingStatus }) {
  const style = STYLES[status] ?? STYLES.default;
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${style}`}
    >
      {LABELS[status] ?? status}
    </span>
  );
}

import { LEGAL_DIRECTORY_DISCLAIMER } from '@/lib/legal-directory/constants';

export function LegalDirectoryDisclaimer() {
  return (
    <aside className="rounded-[var(--radius)] border border-[var(--card-border)] bg-slate-50 p-4 text-sm leading-relaxed text-[var(--muted)]">
      <p>{LEGAL_DIRECTORY_DISCLAIMER}</p>
    </aside>
  );
}

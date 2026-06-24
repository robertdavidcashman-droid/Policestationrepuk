'use client';

import type { ReactNode } from 'react';

export interface AdminWideTableColumn<T> {
  id: string;
  header: ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  hideBelow?: 'md' | 'lg';
  render: (row: T) => ReactNode;
}

export function adminBadgeClass(tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info'): string {
  const map = {
    neutral: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-50 text-emerald-800',
    warning: 'bg-amber-50 text-amber-900',
    danger: 'bg-red-50 text-red-800',
    info: 'bg-blue-50 text-blue-800',
  };
  return `inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${map[tone]}`;
}

export function AdminWideTable<T>({
  title,
  columns,
  rows,
  getRowKey,
  emptyMessage = 'No rows.',
  headerExtra,
  stickyHeader = true,
}: {
  title?: string;
  columns: AdminWideTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  emptyMessage?: string;
  headerExtra?: ReactNode;
  stickyHeader?: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-white shadow-sm">
      {(title || headerExtra) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
          {title ? <h2 className="text-sm font-bold text-[var(--navy)]">{title}</h2> : <span />}
          {headerExtra}
        </div>
      )}
      {rows.length === 0 ? (
        <p className="px-4 py-8 text-sm text-[var(--muted)]">{emptyMessage}</p>
      ) : (
        <table className="min-w-full text-left text-sm">
          <thead
            className={`border-b border-[var(--border)] bg-slate-50 text-xs uppercase tracking-wide text-[var(--muted)] ${
              stickyHeader ? 'sticky top-0 z-10' : ''
            }`}
          >
            <tr>
              {columns.map((col) => (
                <th
                  key={col.id}
                  className={`px-4 py-3 whitespace-nowrap ${col.headerClassName ?? ''} ${
                    col.hideBelow === 'md' ? 'hidden md:table-cell' : ''
                  } ${col.hideBelow === 'lg' ? 'hidden lg:table-cell' : ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {rows.map((row) => (
              <tr key={getRowKey(row)} className="hover:bg-slate-50/80">
                {columns.map((col) => (
                  <td
                    key={col.id}
                    className={`px-4 py-3 align-top ${col.cellClassName ?? ''} ${
                      col.hideBelow === 'md' ? 'hidden md:table-cell' : ''
                    } ${col.hideBelow === 'lg' ? 'hidden lg:table-cell' : ''}`}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

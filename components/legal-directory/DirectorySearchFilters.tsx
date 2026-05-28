'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { LEGAL_DIRECTORY_CATEGORIES } from '@/lib/legal-directory/categories';
import { ENGLISH_COUNTIES } from '@/lib/english-counties';
import { UK_REGIONS, LEGAL_DIRECTORY_BASE } from '@/lib/legal-directory/constants';

export function DirectorySearchFilters() {
  const router = useRouter();
  const params = useSearchParams();

  const submit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const q = new URLSearchParams();
      for (const [k, v] of fd.entries()) {
        if (typeof v === 'string' && v.trim()) q.set(k, v.trim());
      }
      router.push(`${LEGAL_DIRECTORY_BASE}/search?${q.toString()}`);
    },
    [router],
  );

  return (
    <form onSubmit={submit} className="card-surface space-y-4 p-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block sm:col-span-2 lg:col-span-3">
          <span className="text-sm font-semibold text-[var(--navy)]">Keyword</span>
          <input
            name="q"
            type="search"
            defaultValue={params.get('q') ?? ''}
            className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
            placeholder="Firm name, specialism, area…"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-[var(--navy)]">Category</span>
          <select
            name="category"
            defaultValue={params.get('category') ?? ''}
            className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          >
            <option value="">All categories</option>
            {LEGAL_DIRECTORY_CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-[var(--navy)]">County</span>
          <select
            name="county"
            defaultValue={params.get('county') ?? ''}
            className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          >
            <option value="">All counties</option>
            {ENGLISH_COUNTIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-[var(--navy)]">Region</span>
          <select
            name="region"
            defaultValue={params.get('region') ?? ''}
            className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          >
            <option value="">All regions</option>
            {UK_REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-[var(--navy)]">Town / city</span>
          <input
            name="town"
            type="text"
            defaultValue={params.get('town') ?? ''}
            className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-[var(--navy)]">Legal Aid</span>
          <select
            name="legalAid"
            defaultValue={params.get('legalAid') ?? ''}
            className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          >
            <option value="">Any</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
            <option value="not_applicable">Not applicable</option>
          </select>
        </label>
        <label className="flex items-end gap-2 pb-2">
          <input
            type="checkbox"
            name="availability24Hour"
            value="1"
            defaultChecked={params.get('availability24Hour') === '1'}
            className="h-4 w-4"
          />
          <span className="text-sm font-semibold text-[var(--navy)]">24-hour availability</span>
        </label>
      </div>
      <button type="submit" className="btn-gold">
        Search directory
      </button>
    </form>
  );
}

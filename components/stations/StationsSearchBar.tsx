'use client';

import { useEffect, useRef } from 'react';

interface StationsSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  resultCount: number;
  onClear?: () => void;
}

export function StationsSearchBar({
  value,
  onChange,
  resultCount,
  onClear,
}: StationsSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleSlash(e: KeyboardEvent) {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handleSlash);
    return () => window.removeEventListener('keydown', handleSlash);
  }, []);

  return (
    <div className="relative">
      <label htmlFor="stations-search" className="sr-only">
        Search stations
      </label>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
        <svg
          className="h-5 w-5 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
      </div>
      <input
        ref={inputRef}
        id="stations-search"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Name, town, postcode, county, force…"
        autoComplete="off"
        className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-24 text-base text-[var(--foreground)] shadow-sm placeholder:text-slate-400 focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/30 sm:text-[15px]"
      />
      <div className="absolute inset-y-0 right-0 flex items-center gap-2 pr-3">
        <kbd className="hidden rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] font-medium text-slate-400 sm:inline-block">
          /
        </kbd>
        {value.trim() ? (
          <>
            <span
              className="rounded-full bg-[var(--navy)]/10 px-2 py-0.5 text-[11px] font-bold text-[var(--navy)]"
              aria-live="polite"
            >
              {resultCount}
            </span>
            {onClear ? (
              <button
                type="button"
                onClick={onClear}
                className="rounded-lg px-2 py-1 text-xs font-semibold text-[var(--muted)] hover:bg-slate-100 hover:text-[var(--navy)]"
                aria-label="Clear search"
              >
                Clear
              </button>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

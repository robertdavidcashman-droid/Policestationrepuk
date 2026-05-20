'use client';

import { useRef, useEffect } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  resultCount: number;
  placeholder?: string;
  onQuickCounty?: (county: string) => void;
}

const QUICK_CHIPS = ['Kent', 'London', 'Essex', 'Manchester', 'Birmingham'];

export function SearchBar({
  value,
  onChange,
  resultCount,
  placeholder = 'Search by county, police station, or name\u2026',
  onQuickCounty,
}: SearchBarProps) {
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
    <div className="space-y-2.5">
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
        <input
          ref={inputRef}
          id="dir-q"
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-12 pr-20 text-base text-[var(--foreground)] shadow-sm placeholder:text-slate-400 focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/30 sm:text-[15px]"
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center gap-2 pr-4">
          <kbd className="hidden rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] font-medium text-slate-400 sm:inline-block">
            /
          </kbd>
          {value && (
            <span className="rounded-full bg-[var(--navy)]/10 px-2 py-0.5 text-[11px] font-bold text-[var(--navy)]">
              {resultCount}
            </span>
          )}
        </div>
      </div>

      {/* Quick county chips */}
      {!value && onQuickCounty && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <span className="text-[11px] font-semibold text-slate-500">Popular:</span>
          {QUICK_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => onQuickCounty(chip)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-[var(--navy)] transition-all hover:border-[var(--gold)]/50 hover:bg-[var(--gold-pale)] hover:shadow-sm"
            >
              {chip}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import type { County, PoliceStation } from '@/lib/types';
import type { AccreditationFilterKey } from '@/lib/directory-rep-filters';
import type { ExperienceTier } from '@/lib/directory-ranking';

export interface FilterState {
  county: string;
  station: string;
  availability: string;
  accreditation: AccreditationFilterKey;
  force: string;
  experience: ExperienceTier;
  urgentOnly: boolean;
  completeOnly: boolean;
  sort: 'smart' | 'relevance' | 'name' | 'county';
}

interface FilterSidebarProps {
  filters: FilterState;
  onFilterChange: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onReset: () => void;
  counties: County[];
  countyStations: PoliceStation[];
  forceOptions: string[];
  hasTextQuery: boolean;
  hasActiveFilters: boolean;
  resultCount: number;
}

const AVAILABILITY_OPTIONS = [
  { value: '', label: 'All availability' },
  { value: '24-7', label: '24/7 / Full-time' },
  { value: 'evenings-nights', label: 'Evenings & nights' },
  { value: 'weekends', label: 'Weekends' },
  { value: 'daytime', label: 'Daytime' },
  { value: 'flexible', label: 'Flexible / by arrangement' },
];

const ACCREDITATION_OPTIONS: { value: AccreditationFilterKey; label: string }[] = [
  { value: '', label: 'All types' },
  { value: 'duty', label: 'Duty solicitor' },
  { value: 'solicitor', label: 'Solicitor' },
  { value: 'accredited', label: 'Accredited PSRAS rep' },
];

const EXPERIENCE_OPTIONS: { value: ExperienceTier; label: string }[] = [
  { value: '', label: 'Any experience' },
  { value: 'senior', label: '15+ years' },
  { value: 'mid', label: '5\u201314 years' },
  { value: 'junior', label: '1\u20134 years' },
  { value: 'unspecified', label: 'Not stated' },
];

function FilterSelect<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-[var(--foreground)] transition-colors focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)]/30"
      >
        {options.map((o) => (
          <option key={o.value || '__all'} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function FilterSidebar({
  filters,
  onFilterChange,
  onReset,
  counties,
  countyStations,
  forceOptions,
  hasTextQuery,
  hasActiveFilters,
  resultCount,
}: FilterSidebarProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[var(--navy)]">Filters</h3>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              className="text-xs font-semibold text-[var(--gold-link)] transition-colors hover:text-[var(--gold)]"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="space-y-3">
          <FilterSelect
            id="dir-county"
            label="County"
            value={filters.county}
            options={[
              { value: '', label: 'All counties' },
              ...counties.map((c) => ({ value: c.name, label: c.name })),
            ]}
            onChange={(v) => {
              onFilterChange('county', v);
              if (!v) onFilterChange('station', '');
            }}
          />

          <FilterSelect
            id="dir-availability"
            label="Availability"
            value={filters.availability}
            options={AVAILABILITY_OPTIONS}
            onChange={(v) => onFilterChange('availability', v)}
          />

          <FilterSelect
            id="dir-accreditation"
            label="Accreditation"
            value={filters.accreditation}
            options={ACCREDITATION_OPTIONS}
            onChange={(v) => onFilterChange('accreditation', v as AccreditationFilterKey)}
          />

          <FilterSelect
            id="dir-force"
            label="Police force"
            value={filters.force}
            options={[
              { value: '', label: 'All forces' },
              ...forceOptions.map((f) => ({ value: f, label: f })),
            ]}
            onChange={(v) => onFilterChange('force', v)}
          />

          <FilterSelect
            id="dir-experience"
            label="Experience"
            value={filters.experience}
            options={EXPERIENCE_OPTIONS}
            onChange={(v) => onFilterChange('experience', v as ExperienceTier)}
          />

          <div>
            <label
              htmlFor="dir-station"
              className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500"
            >
              Station
            </label>
            {filters.county && countyStations.length > 0 ? (
              <select
                id="dir-station"
                value={filters.station}
                onChange={(e) => onFilterChange('station', e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"
              >
                <option value="">All stations in {filters.county}</option>
                {countyStations.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id="dir-station"
                type="text"
                placeholder="Filter by station\u2026"
                value={filters.station}
                onChange={(e) => onFilterChange('station', e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm placeholder:text-slate-400"
              />
            )}
          </div>
        </div>

        <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[var(--navy)]">
            <input
              type="checkbox"
              checked={filters.urgentOnly}
              onChange={(e) => onFilterChange('urgentOnly', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-[var(--navy)]"
            />
            Out-of-hours ready
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[var(--navy)]">
            <input
              type="checkbox"
              checked={filters.completeOnly}
              onChange={(e) => onFilterChange('completeOnly', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-[var(--navy)]"
            />
            Full profiles only
          </label>
        </div>

        <div className="mt-4 border-t border-slate-100 pt-4">
          <FilterSelect
            id="dir-sort"
            label="Sort by"
            value={filters.sort}
            options={[
              { value: 'smart' as const, label: 'Recommended' },
              ...(hasTextQuery ? [{ value: 'relevance' as const, label: 'Text match' }] : []),
              { value: 'name' as const, label: 'Name (A\u2013Z)' },
              { value: 'county' as const, label: 'County' },
            ]}
            onChange={(v) => onFilterChange('sort', v as FilterState['sort'])}
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-center shadow-sm">
        <p className="text-sm text-slate-600">
          <span className="text-lg font-extrabold text-[var(--navy)]">{resultCount}</span>{' '}
          listing{resultCount !== 1 ? 's' : ''} found
        </p>
      </div>
    </div>
  );
}

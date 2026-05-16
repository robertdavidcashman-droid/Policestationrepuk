'use client';

import Link from 'next/link';
import { DirectoryCard, type MatchHighlight } from '@/components/DirectoryCard';
import { JoinCTA } from '@/components/directory/JoinCTA';
import { CustodyNoteInlineCTA } from '@/components/CustodyNoteInlineCTA';
import { PsrTrainPromo } from '@/components/PsrTrainPromo';
import type { Representative } from '@/lib/types';

interface ResultsGridProps {
  featuredReps: Representative[];
  nonFeaturedReps: Representative[];
  pagedNonFeatured: Representative[];
  hasMore: boolean;
  onLoadMore: () => void;
  sort: string;
  hasActiveFilters: boolean;
  onReset: () => void;
  totalCount: number;
}

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-3 flex gap-2">
        <div className="h-5 w-14 rounded-full bg-slate-100" />
        <div className="h-5 w-20 rounded-full bg-slate-100" />
      </div>
      <div className="h-6 w-3/4 rounded bg-slate-100" />
      <div className="mt-2 h-4 w-1/2 rounded bg-slate-100" />
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full rounded bg-slate-50" />
        <div className="h-3 w-5/6 rounded bg-slate-50" />
      </div>
      <div className="mt-5 flex gap-2 border-t border-slate-50 pt-4">
        <div className="h-10 flex-1 rounded-lg bg-slate-100" />
        <div className="h-10 flex-1 rounded-lg bg-slate-50" />
      </div>
    </div>
  );
}

export function ResultsGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

const INLINE_CTA_POSITION = 6;
const INLINE_PSR_TRAIN_POSITION = 12;

export function ResultsGrid({
  featuredReps,
  nonFeaturedReps,
  pagedNonFeatured,
  hasMore,
  onLoadMore,
  sort,
  hasActiveFilters,
  onReset,
  totalCount,
}: ResultsGridProps) {
  if (totalCount === 0) {
    return (
      <div className="space-y-6">
        <CustodyNoteInlineCTA variant="full" />
        <JoinCTA variant="empty-state" />
        {hasActiveFilters && (
          <div className="text-center">
            <button type="button" onClick={onReset} className="btn-outline !text-sm">
              Reset all filters
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Featured reps — visually distinct section */}
      {featuredReps.length > 0 && (
        <section>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <svg className="h-4 w-4 text-[var(--gold)]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <h2 className="text-lg font-bold text-[var(--navy)]">Featured Representatives</h2>
              </div>
              <p className="text-xs text-slate-500">
                Promoted placements &mdash; firms should verify credentials before instructing.
              </p>
            </div>
            <Link
              href="/GoFeatured"
              className="hidden items-center gap-1 text-xs font-bold text-[var(--gold-link)] no-underline hover:text-[var(--gold)] sm:inline-flex"
            >
              Become featured
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {featuredReps.map((rep, i) => {
              let matchHighlight: MatchHighlight = null;
              if (sort === 'smart' && i < 2) {
                matchHighlight = i === 0 ? 'top' : 'runner';
              }
              return <DirectoryCard key={rep.id} rep={rep} matchHighlight={matchHighlight} />;
            })}
          </div>
          <div className="mt-8">
            <CustodyNoteInlineCTA variant="full" />
          </div>
        </section>
      )}

      {/* All listings with inline CTA */}
      {pagedNonFeatured.length > 0 && (
        <section>
          {featuredReps.length === 0 && (
            <div className="mb-8">
              <CustodyNoteInlineCTA variant="full" />
            </div>
          )}
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-lg font-bold text-[var(--navy)]">
              All listings
              <span className="ml-2 text-sm font-normal text-slate-500">
                {nonFeaturedReps.length}
              </span>
            </h2>
          </div>
          {sort === 'smart' && (
            <p className="mb-3 text-xs text-slate-500">
              Sorted by location match, availability signals, and profile depth.
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {pagedNonFeatured.map((rep, i) => {
              let matchHighlight: MatchHighlight = null;
              if (sort === 'smart' && i < 3) {
                matchHighlight = i === 0 ? 'top' : 'runner';
              }
              return (
                <DirectoryCardWithInlineCTA
                  key={rep.id}
                  rep={rep}
                  matchHighlight={matchHighlight}
                  index={i}
                  totalPaged={pagedNonFeatured.length}
                />
              );
            })}
          </div>
          <div className="mt-10">
            <CustodyNoteInlineCTA variant="full" />
          </div>
          {hasMore && (
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={onLoadMore}
                className="btn-outline !min-h-[44px] !px-8 font-semibold"
              >
                Load more ({nonFeaturedReps.length - pagedNonFeatured.length} remaining)
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function DirectoryCardWithInlineCTA({
  rep,
  matchHighlight,
  index,
  totalPaged,
}: {
  rep: Representative;
  matchHighlight: MatchHighlight;
  index: number;
  totalPaged: number;
}) {
  const showJoinCTA = index === INLINE_CTA_POSITION - 1 && totalPaged > INLINE_CTA_POSITION;
  const showPsrTrain =
    index === INLINE_PSR_TRAIN_POSITION - 1 && totalPaged > INLINE_PSR_TRAIN_POSITION;
  return (
    <>
      <DirectoryCard rep={rep} matchHighlight={matchHighlight} />
      {showJoinCTA && (
        <div className="sm:col-span-2">
          <JoinCTA variant="inline" />
        </div>
      )}
      {showPsrTrain && (
        <div className="sm:col-span-2">
          <PsrTrainPromo variant="compact" campaign="directory_results" />
        </div>
      )}
    </>
  );
}

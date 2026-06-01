'use client';

import dynamic from 'next/dynamic';

const StationLocationMapInner = dynamic(() => import('./StationLocationMapInner'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[220px] items-center justify-center rounded-[var(--radius)] bg-slate-100">
      <p className="text-xs font-medium text-[var(--muted)]">Loading map…</p>
    </div>
  ),
});

export function StationLocationMap({
  lat,
  lng,
  name,
}: {
  lat: number;
  lng: number;
  name: string;
}) {
  return (
    <div className="h-[220px] w-full overflow-hidden rounded-[var(--radius)] border border-[var(--card-border)]">
      <StationLocationMapInner lat={lat} lng={lng} name={name} />
    </div>
  );
}

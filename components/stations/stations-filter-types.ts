export type StationsSortBy = 'relevance' | 'name';
export type StationsViewMode = 'cards' | 'table';
export type StationsCustodyFilter = 'all' | 'published' | 'not_published';
export type StationsFrontCounterFilter = 'all' | 'open' | 'closed' | 'appointment_only';

export interface AreaIndexEntry {
  label: string;
  count: number;
}

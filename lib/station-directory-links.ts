export function buildStationsDirectorySearchUrl(query: string): string {
  const trimmed = query.trim();
  return trimmed
    ? `/StationsDirectory?q=${encodeURIComponent(trimmed)}#directory-search`
    : '/StationsDirectory';
}

export function stationDirectoryHref(countyFilter?: string, forceFilter?: string): string {
  if (countyFilter) {
    return `/StationsDirectory?county=${encodeURIComponent(countyFilter)}`;
  }
  if (forceFilter) {
    return `/StationsDirectory?force=${encodeURIComponent(forceFilter)}`;
  }
  return '/StationsDirectory';
}

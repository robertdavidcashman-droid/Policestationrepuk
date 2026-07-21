import type { SearchResult } from './types';

export type SearchProvider = (query: string) => Promise<SearchQueryResult>;

export type SearchQueryResult = SearchResult[] | SearchQueryError;

export interface SearchQueryError {
  ok: false;
  reason: string;
}

export function isSearchQueryError(result: SearchQueryResult): result is SearchQueryError {
  return !Array.isArray(result) && 'ok' in result && result.ok === false;
}

const SERPER_URL = 'https://google.serper.dev/search';

async function serperSearch(query: string): Promise<SearchQueryResult> {
  const key = process.env.SERPER_API_KEY?.trim();
  if (!key) {
    return { ok: false, reason: 'SERPER_API_KEY missing' };
  }

  const res = await fetch(SERPER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': key,
    },
    body: JSON.stringify({ q: query, gl: 'uk', hl: 'en', num: 10 }),
  });

  if (!res.ok) {
    return { ok: false, reason: `Serper HTTP ${res.status}` };
  }
  const data = (await res.json()) as {
    organic?: Array<{ title?: string; link?: string; snippet?: string; date?: string }>;
  };

  return (data.organic ?? [])
    .filter((r) => r.link?.startsWith('http'))
    .map((r) => ({
      title: r.title ?? '',
      url: r.link!,
      snippet: r.snippet ?? '',
      date: r.date,
    }));
}

function stationSearchLabel(name: string): string {
  return name
    .replace(/\s*police station\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildSearchQueries(suite: import('./types').CustodySuite): string[] {
  const name = suite.custodySuiteName || suite.policeStationName;
  const shortName = stationSearchLabel(name);
  const force = suite.forceName;
  const domain = suite.forceDomain;
  const dedicated = suite.isDedicatedCustodySuite ?? /custody|justice centre/i.test(name);

  const stationQueries = dedicated
    ? [
        `"${name}" custody desk telephone`,
        `"${name}" custody telephone`,
        `"${name}" police custody phone number`,
        `"${name}" custody suite telephone site:.gov.uk`,
      ]
    : [
        `"${name}" custody desk`,
        `"${name}" custody telephone number`,
        `"${name}" police station custody phone`,
        `"${force}" "${shortName}" custody desk telephone`,
        `"${force}" "${shortName}" custody telephone`,
        `"${shortName}" custody suite contact`,
        `site:${domain} "${shortName}" custody`,
      ];

  return [
    ...stationQueries,
    `"${force}" custody desk telephone`,
    `"${force}" custody suite contact`,
    `"${force}" custody telephone number`,
    `site:${domain} custody desk`,
    `site:${domain} custody telephone`,
    `site:${domain} custody suite`,
    `filetype:pdf "${force}" custody suite telephone number`,
    `filetype:pdf "${force}" custody contact police`,
    `site:police.uk "${name}" custody`,
  ];
}

export function isSerperConfigured(): boolean {
  return Boolean(process.env.SERPER_API_KEY?.trim());
}

export async function searchForSuite(
  suite: import('./types').CustodySuite,
  provider: SearchProvider = serperSearch,
  maxQueries = 4,
): Promise<SearchResult[] | SearchQueryError> {
  if (provider === serperSearch && !isSerperConfigured()) {
    return { ok: false, reason: 'SERPER_API_KEY missing' };
  }

  const queries = buildSearchQueries(suite).slice(0, maxQueries);
  const seen = new Set<string>();
  const results: SearchResult[] = [];

  for (const q of queries) {
    const rows = await provider(q);
    if (isSearchQueryError(rows)) {
      return rows;
    }
    for (const row of rows) {
      const key = row.url.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      results.push(row);
    }
  }
  return results;
}

export { serperSearch };

interface CrawlHeading {
  level: number;
  text: string;
}

export interface CrawlData {
  title?: string;
  headings?: CrawlHeading[];
  content?: string;
}

/**
 * Heading text patterns that are Wix-template navigation/footer noise, not real article
 * sub-sections. They appear at the tail of every crawled mirror page and pollute the
 * rendered article if we treat them as real headings.
 */
const NOISE_HEADING_PATTERNS: RegExp[] = [
  /^contents$/i,
  /^your rights explained$/i,
  /^2025 guide$/i,
  /^comparison guide$/i,
  /^complete guide$/i,
  /^need a police station rep in/i,
  /^training guides? & resources?$/i,
  /^directories$/i,
  /^for representatives$/i,
  /^tools? & resources?$/i,
  /^community$/i,
  /^regulatory notice$/i,
  /^trusted nationwide coverage$/i,
  /^the uk'?s free directory/i,
];

function isNoiseHeading(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  return NOISE_HEADING_PATTERNS.some((re) => re.test(trimmed));
}

/**
 * Find the start index of `needle` in `haystack` at-or-after `from`.
 * Tolerates extra whitespace/punctuation differences between the heading text and
 * the inline flattened-content occurrence.
 */
function findHeadingIndex(haystack: string, needle: string, from: number): number {
  if (!needle) return -1;
  const direct = haystack.indexOf(needle, from);
  if (direct !== -1) return direct;
  const escaped = needle
    .trim()
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\s+/g, '\\s+');
  try {
    const re = new RegExp(escaped, 'i');
    const slice = haystack.slice(from);
    const m = slice.match(re);
    if (m && typeof m.index === 'number') return from + m.index;
  } catch {
    // ignore – fall through
  }
  return -1;
}

function stripLeadingTitle(content: string, title: string | undefined): string {
  if (!title) return content;
  const trimmed = title.trim();
  if (!trimmed) return content;
  const candidates = [`Home${trimmed}`, trimmed];
  for (const c of candidates) {
    if (content.startsWith(c)) return content.slice(c.length);
  }
  return content;
}

/** Remove Wix breadcrumb / hero junk before the first real section in flat crawl strings. */
function stripBreadcrumbPrefix(content: string): string {
  let out = content.replace(/^\u00a0/g, '').trim();
  if (/^Home(?:Resources|Blog)/i.test(out)) {
    out = out.replace(/^Home(?:Resources|Blog)?/i, '');
    const sectionStart = out.search(
      /(?:Contents|What is |The Police |Side-by-Side|How to |Getting Started|What Does |Duty Solicitor|Police Disclosure|Build Your|Prepare for|Accredited Representative|Criminal Law Career)/i,
    );
    if (sectionStart > 0) out = out.slice(sectionStart);
  }
  return out.trim();
}

function isJunkIntro(lines: string[]): boolean {
  if (lines.length === 0) return true;
  const joined = lines.join(' ').toLowerCase();
  if (joined.length > 800) return false;
  return (
    /\bhome\b/.test(joined) &&
    (/\bresources\b/.test(joined) || /\bcontents\b/.test(joined) || joined.includes('2025 guide'))
  );
}

/** When crawl JSON lists the same heading twice (TOC + body), keep the section with more text. */
function dedupeSections(
  sections: Array<{ level: number; text: string; paragraphs: string[] }>,
): Array<{ level: number; text: string; paragraphs: string[] }> {
  const byKey = new Map<string, { level: number; text: string; paragraphs: string[] }>();
  const order: string[] = [];
  for (const section of sections) {
    const key = section.text.toLowerCase().trim();
    const len = section.paragraphs.join('').length;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, section);
      order.push(key);
      continue;
    }
    if (len > existing.paragraphs.join('').length) {
      byKey.set(key, section);
    }
  }
  return order.map((k) => byKey.get(k)!);
}

/**
 * Multi-pass splitter for flattened Wix-mirror content.
 */
export function splitCrawlParagraphs(raw: string): string[] {
  const cleaned = raw.replace(/\u00a0/g, ' ').trim();
  if (!cleaned) return [];

  let parts: string[] = /\n{2,}/.test(cleaned)
    ? cleaned.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
    : [cleaned];

  const splitOnConcat = (s: string): string[] =>
    s.split(/(?<=[a-z]{3,})(?=[A-Z][a-z]{2,})/g).map((p) => p.trim()).filter(Boolean);
  const splitOnSentence = (s: string): string[] =>
    s.split(/(?<=[.!?])\s+(?=[A-Z0-9£])/g).map((p) => p.trim()).filter(Boolean);
  const splitOnBullet = (s: string): string[] =>
    s.split(/\s*(?:•|✅|❌|⚠️|→|–)\s+/g).map((p) => p.trim()).filter(Boolean);
  const splitOnPunct = (s: string): string[] =>
    s.split(/(?<=[.!?])(?=[A-Z])/g).map((p) => p.trim()).filter(Boolean);
  const splitOnReferences = (s: string): string[] =>
    s.split(/(?=\[\d+\][A-Z])/g).map((p) => p.trim()).filter(Boolean);

  const passes: Array<(s: string) => string[]> = [
    splitOnReferences,
    splitOnConcat,
    splitOnSentence,
    splitOnPunct,
    splitOnBullet,
  ];

  for (const pass of passes) {
    if (parts.every((p) => p.length <= 1500)) break;
    const next: string[] = [];
    for (const p of parts) {
      if (p.length <= 1500) {
        next.push(p);
        continue;
      }
      const sub = pass(p);
      if (sub.length > 1) next.push(...sub);
      else next.push(p);
    }
    parts = next;
  }

  return parts.filter((p) => p.length > 0);
}

/**
 * Build an ordered list of article sections from a crawled Wix mirror payload.
 */
export function segmentCrawlContent(data: CrawlData): {
  intro: string[];
  sections: Array<{ level: number; text: string; paragraphs: string[] }>;
} {
  const rawContent = stripBreadcrumbPrefix(stripLeadingTitle(data.content ?? '', data.title));
  const subHeadings = (data.headings ?? [])
    .filter((h) => h.level > 1)
    .filter((h) => !isNoiseHeading(h.text));

  if (subHeadings.length === 0) {
    return { intro: splitCrawlParagraphs(rawContent), sections: [] };
  }

  const positions: Array<{ heading: CrawlHeading; start: number }> = [];
  let cursor = 0;
  for (const heading of subHeadings) {
    const idx = findHeadingIndex(rawContent, heading.text, cursor);
    if (idx === -1) continue;
    positions.push({ heading, start: idx });
    cursor = idx + heading.text.length;
  }

  if (positions.length === 0) {
    return { intro: splitCrawlParagraphs(rawContent), sections: [] };
  }

  const introRaw = rawContent.slice(0, positions[0].start);

  const sections = dedupeSections(
    positions.map(({ heading, start }, i) => {
      const next = positions[i + 1]?.start ?? rawContent.length;
      let body = rawContent.slice(start + heading.text.length, next);
      body = body.replace(/^[\s\-:—.|]+/, '');
      return {
        level: heading.level,
        text: heading.text,
        paragraphs: splitCrawlParagraphs(body),
      };
    }),
  );

  const intro = isJunkIntro(splitCrawlParagraphs(introRaw)) ? [] : splitCrawlParagraphs(introRaw);

  return { intro, sections };
}

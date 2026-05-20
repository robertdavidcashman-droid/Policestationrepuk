import '@/styles/prose.css';
import fs from 'fs';
import path from 'path';

interface CrawlHeading {
  level: number;
  text: string;
}

interface CrawlData {
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
  // Build a tolerant regex: collapse whitespace, escape regex special chars.
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
  // Strip common Wix "Home<title>" prefix and the bare title prefix.
  const candidates = [`Home${trimmed}`, trimmed];
  for (const c of candidates) {
    if (content.startsWith(c)) return content.slice(c.length);
  }
  return content;
}

/**
 * Multi-pass splitter for flattened Wix-mirror content. Tries paragraph breaks first,
 * then camelCase-join boundaries (e.g. `qualificationsLying`), then sentence boundaries,
 * then bullet markers. Ensures no single paragraph is left >1,500 chars when avoidable.
 */
function splitParagraphs(raw: string): string[] {
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
  // References blocks: "...source.[1]SRA: ...[2]Law Society:" — split before each bracketed reference.
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
      if (p.length <= 1500) { next.push(p); continue; }
      const sub = pass(p);
      if (sub.length > 1) next.push(...sub);
      else next.push(p);
    }
    parts = next;
  }

  return parts.filter((p) => p.length > 0);
}

function HeadingTag({ level, text }: { level: number; text: string }) {
  const l = Math.min(Math.max(level, 2), 6);
  const Tag = `h${l}` as 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  const styles: Record<number, string> = {
    2: 'text-2xl font-bold mt-8 mb-4 pb-2 border-b-2 border-[var(--gold-pale)] text-[var(--navy)]',
    3: 'text-xl font-semibold mt-7 mb-3 text-[var(--navy)]',
    4: 'text-lg font-semibold mt-5 mb-2 text-[var(--navy)]',
    5: 'text-base font-semibold mt-4 mb-2 text-[var(--navy)]',
    6: 'text-sm font-bold mt-3 mb-2 uppercase tracking-wide text-[var(--muted)]',
  };
  return <Tag className={styles[l]}>{text}</Tag>;
}

function Paragraphs({ lines }: { lines: string[] }) {
  if (lines.length === 0) return null;
  return (
    <div className="space-y-4 leading-[1.8] text-[var(--muted)]">
      {lines.map((p, i) => (
        <p key={i} className="whitespace-pre-line">
          {p}
        </p>
      ))}
    </div>
  );
}

/**
 * Build an ordered list of article sections from a crawled Wix mirror payload.
 *
 * The crawler emits a single flat `content` string that already contains every
 * heading text inline (no newlines). We slice that string by the *positions* of
 * each heading.text occurrence so each H2/H3 gets its own real section.
 *
 * Falls back to plain prose when the content cannot be segmented.
 */
export function segmentCrawlContent(data: CrawlData): {
  intro: string[];
  sections: Array<{ level: number; text: string; paragraphs: string[] }>;
} {
  const rawContent = stripLeadingTitle(data.content ?? '', data.title);
  const subHeadings = (data.headings ?? [])
    .filter((h) => h.level > 1)
    .filter((h) => !isNoiseHeading(h.text));

  if (subHeadings.length === 0) {
    return { intro: splitParagraphs(rawContent), sections: [] };
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
    return { intro: splitParagraphs(rawContent), sections: [] };
  }

  const introRaw = rawContent.slice(0, positions[0].start);

  const sections = positions.map(({ heading, start }, i) => {
    const next = positions[i + 1]?.start ?? rawContent.length;
    let body = rawContent.slice(start + heading.text.length, next);
    body = body.replace(/^[\s\-:—.|]+/, '');
    return {
      level: heading.level,
      text: heading.text,
      paragraphs: splitParagraphs(body),
    };
  });

  return { intro: splitParagraphs(introRaw), sections };
}

export function CrawlContent({ slug }: { slug: string }) {
  const filePath = path.join(process.cwd(), 'content', 'crawl', `${slug}.json`);
  if (!fs.existsSync(filePath)) return null;

  let data: CrawlData;
  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }

  const { intro, sections } = segmentCrawlContent(data);

  if (intro.length === 0 && sections.length === 0) return null;

  return (
    <div className="content-section space-y-6">
      {intro.length > 0 && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)] sm:p-8">
          <Paragraphs lines={intro} />
        </div>
      )}
      {sections.map((section, idx) => (
        <section
          key={idx}
          className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)] sm:p-8"
        >
          <HeadingTag level={section.level} text={section.text} />
          {section.paragraphs.length > 0 && (
            <div className="mt-3">
              <Paragraphs lines={section.paragraphs} />
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

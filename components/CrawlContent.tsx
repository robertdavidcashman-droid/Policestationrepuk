import '@/styles/prose.css';
import fs from 'fs';
import path from 'path';
import { ContentReliabilityNotice } from '@/components/ContentReliabilityNotice';
import { ResolvedContentSources } from '@/components/ContentSourcesFooter';
import { segmentCrawlContent, type CrawlData } from '@/lib/segment-crawl-content';

export { segmentCrawlContent } from '@/lib/segment-crawl-content';

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

export function CrawlContent({
  slug,
  showReliabilityNotice = true,
}: {
  slug: string;
  showReliabilityNotice?: boolean;
}) {
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
      {showReliabilityNotice && <ContentReliabilityNotice />}
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
      <ResolvedContentSources className="mt-2" context={{ kind: 'crawl', slug }} />
    </div>
  );
}

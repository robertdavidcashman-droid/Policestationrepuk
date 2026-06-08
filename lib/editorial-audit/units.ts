import fs from 'fs';
import path from 'path';
import { getAllBlogArticles } from '@/lib/blog/registry';
import { EDITORIAL_PAGE_PATHS, FEE_RIGHTS_PATHS, GUIDE_LIB_BY_PATH } from './constants';
import type { AuditUnit, ContentType } from './types';

const ROOT = process.cwd();

function readText(filePath: string): string {
  const full = path.join(ROOT, filePath);
  if (!fs.existsSync(full)) return '';
  return fs.readFileSync(full, 'utf8');
}

export function splitMarkdownSections(markdown: string): Array<{ title: string; text: string }> {
  const parts = markdown.split(/^## /m);
  if (parts.length <= 1) {
    const trimmed = markdown.trim();
    return trimmed ? [{ title: '(whole page)', text: trimmed }] : [];
  }

  const preamble = parts[0]?.trim();
  const sections: Array<{ title: string; text: string }> = [];

  if (preamble) {
    sections.push({ title: '(introduction)', text: preamble });
  }

  for (let i = 1; i < parts.length; i++) {
    const chunk = parts[i];
    const nl = chunk.indexOf('\n');
    const title = nl >= 0 ? chunk.slice(0, nl).trim() : chunk.trim();
    const body = nl >= 0 ? chunk.slice(nl + 1).trim() : '';
    sections.push({ title: title || `(section ${i})`, text: body || title });
  }

  return sections.length > 0 ? sections : [{ title: '(whole page)', text: markdown.trim() }];
}

function makeUnit(
  contentType: ContentType,
  url: string,
  sourceFile: string,
  sectionIndex: number,
  sectionTitle: string,
  text: string,
): AuditUnit {
  return {
    id: `${contentType}:${url}:${sectionIndex}`,
    url,
    contentType,
    sourceFile,
    sectionTitle,
    sectionIndex,
    text,
  };
}

function pageCompliance(pagePath: string): { sourceFile: string } {
  const segment = pagePath.replace(/^\//, '');
  const candidates = [
    path.join(ROOT, 'app', segment, 'page.tsx'),
    path.join(ROOT, 'app', segment, '[slug]', 'page.tsx'),
  ];
  const filePath = candidates.find((p) => fs.existsSync(p));
  if (!filePath) {
    return { sourceFile: `app/${segment}/page.tsx (missing)` };
  }
  return { sourceFile: path.relative(ROOT, filePath) };
}

/** Build all section-level audit units, sorted for stable cursor rotation. */
export function buildAllUnits(): AuditUnit[] {
  const units: AuditUnit[] = [];

  for (const article of getAllBlogArticles()) {
    const url = `/Blog/${article.slug}`;
    const fullText = [
      article.bodyMarkdown,
      article.summary,
      ...(article.faqs?.map((f) => `${f.q} ${f.a}`) ?? []),
    ].join('\n');
    const sections = splitMarkdownSections(fullText);
    sections.forEach((s, i) => {
      units.push(makeUnit('blog', url, 'lib/blog/articles-batch-*.ts', i, s.title, s.text));
    });
  }

  const wikiArticles = JSON.parse(readText('data/wiki-articles.json')) as Array<{
    slug: string;
    content: string;
  }>;
  for (const article of wikiArticles) {
    const url = `/Wiki/${article.slug}`;
    const sections = splitMarkdownSections(article.content || '');
    sections.forEach((s, i) => {
      units.push(makeUnit('wiki', url, 'data/wiki-articles.json', i, s.title, s.text));
    });
  }

  const legalUpdates = JSON.parse(readText('data/legal-updates.json')) as Array<{
    slug: string;
    content: string;
  }>;
  for (const article of legalUpdates) {
    const url = `/LegalUpdates/${article.slug}`;
    const sections = splitMarkdownSections(article.content || '');
    sections.forEach((s, i) => {
      units.push(makeUnit('legal-update', url, 'data/legal-updates.json', i, s.title, s.text));
    });
  }

  for (const pagePath of EDITORIAL_PAGE_PATHS) {
    const compliance = pageCompliance(pagePath);
    const libFile = GUIDE_LIB_BY_PATH[pagePath];
    const pageSrc = readText(compliance.sourceFile);
    const libSrc = libFile ? readText(libFile) : '';
    const text = `${pageSrc}\n${libSrc}`;
    const contentType: ContentType = FEE_RIGHTS_PATHS.has(pagePath) ? 'fee-rights' : 'guide';
    units.push(
      makeUnit(contentType, pagePath, libFile ?? compliance.sourceFile, 0, '(whole page)', text),
    );
  }

  return units.sort((a, b) => {
    const typeOrder = (t: ContentType) =>
      ({ blog: 0, wiki: 1, 'legal-update': 2, guide: 3, 'fee-rights': 4 })[t];
    const tc = typeOrder(a.contentType) - typeOrder(b.contentType);
    if (tc !== 0) return tc;
    const uc = a.url.localeCompare(b.url);
    if (uc !== 0) return uc;
    return a.sectionIndex - b.sectionIndex;
  });
}

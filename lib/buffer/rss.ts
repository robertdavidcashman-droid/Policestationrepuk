/** Minimal RSS 2.0 item parser — no external XML dependency. */

export interface RssItem {
  title: string;
  link: string;
  description: string;
  guid: string;
  imageUrl?: string;
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .trim();
}

function tagValue(block: string, tag: string): string {
  const cdata = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i');
  const plain = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = block.match(cdata) ?? block.match(plain);
  return m ? decodeXmlEntities(m[1] ?? '') : '';
}

function attrValue(tag: string, attr: string): string {
  const re = new RegExp(`${attr}\\s*=\\s*["']([^"']+)["']`, 'i');
  const m = tag.match(re);
  return m ? decodeXmlEntities(m[1] ?? '') : '';
}

/** Resolve a relative or protocol-relative URL against a link base. */
export function resolveAbsoluteUrl(linkBase: string, url: string | undefined | null): string | undefined {
  if (!url?.trim()) return undefined;
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  try {
    return new URL(trimmed, linkBase).href;
  } catch {
    return undefined;
  }
}

function extractImageUrl(block: string, linkBase: string): string | undefined {
  const enclosureMatch = block.match(/<enclosure\b[^>]*\/?>/i);
  if (enclosureMatch) {
    const tag = enclosureMatch[0] ?? '';
    const type = attrValue(tag, 'type');
    const url = attrValue(tag, 'url');
    if (url && (!type || type.startsWith('image/'))) {
      const resolved = resolveAbsoluteUrl(linkBase, url);
      if (isRasterImageUrl(resolved)) return resolved;
    }
  }

  const mediaContentMatch = block.match(/<media:content\b[^>]*\/?>/i);
  if (mediaContentMatch) {
    const tag = mediaContentMatch[0] ?? '';
    const medium = attrValue(tag, 'medium');
    const type = attrValue(tag, 'type');
    const url = attrValue(tag, 'url');
    if (url && (medium === 'image' || type.startsWith('image/'))) {
      const resolved = resolveAbsoluteUrl(linkBase, url);
      if (isRasterImageUrl(resolved)) return resolved;
    }
  }

  const mediaThumbMatch = block.match(/<media:thumbnail\b[^>]*\/?>/i);
  if (mediaThumbMatch) {
    const url = attrValue(mediaThumbMatch[0] ?? '', 'url');
    if (url) {
      const resolved = resolveAbsoluteUrl(linkBase, url);
      if (isRasterImageUrl(resolved)) return resolved;
    }
  }

  const description = tagValue(block, 'description');
  const fromDescription = extractImageFromHtml(description, linkBase);
  if (fromDescription) return fromDescription;

  return undefined;
}

function isRasterImageUrl(url: string | undefined): boolean {
  if (!url) return false;
  return /\.(png|jpe?g|webp|gif)(\?|$)/i.test(url) || /opengraph-image/i.test(url);
}

function extractImageFromHtml(html: string, linkBase: string): string | undefined {
  const imgMatch = html.match(/<img\b[^>]*\ssrc=["']([^"']+)["']/i);
  if (!imgMatch?.[1]) return undefined;
  const resolved = resolveAbsoluteUrl(linkBase, imgMatch[1]);
  return isRasterImageUrl(resolved) ? resolved : undefined;
}

/** Channel-level RSS image URL (fallback when items omit enclosures). */
export function parseRssChannelImageUrl(xml: string, feedUrl: string): string | undefined {
  const imageBlock = xml.match(/<image\b[^>]*>([\s\S]*?)<\/image>/i)?.[1];
  if (!imageBlock) return undefined;
  const imageUrl = tagValue(imageBlock, 'url');
  if (!imageUrl) return undefined;
  const resolved = resolveAbsoluteUrl(feedUrl, imageUrl);
  return isRasterImageUrl(resolved) ? resolved : undefined;
}

/** Extract <item> entries from RSS/XML feed text. */
export function parseRssItems(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const itemRegex = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1] ?? '';
    const title = tagValue(block, 'title');
    const link = tagValue(block, 'link');
    const description = tagValue(block, 'description');
    const guid = tagValue(block, 'guid') || link;
    if (title && link) {
      items.push({
        title,
        link,
        description,
        guid,
        imageUrl: extractImageUrl(block, link),
      });
    }
  }
  return items;
}

export function slugFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname.replace(/\/$/, '');
    const segment = path.split('/').filter(Boolean).pop();
    return segment || url;
  } catch {
    return url;
  }
}

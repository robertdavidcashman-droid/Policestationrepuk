/** Minimal RSS 2.0 item parser — no external XML dependency. */

export interface RssItem {
  title: string;
  link: string;
  description: string;
  guid: string;
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
      items.push({ title, link, description, guid });
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

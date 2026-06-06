import type { CustodySourceType } from './types';

export function extractDomain(url: string): string {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host.replace(/^www\./, '');
  } catch {
    return '';
  }
}

export function detectSourceType(url: string, title = ''): CustodySourceType {
  const domain = extractDomain(url);
  const hay = `${domain} ${title} ${url}`.toLowerCase();

  if (!domain) return 'unknown';
  if (/web\.archive\.org|archive\.org|wayback/i.test(url)) return 'archived';
  if (domain.endsWith('.police.uk') || /\.police\.uk$/i.test(domain)) return 'official_police';
  if (domain === 'police.uk' || domain.endsWith('.police.uk')) return 'police_uk';
  if (/\.pdf$/i.test(url) || hay.includes('filetype:pdf')) return 'pdf';
  if (/foi|freedom.of.information|whatdotheyknow|gov\.uk\/government\/publications/i.test(hay)) {
    return 'foi';
  }
  if (/pcc\.|policeandcrimecommissioner|police-and-crime/i.test(hay)) return 'pcc';
  if (/\.gov\.uk|council|borough|county council|local authority/i.test(hay)) return 'local_authority';
  if (/solicitor|law firm|legal directory|chambers|barrister|\.co\.uk\/legal/i.test(hay)) {
    return 'solicitor_site';
  }
  return 'unknown';
}

export function isOfficialSourceType(type: CustodySourceType): boolean {
  return type === 'official_police' || type === 'police_uk' || type === 'foi' || type === 'pdf';
}

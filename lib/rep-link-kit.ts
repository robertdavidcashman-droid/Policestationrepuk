/** Profile URL and copy snippets for rep link kits (cards, email signatures, QR). */

export function repProfileUrl(siteUrl: string, slug: string): string {
  return `${siteUrl.replace(/\/$/, '')}/rep/${slug}`;
}

export function repShareBlurb(name: string, county?: string | null): string {
  const area = county?.trim() ? ` covering ${county.trim()}` : '';
  return `${name} — accredited police station rep${area}. Listed on PoliceStationRepUK:`;
}

export function repEmailSignature(name: string, profileUrl: string, county?: string | null): string {
  const area = county?.trim() ? ` covering ${county.trim()}` : '';
  return [
    `${name} — accredited police station representative${area}`,
    `PoliceStationRepUK directory: ${profileUrl}`,
  ].join('\n');
}

export function repQrDownloadFilename(slug: string): string {
  const safe = slug.replace(/[^a-z0-9-]+/gi, '-').replace(/^-|-$/g, '') || 'profile';
  return `policestationrepuk-${safe}-qr.png`;
}

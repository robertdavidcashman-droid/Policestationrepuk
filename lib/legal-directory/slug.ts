import { getCategoryBySlug } from './categories';

export function slugifyLegalDirectory(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'listing'
  );
}

export function buildListingSlug(
  businessName: string,
  town: string,
  email: string,
): string {
  const base = slugifyLegalDirectory(businessName);
  const loc = town ? slugifyLegalDirectory(town) : '';
  const shortId = email.replace(/[^a-z0-9]/gi, '').slice(0, 6).toLowerCase();
  const parts = [base, loc, shortId].filter(Boolean);
  return parts.join('-').slice(0, 120);
}

export function buildSeoTitle(
  businessName: string,
  categorySlug: string,
  town: string,
  county: string,
): string {
  const cat = getCategoryBySlug(categorySlug);
  const catLabel = cat?.label ?? 'Legal Services';
  const loc = town || county || 'UK';
  return `${businessName} | ${catLabel} in ${loc}`;
}

export function locationSlugFromParts(town: string, county: string): string {
  const primary = county || town;
  return slugifyLegalDirectory(primary);
}

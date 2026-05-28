import { SITE_URL } from '@/lib/seo-layer/config';
import { LEGAL_DIRECTORY_BASE } from './constants';
import type { PublicLegalDirectoryListing } from './types';

export function legalDirectoryListingSchema(listing: PublicLegalDirectoryListing) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LegalService',
    name: listing.businessName,
    url: `${SITE_URL}${LEGAL_DIRECTORY_BASE}/listing/${listing.slug}`,
    telephone: listing.phone || undefined,
    description: listing.description.slice(0, 500),
    areaServed: {
      '@type': 'AdministrativeArea',
      name: listing.county || listing.region || 'England and Wales',
    },
    serviceType: listing.category,
    address: {
      '@type': 'PostalAddress',
      streetAddress: [listing.addressLine1, listing.addressLine2].filter(Boolean).join(', ') || undefined,
      addressLocality: listing.town,
      addressRegion: listing.county,
      postalCode: listing.postcode || undefined,
      addressCountry: 'GB',
    },
  };
}

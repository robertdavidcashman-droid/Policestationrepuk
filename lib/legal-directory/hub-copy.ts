import type { LegalDirectoryCategory } from './categories';
import type { LegalDirectoryLocation } from './locations';

const CATEGORY_HUB_EXTRA: Partial<Record<string, string>> = {
  solicitors:
    'Many criminal defence firms hold Legal Aid Agency contracts for police station and court work. Use the search filters to narrow by Legal Aid status, 24-hour availability, or verified regulator checks. Unclaimed listings sourced from published LAA data can be claimed by the firm to complete contact details.',
  'police-station-representatives':
    'Accredited police station representatives attend custody suites under PSRAS or equivalent schemes. Confirm accreditation and the stations a rep covers before instructing. Listings marked verified have been checked against a published regulator or official source.',
  'prison-law':
    'Prison law providers listed here typically hold Legal Aid contracts for prison law work. Verify current contract status and specialisms before instructing.',
};

export function getCategoryHubBody(cat: LegalDirectoryCategory): string {
  return (
    CATEGORY_HUB_EXTRA[cat.slug] ??
    `${cat.intro} Browse approved listings below or use search to filter by town, Legal Aid, and verification status. Providers can add a free listing subject to moderation.`
  );
}

export function getLocationHubBody(loc: LegalDirectoryLocation): string {
  if (loc.type === 'region') {
    return (
      `This hub lists criminal law and criminal justice service providers serving ${loc.label}. ` +
      `Use category links below to find solicitors, barristers, police station representatives, and specialist providers. ` +
      `For custody suite telephone numbers across the region, see the police station directory.`
    );
  }

  return (
    `Find criminal defence solicitors, barristers, police station representatives, and related providers ` +
    `in ${loc.label}. Listings include firms with Legal Aid contracts where applicable — filter search results ` +
    `by category, Legal Aid, and verification status. Need a custody desk number for a station in ${loc.label}? ` +
    `Check the police station phone directory or contribute a number if you are an accredited rep.`
  );
}

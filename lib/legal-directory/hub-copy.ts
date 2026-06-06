import type { LegalDirectoryCategory } from './categories';
import type { LegalDirectoryLocation } from './locations';

const CATEGORY_HUB_EXTRA: Partial<Record<string, string>> = {
  solicitors:
    'Entries here are auto-imported from published Legal Aid Agency crime legal aid provider data. ' +
    'Most are unclaimed — the firm has not confirmed contact details on Police Station Rep UK. ' +
    'A crime legal aid contract is not the same as membership of the national duty solicitor rota. ' +
    'Use official LAA and SRA tools (linked below) before instructing. Firms can claim a stub or add a listing.',
  'police-station-representatives':
    'Accredited police station representatives attend custody suites under PSRAS or equivalent schemes. ' +
    'Live rep profiles — with station coverage and availability for firms instructing cover — are in the main ' +
    'Police Station Rep UK directory (/directory), not as claimable listings in this Legal Services Directory category. ' +
    'Use the links below to find or register a rep, or browse PSRAS guidance.',
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

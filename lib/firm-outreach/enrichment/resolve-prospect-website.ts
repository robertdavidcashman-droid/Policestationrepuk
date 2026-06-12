import type { FirmProspect } from '../types';
import { lookupSraOrganisationByName } from '../sra-org-lookup';
import { discoverFirmWebsiteViaSerper } from './website-discovery';

/**
 * Resolve firm website via SRA org register, then Serper search if still missing.
 * May set status to excluded when SRA shows the org is not authorised.
 */
export async function resolveProspectWebsite(prospect: FirmProspect): Promise<FirmProspect> {
  if (!prospect.regulatoryNumber || !prospect.websiteUrl) {
    const sra = await lookupSraOrganisationByName(prospect.firmName, prospect.postcode);
    if (sra.organisation) {
      prospect.regulatoryNumber = prospect.regulatoryNumber || sra.organisation.sraNumber;
      prospect.websiteUrl = prospect.websiteUrl || sra.organisation.website;
      if (sra.matched && !sra.organisation.authorised) {
        prospect.status = 'excluded';
        prospect.excludedReason = 'sra_not_authorised';
        return prospect;
      }
    }
    await new Promise((r) => setTimeout(r, 2000));
  }

  if (!prospect.websiteUrl && prospect.status !== 'excluded') {
    const website = await discoverFirmWebsiteViaSerper({
      firmName: prospect.firmName,
      town: prospect.town,
      county: prospect.county,
      postcode: prospect.postcode,
    });
    if (website) prospect.websiteUrl = website;
  }

  return prospect;
}

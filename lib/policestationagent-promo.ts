/** Central Police Station Agent conversion URLs (UTM for funnel attribution). */
import { partnerHref } from '@/lib/utm';

export const POLICESTATIONAGENT_SITE = 'https://www.policestationagent.com';

export function psaHref(campaign: string, path = ''): string {
  const base = path
    ? `${POLICESTATIONAGENT_SITE}${path.startsWith('/') ? path : `/${path}`}`
    : POLICESTATIONAGENT_SITE;
  return partnerHref(base, campaign);
}

export const POLICESTATIONAGENT_HOME_HREF = psaHref('directory');
export const POLICESTATIONAGENT_KENT_RESOURCES_HREF = psaHref('kent_resources', '/kent-police-custody-resources');
export const POLICESTATIONAGENT_FREE_ADVICE_HREF = psaHref('free_advice', '/free-police-station-advice-kent');
export const POLICESTATIONAGENT_SOLICITOR_HREF = psaHref('solicitor_seo', '/police-station-solicitor');
export const POLICESTATIONAGENT_NAME = 'Police Station Agent';

export const POLICESTATIONAGENT_TAGLINE =
  'Criminal defence solicitor cover in Kent — police station attendance and agency services';

export const POLICESTATIONAGENT_CTA = 'Need a solicitor in Kent?';

export {
  shouldPromotePoliceStationAgent,
  textMentionsKent,
  resolveStationFromText,
  type PsaPromoContext,
} from '@/lib/policestationagent-resolve';

export {
  countySlugCoverageLevel,
  countySlugHasPsaCoverage,
  getPsaCoverageIndex,
  isStationSlugInCoverage,
} from '@/lib/policestationagent-coverage';

/** Central Police Station Agent conversion URLs (UTM for funnel attribution). */
const UTM = 'utm_source=policestationrepuk&utm_medium=web&utm_campaign=directory';

export const POLICESTATIONAGENT_SITE = 'https://www.policestationagent.com';
export const POLICESTATIONAGENT_HOME_HREF = `${POLICESTATIONAGENT_SITE}?${UTM}`;
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

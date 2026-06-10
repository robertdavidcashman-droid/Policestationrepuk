/** Central PSR Train conversion URLs (UTM for funnel attribution). */
import { partnerHref } from '@/lib/utm';

export function psrTrainHref(campaign: string, path = ''): string {
  const base = path
    ? `https://www.psrtrain.com${path.startsWith('/') ? path : `/${path}`}`
    : 'https://www.psrtrain.com';
  return partnerHref(base, campaign);
}

export const PSRTRAIN_SITE = 'https://www.psrtrain.com';
export const PSRTRAIN_HOME_HREF = psrTrainHref('training_resources');
export const PSRTRAIN_TRAINING_HREF = psrTrainHref('homepage_training', '/training');
export const PSRTRAIN_PRICING_HREF = psrTrainHref('pricing', '/pricing');
export const PSRTRAIN_CIT_HREF = psrTrainHref('prepare_for_cit', '/training');

export const PSRTRAIN_NAME = 'PSR Train';
export const PSRTRAIN_TAGLINE = 'PSRAS prep — mock exams, modules, and CIT-style scenarios';
export const PSRTRAIN_HEADLINE = 'Preparing for PSRAS or the CIT?';
export const PSRTRAIN_SUBHEAD =
  'Interactive practice on a partner platform — timed MCQs, learning modules, and scenario training aligned with PACE.';
export const PSRTRAIN_DISCLAIMER =
  'Training guidance only — completion does not confer PSRAS accreditation.';
export const PSRTRAIN_FREE_TESTING_NOTE = 'Free access whilst testing on psrtrain.com';
export const PSRTRAIN_CTA = 'Try PSR Train';
export const PSRTRAIN_CTA_START = 'Start training';

export const PSRTRAIN_BULLETS = [
  'Timed MCQ practice with instant feedback',
  'PACE-aligned learning modules',
  'CIT-style scenario exercises',
] as const;

import { CUSTODYNOTE_DOWNLOAD_HREF, CUSTODYNOTE_TRIAL_HREF } from '@/lib/custodynote-promo';
import { PSRTRAIN_HOME_HREF, PSRTRAIN_TRAINING_HREF } from '@/lib/psrtrain-promo';
import { POLICESTATIONAGENT_HOME_HREF } from '@/lib/policestationagent-promo';
import { SITE_URL } from '@/lib/seo-layer/config';
import {
  WHATSAPP_JOIN_URL,
  WHATSAPP_PAGE_FIRMS,
  WHATSAPP_PAGE_REPS,
} from '@/lib/site-navigation';
import { GO_COUNTY_LABELS } from '@/lib/short-links';

export type LinksHubItem = {
  href: string;
  label: string;
  description: string;
  external?: boolean;
};

export type LinksHubSection = {
  title: string;
  items: LinksHubItem[];
};

/** One-page link hub for bios, cards, and email footers. */
export const LINKS_HUB_SECTIONS: LinksHubSection[] = [
  {
    title: 'Directory',
    items: [
      {
        href: '/find',
        label: 'Find a rep',
        description: 'Search accredited police station representatives — short link to the directory.',
      },
      {
        href: '/directory',
        label: 'Full directory',
        description: 'Browse by county, station, or name.',
      },
      {
        href: '/StationsDirectory',
        label: 'Station phone numbers',
        description: 'Custody suite and main line numbers across England & Wales.',
      },
      {
        href: '/register',
        label: 'Join the directory (free)',
        description: 'Register as an accredited rep — free listing.',
      },
    ],
  },
  {
    title: 'County shortcuts',
    items: GO_COUNTY_LABELS.map(({ alias, label }) => ({
      href: `/go/${alias}`,
      label,
      description: `Short link → ${SITE_URL}/go/${alias}`,
    })),
  },
  {
    title: 'Community',
    items: [
      {
        href: WHATSAPP_PAGE_REPS,
        label: 'Join WhatsApp — reps',
        description: 'Urgent cover requests and peer support.',
      },
      {
        href: WHATSAPP_PAGE_FIRMS,
        label: 'Join WhatsApp — firms',
        description: 'Criminal defence firms seeking cover.',
      },
      {
        href: WHATSAPP_JOIN_URL,
        label: 'WhatsApp — open chat',
        description: 'Direct join link with pre-filled message.',
        external: true,
      },
      {
        href: '/Blog',
        label: 'Blog',
        description: 'Guides, news, and rep resources.',
      },
    ],
  },
  {
    title: 'Our other sites',
    items: [
      {
        href: CUSTODYNOTE_TRIAL_HREF,
        label: 'Custody Note',
        description: 'Structured custody attendance notes — 30-day free trial.',
        external: true,
      },
      {
        href: CUSTODYNOTE_DOWNLOAD_HREF,
        label: 'Custody Note — download',
        description: 'Windows & Mac desktop apps.',
        external: true,
      },
      {
        href: PSRTRAIN_TRAINING_HREF,
        label: 'PSR Train',
        description: 'PSRAS exam prep — MCQs, modules, and CIT-style scenarios.',
        external: true,
      },
      {
        href: PSRTRAIN_HOME_HREF,
        label: 'PSR Train — home',
        description: 'Training platform homepage.',
        external: true,
      },
      {
        href: POLICESTATIONAGENT_HOME_HREF,
        label: 'Police Station Agent',
        description: 'Criminal defence solicitor cover and agency services.',
        external: true,
      },
    ],
  },
];

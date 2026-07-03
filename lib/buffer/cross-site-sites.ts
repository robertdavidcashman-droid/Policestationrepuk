/** Per-site Buffer cross-posting targets — mirrors scripts/lib/buffer-cross-site-config.mjs */
export interface CrossSiteBufferTarget {
  id: string;
  hostname: string;
  productionUrl: string;
  /** Channel IDs used when querying Buffer for this site's posts */
  channelIds: string[];
  requiredPostsPerDay: number;
}

const ORG_CHANNELS = {
  linkedin: '69d26c06031bfa423cd0c50d',
  twitter: '69d26c3d031bfa423cd0c6b3',
  googlebusiness: '69d26c8b031bfa423cd0c8b7',
  facebook_criminal_solicitor: '6a304bd838b55793459b4247',
  facebook_robert_cashman: '6a304bd838b55793459b4248',
  facebook_psa: '6a304bd938b55793459b4255',
} as const;

export const CROSS_SITE_BUFFER_TARGETS: CrossSiteBufferTarget[] = [
  {
    id: 'policestationrepuk',
    hostname: 'policestationrepuk.org',
    productionUrl: 'https://policestationrepuk.org',
    channelIds: [
      ORG_CHANNELS.twitter,
      ORG_CHANNELS.linkedin,
      ORG_CHANNELS.googlebusiness,
    ],
    requiredPostsPerDay: 5,
  },
  {
    id: 'psrtrain',
    hostname: 'psrtrain.com',
    productionUrl: 'https://psrtrain.com',
    channelIds: [
      ORG_CHANNELS.linkedin,
      ORG_CHANNELS.twitter,
      ORG_CHANNELS.facebook_robert_cashman,
    ],
    requiredPostsPerDay: 5,
  },
  {
    id: 'custodynote',
    hostname: 'custodynote.com',
    productionUrl: 'https://custodynote.com',
    channelIds: [
      ORG_CHANNELS.linkedin,
      ORG_CHANNELS.facebook_criminal_solicitor,
      ORG_CHANNELS.googlebusiness,
    ],
    requiredPostsPerDay: 5,
  },
  {
    id: 'policestationagent',
    hostname: 'policestationagent.com',
    productionUrl: 'https://www.policestationagent.com',
    channelIds: [
      ORG_CHANNELS.linkedin,
      ORG_CHANNELS.twitter,
      ORG_CHANNELS.facebook_psa,
      ORG_CHANNELS.googlebusiness,
    ],
    requiredPostsPerDay: 5,
  },
];

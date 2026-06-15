/** Legacy Wix county landing URLs → canonical /directory/{slug} paths. */
export const LEGACY_COUNTY_REDIRECTS: { source: string; destination: string }[] = [
  { source: '/PoliceStationRepsKent', destination: '/directory/kent' },
  { source: '/policestationrepskent', destination: '/directory/kent' },
  { source: '/PoliceStationRepsLondon', destination: '/directory/london' },
  { source: '/policestationrepslondon', destination: '/directory/london' },
  { source: '/PoliceStationRepsEssex', destination: '/directory/essex' },
  { source: '/policestationrepsessex', destination: '/directory/essex' },
  { source: '/PoliceStationRepsManchester', destination: '/directory/greater-manchester' },
  { source: '/policestationrepsmanchester', destination: '/directory/greater-manchester' },
  { source: '/PoliceStationRepsWestMidlands', destination: '/directory/west-midlands' },
  { source: '/policestationrepswestmidlands', destination: '/directory/west-midlands' },
  { source: '/PoliceStationRepsWestYorkshire', destination: '/directory/west-yorkshire' },
  { source: '/policestationrepswestyorkshire', destination: '/directory/west-yorkshire' },
  { source: '/PoliceStationRepsSurrey', destination: '/directory/surrey' },
  { source: '/policestationrepssurrey', destination: '/directory/surrey' },
  { source: '/PoliceStationRepsSussex', destination: '/directory/sussex' },
  { source: '/policestationrepssussex', destination: '/directory/sussex' },
  { source: '/PoliceStationRepsHampshire', destination: '/directory/hampshire' },
  { source: '/policestationrepshampshire', destination: '/directory/hampshire' },
  { source: '/PoliceStationRepsNorfolk', destination: '/directory/norfolk' },
  { source: '/policestationrepsnorfolk', destination: '/directory/norfolk' },
  { source: '/PoliceStationRepsSuffolk', destination: '/directory/suffolk' },
  { source: '/policestationrepssuffolk', destination: '/directory/suffolk' },
  { source: '/PoliceStationRepsBerkshire', destination: '/directory/berkshire' },
  { source: '/policestationrepsberkshire', destination: '/directory/berkshire' },
  { source: '/PoliceStationRepsHertfordshire', destination: '/directory' },
  { source: '/policestationrepshertfordshire', destination: '/directory' },
];

export const LEGACY_COUNTY_MIRROR_PATHS = new Set(
  LEGACY_COUNTY_REDIRECTS.map((r) => r.source.replace(/^\//, '')),
);

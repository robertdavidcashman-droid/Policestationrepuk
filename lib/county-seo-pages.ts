import { getRepsByCounty, getStationsByCounty } from '@/lib/data';

export interface CountySeoPage {
  slug: string;
  countyName: string;
  pageSlug: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  intro: string;
  stationNames: string[];
}

export const COUNTY_SEO_PAGES: CountySeoPage[] = [
  {
    slug: 'kent',
    countyName: 'Kent',
    pageSlug: 'PoliceStationRepsKent',
    metaTitle: 'Kent Police Station Reps | Directory for Firms',
    metaDescription:
      'Accredited police station reps covering Kent custody suites — Maidstone, Medway, Folkestone, Tunbridge Wells. Free directory for criminal defence firms.',
    h1: 'Kent Police Station Cover Network',
    intro:
      'Accredited police station representatives covering Maidstone, Canterbury, Medway, Folkestone, Tunbridge Wells, and all Kent custody suites. Our Kent representatives are available 24/7 for criminal defence firms needing police station cover.',
    stationNames: ['Maidstone', 'Canterbury', 'Medway', 'Folkestone', 'Tunbridge Wells', 'Gravesend', 'Tonbridge', 'Sevenoaks', 'Swanley'],
  },
  {
    slug: 'london',
    countyName: 'London',
    pageSlug: 'PoliceStationRepsLondon',
    metaTitle: 'London Police Station Reps | Directory for Firms',
    metaDescription:
      'Accredited reps for Greater London custody suites — Metropolitan Police area. Search the free directory for criminal defence firms needing cover.',
    h1: 'London Police Station Representatives',
    intro:
      'Accredited police station representatives covering all Greater London custody suites. Our London representatives provide 24/7 cover for criminal defence firms across the Metropolitan Police area.',
    stationNames: ['Brixton', 'Lewisham', 'Charing Cross', 'Croydon', 'Islington', 'Hammersmith'],
  },
  {
    slug: 'essex',
    countyName: 'Essex',
    pageSlug: 'PoliceStationRepsEssex',
    metaTitle: 'Essex Police Station Reps | Directory for Firms',
    metaDescription:
      'Accredited reps for Essex Police custody suites — Chelmsford, Southend, Basildon, Colchester. Free directory for criminal defence firms.',
    h1: 'Essex Police Station Representatives',
    intro:
      'Accredited police station representatives covering all Essex Police custody suites. Our Essex representatives are available for criminal defence firms needing police station cover across the county.',
    stationNames: ['Chelmsford', 'Southend', 'Basildon', 'Colchester', 'Harlow'],
  },
  {
    slug: 'manchester',
    countyName: 'Greater Manchester',
    pageSlug: 'PoliceStationRepsManchester',
    metaTitle: 'Manchester Police Station Representatives | Find Reps for Firms',
    metaDescription:
      'Find accredited police station representatives covering Greater Manchester. Representatives available for all GMP custody suites.',
    h1: 'Manchester Police Station Representatives',
    intro:
      'Accredited police station representatives covering Greater Manchester Police custody suites. Our Manchester representatives provide cover for criminal defence firms across the region.',
    stationNames: ['Manchester Central', 'Salford', 'Bolton', 'Stockport', 'Wigan'],
  },
  {
    slug: 'west-midlands',
    countyName: 'West Midlands',
    pageSlug: 'PoliceStationRepsWestMidlands',
    metaTitle: 'West Midlands Police Station Representatives | Find Reps for Firms',
    metaDescription:
      'Find accredited police station representatives covering the West Midlands. Representatives available for all WMP custody suites.',
    h1: 'West Midlands Police Station Representatives',
    intro:
      'Accredited police station representatives covering West Midlands Police custody suites including Birmingham, Coventry, Wolverhampton, and surrounding areas.',
    stationNames: ['Birmingham', 'Coventry', 'Wolverhampton', 'Walsall', 'Dudley'],
  },
  {
    slug: 'west-yorkshire',
    countyName: 'West Yorkshire',
    pageSlug: 'PoliceStationRepsWestYorkshire',
    metaTitle: 'West Yorkshire Police Station Representatives | Find Reps for Firms',
    metaDescription:
      'Find accredited police station representatives covering West Yorkshire. Representatives available for all WYP custody suites.',
    h1: 'West Yorkshire Police Station Representatives',
    intro:
      'Accredited police station representatives covering West Yorkshire Police custody suites including Leeds, Bradford, Wakefield, and surrounding areas.',
    stationNames: ['Leeds', 'Bradford', 'Wakefield', 'Huddersfield', 'Halifax'],
  },
  {
    slug: 'surrey',
    countyName: 'Surrey',
    pageSlug: 'PoliceStationRepsSurrey',
    metaTitle: 'Surrey Police Station Reps | Directory for Firms',
    metaDescription:
      'Accredited reps for Surrey custody suites — Guildford, Woking, Staines, Reigate. Search the free UK directory for criminal defence firms.',
    h1: 'Surrey Police Station Representatives',
    intro:
      'Accredited police station representatives covering Surrey Police custody suites including Guildford, Woking, Staines, and surrounding areas.',
    stationNames: ['Guildford', 'Woking', 'Staines', 'Reigate'],
  },
  {
    slug: 'sussex',
    countyName: 'Sussex',
    pageSlug: 'PoliceStationRepsSussex',
    metaTitle: 'Sussex Police Station Reps | Directory for Firms',
    metaDescription:
      'Accredited reps for Sussex custody — Brighton, Crawley, Eastbourne, Hastings. Free directory for criminal defence firms in England and Wales.',
    h1: 'Sussex Police Station Representatives',
    intro:
      'Accredited police station representatives covering Sussex Police custody suites including Brighton, Crawley, Eastbourne, and surrounding areas.',
    stationNames: ['Brighton', 'Crawley', 'Eastbourne', 'Hastings', 'Worthing'],
  },
  {
    slug: 'hampshire',
    countyName: 'Hampshire',
    pageSlug: 'PoliceStationRepsHampshire',
    metaTitle: 'Hampshire Police Station Reps | Directory for Firms',
    metaDescription:
      'Accredited reps for Hampshire custody — Southampton, Portsmouth, Winchester. Free directory for criminal defence firms needing police station cover.',
    h1: 'Hampshire Police Station Representatives',
    intro:
      'Accredited police station representatives covering Hampshire Constabulary custody suites including Southampton, Portsmouth, Winchester, and surrounding areas.',
    stationNames: ['Southampton', 'Portsmouth', 'Winchester', 'Basingstoke'],
  },
  {
    slug: 'norfolk',
    countyName: 'Norfolk',
    pageSlug: 'PoliceStationRepsNorfolk',
    metaTitle: 'Norfolk Police Station Representatives | Find Reps for Firms',
    metaDescription:
      'Find accredited police station representatives covering Norfolk. Representatives available for all Norfolk Constabulary custody suites.',
    h1: 'Norfolk Police Station Representatives',
    intro:
      'Accredited police station representatives covering Norfolk Constabulary custody suites including Norwich, King\'s Lynn, Great Yarmouth, and surrounding areas.',
    stationNames: ['Norwich', "King's Lynn", 'Great Yarmouth'],
  },
  {
    slug: 'suffolk',
    countyName: 'Suffolk',
    pageSlug: 'PoliceStationRepsSuffolk',
    metaTitle: 'Suffolk Police Station Representatives | Find Reps for Firms',
    metaDescription:
      'Find accredited police station representatives covering Suffolk. Representatives available for all Suffolk Constabulary custody suites.',
    h1: 'Suffolk Police Station Representatives',
    intro:
      'Accredited police station representatives covering Suffolk Constabulary custody suites including Ipswich, Bury St Edmunds, Lowestoft, and surrounding areas.',
    stationNames: ['Ipswich', 'Bury St Edmunds', 'Lowestoft'],
  },
  {
    slug: 'berkshire',
    countyName: 'Berkshire',
    pageSlug: 'PoliceStationRepsBerkshire',
    metaTitle: 'Thames Valley Police Station Reps | Berkshire',
    metaDescription:
      'Accredited reps for Thames Valley custody in Berkshire — Reading, Slough, Maidenhead. Free directory for criminal defence firms.',
    h1: 'Berkshire Police Station Representatives',
    intro:
      'Accredited police station representatives covering Berkshire custody suites including Reading, Slough, Maidenhead, and surrounding areas under Thames Valley Police.',
    stationNames: ['Reading', 'Slough', 'Maidenhead', 'Windsor'],
  },
  {
    slug: 'hertfordshire',
    countyName: 'Hertfordshire',
    pageSlug: 'PoliceStationRepsHertfordshire',
    metaTitle: 'Hertfordshire Police Station Reps | Directory',
    metaDescription:
      'Accredited reps for Hertfordshire custody — Hatfield, Stevenage, Watford. Search the free directory for criminal defence firms.',
    h1: 'Hertfordshire Police Station Representatives',
    intro:
      'Accredited police station representatives covering Hertfordshire Constabulary custody suites including Hatfield, Stevenage, Watford, and surrounding areas.',
    stationNames: ['Hatfield', 'Stevenage', 'Watford', 'St Albans'],
  },
  {
    slug: 'merseyside',
    countyName: 'Merseyside',
    pageSlug: 'PoliceStationRepsMerseyside',
    metaTitle: 'Merseyside Police Station Representatives | Find Reps for Firms',
    metaDescription:
      'Find accredited police station representatives covering Merseyside. Representatives available for all Merseyside Police custody suites.',
    h1: 'Merseyside Police Station Representatives',
    intro:
      'Accredited police station representatives covering Merseyside Police custody suites including Liverpool, Birkenhead, St Helens, and surrounding areas.',
    stationNames: ['Liverpool', 'Birkenhead', 'St Helens', 'Southport'],
  },
  {
    slug: 'south-yorkshire',
    countyName: 'South Yorkshire',
    pageSlug: 'PoliceStationRepsSouthYorkshire',
    metaTitle: 'South Yorkshire Police Station Representatives | Find Reps for Firms',
    metaDescription:
      'Find accredited police station representatives covering South Yorkshire. Representatives available for all SYP custody suites.',
    h1: 'South Yorkshire Police Station Representatives',
    intro:
      'Accredited police station representatives covering South Yorkshire Police custody suites including Sheffield, Doncaster, Rotherham, and Barnsley.',
    stationNames: ['Sheffield', 'Doncaster', 'Rotherham', 'Barnsley'],
  },
  {
    slug: 'nottinghamshire',
    countyName: 'Nottinghamshire',
    pageSlug: 'PoliceStationRepsNottinghamshire',
    metaTitle: 'Nottinghamshire Police Station Representatives | Find Reps for Firms',
    metaDescription:
      'Find accredited police station representatives covering Nottinghamshire. Representatives available for Nottinghamshire Police custody suites.',
    h1: 'Nottinghamshire Police Station Representatives',
    intro:
      'Accredited police station representatives covering Nottinghamshire Police custody suites including Nottingham, Mansfield, Newark, and surrounding areas.',
    stationNames: ['Nottingham', 'Mansfield', 'Newark'],
  },
  {
    slug: 'avon-and-somerset',
    countyName: 'Avon and Somerset',
    pageSlug: 'PoliceStationRepsAvonSomerset',
    metaTitle: 'Bristol & Somerset Police Station Representatives | Find Reps for Firms',
    metaDescription:
      'Find accredited police station representatives covering Avon and Somerset. Representatives available for Bristol, Bath, and all ASP custody suites.',
    h1: 'Bristol & Somerset Police Station Representatives',
    intro:
      'Accredited police station representatives covering Avon and Somerset Police custody suites including Bristol, Bath, Taunton, and surrounding areas.',
    stationNames: ['Bristol', 'Bath', 'Taunton', 'Weston-super-Mare'],
  },
  {
    slug: 'lancashire',
    countyName: 'Lancashire',
    pageSlug: 'PoliceStationRepsLancashire',
    metaTitle: 'Lancashire Police Station Representatives | Find Reps for Firms',
    metaDescription:
      'Find accredited police station representatives covering Lancashire. Representatives available for all Lancashire Constabulary custody suites.',
    h1: 'Lancashire Police Station Representatives',
    intro:
      'Accredited police station representatives covering Lancashire Constabulary custody suites including Preston, Blackpool, Blackburn, and surrounding areas.',
    stationNames: ['Preston', 'Blackpool', 'Blackburn', 'Lancaster', 'Burnley'],
  },
  {
    slug: 'devon-and-cornwall',
    countyName: 'Devon and Cornwall',
    pageSlug: 'PoliceStationRepsDevonCornwall',
    metaTitle: 'Devon & Cornwall Police Station Representatives | Find Reps for Firms',
    metaDescription:
      'Find accredited police station representatives covering Devon and Cornwall. Representatives available for all D&C Police custody suites.',
    h1: 'Devon & Cornwall Police Station Representatives',
    intro:
      'Accredited police station representatives covering Devon and Cornwall Police custody suites including Exeter, Plymouth, Truro, and surrounding areas.',
    stationNames: ['Exeter', 'Plymouth', 'Truro', 'Torquay'],
  },
];

export function getCountySeoPage(pageSlug: string): CountySeoPage | null {
  return (
    COUNTY_SEO_PAGES.find(
      (p) => p.pageSlug.toLowerCase() === pageSlug.toLowerCase()
    ) ?? null
  );
}

export async function getCountySeoData(page: CountySeoPage) {
  const [reps, stations] = await Promise.all([
    getRepsByCounty(page.countyName),
    getStationsByCounty(page.countyName),
  ]);
  return { reps, stations };
}

export function getAllCountySeoPageSlugs(): string[] {
  return COUNTY_SEO_PAGES.map((p) => p.pageSlug);
}

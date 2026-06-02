const fs = require('fs');
const path = require('path');

function toSlug(name) {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ─── Existing 75 stations (preserved exactly) ───────────────────────────────

const existingStations = [
  { id: "s1", name: "Maidstone", slug: "maidstone", county: "Kent", address: "6 Palace Avenue, Maidstone ME15 6NF", phone: "01622 690690", custodySuite: true },
  { id: "s2", name: "Canterbury", slug: "canterbury", county: "Kent", address: "Old Dover Road, Canterbury CT1 3JQ", phone: "01227 868190", custodySuite: true },
  { id: "s3", name: "Medway", slug: "medway", county: "Kent", address: "Purser Way, Gillingham ME7 1NE", phone: "01634 792190", custodySuite: true },
  { id: "s4", name: "Folkestone", slug: "folkestone", county: "Kent", address: "Bouverie Road West, Folkestone CT20 2RB", phone: "01303 289190", custodySuite: true },
  { id: "s5", name: "Tunbridge Wells", slug: "tunbridge-wells", county: "Kent", address: "Crescent Road, Tunbridge Wells TN1 2LU", custodySuite: false },
  { id: "s6", name: "Margate", slug: "margate", county: "Kent", address: "Fort Hill, Margate CT9 1HD", custodySuite: true },
  { id: "s7", name: "Dover", slug: "dover", county: "Kent", address: "Ladywell, Dover CT16 1DJ", custodySuite: false },
  { id: "s8", name: "Ashford", slug: "ashford-kent", county: "Kent", address: "Tufton Street, Ashford TN23 1BT", custodySuite: true },
  { id: "s9", name: "Charing Cross", slug: "charing-cross", county: "London", address: "Agar Street, London WC2N 4JP", phone: "020 7240 1212", custodySuite: true },
  { id: "s10", name: "Brixton", slug: "brixton", county: "London", address: "367 Brixton Road, London SW9 7DD", custodySuite: true },
  { id: "s11", name: "Lewisham", slug: "lewisham", county: "London", address: "43 Lewisham High Street, London SE13 5JZ", custodySuite: true },
  { id: "s12", name: "Croydon", slug: "croydon", county: "London", address: "71 Park Lane, Croydon CR9 1BP", custodySuite: true },
  { id: "s13", name: "Tottenham", slug: "tottenham", county: "London", address: "398 High Road, London N17 9JA", custodySuite: true },
  { id: "s14", name: "Stoke Newington", slug: "stoke-newington", county: "London", address: "33 Stoke Newington High Street, London N16 8DS", custodySuite: true },
  { id: "s15", name: "Chelmsford", slug: "chelmsford", county: "Essex", address: "New Street, Chelmsford CM1 1GJ", custodySuite: true },
  { id: "s16", name: "Southend", slug: "southend", county: "Essex", address: "Victoria Avenue, Southend-on-Sea SS2 6ES", phone: "01702 431212", custodySuite: true },
  { id: "s17", name: "Basildon", slug: "basildon", county: "Essex", address: "Great Oaks, Basildon SS14 1EJ", custodySuite: true },
  { id: "s18", name: "Colchester", slug: "colchester", county: "Essex", address: "10 Southway, Colchester CO3 3BU", custodySuite: true },
  { id: "s19", name: "Brighton", slug: "brighton", county: "Sussex", address: "John Street, Brighton BN2 0LA", phone: "01273 665511", custodySuite: true },
  { id: "s20", name: "Eastbourne", slug: "eastbourne", county: "Sussex", address: "Grove Road, Eastbourne BN21 4TW", custodySuite: true },
  { id: "s21", name: "Crawley", slug: "crawley", county: "Sussex", address: "Northgate Avenue, Crawley RH10 8BF", custodySuite: true },
  { id: "s22", name: "Chichester", slug: "chichester", county: "Sussex", address: "Kingsham Road, Chichester PO19 8AD", custodySuite: false },
  { id: "s23", name: "Guildford", slug: "guildford", county: "Surrey", address: "Margaret Road, Guildford GU1 4QJ", custodySuite: true },
  { id: "s24", name: "Woking", slug: "woking", county: "Surrey", address: "Station Approach, Woking GU22 7AP", custodySuite: true },
  { id: "s25", name: "Staines", slug: "staines", county: "Surrey", address: "Kingston Road, Staines TW18 4LH", custodySuite: true },
  { id: "s26", name: "Reigate", slug: "reigate", county: "Surrey", address: "Reigate Road, Reigate RH2 0SB", custodySuite: false },
  { id: "s27", name: "Southampton Central", slug: "southampton-central", county: "Hampshire", address: "Southern Road, Southampton SO15 1AN", phone: "023 8084 5511", custodySuite: true },
  { id: "s28", name: "Portsmouth Central", slug: "portsmouth-central", county: "Hampshire", address: "Winston Churchill Avenue, Portsmouth PO1 2DL", custodySuite: true },
  { id: "s29", name: "Basingstoke", slug: "basingstoke", county: "Hampshire", address: "London Road, Basingstoke RG21 4AD", custodySuite: true },
  { id: "s30", name: "Winchester", slug: "winchester", county: "Hampshire", address: "North Walls, Winchester SO23 8DB", custodySuite: false },
  { id: "s31", name: "Exeter", slug: "exeter", county: "Devon", address: "Heavitree Road, Exeter EX1 2LR", custodySuite: true },
  { id: "s32", name: "Plymouth", slug: "plymouth", county: "Devon", address: "Charles Cross, Plymouth PL1 1AA", phone: "01752 487500", custodySuite: true },
  { id: "s33", name: "Torquay", slug: "torquay", county: "Devon", address: "South Street, Torquay TQ2 5EG", custodySuite: true },
  { id: "s34", name: "Taunton", slug: "taunton", county: "Somerset", address: "Shuttern, Taunton TA1 3QA", custodySuite: true },
  { id: "s35", name: "Yeovil", slug: "yeovil", county: "Somerset", address: "Horsey Lane, Yeovil BA20 1SN", custodySuite: true },
  { id: "s36", name: "Bournemouth", slug: "bournemouth", county: "Dorset", address: "Madeira Road, Bournemouth BH1 1QQ", custodySuite: true },
  { id: "s37", name: "Poole", slug: "poole", county: "Dorset", address: "Wimborne Road, Poole BH15 2BP", custodySuite: true },
  { id: "s38", name: "Gloucester", slug: "gloucester", county: "Gloucestershire", address: "Bearland, Gloucester GL1 2JP", custodySuite: true },
  { id: "s39", name: "Cheltenham", slug: "cheltenham", county: "Gloucestershire", address: "Holland Road, Cheltenham GL50 1HQ", custodySuite: true },
  { id: "s40", name: "Oxford", slug: "oxford", county: "Oxfordshire", address: "St Aldates, Oxford OX1 1TZ", custodySuite: true },
  { id: "s41", name: "Banbury", slug: "banbury", county: "Oxfordshire", address: "Warwick Road, Banbury OX16 2AQ", custodySuite: true },
  { id: "s42", name: "Reading", slug: "reading", county: "Berkshire", address: "Castle Street, Reading RG1 7TH", phone: "0118 953 6000", custodySuite: true },
  { id: "s43", name: "Slough", slug: "slough", county: "Berkshire", address: "Windsor Road, Slough SL1 2HH", custodySuite: true },
  { id: "s44", name: "Hatfield", slug: "hatfield", county: "Hertfordshire", address: "Comet Way, Hatfield AL10 9SJ", custodySuite: true },
  { id: "s45", name: "Watford", slug: "watford", county: "Hertfordshire", address: "Shady Lane, Watford WD17 1DD", custodySuite: true },
  { id: "s46", name: "Stevenage", slug: "stevenage", county: "Hertfordshire", address: "Lytton Way, Stevenage SG1 1HF", custodySuite: true },
  { id: "s47", name: "Cambridge", slug: "cambridge", county: "Cambridgeshire", address: "Parkside, Cambridge CB1 1JG", custodySuite: true },
  { id: "s48", name: "Peterborough", slug: "peterborough", county: "Cambridgeshire", address: "Bridge Street, Peterborough PE1 1EJ", custodySuite: true },
  { id: "s49", name: "Norwich", slug: "norwich", county: "Norfolk", address: "Bethel Street, Norwich NR2 1NN", custodySuite: true },
  { id: "s50", name: "King's Lynn", slug: "kings-lynn", county: "Norfolk", address: "St James Road, King's Lynn PE30 5DA", custodySuite: true },
  { id: "s51", name: "Ipswich", slug: "ipswich", county: "Suffolk", address: "Museum Street, Ipswich IP1 1HT", custodySuite: true },
  { id: "s52", name: "Bury St Edmunds", slug: "bury-st-edmunds", county: "Suffolk", address: "Raingate Street, Bury St Edmunds IP33 2AP", custodySuite: true },
  { id: "s53", name: "Birmingham Central", slug: "birmingham-central", county: "West Midlands", address: "Steelhouse Lane, Birmingham B4 6NW", phone: "0121 626 5000", custodySuite: true },
  { id: "s54", name: "Coventry", slug: "coventry", county: "West Midlands", address: "Little Park Street, Coventry CV1 2JX", custodySuite: true },
  { id: "s55", name: "Wolverhampton", slug: "wolverhampton", county: "West Midlands", address: "Bilston Street, Wolverhampton WV1 3AA", custodySuite: true },
  { id: "s56", name: "Manchester Central", slug: "manchester-central", county: "Greater Manchester", address: "Bootle Street, Manchester M2 5GU", phone: "0161 872 5050", custodySuite: true },
  { id: "s57", name: "Salford", slug: "salford", county: "Greater Manchester", address: "The Crescent, Salford M5 4PR", custodySuite: true },
  { id: "s58", name: "Bolton", slug: "bolton", county: "Greater Manchester", address: "Scholey Street, Bolton BL1 1HU", custodySuite: true },
  { id: "s59", name: "Oldham", slug: "oldham", county: "Greater Manchester", address: "Barn Street, Oldham OL1 1LP", custodySuite: true },
  { id: "s60", name: "Leeds", slug: "leeds", county: "West Yorkshire", address: "Elland Road, Leeds LS11 8BU", custodySuite: true },
  { id: "s61", name: "Bradford", slug: "bradford", county: "West Yorkshire", address: "The Tyrls, Bradford BD1 1NN", custodySuite: true },
  { id: "s62", name: "Huddersfield", slug: "huddersfield", county: "West Yorkshire", address: "Castlegate, Huddersfield HD1 2EQ", custodySuite: true },
  { id: "s63", name: "Liverpool Central", slug: "liverpool-central", county: "Merseyside", address: "Canning Place, Liverpool L1 8JX", custodySuite: true },
  { id: "s64", name: "Birkenhead", slug: "birkenhead", county: "Merseyside", address: "Exmouth Street, Birkenhead CH41 5EP", custodySuite: true },
  { id: "s65", name: "Sheffield Central", slug: "sheffield-central", county: "South Yorkshire", address: "Snig Hill, Sheffield S3 8LY", custodySuite: true },
  { id: "s66", name: "Doncaster", slug: "doncaster", county: "South Yorkshire", address: "College Road, Doncaster DN1 3HT", custodySuite: true },
  { id: "s67", name: "Preston", slug: "preston", county: "Lancashire", address: "Lawson Street, Preston PR1 2QG", custodySuite: true },
  { id: "s68", name: "Blackburn", slug: "blackburn", county: "Lancashire", address: "Whitebirk Drive, Blackburn BB1 3HP", custodySuite: true },
  { id: "s69", name: "Burnley", slug: "burnley", county: "Lancashire", address: "Parker Lane, Burnley BB11 2BT", custodySuite: true },
  { id: "s70", name: "Nottingham Central", slug: "nottingham-central", county: "Nottinghamshire", address: "Byron House, Maid Marian Way, Nottingham NG1 6HS", custodySuite: true },
  { id: "s71", name: "Mansfield", slug: "mansfield", county: "Nottinghamshire", address: "Great Central Road, Mansfield NG18 2HQ", custodySuite: true },
  { id: "s72", name: "Northampton", slug: "northampton", county: "Northamptonshire", address: "Wootton Hall Park, Northampton NN4 0JQ", custodySuite: true },
  { id: "s73", name: "Kettering", slug: "kettering", county: "Northamptonshire", address: "London Road, Kettering NN15 7QA", custodySuite: true },
  { id: "s74", name: "Warwick", slug: "warwick", county: "Warwickshire", address: "Priory Road, Warwick CV34 4NA", custodySuite: true },
  { id: "s75", name: "Nuneaton", slug: "nuneaton", county: "Warwickshire", address: "Vicarage Street, Nuneaton CV11 4DH", custodySuite: true },
];

// ─── New stations (s76+) ────────────────────────────────────────────────────

const newStationData = [
  // London
  { name: "Paddington Green", county: "London", address: "2 Harrow Road, London W2 1XJ", custodySuite: true },
  { name: "Holborn", county: "London", address: "10 Lambs Conduit Street, London WC1N 3NR", custodySuite: true },
  { name: "Bethnal Green", county: "London", address: "12 Victoria Park Square, London E2 9PB", custodySuite: true },
  { name: "Forest Gate", county: "London", address: "350 Romford Road, London E7 8BS", custodySuite: true },
  { name: "Ilford", county: "London", address: "270 High Road, Ilford IG1 1QB", phone: "020 8554 1212", custodySuite: true },
  { name: "Barking", county: "London", address: "72 Ripple Road, Barking IG11 7PR", custodySuite: true },
  { name: "Dagenham", county: "London", address: "561 Rainham Road South, Dagenham RM10 7XJ", custodySuite: false },
  { name: "Romford", county: "London", address: "19 Main Road, Romford RM1 3BJ", custodySuite: true },
  { name: "Walthamstow", county: "London", address: "17 Queens Road, Walthamstow E17 8QP", custodySuite: true },
  { name: "Edmonton", county: "London", address: "462 Fore Street, Edmonton N9 0PW", custodySuite: true },
  { name: "Wood Green", county: "London", address: "High Road, Wood Green N22 8JG", custodySuite: false },
  { name: "Hendon", county: "London", address: "Graham Park Way, London NW9 5TW", custodySuite: true },
  { name: "Colindale", county: "London", address: "Grahame Park Way, Colindale NW9 5TQ", custodySuite: true },
  { name: "Wembley", county: "London", address: "603 Harrow Road, Wembley HA0 2HH", custodySuite: true },
  { name: "Harrow", county: "London", address: "74 Northolt Road, Harrow HA2 0DN", custodySuite: true },
  { name: "Uxbridge", county: "London", address: "1 Warwick Place, Uxbridge UB8 1PG", custodySuite: true },
  { name: "Ealing", county: "London", address: "67 Uxbridge Road, Ealing W5 5SA", custodySuite: true },
  { name: "Acton", county: "London", address: "250 High Street, Acton W3 9BH", custodySuite: false },
  { name: "Hammersmith", county: "London", address: "226 Shepherd's Bush Road, London W6 7NX", custodySuite: true },
  { name: "Fulham", county: "London", address: "Heckfield Place, London SW6 5NR", custodySuite: false },
  { name: "Wandsworth", county: "London", address: "146 Wandsworth High Street, London SW18 4JB", custodySuite: true },
  { name: "Sutton", county: "London", address: "6 Carshalton Road, Sutton SM1 4RF", custodySuite: true },
  { name: "Kingston", county: "London", address: "5 High Street, Kingston upon Thames KT1 1LB", custodySuite: true },
  { name: "Wimbledon", county: "London", address: "15 Queens Road, Wimbledon SW19 8NN", custodySuite: true },
  { name: "Bromley", county: "London", address: "High Street, Bromley BR1 1ER", custodySuite: true },
  { name: "Greenwich", county: "London", address: "31 Royal Hill, Greenwich SE10 8RT", custodySuite: true },
  { name: "Woolwich", county: "London", address: "31 Market Street, Woolwich SE18 6QQ", custodySuite: true },
  { name: "Plumstead", county: "London", address: "160 Plumstead High Street, London SE18 1JQ", custodySuite: false },
  { name: "Bexleyheath", county: "London", address: "2 Arnsberg Way, Bexleyheath DA7 4QS", custodySuite: true },
  { name: "Catford", county: "London", address: "33 Catford Road, London SE6 4SW", custodySuite: false },
  { name: "Peckham", county: "London", address: "177 Peckham High Street, London SE15 5SL", custodySuite: true },
  { name: "Camberwell", county: "London", address: "22 Camberwell Church Street, London SE5 8QU", custodySuite: false },
  { name: "Kennington", county: "London", address: "49 Kennington Road, London SE11 4QH", custodySuite: true },
  { name: "Walworth", county: "London", address: "12 Manor Place, London SE17 3BD", custodySuite: false },
  { name: "Southwark", county: "London", address: "323 Borough High Street, London SE1 1JL", custodySuite: true },

  // Kent
  { name: "Gravesend", county: "Kent", address: "Windmill Street, Gravesend DA12 1BE", phone: "01474 564422", custodySuite: true },
  { name: "Tonbridge", county: "Kent", address: "Pembury Road, Tonbridge TN9 2HS", phone: "01732 379190", custodySuite: true },
  { name: "Sevenoaks", county: "Kent", address: "Morewood Close, Sevenoaks TN13 2HU", custodySuite: false },
  { name: "Swanley", county: "Kent", address: "London Road, Swanley BR8 7AE", custodySuite: false },
  { name: "Dartford", county: "Kent", address: "Overy Street, Dartford DA1 1JD", custodySuite: true },
  { name: "Sittingbourne", county: "Kent", address: "Bell Road, Sittingbourne ME10 4DH", custodySuite: true },
  { name: "Faversham", county: "Kent", address: "East Street, Faversham ME13 8AQ", custodySuite: false },
  { name: "Herne Bay", county: "Kent", address: "Station Road, Herne Bay CT6 5QP", custodySuite: false },
  { name: "Ramsgate", county: "Kent", address: "Cavendish Street, Ramsgate CT11 9EJ", custodySuite: true },
  { name: "Deal", county: "Kent", address: "Park Avenue, Deal CT14 9RL", custodySuite: false },
  { name: "Sheerness", county: "Kent", address: "Trinity Road, Sheerness ME12 2HS", custodySuite: false },
  { name: "Cranbrook", county: "Kent", address: "Stone Street, Cranbrook TN17 3HF", custodySuite: false },

  // Essex
  { name: "Harlow", county: "Essex", address: "Kao Park, Harlow CM17 9NA", custodySuite: true },
  { name: "Brentwood", county: "Essex", address: "London Road, Brentwood CM14 4QJ", custodySuite: true },
  { name: "Grays", county: "Essex", address: "Brooke Road, Grays RM17 5BS", custodySuite: true },
  { name: "Braintree", county: "Essex", address: "Blyths Meadow, Braintree CM7 3DJ", custodySuite: false },
  { name: "Clacton", county: "Essex", address: "Beatrice Road, Clacton-on-Sea CO15 1DG", custodySuite: true },
  { name: "Witham", county: "Essex", address: "Newland Street, Witham CM8 2AF", custodySuite: false },
  { name: "Rayleigh", county: "Essex", address: "Castle Road, Rayleigh SS6 7QF", custodySuite: true },
  { name: "Canvey Island", county: "Essex", address: "Long Road, Canvey Island SS8 0JA", custodySuite: false },

  // Surrey
  { name: "Epsom", county: "Surrey", address: "Church Street, Epsom KT17 4QB", custodySuite: true },
  { name: "Dorking", county: "Surrey", address: "Moores Road, Dorking RH4 2AA", custodySuite: false },
  { name: "Camberley", county: "Surrey", address: "Portesbery Road, Camberley GU15 3SZ", custodySuite: true },
  { name: "Godalming", county: "Surrey", address: "Queen Street, Godalming GU7 1BA", custodySuite: false },
  { name: "Leatherhead", county: "Surrey", address: "Bull Hill, Leatherhead KT22 7AH", custodySuite: false },
  { name: "Redhill", county: "Surrey", address: "Donyngs, Redhill RH1 6RE", custodySuite: true },
  { name: "Esher", county: "Surrey", address: "High Street, Esher KT10 9RQ", custodySuite: false },

  // Sussex
  { name: "Worthing", county: "Sussex", address: "Chatsworth Road, Worthing BN11 1LY", custodySuite: true },
  { name: "Hastings", county: "Sussex", address: "Bohemia Road, Hastings TN34 1EX", custodySuite: true },
  { name: "Lewes", county: "Sussex", address: "North Street, Lewes BN7 2PE", custodySuite: false },
  { name: "Horsham", county: "Sussex", address: "Hurst Road, Horsham RH12 2DJ", custodySuite: true },
  { name: "Bognor Regis", county: "Sussex", address: "Victoria Drive, Bognor Regis PO21 2EE", custodySuite: false },
  { name: "Littlehampton", county: "Sussex", address: "Beaumont Road, Littlehampton BN17 5NA", custodySuite: false },

  // Hampshire
  { name: "Aldershot", county: "Hampshire", address: "Wellington Avenue, Aldershot GU11 1NY", custodySuite: true },
  { name: "Andover", county: "Hampshire", address: "East Street, Andover SP10 1EQ", custodySuite: true },
  { name: "Fareham", county: "Hampshire", address: "Quay Street, Fareham PO16 0NA", custodySuite: true },
  { name: "Gosport", county: "Hampshire", address: "South Street, Gosport PO12 1ES", custodySuite: false },
  { name: "Havant", county: "Hampshire", address: "Civic Centre Road, Havant PO9 2AX", custodySuite: true },
  { name: "New Forest", county: "Hampshire", address: "Commercial Road, Totton SO40 3BH", custodySuite: false },

  // West Midlands
  { name: "Walsall", county: "West Midlands", address: "Green Lane, Walsall WS2 8HE", custodySuite: true },
  { name: "Dudley", county: "West Midlands", address: "Tower Street, Dudley DY1 1NB", custodySuite: true },
  { name: "Sandwell", county: "West Midlands", address: "Oldbury Road, Smethwick B66 1JE", custodySuite: true },
  { name: "Solihull", county: "West Midlands", address: "Homer Road, Solihull B91 3QJ", custodySuite: true },
  { name: "Sutton Coldfield", county: "West Midlands", address: "Lichfield Road, Sutton Coldfield B74 2NR", custodySuite: false },
  { name: "West Bromwich", county: "West Midlands", address: "High Street, West Bromwich B70 8HR", custodySuite: true },

  // Greater Manchester
  { name: "Stockport", county: "Greater Manchester", address: "Lee Street, Stockport SK1 3LR", custodySuite: true },
  { name: "Bury", county: "Greater Manchester", address: "Irwell Street, Bury BL9 0DA", custodySuite: true },
  { name: "Rochdale", county: "Greater Manchester", address: "The Esplanade, Rochdale OL16 1AG", custodySuite: true },
  { name: "Tameside", county: "Greater Manchester", address: "Ashton Old Road, Ashton-under-Lyne OL6 7PT", custodySuite: true },
  { name: "Trafford", county: "Greater Manchester", address: "Talbot Road, Stretford M32 0XB", custodySuite: false },
  { name: "Wigan", county: "Greater Manchester", address: "Crawford Street, Wigan WN1 1ND", custodySuite: true },
  { name: "Ashton-under-Lyne", county: "Greater Manchester", address: "Manchester Road, Ashton-under-Lyne OL7 0BG", custodySuite: true },

  // West Yorkshire
  { name: "Wakefield", county: "West Yorkshire", address: "Wood Street, Wakefield WF1 2HQ", custodySuite: true },
  { name: "Halifax", county: "West Yorkshire", address: "Carlton Street, Halifax HX1 2AQ", custodySuite: true },
  { name: "Dewsbury", county: "West Yorkshire", address: "Aldams Road, Dewsbury WF12 9AS", custodySuite: true },
  { name: "Keighley", county: "West Yorkshire", address: "Royd Way, Keighley BD21 4DX", custodySuite: false },
  { name: "Pontefract", county: "West Yorkshire", address: "Stuart Road, Pontefract WF8 4PB", custodySuite: false },

  // South Yorkshire
  { name: "Rotherham", county: "South Yorkshire", address: "Main Street, Rotherham S60 1PH", custodySuite: true },
  { name: "Barnsley", county: "South Yorkshire", address: "Churchfield, Barnsley S70 2JB", custodySuite: true },

  // Lancashire
  { name: "Lancaster", county: "Lancashire", address: "Thurnham Street, Lancaster LA1 1YB", custodySuite: true },
  { name: "Skelmersdale", county: "Lancashire", address: "Hall Green, Skelmersdale WN8 6PA", custodySuite: false },
  { name: "Chorley", county: "Lancashire", address: "St Thomas's Road, Chorley PR7 1HP", custodySuite: true },
  { name: "Accrington", county: "Lancashire", address: "Manchester Road, Accrington BB5 2DT", custodySuite: true },
  { name: "Nelson", county: "Lancashire", address: "Scotland Road, Nelson BB9 7YE", custodySuite: false },

  // Merseyside
  { name: "St Helens", county: "Merseyside", address: "College Street, St Helens WA10 1TG", custodySuite: true },
  { name: "Knowsley", county: "Merseyside", address: "Manor Farm Road, Huyton L36 0UB", custodySuite: true },
  { name: "Sefton", county: "Merseyside", address: "Marsh Lane, Bootle L20 5EW", custodySuite: true },
  { name: "Southport", county: "Merseyside", address: "Albert Road, Southport PR9 0LG", custodySuite: false },
  { name: "Bootle", county: "Merseyside", address: "Merton Road, Bootle L20 3BJ", custodySuite: true },

  // Devon
  { name: "Barnstaple", county: "Devon", address: "North Walk, Barnstaple EX31 1DX", custodySuite: true },
  { name: "Newton Abbot", county: "Devon", address: "East Street, Newton Abbot TQ12 2LD", custodySuite: true },
  { name: "Bideford", county: "Devon", address: "New Road, Bideford EX39 2BT", custodySuite: false },
  { name: "Ilfracombe", county: "Devon", address: "Church Road, Ilfracombe EX34 8AE", custodySuite: false },

  // Dorset
  { name: "Weymouth", county: "Dorset", address: "Radipole Lane, Weymouth DT4 9SH", custodySuite: true },
  { name: "Dorchester", county: "Dorset", address: "Bridport Road, Dorchester DT1 1QR", custodySuite: true },
  { name: "Wimborne", county: "Dorset", address: "Hanham Road, Wimborne BH21 1AS", custodySuite: false },

  // Norfolk
  { name: "Great Yarmouth", county: "Norfolk", address: "Howard Street North, Great Yarmouth NR30 1PR", custodySuite: true },
  { name: "Thetford", county: "Norfolk", address: "Kilverstone Road, Thetford IP24 2QY", custodySuite: false },
  { name: "Dereham", county: "Norfolk", address: "Commercial Road, Dereham NR19 1AE", custodySuite: false },
  { name: "Wymondham", county: "Norfolk", address: "Harts Farm Road, Wymondham NR18 0WA", custodySuite: true },

  // Suffolk
  { name: "Lowestoft", county: "Suffolk", address: "Old Nelson Street, Lowestoft NR32 1PE", custodySuite: true },
  { name: "Felixstowe", county: "Suffolk", address: "High Road West, Felixstowe IP11 9BB", custodySuite: false },
  { name: "Haverhill", county: "Suffolk", address: "Hollands Road, Haverhill CB9 8PJ", custodySuite: false },
  { name: "Mildenhall", county: "Suffolk", address: "Queensway, Mildenhall IP28 7JQ", custodySuite: true },

  // Cambridgeshire
  { name: "Huntingdon", county: "Cambridgeshire", address: "St Johns Street, Huntingdon PE29 3DD", custodySuite: true },
  { name: "March", county: "Cambridgeshire", address: "Burrowmoor Road, March PE15 9RB", custodySuite: false },
  { name: "Wisbech", county: "Cambridgeshire", address: "Churchill Road, Wisbech PE13 1SD", custodySuite: true },
  { name: "Ely", county: "Cambridgeshire", address: "Nutholt Lane, Ely CB7 4PL", custodySuite: false },

  // Hertfordshire
  { name: "St Albans", county: "Hertfordshire", address: "Victoria Street, St Albans AL1 3JL", custodySuite: true },
  { name: "Hemel Hempstead", county: "Hertfordshire", address: "Combe Street, Hemel Hempstead HP1 1HH", custodySuite: true },
  { name: "Hitchin", county: "Hertfordshire", address: "College Road, Hitchin SG5 1JX", custodySuite: false },
  { name: "Letchworth", county: "Hertfordshire", address: "Nevells Road, Letchworth SG6 4UB", custodySuite: false },
  { name: "Hertford", county: "Hertfordshire", address: "Ware Road, Hertford SG13 7DN", custodySuite: true },

  // Berkshire
  { name: "Maidenhead", county: "Berkshire", address: "Bridge Road, Maidenhead SL6 8LB", custodySuite: true },
  { name: "Windsor", county: "Berkshire", address: "Alma Road, Windsor SL4 3HJ", custodySuite: true },
  { name: "Bracknell", county: "Berkshire", address: "The Broadway, Bracknell RG12 1AE", custodySuite: true },
  { name: "Wokingham", county: "Berkshire", address: "Rectory Road, Wokingham RG40 1DG", custodySuite: false },
  { name: "Newbury", county: "Berkshire", address: "Mill Lane, Newbury RG14 5QS", custodySuite: true },

  // Oxfordshire
  { name: "Abingdon", county: "Oxfordshire", address: "Bridge Street, Abingdon OX14 3HN", custodySuite: true },
  { name: "Witney", county: "Oxfordshire", address: "Welch Way, Witney OX28 6JH", custodySuite: false },
  { name: "Bicester", county: "Oxfordshire", address: "Queens Avenue, Bicester OX26 2NR", custodySuite: true },
  { name: "Didcot", county: "Oxfordshire", address: "Station Road, Didcot OX11 7LJ", custodySuite: false },
  { name: "Henley-on-Thames", county: "Oxfordshire", address: "Greys Road, Henley-on-Thames RG9 1QR", custodySuite: false },

  // Wiltshire
  { name: "Swindon", county: "Wiltshire", address: "Fleming Way, Swindon SN1 2HG", phone: "01793 528111", custodySuite: true },
  { name: "Salisbury", county: "Wiltshire", address: "Wilton Road, Salisbury SP2 7QQ", custodySuite: true },
  { name: "Chippenham", county: "Wiltshire", address: "Wood Lane, Chippenham SN15 3DL", custodySuite: true },
  { name: "Trowbridge", county: "Wiltshire", address: "Polebarn Road, Trowbridge BA14 7EG", custodySuite: true },
  { name: "Devizes", county: "Wiltshire", address: "New Park Street, Devizes SN10 1DT", custodySuite: false },
  { name: "Melksham", county: "Wiltshire", address: "Market Place, Melksham SN12 6EX", custodySuite: false },

  // Avon
  { name: "Bristol Central", county: "Avon", address: "Nelson Street, Bristol BS1 2LE", phone: "0117 927 7777", custodySuite: true },
  { name: "Bath", county: "Avon", address: "Manvers Street, Bath BA1 1JN", custodySuite: true },
  { name: "Keynsham", county: "Avon", address: "Bath Hill, Keynsham BS31 1HG", custodySuite: true },

  // Cornwall
  { name: "Truro", county: "Cornwall", address: "Tregolls Road, Truro TR1 1PF", custodySuite: true },
  { name: "Penzance", county: "Cornwall", address: "Penalverne Drive, Penzance TR18 2QS", custodySuite: true },
  { name: "Newquay", county: "Cornwall", address: "Tolcarne Road, Newquay TR7 2NQ", custodySuite: false },
  { name: "Falmouth", county: "Cornwall", address: "Dracaena Avenue, Falmouth TR11 2ES", custodySuite: true },
  { name: "Bodmin", county: "Cornwall", address: "Priory Road, Bodmin PL31 2AB", custodySuite: true },
  { name: "St Austell", county: "Cornwall", address: "Palace Road, St Austell PL25 4AR", custodySuite: false },
  { name: "Camborne", county: "Cornwall", address: "College Street, Camborne TR14 8EH", custodySuite: true },

  // Derbyshire
  { name: "Derby", county: "Derbyshire", address: "Full Street, Derby DE1 3AF", phone: "01332 613000", custodySuite: true },
  { name: "Chesterfield", county: "Derbyshire", address: "Beetwell Street, Chesterfield S40 1QP", custodySuite: true },
  { name: "Buxton", county: "Derbyshire", address: "Silverlands, Buxton SK17 6QJ", custodySuite: true },
  { name: "Ilkeston", county: "Derbyshire", address: "South Street, Ilkeston DE7 5QJ", custodySuite: false },
  { name: "Swadlincote", county: "Derbyshire", address: "Civic Way, Swadlincote DE11 0AE", custodySuite: false },

  // Durham
  { name: "Durham", county: "Durham", address: "New Elvet, Durham DH1 3AQ", custodySuite: true },
  { name: "Darlington", county: "Durham", address: "Parkgate, Darlington DL1 1RU", phone: "01325 467681", custodySuite: true },
  { name: "Bishop Auckland", county: "Durham", address: "Watling Road, Bishop Auckland DL14 6JQ", custodySuite: true },
  { name: "Consett", county: "Durham", address: "Parliament Street, Consett DH8 5DL", custodySuite: false },
  { name: "Newton Aycliffe", county: "Durham", address: "Central Avenue, Newton Aycliffe DL5 5QG", custodySuite: true },

  // East Yorkshire / Humberside
  { name: "Hull", county: "Humberside", address: "Queens Gardens, Kingston upon Hull HU1 3DL", phone: "01482 220111", custodySuite: true },
  { name: "Grimsby", county: "Humberside", address: "Victoria Street, Grimsby DN31 1DB", custodySuite: true },
  { name: "Scunthorpe", county: "Humberside", address: "Carlton Street, Scunthorpe DN15 6QQ", custodySuite: true },
  { name: "Goole", county: "Humberside", address: "Carlisle Street, Goole DN14 5DS", custodySuite: false },
  { name: "Beverley", county: "Humberside", address: "Norwood, Beverley HU17 9ET", custodySuite: true },
  { name: "Bridlington", county: "Humberside", address: "Prospect Street, Bridlington YO15 2AE", custodySuite: false },

  // Leicestershire
  { name: "Leicester", county: "Leicestershire", address: "Mansfield House, Lancaster Road, Leicester LE1 7HA", phone: "0116 222 2222", custodySuite: true },
  { name: "Loughborough", county: "Leicestershire", address: "Southfields Road, Loughborough LE11 5TJ", custodySuite: true },
  { name: "Hinckley", county: "Leicestershire", address: "Upper Bond Street, Hinckley LE10 1RJ", custodySuite: true },
  { name: "Melton Mowbray", county: "Leicestershire", address: "Asfordby Road, Melton Mowbray LE13 0HR", custodySuite: false },

  // Lincolnshire
  { name: "Lincoln", county: "Lincolnshire", address: "West Parade, Lincoln LN1 1YP", phone: "01522 882222", custodySuite: true },
  { name: "Boston", county: "Lincolnshire", address: "Lincoln Lane, Boston PE21 8QS", custodySuite: true },
  { name: "Grantham", county: "Lincolnshire", address: "Harlaxton Road, Grantham NG31 7SQ", custodySuite: true },
  { name: "Skegness", county: "Lincolnshire", address: "Grand Parade, Skegness PE25 2UG", custodySuite: false },
  { name: "Spalding", county: "Lincolnshire", address: "Westlode Street, Spalding PE11 2AF", custodySuite: true },

  // Staffordshire
  { name: "Stoke-on-Trent", county: "Staffordshire", address: "Bethesda Street, Hanley, Stoke-on-Trent ST1 3DW", phone: "01785 257717", custodySuite: true },
  { name: "Stafford", county: "Staffordshire", address: "Eastgate Street, Stafford ST16 2DQ", custodySuite: true },
  { name: "Burton", county: "Staffordshire", address: "Horninglow Street, Burton upon Trent DE14 1PA", custodySuite: true },
  { name: "Lichfield", county: "Staffordshire", address: "Frog Lane, Lichfield WS13 6YJ", custodySuite: false },
  { name: "Tamworth", county: "Staffordshire", address: "Spinning School Lane, Tamworth B79 7AW", custodySuite: true },
  { name: "Cannock", county: "Staffordshire", address: "Old Hednesford Road, Cannock WS11 1BT", custodySuite: true },

  // North Yorkshire
  { name: "York", county: "North Yorkshire", address: "Fulford Road, York YO10 4BY", phone: "01904 618691", custodySuite: true },
  { name: "Scarborough", county: "North Yorkshire", address: "Northway, Scarborough YO12 7AE", custodySuite: true },
  { name: "Harrogate", county: "North Yorkshire", address: "Beckwith Head Road, Harrogate HG3 1FR", custodySuite: true },
  { name: "Skipton", county: "North Yorkshire", address: "Otley Road, Skipton BD23 1EZ", custodySuite: false },
  { name: "Northallerton", county: "North Yorkshire", address: "Racecourse Lane, Northallerton DL7 8TQ", custodySuite: true },
  { name: "Selby", county: "North Yorkshire", address: "Portholme Road, Selby YO8 4QQ", custodySuite: false },
  { name: "Ripon", county: "North Yorkshire", address: "North Street, Ripon HG4 1DP", custodySuite: false },

  // Cleveland
  { name: "Middlesbrough", county: "Cleveland", address: "Bridge Street West, Middlesbrough TS2 1AE", phone: "01642 326326", custodySuite: true },
  { name: "Stockton", county: "Cleveland", address: "Bishop Street, Stockton-on-Tees TS18 1SY", custodySuite: true },
  { name: "Hartlepool", county: "Cleveland", address: "Avenue Road, Hartlepool TS24 8BB", custodySuite: true },
  { name: "Redcar", county: "Cleveland", address: "Kirkleatham Street, Redcar TS10 1QQ", custodySuite: false },

  // Cumbria
  { name: "Carlisle", county: "Cumbria", address: "English Street, Carlisle CA3 8NH", phone: "01228 528191", custodySuite: true },
  { name: "Barrow", county: "Cumbria", address: "Market Street, Barrow-in-Furness LA14 2LE", custodySuite: true },
  { name: "Kendal", county: "Cumbria", address: "Busher Walk, Kendal LA9 4RJ", custodySuite: true },
  { name: "Penrith", county: "Cumbria", address: "Hunter Lane, Penrith CA11 7JU", custodySuite: true },
  { name: "Workington", county: "Cumbria", address: "Hall Brow, Workington CA14 4EG", custodySuite: false },
  { name: "Whitehaven", county: "Cumbria", address: "Scotch Street, Whitehaven CA28 7NL", custodySuite: false },

  // Tyne and Wear
  { name: "Newcastle", county: "Tyne and Wear", address: "Pilgrim Street, Newcastle upon Tyne NE1 6QF", phone: "0191 214 6555", custodySuite: true },
  { name: "Gateshead", county: "Tyne and Wear", address: "Prince Consort Road, Gateshead NE8 4DS", custodySuite: true },
  { name: "Sunderland", county: "Tyne and Wear", address: "Toward Road, Sunderland SR1 2QJ", custodySuite: true },
  { name: "South Shields", county: "Tyne and Wear", address: "Keppel Street, South Shields NE33 1AQ", custodySuite: true },
  { name: "North Shields", county: "Tyne and Wear", address: "Saville Street, North Shields NE30 1QN", custodySuite: true },
  { name: "Wallsend", county: "Tyne and Wear", address: "Lawson Street, Wallsend NE28 6JA", custodySuite: false },

  // Northumberland
  { name: "Alnwick", county: "Northumberland", address: "Pottergate, Alnwick NE66 1JR", custodySuite: true },
  { name: "Berwick", county: "Northumberland", address: "Church Street, Berwick-upon-Tweed TD15 1EE", custodySuite: false },
  { name: "Morpeth", county: "Northumberland", address: "Castle Square, Morpeth NE61 1YG", custodySuite: true },
  { name: "Hexham", county: "Northumberland", address: "Shaftoe Leazes, Hexham NE46 3HB", custodySuite: true },
  { name: "Blyth", county: "Northumberland", address: "Bridge Street, Blyth NE24 2AA", custodySuite: false },
  { name: "Cramlington", county: "Northumberland", address: "Forum Way, Cramlington NE23 6QN", custodySuite: true },

  // Bedfordshire
  { name: "Bedford", county: "Bedfordshire", address: "Greyfriars, Bedford MK40 1HG", custodySuite: true },
  { name: "Luton", county: "Bedfordshire", address: "Buxton Road, Luton LU1 1PP", phone: "01234 841212", custodySuite: true },
  { name: "Dunstable", county: "Bedfordshire", address: "West Street, Dunstable LU6 1SL", custodySuite: true },
  { name: "Leighton Buzzard", county: "Bedfordshire", address: "Grovebury Road, Leighton Buzzard LU7 4TU", custodySuite: false },
  { name: "Biggleswade", county: "Bedfordshire", address: "Shortmead Street, Biggleswade SG18 0AT", custodySuite: false },

  // Buckinghamshire
  { name: "Aylesbury", county: "Buckinghamshire", address: "Gatehouse Road, Aylesbury HP19 8FB", custodySuite: true },
  { name: "High Wycombe", county: "Buckinghamshire", address: "Queen Victoria Road, High Wycombe HP11 1BE", custodySuite: true },
  { name: "Milton Keynes", county: "Buckinghamshire", address: "Sherwood Drive, Bletchley, Milton Keynes MK3 6GS", custodySuite: true },
  { name: "Amersham", county: "Buckinghamshire", address: "King George V Road, Amersham HP6 5AW", custodySuite: false },
  { name: "Chesham", county: "Buckinghamshire", address: "White Hill, Chesham HP5 1AG", custodySuite: false },

  // North Wales
  { name: "Wrexham", county: "North Wales", address: "Bodhyfryd, Wrexham LL12 7BB", phone: "01978 290222", custodySuite: true },
  { name: "Rhyl", county: "North Wales", address: "Wellington Road, Rhyl LL18 1BA", custodySuite: true },
  { name: "Bangor", county: "North Wales", address: "Garth Road, Bangor LL57 2RT", custodySuite: true },
  { name: "Llandudno", county: "North Wales", address: "Oxford Road, Llandudno LL30 1DZ", custodySuite: true },
  { name: "Colwyn Bay", county: "North Wales", address: "Abergele Road, Colwyn Bay LL29 8SW", custodySuite: false },
  { name: "Caernarfon", county: "North Wales", address: "Llanberis Road, Caernarfon LL55 2DF", custodySuite: true },
  { name: "Holyhead", county: "North Wales", address: "Stanley Street, Holyhead LL65 1HB", custodySuite: false },

  // South Wales
  { name: "Cardiff Central", county: "South Wales", address: "King Edward VII Avenue, Cardiff CF10 3NN", phone: "029 2022 2111", custodySuite: true },
  { name: "Swansea Central", county: "South Wales", address: "Grove Place, Swansea SA1 5AR", custodySuite: true },
  { name: "Newport Central", county: "South Wales", address: "Cardiff Road, Newport NP20 2EJ", custodySuite: true },
  { name: "Bridgend", county: "South Wales", address: "Cheapside, Bridgend CF31 3BN", custodySuite: true },
  { name: "Neath", county: "South Wales", address: "Gnoll Park Road, Neath SA11 3BW", custodySuite: true },
  { name: "Port Talbot", county: "South Wales", address: "Station Road, Port Talbot SA13 1NR", custodySuite: false },
  { name: "Barry", county: "South Wales", address: "Gladstone Road, Barry CF63 1QT", custodySuite: true },
  { name: "Merthyr Tydfil", county: "South Wales", address: "Rhydycar, Merthyr Tydfil CF48 1UZ", custodySuite: true },

  // Gwent
  { name: "Cwmbran", county: "Gwent", address: "Tudor Road, Cwmbran NP44 3YB", custodySuite: true },
  { name: "Pontypool", county: "Gwent", address: "Osborne Road, Pontypool NP4 6LU", custodySuite: true },
  { name: "Ebbw Vale", county: "Gwent", address: "Bethcar Street, Ebbw Vale NP23 6HQ", custodySuite: false },
  { name: "Abergavenny", county: "Gwent", address: "Tudor Street, Abergavenny NP7 5DH", custodySuite: true },

  // Dyfed-Powys
  { name: "Carmarthen", county: "Dyfed-Powys", address: "Friars Park, Carmarthen SA31 3AT", phone: "01267 222020", custodySuite: true },
  { name: "Llanelli", county: "Dyfed-Powys", address: "Inkerman Street, Llanelli SA15 1SH", custodySuite: true },
  { name: "Haverfordwest", county: "Dyfed-Powys", address: "Merlin's Bridge, Haverfordwest SA61 1PG", custodySuite: true },
  { name: "Aberystwyth", county: "Dyfed-Powys", address: "Boulevard de Saint-Brieuc, Aberystwyth SY23 1PH", custodySuite: true },
  { name: "Brecon", county: "Dyfed-Powys", address: "Lion Street, Brecon LD3 7HY", custodySuite: false },
  { name: "Newtown", county: "Dyfed-Powys", address: "Park Street, Newtown SY16 1EN", custodySuite: true },
];

// ─── Build new stations with sequential IDs ─────────────────────────────────

let nextId = 76;
const newStations = newStationData.map((s) => {
  const station = {
    id: `s${nextId++}`,
    name: s.name,
    slug: toSlug(s.name),
    county: s.county,
    address: s.address,
    custodySuite: s.custodySuite,
  };
  if (s.phone) station.phone = s.phone;
  return station;
});

const allStations = [...existingStations, ...newStations];

// ─── Existing 25 counties (preserved exactly) ──────────────────────────────

const existingCounties = [
  { id: "1", name: "Kent", slug: "kent", region: "South East" },
  { id: "2", name: "London", slug: "london", region: "London" },
  { id: "3", name: "Essex", slug: "essex", region: "East of England" },
  { id: "4", name: "Sussex", slug: "sussex", region: "South East" },
  { id: "5", name: "Surrey", slug: "surrey", region: "South East" },
  { id: "6", name: "Hampshire", slug: "hampshire", region: "South East" },
  { id: "7", name: "Devon", slug: "devon", region: "South West" },
  { id: "8", name: "Somerset", slug: "somerset", region: "South West" },
  { id: "9", name: "Dorset", slug: "dorset", region: "South West" },
  { id: "10", name: "Gloucestershire", slug: "gloucestershire", region: "South West" },
  { id: "11", name: "Oxfordshire", slug: "oxfordshire", region: "South East" },
  { id: "12", name: "Berkshire", slug: "berkshire", region: "South East" },
  { id: "13", name: "Hertfordshire", slug: "hertfordshire", region: "East of England" },
  { id: "14", name: "Cambridgeshire", slug: "cambridgeshire", region: "East of England" },
  { id: "15", name: "Norfolk", slug: "norfolk", region: "East of England" },
  { id: "16", name: "Suffolk", slug: "suffolk", region: "East of England" },
  { id: "17", name: "West Midlands", slug: "west-midlands", region: "West Midlands" },
  { id: "18", name: "Greater Manchester", slug: "greater-manchester", region: "North West" },
  { id: "19", name: "West Yorkshire", slug: "west-yorkshire", region: "Yorkshire and the Humber" },
  { id: "20", name: "Merseyside", slug: "merseyside", region: "North West" },
  { id: "21", name: "South Yorkshire", slug: "south-yorkshire", region: "Yorkshire and the Humber" },
  { id: "22", name: "Lancashire", slug: "lancashire", region: "North West" },
  { id: "23", name: "Nottinghamshire", slug: "nottinghamshire", region: "East Midlands" },
  { id: "24", name: "Northamptonshire", slug: "northamptonshire", region: "East Midlands" },
  { id: "25", name: "Warwickshire", slug: "warwickshire", region: "West Midlands" },
];

const newCounties = [
  { name: "Wiltshire", region: "South West" },
  { name: "Avon", region: "South West" },
  { name: "Cornwall", region: "South West" },
  { name: "Derbyshire", region: "East Midlands" },
  { name: "Durham", region: "North East" },
  { name: "East Yorkshire", region: "Yorkshire and the Humber" },
  { name: "Humberside", region: "Yorkshire and the Humber" },
  { name: "Leicestershire", region: "East Midlands" },
  { name: "Lincolnshire", region: "East Midlands" },
  { name: "Staffordshire", region: "West Midlands" },
  { name: "North Yorkshire", region: "Yorkshire and the Humber" },
  { name: "Northumberland", region: "North East" },
  { name: "Tyne and Wear", region: "North East" },
  { name: "Cleveland", region: "North East" },
  { name: "Cumbria", region: "North West" },
  { name: "Bedfordshire", region: "East of England" },
  { name: "Buckinghamshire", region: "South East" },
  { name: "North Wales", region: "Wales" },
  { name: "South Wales", region: "Wales" },
  { name: "Gwent", region: "Wales" },
  { name: "Dyfed-Powys", region: "Wales" },
];

let countyId = 26;
const newCountyEntries = newCounties.map((c) => ({
  id: String(countyId++),
  name: c.name,
  slug: toSlug(c.name),
  region: c.region,
}));

const allCounties = [...existingCounties, ...newCountyEntries];

// ─── Write output ───────────────────────────────────────────────────────────

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const stationsPath = path.join(dataDir, 'stations.json');
const countiesPath = path.join(dataDir, 'counties.json');

fs.writeFileSync(stationsPath, JSON.stringify(allStations, null, 2) + '\n');
fs.writeFileSync(countiesPath, JSON.stringify(allCounties, null, 2) + '\n');

const custodyCount = allStations.filter((s) => s.custodySuite).length;
const custodyPct = ((custodyCount / allStations.length) * 100).toFixed(1);

console.log(`Stations: ${allStations.length} total (IDs s1–s${allStations.length})`);
console.log(`  Custody suites: ${custodyCount} (${custodyPct}%)`);
console.log(`  Counties covered: ${[...new Set(allStations.map((s) => s.county))].length}`);
console.log(`Counties: ${allCounties.length} total`);
console.log(`Written to:`);
console.log(`  ${stationsPath}`);
console.log(`  ${countiesPath}`);

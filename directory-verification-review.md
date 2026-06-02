# Directory verification review

Generated: 2026-06-02T14:34:50.724Z

## Scope

- **In scope:** Police station telephone/address/custody directory (`data/stations.json`), legal services directory (KV).
- **Out of scope:** Police station **representatives** directory (no changes).

## Station directory audit

| Metric | Count |
|--------|------:|
| Total stations | 896 |
| Verification records | 896 |
| Dialable main `phone` | 773 |
| Dialable `custodyPhone` | 14+ (see Kent PSR updates below) |
| Custody marked not publicly listed (metadata) | 78 |
| Main phone marked unverified in metadata | 773 |


## Priority queue

```json
{
  "generatedAt": "2026-06-02T14:34:43.281Z",
  "totalStations": 896,
  "queued": 888,
  "tier1_custodyMissingCustody": 78,
  "tier2_missingMainPhone": 103,
  "tier3": 0,
  "tier4_missingCustody": 707
}
```


## Entries updated

Station verification sidecar (`data/station-verification.json`): **896** records from automated batch pass (force contact sources; custody lines not invented).

## Custody numbers added (verified dialable)

- Reading Police Station: 0118 953 6000
- Barnstaple Police Station — custody desk: **01392 290645** (devon-cornwall.police.uk — custody matters only)
- Camborne Police Station — custody desk: **01209 615538** (devon-cornwall.police.uk — custody matters only)
- Plymouth Charles Cross / Crownhill / Devonport — custody desk: **01392 854233** (devon-cornwall.police.uk — Charles Cross Custody Office)
- Exeter Police Station — custody desk: **01392 290820** (devon-cornwall.police.uk — custody matters only)
- Newquay Police Station — custody desk: **01637 839660** (devon-cornwall.police.uk — custody matters only)
- Torquay Police Station — custody desk: **01392 854082** (devon-cornwall.police.uk — custody matters only)
- Brighton Police Station: 01273 665511
- Medway Police Station: **01634 792190** (policestationreps.com — corrected from seed 792000)
- Tonbridge Police Station: **01732 379190** (policestationreps.com custody listing)
- Canterbury Police Station — custody desk: **01227 868190** (policestationreps.com)
- Folkestone Police Station — custody desk: **01303 289190** (policestationreps.com)
- North Kent Police Station — custody desk: **01474 366190** (policestationreps.com; main station **01474 564 100** unchanged)
- Margate Police Station — custody desk: **01843 222190** (policestationreps.com; main station **01843 222 222** unchanged)
- Brighton Police Station: 01273 665511
- Southampton Central Police Station: 023 8084 5511
- Reading Police Station: 0118 953 6000
- Barnstaple Police Station: 01392 290645
- Camborne Police Station: 01209 615538
- Plymouth Charles Cross Police Station: 01392 854233
- Exeter Police Station: 01392 290820
- Newquay Police Station: 01637 839660
- Torquay Police Station: 01392 854082
- Southend Police Station: 01702 431212
- Charing Cross Police Station: 020 7240 1212
- Plymouth Crownhill Police Station: 01392 854233
- Plymouth Devonport Police Station: 01392 854233

## Custody not publicly available

- Oldbury custody suite (West Midlands Police)
- Bradford trafalgar house police station (West Yorkshire Police)
- Middlewich custody (Cheshire Constabulary)
- Polar Park Police Station (Metropolitan Police)
- Euston Street Police Station (Leicestershire Police)
- Northampton Criminal Justice Centre (Northamptonshire Police)
- Keyham Lane Police Station (Leicestershire Police)
- Banbury Police Station (Thames Valley Police)
- Weekly Woods Justice Centre (Northamptonshire Police)
- Kempston Police Station (Bedfordshire Police)
- Norwich Police Station (British Transport Police)
- Cambridge Police Station (British Transport Police)
- Peterborough Police Station (British Transport Police)
- Gloucester Police Station (British Transport Police)
- Exeter St Davids Police Station (British Transport Police)
- Doncaster Police Station (British Transport Police)
- Preston Police Station (British Transport Police)
- Leeds Police Station (British Transport Police)
- Kings Cross Police Station (British Transport Police)
- Portsmouth Central Police Station (Hampshire Constabulary)
- Crawley Police Station (Sussex Police)
- Basingstoke Police Station (Hampshire Constabulary)
- Bournemouth Police Station (Dorset Police)
- Staines Police Station (Surrey Police)
- Ashford Police Station (Kent Police)
- Canterbury Police Station (Kent Police)
- Folkestone Police Station (Kent Police)
- Margate Police Station (Kent Police)
- Guildford Police Station (Surrey Police)
- Maidstone Police Station (Kent Police)
- Eastbourne Police Station (Sussex Police)
- Poole Police Station (Dorset Police)
- Woking Police Station (Surrey Police)
- Oxford Police Station (Thames Valley Police)
- Slough Police Station (Thames Valley Police)
- Yeovil Police Station (Avon and Somerset Constabulary)
- Cheltenham Police Station (Gloucestershire Constabulary)
- Torquay, Exeter, Barnstaple, Bodmin, Camborne, Newquay, and other D&C custody suites — numbers on force site; run `npx tsx scripts/fetch-devon-cornwall-custody.ts --write --apply` after `npx playwright install chromium`
- Gloucestershire Headquarters (Gloucestershire Constabulary)
- … and 38 more

## Source URLs used (domains)

- www.btp.police.uk
- www.gmp.police.uk
- www.google.com
- www.devon-cornwall.police.uk
- www.kent.police.uk
- www.met.police.uk
- www.thamesvalley.police.uk
- www.west-midlands.police.uk
- www.westyorkshire.police.uk

## Possible duplicates

_Manual review: compare station names within same force in `data/stations.json`._

## Closed / moved / no longer custody

_No systematic closed-station flags in this pass. Flag via `fields.custodyStatus` in verification sidecar when confirmed._

## Manual review queue

- Stations with `verificationStatus: unverified` or `partial` in sidecar
- Any custody suite where a force publishes a dedicated desk number (update sidecar + optional `stations.json` after review)
- Legal listings left `unverified` until admin sets `set_verification_provenance`


## Legal services directory

- Listings exported: 0
- Verified: 0
- Unverified: 0


## Police station records checked

**896** records catalogued; priority queue targets stations missing phone/custody data (see `data/reports/station-verification-queue.json`).

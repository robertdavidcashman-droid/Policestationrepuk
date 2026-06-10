# Growth ops templates — Defence Legal network

Copy-paste assets for Phase 6 flywheel tactics. Update quarterly.

## Email signature (reps & firms)

```
Police station cover & resources:
Directory (free) → https://policestationrepuk.org/directory?utm_source=email&utm_medium=email&utm_campaign=signature
Kent solicitor cover → https://www.policestationagent.com/?utm_source=policestationrepuk&utm_medium=email&utm_campaign=signature
Training (PSRAS) → https://www.psrtrain.com/training?utm_source=policestationrepuk&utm_medium=email&utm_campaign=signature
Custody notes trial → https://custodynote.com/trial?utm_source=policestationrepuk&utm_medium=email&utm_campaign=signature
All links hub → https://policestationrepuk.org/links
```

## WhatsApp pinned message (community groups)

```
Register free on the UK rep directory: https://policestationrepuk.org/register?utm_source=whatsapp&utm_medium=web&utm_campaign=pinned
Station numbers: https://policestationrepuk.org/StationsDirectory
PSRAS prep: https://www.psrtrain.com?utm_source=policestationrepuk&utm_medium=web&utm_campaign=whatsapp_pinned
```

## Weekly ops checklist

- [ ] Monday: traffic-digest cron email (GBP + cross-domain links)
- [ ] Buffer scheduled posts verified (`npm run buffer:verify-scheduled-gbp`)
- [ ] Cross-domain audit: `npm run audit:cross-domain-links`
- [ ] GSC: note organic session delta per domain
- [ ] GA4: partner outbound clicks by campaign (after measurement IDs set)

## 90-day baseline (record once)

| Metric | Day 0 | Week 4 | Week 8 | Week 12 |
|--------|-------|--------|--------|---------|
| repuk organic sessions | | | | |
| Outbound partner clicks | | | | |
| Buffer-referred sibling sessions | | | | |
| New public rep profiles | | | | |
| CN trials (repuk UTMs) | | | | |

See `docs/measurement-setup.md` for GA4 exploration setup.

## Legacy rep outreach email (218 directory reps)

Subject: **Your PoliceStationRepUK listing — quick profile check**

```
Hi [First name],

You’re listed on the free UK police station rep directory at policestationrepuk.org.

Please take two minutes to confirm your profile is up to date:
→ https://policestationrepuk.org/rep/[slug]?utm_source=email&utm_medium=email&utm_campaign=legacy_rep_refresh

If you have a website or LinkedIn, a link back to the directory helps other firms find cover:
→ https://policestationrepuk.org/directory?utm_source=email&utm_medium=email&utm_campaign=legacy_rep_backlink

Useful resources to share with colleagues:
• PSRAS training → https://www.psrtrain.com/training?utm_source=policestationrepuk&utm_medium=email&utm_campaign=legacy_rep_refresh
• Custody notes trial → https://custodynote.com/trial?utm_source=policestationrepuk&utm_medium=email&utm_campaign=legacy_rep_refresh
• Kent solicitor cover → https://www.policestationagent.com/?utm_source=policestationrepuk&utm_medium=email&utm_campaign=legacy_rep_refresh

Reply if anything looks wrong — we’ll fix it.

Robert
PoliceStationRepUK
```

Track sends in a spreadsheet: rep slug, sent date, profile updated (Y/N), backlink added (Y/N).

## WhatsApp quarterly reminder (post in community group)

```
Quarterly check-in: if your directory profile changed (areas, accreditation, mobile), update it so firms can reach you:
https://policestationrepuk.org/register?utm_source=whatsapp&utm_medium=web&utm_campaign=quarterly_refresh

New to PSRAS? Free guides: https://www.psrtrain.com/guides?utm_source=policestationrepuk&utm_medium=web&utm_campaign=whatsapp_quarterly
```

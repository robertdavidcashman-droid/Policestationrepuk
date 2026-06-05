#!/usr/bin/env node
/**
 * One-off patches from audit/policestationrepuk-editorial-audit.md
 * Run: node scripts/patch-editorial-audit-fixes.mjs
 */
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const wikiPath = path.join(root, 'data/wiki-articles.json');
const legalPath = path.join(root, 'data/legal-updates.json');

const wiki = JSON.parse(fs.readFileSync(wikiPath, 'utf8'));

const OLD_BAIL = `### Pre-Charge Bail Timescales

**Strict time limits:**

1. **0-28 days:** Initial bail period (custody sergeant)
2. **28 days-3 months:** First extension (Inspector)
3. **3-6 months:** Superintendent authorization required
4. **Beyond 6 months:** Magistrates' court must authorize each further 3-6 month period

**Breach:** If time limits breached, bail automatically ends—suspect can no longer be required to answer bail.[7]`;

const NEW_BAIL = `### Pre-Charge Bail Timescales (from 28 October 2022)

**Standard cases** (PCSC Act 2022, Sch. 4; PACE ss.47ZB–47ZJ):

1. **Initial applicable bail period (ABP):** up to **3 months** — custody officer
2. **Extension to 6 months:** inspector (statutory conditions A–D met)
3. **Extension to 9 months:** superintendent
4. **Beyond 9 months:** police must apply to the **Magistrates' Court** (Criminal Procedure Rules Part 14)

*(For FCA, SFO, NCA or HMRC designated cases the initial ABP is 6 months.)*

**Important:** Do not assume bail simply "automatically ends" if a deadline is missed — the current PACE provisions and Home Office statutory guidance govern what happens next. Take advice on the live position.[7]`;

const OLD_LEGAL_ADVICE = `## 4. Your Absolute Right to Free Legal Advice

Every suspect—whether arrested or attending voluntarily—has an **absolute right to free legal advice** at the police station.[25] This right is protected by:

✓ **PACE 1984, section 58**[26]

✓ **Article 6 ECHR** (right to fair trial)[27]

✓ **Legal Aid, Sentencing and Punishment of Offenders Act 2012** (LASPO)[28]

Legal advice is **completely free** under the Duty Solicitor Scheme or through your own chosen solicitor. There is **no means test** and **no cost** to the client for police station advice.[29]`;

const NEW_LEGAL_ADVICE = `## 4. Your Right to Legal Advice at the Police Station

If you are **detained at a police station** (or otherwise entitled to legal aid advice in that context), you can usually request **legal advice funded through criminal legal aid** — typically without a means test for police-station work.[25] The framework includes:

✓ **PACE 1984, section 58** (right to consult a solicitor)[26]

✓ **PACE Code C** (access and consultation in custody)[27]

✓ **Criminal legal aid** rules administered by the Legal Aid Agency[28]

For **voluntary interviews**, you should still take legal advice before attending, but funding and attendance arrangements depend on how the interview is arranged — confirm with a criminal defence solicitor. **PoliceStationRepUK does not provide legal advice**; this article is general information only.[29]`;

function patch(slug, fn) {
  const idx = wiki.findIndex((a) => a.slug === slug);
  if (idx === -1) throw new Error(`Missing wiki slug: ${slug}`);
  fn(wiki[idx]);
}

patch('rui-vs-bail-guide', (a) => {
  if (!a.content.includes(OLD_BAIL)) throw new Error('rui-vs-bail: expected bail block not found');
  a.content = a.content.replace(OLD_BAIL, NEW_BAIL);
});

patch('police-caution-explained', (a) => {
  if (!a.content.includes(OLD_LEGAL_ADVICE)) throw new Error('police-caution: legal advice block not found');
  a.content = a.content.replace(OLD_LEGAL_ADVICE, NEW_LEGAL_ADVICE);
  a.content = a.content.replace(
    '✓ **Never accept a caution without legal advice** – it is an admission of guilt',
    '✓ **Do not accept a police caution without legal advice.** A caution is a formal admission with long-term consequences (including disclosure). Speak to a criminal defence solicitor before deciding'
  );
  a.content = a.content.replace(
    '**Critical:** Never be interviewed without legal advice unless you\'re 100% certain you understand your rights and the implications. Even innocent people make damaging statements without proper advice.',
    '**Critical:** Take legal advice before any interview under caution. Even if you believe you understand the caution, the tactical and legal consequences of answering questions are case-specific.'
  );
});

patch('voluntary-police-interview-guide', (a) => {
  a.excerpt =
    'Guide to voluntary police interviews under caution: what happens, your rights to legal-aid-funded advice, and why you should take legal advice before attending.';
});

// Tone: reduce repetitive SEO filler in wiki intros
for (const a of wiki) {
  a.content = a.content.replace(/This comprehensive guide explains/g, 'This article explains');
  a.content = a.content.replace(/This comprehensive guide explores/g, 'This article covers');
  a.content = a.content.replace(/This comprehensive guide addresses/g, 'This article addresses');
}

fs.writeFileSync(wikiPath, JSON.stringify(wiki, null, 2) + '\n');

const legal = JSON.parse(fs.readFileSync(legalPath, 'utf8'));
const rasso = legal.find((u) => u.slug === 'rasso-interview-strategy');
if (rasso && !rasso.content.includes('For criminal defence practitioners')) {
  rasso.content = rasso.content.replace(
    '# RASSO Cases: Interview Strategy Updates\n\n## The Unique Challenge',
    '# RASSO Cases: Interview Strategy Updates\n\n*For criminal defence practitioners — not a substitute for firm policy or CPS guidance on live RASSO files.*\n\n## The Unique Challenge'
  );
}
fs.writeFileSync(legalPath, JSON.stringify(legal, null, 2) + '\n');

console.log('Patched wiki-articles.json and legal-updates.json');

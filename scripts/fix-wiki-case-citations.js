#!/usr/bin/env node
/**
 * Fix misattributed case-law footnotes in police-caution-explained wiki article.
 * Run: node scripts/fix-wiki-case-citations.js
 */
const fs = require('fs');
const path = require('path');

const wikiPath = path.join(process.cwd(), 'data/wiki-articles.json');
const articles = JSON.parse(fs.readFileSync(wikiPath, 'utf-8'));
const idx = articles.findIndex((a) => a.slug === 'police-caution-explained');
if (idx === -1) {
  console.error('police-caution-explained not found');
  process.exit(1);
}

let content = articles[idx].content;

const replacements = [
  [
    '[6] *R v Sang* [1980] AC 402 – Principle against self-incrimination\n\n[7] *Funke v France* (1993) 16 EHRR 297 – ECHR protection against self-incrimination\n\n',
    '[6] PACE s.58 and Code C — right to free legal advice before interview (https://www.legislation.gov.uk/ukpga/1984/60/section/58)\n\n',
  ],
  [
    '[10] *R v Roble* [1997] Crim LR 449 – Self-defence not mentioned adverse inference\n\n',
    '[10] *R v Roble* [1997] Crim LR 449 – Whether it was reasonable to rely on legal advice to remain silent is a question of fact for the jury\n\n',
  ],
  [
    '[11] *R v Condron* [1997] 1 Cr App R 185 – Alibi withheld adverse inference\n\n',
    '[11] *R v Condron* [1997] 1 WLR 827 – Silence on legal advice does not automatically prevent adverse inference; see also *Condron v UK* [2000] ECHR 191 on jury direction\n\n',
  ],
  [
    '[12] *R v Nickolson* [1999] Crim LR 61 – Innocent explanation delayed adverse inference\n\n',
    '',
  ],
  [
    '[16] *R v Pointer* [1997] Crim LR 676 – Failure to caution prevents adverse inference\n\n',
    '[16] *R v Pointer* [1997] EWCA Crim 926 – Questioning after an officer believes there is sufficient evidence to charge engages Code C para 11.4; adverse inference directions need care\n\n',
  ],
  [
    '[20] *R v McGarry* [1999] 1 Cr App R 377 – Use of interview evidence at trial\n\n',
    '',
  ],
  [
    '[22] *R v Miller* [1998] Crim LR 209 – Questioning at scene requiring caution\n\n',
    '',
  ],
  [
    '[24] *R v Pointer* [1997] Crim LR 676 – No adverse inference without proper caution\n\n',
    '',
  ],
  [
    '[32] *R v Beckles* [2005] 1 Cr App R 23 – "No comment" interviews\n\n',
    '[32] *R v Beckles* [2005] 1 Cr App R 23 – Whether it was reasonable to rely on legal advice to remain silent is for the jury\n\n',
  ],
  [
    '[51] *R v Betts and Hall* [2001] EWCA Crim 224; [2001] 2 Cr App R 16 – Prepared statements do not prevent adverse inferences if material facts are omitted\n\n',
    '[51] *R v Betts and Hall* [2001] EWCA Crim 224 – Adverse inference only if silence indicates no answer or none that would stand scrutiny; omitting material facts from a prepared statement may still attract s.34\n\n',
  ],
  [
    '[52] *R v Knight* [2003] EWCA Crim 1977 – Courts may comment on refusal to answer questions after prepared statement\n\n',
    '[52] *R v Knight* [2003] EWCA Crim 1977 – No adverse inference where the defendant gave a full account in a prepared statement and remained consistent at trial\n\n',
  ],
  [
    '[54] *R v Knight* [2003] EWCA Crim 1977 at [21] – Prepared statement with no comment may indicate account fabricated or wouldn\'t stand scrutiny\n\n',
    '[54] *R v Knight* [2003] EWCA Crim 1977 – A prepared statement alone gives no automatic immunity if material facts are omitted and later relied on at trial\n\n',
  ],
  [
    '[56] *R v Knight* [2003] EWCA Crim 1977 – Prosecution and judge may comment on refusal to answer questions after prepared statement\n\n',
    '',
  ],
  [
    '[64] *R v Doolan* [1988] Crim LR 747 – Interview of intoxicated suspect\n\n',
    '[64] PACE Code C, paragraph 12.3 and Annex E — fitness for interview (including intoxication); do not rely on unverified case summaries alone\n\n',
  ],
  [
    '**Fact-Checked:** All case law, legislation, and PACE Code references verified and current as of November 2025. Prepared statements section extensively revised with accurate case citations and balanced analysis.',
    '**Case law:** Adverse-inference citations checked against CPS legal guidance and the site case-law registry (2026). If in doubt, verify on BAILII before relying on a footnote in live advice.',
  ],
];

for (const [from, to] of replacements) {
  if (!content.includes(from)) {
    console.warn('Missing expected text:', from.slice(0, 60));
  } else {
    content = content.replace(from, to);
  }
}

articles[idx].content = content;
articles[idx].lastImprovedDate = '2026-06-01';
fs.writeFileSync(wikiPath, JSON.stringify(articles, null, 2) + '\n');
console.log('Updated police-caution-explained wiki article');

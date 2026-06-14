#!/usr/bin/env node
/**
 * Generates external-site blog drafts, Buffer CSV/JSON, and 90-day content calendar.
 * Run: node scripts/seo-growth/generate-external-content.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const OUT = path.join(ROOT, 'seo-growth');

const SITES = {
  policestationagent: {
    domain: 'policestationagent.com',
    baseUrl: 'https://www.policestationagent.com',
    cta: 'Request Police Station Cover',
  },
  psrtrain: {
    domain: 'psrtrain.com',
    baseUrl: 'https://psrtrain.com',
    cta: 'Register Interest',
  },
  custodynote: {
    domain: 'custodynote.com',
    baseUrl: 'https://custodynote.com',
    cta: 'Try CustodyNote',
  },
};

const POSTS = {
  policestationagent: [
    { slug: 'what-happens-police-station-interview', title: 'What Happens at a Police Station Interview?', keyword: 'police station interview UK' },
    { slug: 'answer-questions-or-no-comment', title: 'Should I Answer Questions or Go No Comment in a Police Interview?', keyword: 'no comment police interview' },
    { slug: 'voluntary-police-interview-legal-advice', title: 'Voluntary Police Interview: Why You Still Need Legal Advice', keyword: 'voluntary police interview' },
    { slug: 'police-bail-conditions-guidance', title: 'Police Bail Conditions: What They Mean and What to Do', keyword: 'police bail conditions' },
    { slug: 'released-under-investigation-guidance', title: 'Released Under Investigation: Practical Guidance', keyword: 'released under investigation' },
    { slug: 'why-firms-use-freelance-police-station-agents', title: 'Why Criminal Defence Firms Use Freelance Police Station Agents', keyword: 'freelance police station agent' },
    { slug: 'police-station-cover-kent-solicitors', title: 'Police Station Cover in Kent: What Solicitors Need to Know', keyword: 'police station cover Kent' },
    { slug: 'what-to-send-instructing-police-station-rep', title: 'What to Send When Instructing a Police Station Representative', keyword: 'instruct police station rep' },
    { slug: 'custody-record-dscc-references', title: 'Custody Record Numbers and DSCC References Explained', keyword: 'DSCC reference custody' },
    { slug: 'out-of-hours-police-station-legal-advice', title: 'How Police Station Legal Advice Works Out of Hours', keyword: 'out of hours police station solicitor' },
  ],
  psrtrain: [
    { slug: 'how-to-become-police-station-representative', title: 'How to Become a Police Station Representative', keyword: 'become police station rep' },
    { slug: 'pace-interview-basics-new-reps', title: 'PACE Interview Basics for New Police Station Reps', keyword: 'PACE interview training' },
    { slug: 'understanding-the-police-caution', title: 'Understanding the Police Caution', keyword: 'police caution explained' },
    { slug: 'advising-no-comment-interview', title: 'Advising on a No Comment Interview', keyword: 'no comment interview advice' },
    { slug: 'youth-suspects-police-station', title: 'Youth Suspects at the Police Station', keyword: 'youth suspect police station' },
    { slug: 'vulnerable-suspects-police-interviews', title: 'Vulnerable Suspects and Police Interviews', keyword: 'vulnerable suspect interview' },
    { slug: 'police-station-accreditation-preparation', title: 'Police Station Accreditation: Practical Preparation', keyword: 'PSRAS accreditation' },
    { slug: 'common-mistakes-new-police-station-reps', title: 'Common Mistakes New Police Station Reps Make', keyword: 'new police station rep mistakes' },
    { slug: 'how-to-structure-police-station-advice', title: 'How to Structure Police Station Advice', keyword: 'police station advice structure' },
    { slug: 'sqe-criminal-practice-police-station-basics', title: 'SQE Criminal Practice: Police Station Interview Basics', keyword: 'SQE criminal practice police station' },
  ],
  custodynote: [
    { slug: 'how-to-write-police-station-attendance-note', title: 'How to Write a Proper Police Station Attendance Note', keyword: 'police station attendance note' },
    { slug: 'what-should-go-in-custody-note', title: 'What Should Go in a Custody Note?', keyword: 'custody note contents' },
    { slug: 'police-interview-note-taking-checklist', title: 'Police Interview Note-Taking: Practical Checklist', keyword: 'police interview notes' },
    { slug: 'dscc-custody-records-attendance-notes', title: 'DSCC References, Custody Records and Attendance Notes', keyword: 'DSCC attendance note' },
    { slug: 'police-bail-notes-what-to-record', title: 'Police Bail Notes: What to Record', keyword: 'police bail notes' },
    { slug: 'rui-notes-criminal-practitioners', title: 'RUI Notes: What Criminal Practitioners Should Keep', keyword: 'RUI notes criminal' },
    { slug: 'why-good-attendance-notes-matter', title: 'Why Good Attendance Notes Matter in Criminal Defence', keyword: 'attendance notes criminal defence' },
    { slug: 'ai-assisted-custody-notes-benefits-limits', title: 'AI-Assisted Custody Notes: Benefits and Limits', keyword: 'AI custody notes' },
    { slug: 'police-station-file-preparation-checklist', title: 'Police Station File Preparation Checklist', keyword: 'police station file preparation' },
    { slug: 'attendance-note-template-police-station-reps', title: 'Attendance Note Template for Police Station Representatives', keyword: 'attendance note template' },
  ],
};

const LOCAL_PSA = [
  'kent-police-station-representative',
  'medway-police-station-representative',
  'sevenoaks-police-station-cover',
  'swanley-police-station-cover',
  'dartford-police-station-cover',
  'gravesend-police-station-cover',
  'maidstone-police-station-cover',
  'tonbridge-police-station-cover',
  'tunbridge-wells-police-station-cover',
  'chatham-police-station-cover',
  'gillingham-police-station-cover',
  'rochester-police-station-cover',
];

function blogBody(siteKey, post) {
  const site = SITES[siteKey];
  return `---
title: "${post.title}"
metaTitle: "${post.title.slice(0, 58)}"
metaDescription: "Practical UK guidance on ${post.keyword} for criminal defence professionals. General information only — not legal advice on specific facts."
slug: ${post.slug}
site: ${site.domain}
published: draft
author: Editorial team
cta: ${site.cta}
schema: Article
primaryKeyword: ${post.keyword}
---

## Quick answer

${post.title} is a common question for ${siteKey === 'policestationagent' ? 'criminal defence firms and clients in Kent and across England & Wales' : siteKey === 'psrtrain' ? 'trainee and accredited police station representatives' : 'criminal solicitors and police station representatives'}. This article explains the practical steps, professional context, and what to record or prepare — in plain UK English.

## Who this is for

- ${siteKey === 'policestationagent' ? 'Criminal defence firms needing police station cover' : siteKey === 'psrtrain' ? 'People training for PSRAS accreditation or SQE criminal practice' : 'Practitioners who attend police stations and prepare attendance notes'}

## Key points

1. **Professional context** — work under PACE and the Codes of Practice; the instructing firm retains conduct of the case.
2. **Preparation** — gather custody details, disclosure, and client instructions before interview where possible.
3. **Documentation** — clear notes protect the client, the firm, and the professional.
4. **Escalation** — know when to involve a supervising solicitor or duty scheme.

## Practical workflow

Start with the custody record and identification of the client’s status (detained, voluntary attendance, youth, vulnerability). Confirm the firm’s instruction route and billing. At interview, focus on advice quality and accurate recording rather than outcomes — no practitioner can guarantee a result.

For firms in Kent seeking attendance cover, see [${site.domain}](${site.baseUrl}).

## FAQ

### Is this legal advice?

No. This is general professional information. Anyone facing a police investigation should obtain advice on their own facts from a qualified criminal defence lawyer.

### Does this apply across the UK?

This material focuses on **England and Wales** police station practice.

## Next step

**${site.cta}** — visit [${site.baseUrl}](${site.baseUrl}).

---

*General information only. Not legal advice on specific facts. No guarantee of outcome.*
`;
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

// Blog drafts
for (const [siteKey, posts] of Object.entries(POSTS)) {
  const dir = path.join(OUT, 'blog-posts', siteKey);
  ensureDir(dir);
  for (const post of posts) {
    fs.writeFileSync(path.join(dir, `${post.slug}.md`), blogBody(siteKey, post));
  }
}

// Local SEO drafts — PSA towns
const psaDir = path.join(OUT, 'local-seo', 'policestationagent');
ensureDir(psaDir);
for (const slug of LOCAL_PSA) {
  const town = slug.replace(/-police-station.*/, '').replace(/-/g, ' ');
  fs.writeFileSync(
    path.join(psaDir, `${slug}.md`),
    `# ${town.charAt(0).toUpperCase() + town.slice(1)} police station cover\n\n**Site:** policestationagent.com\n\n## Summary\n\nRobert Cashman / Defence Legal Services provides police station representation for criminal defence firms covering ${town} and surrounding Kent custody suites.\n\n## CTAs\n\n- Call Robert Cashman\n- WhatsApp Now\n- Email Instructions\n- Request Police Station Cover\n\n## FAQ\n\n### Do you cover overnight arrests?\nContact to confirm availability for the specific custody suite.\n\n*General information only — not legal advice.*\n`,
  );
}

// Buffer + calendar
const bufferRows = [];
const calendarRows = [];
let dayOffset = 0;
const start = new Date('2026-06-10T09:00:00Z');

for (const [siteKey, posts] of Object.entries(POSTS)) {
  for (const post of posts) {
    const site = SITES[siteKey];
    const url = `${site.baseUrl}/blog/${post.slug}`;
    const date = new Date(start);
    date.setDate(date.getDate() + dayOffset);
    dayOffset += 2;
    const dateStr = date.toISOString().slice(0, 10);
    const timeStr = '09:30';
    for (const channel of ['LinkedIn', 'Twitter', 'Facebook']) {
      bufferRows.push({
        channel,
        site: site.domain,
        blog_title: post.title,
        post_text: `${post.title} — practical UK guidance for criminal defence professionals. ${site.cta}.`,
        link: url,
        suggested_date: dateStr,
        suggested_time: timeStr,
        status: 'draft',
        notes: 'Publish blog on site before scheduling',
      });
    }
    calendarRows.push({
      title: post.title,
      site: site.domain,
      keyword: post.keyword,
      publish_date: dateStr,
      status: 'draft',
      schema: 'Article',
    });
  }
}

// PSR UK new posts in calendar
for (const slug of [
  'police-station-rep-coverage-location-matters',
  'keep-directory-profile-useful',
  'accredited-reps-keep-availability-updated',
]) {
  calendarRows.push({
    title: slug,
    site: 'policestationrepuk.org',
    keyword: 'police station rep directory',
    publish_date: '2026-06-09',
    status: 'published-in-repo',
    schema: 'BlogPosting',
  });
}

ensureDir(path.join(OUT, 'buffer'));
const csvHeader = 'channel,site,blog_title,post_text,link,suggested_date,suggested_time,status,notes\n';
const csvBody = bufferRows
  .map((r) =>
    [r.channel, r.site, r.blog_title, `"${r.post_text.replace(/"/g, '""')}"`, r.link, r.suggested_date, r.suggested_time, r.status, r.notes].join(','),
  )
  .join('\n');
fs.writeFileSync(path.join(OUT, 'buffer', 'buffer-posts.csv'), csvHeader + csvBody + '\n');
fs.writeFileSync(path.join(OUT, 'buffer', 'buffer-posts.json'), JSON.stringify(bufferRows, null, 2));

ensureDir(OUT);
const calCsv =
  'title,site,keyword,publish_date,status,schema\n' +
  calendarRows.map((r) => [r.title, r.site, r.keyword, r.publish_date, r.status, r.schema].join(',')).join('\n');
fs.writeFileSync(path.join(OUT, 'content-calendar-90-days.csv'), calCsv + '\n');

console.log('Generated external content:', bufferRows.length, 'buffer rows,', Object.values(POSTS).flat().length * 3, 'blog drafts');

const PSRTRAIN_LANDING = [
  'police-station-representative-training',
  'pace-interview-training',
  'police-station-accreditation-support',
  'criminal-defence-training',
  'sqe-criminal-practice-training',
  'youth-suspect-interview-training',
  'vulnerable-suspect-interview-training',
  'no-comment-interview-training',
  'voluntary-interview-training',
];

const CUSTODYNOTE_LANDING = [
  'police-station-attendance-note-template',
  'custody-note-template',
  'pace-interview-note-template',
  'criminal-solicitor-attendance-note-tool',
  'police-station-rep-note-taking-tool',
  'ai-custody-note-tool',
  'dscc-attendance-note-workflow',
  'police-bail-note-template',
  'released-under-investigation-note-template',
];

const trainDir = path.join(OUT, 'local-seo', 'psrtrain');
const cnDir = path.join(OUT, 'local-seo', 'custodynote');
ensureDir(trainDir);
ensureDir(cnDir);

for (const slug of PSRTRAIN_LANDING) {
  const title = slug.replace(/-/g, ' ');
  fs.writeFileSync(
    path.join(trainDir, `${slug}.md`),
    `# ${title}\n\n**Site:** psrtrain.com\n\nTraining landing page draft — publish with Course schema.\n\nCTA: Register Interest · Download Training Guide · Book Training\n\n*General information only.*\n`,
  );
}
for (const slug of CUSTODYNOTE_LANDING) {
  const title = slug.replace(/-/g, ' ');
  fs.writeFileSync(
    path.join(cnDir, `${slug}.md`),
    `# ${title}\n\n**Site:** custodynote.com\n\nTool/template landing page draft — publish with SoftwareApplication schema where appropriate.\n\nCTA: Try CustodyNote · Join Waitlist · Request Demo · Download Template\n\n*General information only.*\n`,
  );
}

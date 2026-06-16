#!/usr/bin/env node
/**
 * Generates external-site blog drafts, Buffer CSV/JSON, local pages, and 90-day content calendar.
 * Run: node scripts/seo-growth/generate-external-content.mjs
 * Then: node scripts/seo-growth/generate-site-packages.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SITE_META, topicContent, expandSections } from './external-content-data.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PKG = process.env.SEO_GROWTH_PKG || __dirname;
const ROOT = process.env.SEO_GROWTH_ROOT || path.resolve(PKG, '../..');
const OUT = process.env.SEO_GROWTH_OUT || path.join(ROOT, 'seo-growth');

const POSTS = JSON.parse(fs.readFileSync(path.join(PKG, 'posts-config.json'), 'utf8'));

const SITES = {
  policestationagent: { domain: 'policestationagent.com', baseUrl: 'https://www.policestationagent.com', cta: 'Request Police Station Cover' },
  psrtrain: { domain: 'psrtrain.com', baseUrl: 'https://psrtrain.com', cta: 'Register Interest' },
  custodynote: { domain: 'custodynote.com', baseUrl: 'https://custodynote.com', cta: 'Try CustodyNote' },
};

const LOCAL_PSA = [
  { slug: 'kent-police-station-representative', place: 'Kent', context: 'county-wide cover including Medway, Maidstone, and north Kent custody suites' },
  { slug: 'medway-police-station-representative', place: 'Medway', context: 'Medway custody and Chatham, Gillingham, Rochester attendances' },
  { slug: 'sevenoaks-police-station-cover', place: 'Sevenoaks', context: 'West Kent custody routes' },
  { slug: 'swanley-police-station-cover', place: 'Swanley', context: 'North West Kent and M25 corridor' },
  { slug: 'dartford-police-station-cover', place: 'Dartford', context: 'North Kent and Thames corridor' },
  { slug: 'gravesend-police-station-cover', place: 'Gravesend', context: 'North Kent custody attendance' },
  { slug: 'maidstone-police-station-cover', place: 'Maidstone', context: 'Mid-Kent custody cover' },
  { slug: 'tonbridge-police-station-cover', place: 'Tonbridge', context: 'West Kent police station representation' },
  { slug: 'tunbridge-wells-police-station-cover', place: 'Tunbridge Wells', context: 'Tunbridge Wells and surrounding custody' },
  { slug: 'chatham-police-station-cover', place: 'Chatham', context: 'Chatham and Medway police station cover' },
  { slug: 'gillingham-police-station-cover', place: 'Gillingham', context: 'Gillingham custody attendance' },
  { slug: 'rochester-police-station-cover', place: 'Rochester', context: 'Rochester and Medway legal representation' },
];

function psaLocalBody(page) {
  const title = `${page.place} police station representative`;
  return `---
title: "${title}"
metaTitle: "${title.slice(0, 58)} | Kent"
metaDescription: "Police station representation for criminal defence firms covering ${page.place}, Kent. Robert Cashman — Defence Legal Services. General information only."
slug: ${page.slug}
canonical: https://www.policestationagent.com/${page.slug}
schema: LegalService, LocalBusiness, FAQPage
---

# ${title}

## Quick answer

Robert Cashman / Defence Legal Services provides police station representation for criminal defence firms covering **${page.place}** — ${page.context}. This page is general information for instructing firms, not case-specific legal advice.

## Local context

Firms instructing cover in ${page.place} should provide DSCC reference, custody location, client details, and billing route early. Overnight and weekend attendances are common in Kent.

## CTAs

- **Call Robert Cashman**
- **WhatsApp Now**
- **Email Instructions**
- **Request Police Station Cover**

## FAQ

### Do you cover overnight arrests?

Contact to confirm availability for the specific custody suite.

### Wider directory

See [PoliceStationRepUK](https://policestationrepuk.org/directory) for a wider accredited rep directory.

---

*General information only — not legal advice.*
`;
}

function blogBody(siteKey, post) {
  const site = SITE_META[siteKey];
  const topic = topicContent(siteKey, post.slug, post.title, post.keyword);
  const body = expandSections(topic.sections);
  const faq = topic.faq.map((f) => `### ${f.q}\n\n${f.a}`).join('\n\n');
  const cross = site.crossLinks.map((l) => `- [${l.label}](${l.url})`).join('\n');
  return `---
title: "${post.title.replace(/"/g, '\\"')}"
metaTitle: "${post.title.slice(0, 58).replace(/"/g, '\\"')}"
metaDescription: "Practical UK guidance on ${post.keyword} for criminal defence professionals. General information only — not legal advice on specific facts."
slug: ${post.slug}
site: ${site.domain}
published: draft
author: Editorial team
lastUpdated: 2026-06-14
cta: ${site.ctas[0]}
schema: Article
primaryKeyword: ${post.keyword}
canonical: ${site.baseUrl}/blog/${post.slug}
---

# ${post.title}

**Last updated:** 14 June 2026

## Quick answer

${topic.intro}

## Who this is for

- ${site.audience}

${body}

## FAQ

${faq}

## Related resources

${cross}

## Next step

**${site.ctas[0]}** — visit [${site.baseUrl}](${site.baseUrl}).

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
const psaSiteDir = path.join(OUT, 'sites', 'policestationagent.com', 'local');
ensureDir(psaDir);
ensureDir(psaSiteDir);
for (const page of LOCAL_PSA) {
  const md = psaLocalBody(page);
  fs.writeFileSync(path.join(psaDir, `${page.slug}.md`), md);
  fs.writeFileSync(path.join(psaSiteDir, `${page.slug}.md`), md);
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
const trainSiteDir = path.join(OUT, 'sites', 'psrtrain.com', 'local');
const cnDir = path.join(OUT, 'local-seo', 'custodynote');
const cnSiteDir = path.join(OUT, 'sites', 'custodynote.com', 'local');
ensureDir(trainDir);
ensureDir(trainSiteDir);
ensureDir(cnDir);
ensureDir(cnSiteDir);

function trainLocalBody(slug) {
  const title = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return `---
title: "${title}"
metaTitle: "${title.slice(0, 58)}"
metaDescription: "${title} for police station representatives in England and Wales. Register interest for course updates."
slug: ${slug}
canonical: https://psrtrain.com/${slug}
schema: Course, FAQPage
---

# ${title}

## Quick answer

Practical **${title.toLowerCase()}** for trainee and accredited police station representatives under PACE in England and Wales.

## CTAs

- **Register Interest** · **Download Training Guide** · **Book Training** · **Join Course Updates**

Cross-link: [Register on PoliceStationRepUK](https://policestationrepuk.org/Register)

*General information only — not legal advice.*
`;
}

function cnLocalBody(slug) {
  const title = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return `---
title: "${title}"
metaTitle: "${title.slice(0, 58)}"
metaDescription: "${title} for criminal solicitors and police station reps. General information only."
slug: ${slug}
canonical: https://custodynote.com/${slug}
schema: SoftwareApplication, FAQPage
---

# ${title}

## Quick answer

**${title}** supports structured **attendance notes** and custody workflows for criminal practitioners.

## CTAs

- **Try CustodyNote** · **Join Waitlist** · **Request Demo** · **Download Template**

Cross-link: [PSR Train](https://psrtrain.com)

*General information only — not legal advice.*
`;
}

for (const slug of PSRTRAIN_LANDING) {
  const md = trainLocalBody(slug);
  fs.writeFileSync(path.join(trainDir, `${slug}.md`), md);
  fs.writeFileSync(path.join(trainSiteDir, `${slug}.md`), md);
}
for (const slug of CUSTODYNOTE_LANDING) {
  const md = cnLocalBody(slug);
  fs.writeFileSync(path.join(cnDir, `${slug}.md`), md);
  fs.writeFileSync(path.join(cnSiteDir, `${slug}.md`), md);
}

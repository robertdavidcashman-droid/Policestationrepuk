/**
 * Build blog hero images for every article.
 *
 * Default behaviour: download a curated Unsplash photo per slug
 *   (Unsplash License — free, commercial use OK, attribution appreciated)
 *   from images.unsplash.com, then write a 16:9 1200x675 hero plus a
 *   768x432 narrow companion to public/images/blog/raster/{slug}.webp, plus
 *   matching {slug}.jpg and {slug}-768.jpg for Google Business (JPEG/PNG only).
 *
 * Optional Pexels fallback: if PEXELS_API_KEY is set and a slug query is
 *   listed in PEXELS_QUERIES, the script will try Pexels first and fall back
 *   to the curated Unsplash URL on failure.
 *
 * Final fallback: rasterise the local SVG placeholder if no remote image is
 *   available.
 *
 * Usage:
 *   node scripts/blog/fetch-hero-images.mjs              # Unsplash + SVG fallback
 *   PEXELS_API_KEY=xxx node scripts/blog/fetch-hero-images.mjs  # Pexels first
 *   node scripts/blog/fetch-hero-images.mjs --force      # ignore existing webp
 */
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const ROOT = process.cwd();
const BLOG_DIR = path.join(ROOT, 'public', 'images', 'blog');
const OUT_DIR = path.join(BLOG_DIR, 'raster');

const FORCE = process.argv.includes('--force');

const WIDE = { w: 1200, h: 675 };
const NARROW = { w: 768, h: 432 };

/**
 * Curated Unsplash photo per article slug.
 * Each entry is the photo's images.unsplash.com identifier (the segment
 * between `/` and `?`).  All photos verified individually as covered by
 * the regular (free) Unsplash License — not Unsplash+.
 */
const UNSPLASH_PHOTOS = {
  'what-does-a-freelance-police-station-representative-do': {
    id: 'photo-1610815253406-7a5887109e83',
    credit: 'Francois Olwage / Unsplash',
    description: 'Old London Police Station signage on a brick wall',
  },
  'how-firms-can-instruct-freelance-police-station-reps': {
    id: 'photo-1758691736493-aa6d22c0f8a6',
    credit: 'Vitaly Gariev / Unsplash',
    description: 'Senior solicitor briefing colleagues during an office meeting',
  },
  'police-station-attendance-checklist': {
    id: 'photo-1754039985008-a15410211b67',
    credit: 'Jakub Żerdzicki / Unsplash',
    description: 'Close-up of a hand ticking off items in a notebook checklist',
  },
  'what-to-include-in-a-police-station-brief': {
    id: 'photo-1758876020200-1e19cddaf656',
    credit: 'Vitaly Gariev / Unsplash',
    description: 'Solicitor preparing case notes at a desk with a laptop and notebook',
  },
  'freelance-police-station-representative-vs-duty-solicitor': {
    id: 'photo-1717333274767-0eed749076a4',
    credit: 'Sue Winston / Unsplash',
    description: "Signage above the entrance to the City of London Magistrates' Court",
  },
  'common-mistakes-when-instructing-freelance-police-station-reps': {
    id: 'photo-1549923746-9507eec27243',
    credit: 'Sebastian Herrmann / Unsplash',
    description: 'Professional in a suit reading a thin case folder',
  },
  'best-practice-handover-notes-after-police-station-attendance': {
    id: 'photo-1768055104910-8c8d213835fb',
    credit: 'Jakub Żerdzicki / Unsplash',
    description: 'Hand writing structured notes in a paper notebook',
  },
  'out-of-hours-police-station-cover-for-law-firms': {
    id: 'photo-1758520145140-c2dd8e78fc02',
    credit: 'Vitaly Gariev / Unsplash',
    description: 'Two professionals working late under low light in an office',
  },
  'accreditation-and-standards-in-freelance-police-station-work': {
    id: 'photo-1534580250660-88e8789d3e85',
    credit: 'Annie Spratt / Unsplash',
    description: 'Stack of bound legal volumes signalling professional standards',
  },
  'how-freelance-police-station-reps-win-repeat-instructions': {
    id: 'photo-1758599543129-5269a8f29e68',
    credit: 'Vitaly Gariev / Unsplash',
    description: 'Two professionals shaking hands outside a modern office building',
  },
  'what-makes-a-good-police-station-representative': {
    id: 'photo-1758876020490-ae178d769b7b',
    credit: 'Vitaly Gariev / Unsplash',
    description: 'Professional taking detailed notes at an office desk with a laptop',
  },
  'why-fast-clear-communication-matters-in-police-station-representation': {
    id: 'photo-1758876202919-4d2fbedcf23d',
    credit: 'Vitaly Gariev / Unsplash',
    description: 'Two colleagues discussing work over a laptop in a modern office',
  },
  'why-firms-need-rep-directory': {
    id: 'photo-1707179120160-d2c0172ec9da',
    credit: 'Crystal Stone / Unsplash',
    description: 'British police vehicle parked outside a UK police station (Silloth, Cumbria)',
  },
  'how-firms-source-emergency-rep-cover': {
    id: 'photo-1758520145140-c2dd8e78fc02',
    credit: 'Vitaly Gariev / Unsplash',
    description: 'Late-night office staff coordinating urgent work',
  },
  'freelance-police-station-rep-career': {
    id: 'photo-1714906472800-45d9328f08d3',
    credit: 'Alexander London / Unsplash',
    description: 'Professional walking to work carrying a leather briefcase',
  },
  'professional-indemnity-insurance-reps': {
    id: 'photo-1763729805496-b5dbf7f00c79',
    credit: 'Jakub Żerdzicki / Unsplash',
    description: 'Close-up of male hands signing a policy document with a pen',
  },
  'police-station-rep-fee-rates-2026': {
    id: 'photo-1772588627483-d036793569e8',
    credit: 'Kelly Sikkema / Unsplash',
    description: 'Calculator, pen and paperwork on an office desk for fee calculations',
  },
  'pre-interview-consultation-rep-guide': {
    id: 'photo-1758876020490-ae178d769b7b',
    credit: 'Vitaly Gariev / Unsplash',
    description: 'Solicitor preparing consultation notes at an office desk',
  },
  'how-to-review-custody-record': {
    id: 'photo-1753715613651-749ef230482c',
    credit: 'Jakub Żerdzicki / Unsplash',
    description: 'Overhead view of reviewing handwritten notes beside a mechanical keyboard',
  },
  'handling-disclosure-police-station': {
    id: 'photo-1549923746-9507eec27243',
    credit: 'Sebastian Herrmann / Unsplash',
    description: 'Solicitor reviewing a folder of disclosure documents in a quiet office',
  },
  'adverse-inference-no-comment-rep-guide': {
    id: 'photo-1589216532372-1c2a367900d9',
    credit: 'Tingey Injury Law Firm / Unsplash',
    description: 'Open law book and gavel on a desk in a quiet legal office',
  },
  'sentencing-act-2026-key-changes': {
    id: 'photo-1752697589032-3717e8b24753',
    credit: 'Krists Luhaers / Unsplash',
    description: 'Row of law books lined up along a shelf',
  },
};

/** Optional Pexels topical queries used only when PEXELS_API_KEY is set. */
const PEXELS_QUERIES = {
  'what-does-a-freelance-police-station-representative-do': 'UK police station signage',
  'how-firms-can-instruct-freelance-police-station-reps': 'solicitor briefing meeting office UK',
  'police-station-attendance-checklist': 'notebook checklist hand ticking off',
  'what-to-include-in-a-police-station-brief': 'lawyer preparing notes desk laptop',
  'freelance-police-station-representative-vs-duty-solicitor': 'magistrates court entrance UK',
  'common-mistakes-when-instructing-freelance-police-station-reps': 'lawyer reviewing folder office serious',
  'best-practice-handover-notes-after-police-station-attendance': 'writing notes paper notebook close up',
  'out-of-hours-police-station-cover-for-law-firms': 'office working late night dim',
  'accreditation-and-standards-in-freelance-police-station-work': 'stack of law books professional',
  'how-freelance-police-station-reps-win-repeat-instructions': 'professionals handshake outside building',
  'what-makes-a-good-police-station-representative': 'professional taking notes desk laptop',
  'why-fast-clear-communication-matters-in-police-station-representation': 'two colleagues discussing laptop office',
  'why-firms-need-rep-directory': 'UK police car police station',
  'how-firms-source-emergency-rep-cover': 'late night office urgent work',
  'freelance-police-station-rep-career': 'professional briefcase commute London',
  'professional-indemnity-insurance-reps': 'signing legal document pen close up',
  'police-station-rep-fee-rates-2026': 'calculator paperwork desk invoice',
  'pre-interview-consultation-rep-guide': 'solicitor preparing notes consultation',
  'how-to-review-custody-record': 'reviewing notes office overhead keyboard',
  'handling-disclosure-police-station': 'lawyer reviewing folder documents office',
  'adverse-inference-no-comment-rep-guide': 'gavel dark background close up',
  'sentencing-act-2026-key-changes': 'law books shelf library legal',
};

function unsplashUrl(photoId, width) {
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${width}&q=80`;
}

async function downloadBuffer(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; PoliceStationRepUK/1.0; +https://policestationrepuk.org)',
      Accept: 'image/avif,image/webp,image/*;q=0.8,*/*;q=0.5',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function fetchPexelsPhoto(query) {
  const key = process.env.PEXELS_API_KEY;
  if (!key || !query) return null;
  const u = new URL('https://api.pexels.com/v1/search');
  u.searchParams.set('query', query);
  u.searchParams.set('per_page', '1');
  u.searchParams.set('orientation', 'landscape');
  u.searchParams.set('size', 'large');
  const res = await fetch(u, { headers: { Authorization: key } });
  if (!res.ok) throw new Error(`Pexels ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const p = data.photos?.[0];
  if (!p) return null;
  const src = p.src?.large2x || p.src?.large || p.src?.original;
  if (!src) return null;
  return {
    buffer: await downloadBuffer(src),
    photographer: p.photographer,
    url: p.url,
  };
}

async function toWebpFromBuffer(buf, width, height, maxBytes) {
  let quality = 82;
  let out;
  for (let i = 0; i < 10; i++) {
    out = await sharp(buf)
      .resize(width, height, { fit: 'cover', position: 'attention' })
      .webp({ quality, effort: 6 })
      .toBuffer();
    if (out.length <= maxBytes || quality <= 60) break;
    quality -= 3;
  }
  return out;
}

async function toJpegFromBuffer(buf, width, height, maxBytes) {
  let quality = 88;
  let out;
  for (let i = 0; i < 8; i++) {
    out = await sharp(buf)
      .resize(width, height, { fit: 'cover', position: 'attention' })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
    if (out.length <= maxBytes || quality <= 65) break;
    quality -= 4;
  }
  return out;
}

async function toJpegFromWebpFile(webpPath, width, height, maxBytes) {
  return toJpegFromBuffer(await fs.readFile(webpPath), width, height, maxBytes);
}

/** True when JPEG companions are missing or older than the wide webp source. */
async function jpegNeedsBackfill(wideWebpPath, wideJpgPath, narrowJpgPath) {
  if (!(await exists(wideJpgPath)) || !(await exists(narrowJpgPath))) return true;
  const webpMtime = (await fs.stat(wideWebpPath)).mtimeMs;
  const wideJpgMtime = (await fs.stat(wideJpgPath)).mtimeMs;
  const narrowJpgMtime = (await fs.stat(narrowJpgPath)).mtimeMs;
  return wideJpgMtime < webpMtime || narrowJpgMtime < webpMtime;
}

async function writeJpegCompanions(slug, wideWebpPath, narrowWebpPath) {
  const wideJpgPath = path.join(OUT_DIR, `${slug}.jpg`);
  const narrowJpgPath = path.join(OUT_DIR, `${slug}-768.jpg`);
  const wideJpg = await toJpegFromWebpFile(wideWebpPath, WIDE.w, WIDE.h, 200 * 1024);
  const narrowJpg = await toJpegFromWebpFile(narrowWebpPath, NARROW.w, NARROW.h, 120 * 1024);
  await fs.writeFile(wideJpgPath, wideJpg);
  await fs.writeFile(narrowJpgPath, narrowJpg);
  return { wideJpgPath, narrowJpgPath, wideJpg, narrowJpg };
}

async function fromSvgFile(svgPath, width, height, maxBytes) {
  let quality = 88;
  let buf;
  for (let i = 0; i < 8; i++) {
    buf = await sharp(svgPath)
      .resize(width, height, { fit: 'cover', position: 'centre' })
      .webp({ quality, effort: 6 })
      .toBuffer();
    if (buf.length <= maxBytes || quality <= 65) break;
    quality -= 4;
  }
  return buf;
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  // GitHub Actions: skip Unsplash/Pexels downloads — heroes are committed under
  // public/images/blog/raster and remote fetch adds flaky network + CI minutes.
  // To force fetch on CI (e.g. refresh heroes): set CI_FETCH_BLOG_HEROES=1
  if (process.env.GITHUB_ACTIONS === 'true' && process.env.CI_FETCH_BLOG_HEROES !== '1') {
    console.log(
      '[fetch-hero-images] Skipping on GitHub Actions (committed assets). Set CI_FETCH_BLOG_HEROES=1 to fetch.',
    );
    return;
  }

  await fs.mkdir(OUT_DIR, { recursive: true });
  const slugs = Object.keys(UNSPLASH_PHOTOS).sort();
  const results = [];

  for (const slug of slugs) {
    const widePath = path.join(OUT_DIR, `${slug}.webp`);
    const narrowPath = path.join(OUT_DIR, `${slug}-768.webp`);
    const wideJpgPath = path.join(OUT_DIR, `${slug}.jpg`);
    const narrowJpgPath = path.join(OUT_DIR, `${slug}-768.jpg`);
    if (!FORCE && (await exists(widePath)) && (await exists(narrowPath))) {
      const wsz = (await fs.stat(widePath)).size;
      if (wsz > 60_000) {
        if (await jpegNeedsBackfill(widePath, wideJpgPath, narrowJpgPath)) {
          const jpgs = await writeJpegCompanions(slug, widePath, narrowPath);
          results.push({
            slug,
            source: 'jpg-regenerated',
            wideJpg: jpgs.wideJpg.length,
            narrowJpg: jpgs.narrowJpg.length,
          });
          console.log(
            `${slug}: jpg-regenerated ${(jpgs.wideJpg.length / 1024).toFixed(1)}KB / ${(
              jpgs.narrowJpg.length / 1024
            ).toFixed(1)}KB`,
          );
        } else {
          results.push({ slug, source: 'cached', size: wsz });
        }
        continue;
      }
      // smaller than ~60KB → almost certainly an SVG-banner rasterisation;
      // fall through to refresh.
    }

    const meta = UNSPLASH_PHOTOS[slug];
    let buffer;
    let source = 'unsplash';
    let credit = meta.credit;

    try {
      const got = await fetchPexelsPhoto(PEXELS_QUERIES[slug]);
      if (got) {
        buffer = got.buffer;
        source = 'pexels';
        credit = `${got.photographer} / Pexels`;
      }
    } catch (err) {
      console.warn(`${slug}: Pexels failed (${err.message}); falling back to Unsplash`);
    }

    if (!buffer) {
      try {
        buffer = await downloadBuffer(unsplashUrl(meta.id, 1600));
      } catch (err) {
        console.warn(`${slug}: Unsplash failed (${err.message}); falling back to local SVG`);
      }
    }

    let wideBuf;
    let narrowBuf;
    let wideJpgBuf;
    let narrowJpgBuf;
    if (buffer) {
      wideBuf = await toWebpFromBuffer(buffer, WIDE.w, WIDE.h, 150 * 1024);
      narrowBuf = await toWebpFromBuffer(buffer, NARROW.w, NARROW.h, 90 * 1024);
      wideJpgBuf = await toJpegFromBuffer(buffer, WIDE.w, WIDE.h, 200 * 1024);
      narrowJpgBuf = await toJpegFromBuffer(buffer, NARROW.w, NARROW.h, 120 * 1024);
    } else {
      const svgPath = path.join(BLOG_DIR, `${slug}.svg`);
      if (!(await exists(svgPath))) {
        throw new Error(`No remote photo and no local SVG for ${slug}`);
      }
      source = 'svg-fallback';
      credit = '(local SVG fallback)';
      wideBuf = await fromSvgFile(svgPath, WIDE.w, WIDE.h, 150 * 1024);
      narrowBuf = await fromSvgFile(svgPath, NARROW.w, NARROW.h, 90 * 1024);
      wideJpgBuf = await toJpegFromBuffer(await fs.readFile(svgPath), WIDE.w, WIDE.h, 200 * 1024);
      narrowJpgBuf = await toJpegFromBuffer(await fs.readFile(svgPath), NARROW.w, NARROW.h, 120 * 1024);
    }

    await fs.writeFile(widePath, wideBuf);
    await fs.writeFile(narrowPath, narrowBuf);
    await fs.writeFile(wideJpgPath, wideJpgBuf);
    await fs.writeFile(narrowJpgPath, narrowJpgBuf);
    results.push({
      slug,
      source,
      credit,
      wide: wideBuf.length,
      narrow: narrowBuf.length,
      wideJpg: wideJpgBuf.length,
      narrowJpg: narrowJpgBuf.length,
    });
    console.log(
      `${slug}: ${source} webp ${(wideBuf.length / 1024).toFixed(1)}KB / ${(
        narrowBuf.length / 1024
      ).toFixed(1)}KB, jpg ${(wideJpgBuf.length / 1024).toFixed(1)}KB / ${(
        narrowJpgBuf.length / 1024
      ).toFixed(1)}KB — ${credit}`,
    );
  }

  console.log(`\nDone — ${slugs.length} hero images in ${OUT_DIR}`);
  const cached = results.filter((r) => r.source === 'cached').length;
  const jpgRegenerated = results.filter((r) => r.source === 'jpg-regenerated').length;
  const fetched = results.filter((r) => r.source === 'unsplash' || r.source === 'pexels').length;
  const svg = results.filter((r) => r.source === 'svg-fallback').length;
  console.log(
    `Summary: ${fetched} fetched, ${cached} cached, ${jpgRegenerated} jpg-regenerated, ${svg} SVG fallback`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

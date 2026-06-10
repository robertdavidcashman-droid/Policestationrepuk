/**
 * Generate distinct 720×720 JPEG defaults for Buffer Google Business posts.
 * Usage: node scripts/generate-gbp-defaults.mjs
 */
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'public', 'images', 'buffer', 'gbp');
const SIZE = 720;

/** Feed-specific source art — visually distinct at a glance in Buffer. */
const SOURCES = {
  policestationrepuk: {
    input: 'public/social-preview.jpg',
    background: '#0f172a',
  },
  custodynote: {
    input: 'public/images/custodynote/illustration-structured-form.svg',
    background: '#1e3a5f',
  },
  psrtrain: {
    input: 'public/images/blog/raster/what-makes-a-good-police-station-representative.jpg',
    background: '#134e4a',
  },
  policestationagent: {
    input: 'public/images/blog/raster/how-firms-can-instruct-freelance-police-station-reps.jpg',
    background: '#312e81',
  },
};

async function buildFeedJpeg(feedId, { input, background }) {
  const inputPath = path.join(ROOT, input);
  const outPath = path.join(OUT_DIR, `${feedId}-default.jpg`);

  const isSvg = input.endsWith('.svg');
  let foreground = sharp(inputPath, isSvg ? { density: 200 } : undefined).resize(
    Math.round(SIZE * 0.82),
    Math.round(SIZE * 0.82),
    { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } },
  );

  if (isSvg) {
    foreground = foreground.png();
  }

  const fgBuffer = await foreground.toBuffer();

  await sharp({
    create: {
      width: SIZE,
      height: SIZE,
      channels: 3,
      background,
    },
  })
    .composite([{ input: fgBuffer, gravity: 'centre' }])
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(outPath);

  console.log(`wrote ${outPath}`);
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  for (const [feedId, spec] of Object.entries(SOURCES)) {
    await buildFeedJpeg(feedId, spec);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

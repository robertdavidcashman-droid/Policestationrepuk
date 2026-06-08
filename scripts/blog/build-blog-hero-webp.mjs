/**
 * Rasterise blog hero SVGs to 16:9 WebP (1200×675 and 768×432).
 * Run from repo root: node scripts/blog/build-blog-hero-webp.mjs
 * Target file size under 150KB for 1200w where possible (quality stepped down).
 */
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const ROOT = process.cwd();
const BLOG_DIR = path.join(ROOT, 'public', 'images', 'blog');
const OUT_DIR = path.join(BLOG_DIR, 'raster');

const WIDE = { w: 1200, h: 675 };
const NARROW = { w: 768, h: 432 };

async function toWebpUnderSize(inputPath, width, height, maxBytes) {
  let quality = 88;
  let buf;
  for (let i = 0; i < 8; i++) {
    buf = await sharp(inputPath)
      .resize(width, height, { fit: 'cover', position: 'centre' })
      .webp({ quality, effort: 6 })
      .toBuffer();
    if (buf.length <= maxBytes || quality <= 65) break;
    quality -= 4;
  }
  return buf;
}

async function toJpegUnderSize(inputPath, width, height, maxBytes) {
  let quality = 88;
  let buf;
  for (let i = 0; i < 8; i++) {
    buf = await sharp(inputPath)
      .resize(width, height, { fit: 'cover', position: 'centre' })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
    if (buf.length <= maxBytes || quality <= 65) break;
    quality -= 4;
  }
  return buf;
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const names = await fs.readdir(BLOG_DIR);
  const svgs = names.filter((n) => n.endsWith('.svg'));
  if (!svgs.length) {
    console.error('No SVG files in', BLOG_DIR);
    process.exit(1);
  }
  for (const file of svgs) {
    const slug = path.basename(file, '.svg');
    const inputPath = path.join(BLOG_DIR, file);
    const wideBuf = await toWebpUnderSize(inputPath, WIDE.w, WIDE.h, 150 * 1024);
    const narrowBuf = await toWebpUnderSize(inputPath, NARROW.w, NARROW.h, 90 * 1024);
    const wideJpg = await toJpegUnderSize(inputPath, WIDE.w, WIDE.h, 200 * 1024);
    const narrowJpg = await toJpegUnderSize(inputPath, NARROW.w, NARROW.h, 120 * 1024);
    await fs.writeFile(path.join(OUT_DIR, `${slug}.webp`), wideBuf);
    await fs.writeFile(path.join(OUT_DIR, `${slug}-768.webp`), narrowBuf);
    await fs.writeFile(path.join(OUT_DIR, `${slug}.jpg`), wideJpg);
    await fs.writeFile(path.join(OUT_DIR, `${slug}-768.jpg`), narrowJpg);
    console.log(
      `${slug}.webp (${(wideBuf.length / 1024).toFixed(1)} KB), ${slug}.jpg (${(wideJpg.length / 1024).toFixed(1)} KB)`,
    );
  }
  console.log('Done —', svgs.length, 'heroes →', OUT_DIR);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

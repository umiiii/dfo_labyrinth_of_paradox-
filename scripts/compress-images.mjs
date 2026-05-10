// Convert public/resources/map.img/*.PNG and public/rewards/*.PNG to WebP.
// Run with: node scripts/compress-images.mjs
import { promises as fs } from 'fs';
import path from 'path';
import sharp from 'sharp';

const ROOT = path.resolve(process.cwd(), 'public');
const TARGETS = [
  { dir: path.join(ROOT, 'resources', 'map.img'), quality: 78 },
  { dir: path.join(ROOT, 'rewards'), quality: 82 },
];

async function processDir({ dir, quality }) {
  let entries;
  try {
    entries = await fs.readdir(dir);
  } catch {
    console.log(`[skip] ${dir} (missing)`);
    return;
  }
  const pngs = entries.filter((f) => /\.png$/i.test(f));
  let savedTotal = 0;
  for (const f of pngs) {
    const src = path.join(dir, f);
    const dst = path.join(dir, f.replace(/\.png$/i, '.webp'));
    const before = (await fs.stat(src)).size;
    await sharp(src)
      .webp({ quality, effort: 6 })
      .toFile(dst);
    const after = (await fs.stat(dst)).size;
    const saved = before - after;
    savedTotal += saved;
    console.log(
      `[ok] ${path.relative(ROOT, dst)}  ${(before / 1024).toFixed(0)}KB → ${(after / 1024).toFixed(0)}KB  (-${(saved / 1024).toFixed(0)}KB)`,
    );
  }
  console.log(`[dir] ${path.relative(ROOT, dir)}: saved ${(savedTotal / 1024).toFixed(0)}KB total`);
}

for (const t of TARGETS) await processDir(t);

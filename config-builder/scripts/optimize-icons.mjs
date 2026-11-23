// One-off generator for the CDN icon set used by both the static site and
// the generated YAML config.
//
// Problem it solves: several current icons are 256px files downscaled from a
// blurry source (e.g. chatgpt.png), so they look soft when a client renders
// them larger. The repo keeps 1024px originals under assets/icons/old/, so we
// rebuild every icon from the sharpest available source, trim transparent
// padding, fit into a clean 256px square, and quantise to a 256-colour PNG.
//
// Output goes to assets/icons/v2/ so the CDN URL changes and stale cached
// copies of the old files are never served.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SRC = path.join(ROOT, "assets/icons");
const OLD = path.join(SRC, "old");
const OUT = path.join(SRC, "v2");
const SIZE = 256;

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const files = (await fs.readdir(SRC)).filter((f) => f.toLowerCase().endsWith(".png"));
  const report = [];

  for (const file of files) {
    const current = path.join(SRC, file);
    const original = path.join(OLD, file);
    const source = (await exists(original)) ? original : current;
    const fromOld = source === original;

    let trimmed;
    try {
      // Trim only fully transparent margins so the artwork fills the frame;
      // keep a tiny 2px breathing room so icons are not clipped by rounding.
      const { data, info } = await sharp(source)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      let minX = info.width, minY = info.height, maxX = -1, maxY = -1;
      for (let y = 0; y < info.height; y++) {
        for (let x = 0; x < info.width; x++) {
          const a = data[(y * info.width + x) * 4 + 3];
          if (a > 8) {
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
          }
        }
      }
      const hasContent = maxX >= minX && maxY >= minY;
      const pad = Math.max(2, Math.round((maxX - minX + 1) * 0.02));
      let pipeline = sharp(source).ensureAlpha();
      if (hasContent) {
        const left = Math.max(0, minX - pad);
        const top = Math.max(0, minY - pad);
        const width = Math.min(info.width - left, maxX - minX + 1 + pad * 2);
        const height = Math.min(info.height - top, maxY - minY + 1 + pad * 2);
        pipeline = pipeline.extract({ left, top, width, height });
      }
      const buf = await pipeline
        .resize(SIZE, SIZE, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
          kernel: "lanczos3",
        })
        .png({ palette: true, colours: 256, quality: 92, compressionLevel: 9 })
        .toBuffer();
      await fs.writeFile(path.join(OUT, file), buf);
      report.push({
        file,
        fromOld,
        sourceSize: `${info.width}x${info.height}`,
        bytes: buf.length,
      });
    } catch (err) {
      report.push({ file, error: String(err.message || err) });
    }
  }

  const ok = report.filter((r) => !r.error);
  const bad = report.filter((r) => r.error);
  const before = (await Promise.all(files.map(async (f) => (await fs.stat(path.join(SRC, f))).size))).reduce((a, b) => a + b, 0);
  const after = ok.reduce((a, r) => a + r.bytes, 0);
  console.log(`processed ${ok.length}/${files.length} icons`);
  console.log(`from 1024px originals: ${ok.filter((r) => r.fromOld).length}`);
  console.log(`input size:  ${(before / 1024 / 1024).toFixed(2)} MB`);
  console.log(`output size: ${(after / 1024 / 1024).toFixed(2)} MB`);
  console.log(`saved:       ${(((before - after) / before) * 100).toFixed(1)}%`);
  if (bad.length) console.log("errors:", bad);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

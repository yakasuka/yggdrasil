// One-off generator for the site's CDN icon set.
//
// The pristine originals are archived under assets/icons/old/. This script
// rebuilds every icon from its archived original at a single, uniform
// standard: transparent margins trimmed, artwork fitted into a 256x256
// square, and PNG quantised to 256 colours. Output goes straight back to
// assets/icons/ so every consumer shares one canonical URL — there is no
// versioned subfolder.
//
// Keeping the archive separate means the generated files can always be
// reproduced without hunting for a blurry, downscaled copy.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SRC = path.join(ROOT, "assets/icons/old");
const OUT = path.join(ROOT, "assets/icons");
const SIZE = 256;

async function main() {
  const files = (await fs.readdir(SRC))
    .filter((f) => f.toLowerCase().endsWith(".png"))
    .sort();
  const report = [];

  for (const file of files) {
    const source = path.join(SRC, file);
    const { data, info } = await sharp(source)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Trim only fully transparent margins so the artwork fills the frame;
    // keep a tiny breathing room so rounded icons are not clipped.
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
    report.push({ file, bytes: buf.length });
  }

  const total = report.reduce((sum, r) => sum + r.bytes, 0);
  console.log(`regenerated ${report.length} icons at ${SIZE}x${SIZE} into assets/icons/`);
  console.log(`output size: ${(total / 1024 / 1024).toFixed(2)} MB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

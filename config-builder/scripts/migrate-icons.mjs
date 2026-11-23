// One-time migration: restore the site's original icon artwork as the archive.
//
// The 1024px set previously stored in assets/icons/old/ is a DIFFERENT icon
// pack from the ones the site has always used (root assets/icons/*.png). The
// v2 build sourced from that wrong pack, which changed artwork (key -> globe,
// popcorn -> film strip, comet -> fox, ...). This migration rebuilds old/ so
// it archives the true original for each site icon:
//   - if the 1024px file in old/ depicts the SAME artwork as the root icon,
//     keep the higher-resolution copy (better clarity);
//   - otherwise use the root icon, which is the artwork the site expects.
//
// Afterwards run optimize-icons.mjs to regenerate the uniform 256px set.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SITE = path.join(ROOT, "assets/icons");
const OLD = path.join(SITE, "old");
const GRID = 64;

async function fingerprint(buf) {
  const { data, info } = await sharp(buf)
    .flatten({ background: "#ffffff" })
    .resize(GRID, GRID, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, channels: info.channels };
}

function difference(a, b) {
  const c = a.channels;
  let total = 0;
  for (let i = 0; i < a.data.length; i += c) {
    for (let k = 0; k < 3; k++) total += Math.abs(a.data[i + k] - b.data[i + k]);
  }
  return total / (a.data.length / c * 3);
}

async function main() {
  const files = (await fs.readdir(SITE))
    .filter((f) => f.toLowerCase().endsWith(".png"))
    .sort();
  const staged = new Map();
  const report = [];

  for (const file of files) {
    const siteBuf = await fs.readFile(path.join(SITE, file));
    const oldPath = path.join(OLD, file);
    let oldBuf = null;
    try {
      oldBuf = await fs.readFile(oldPath);
    } catch {
      /* no archived counterpart */
    }

    let source = siteBuf;
    let reason = "site original";
    if (oldBuf) {
      const [siteFp, oldFp] = await Promise.all([
        fingerprint(siteBuf),
        fingerprint(oldBuf),
      ]);
      const diff = difference(siteFp, oldFp);
      const siteMeta = await sharp(siteBuf).metadata();
      const oldMeta = await sharp(oldBuf).metadata();
      if (diff < 6 && oldMeta.width > siteMeta.width) {
        source = oldBuf;
        reason = `archived hi-res match (diff ${diff.toFixed(1)}, ${oldMeta.width}px)`;
      } else {
        reason += ` (diff ${diff.toFixed(1)}${diff >= 6 ? ", artwork differs" : ", no res gain"})`;
      }
    }
    staged.set(file, source);
    report.push({ file, reason, bytes: source.length });
  }

  // Replace the archive with the true originals, then let optimize-icons.mjs
  // regenerate the uniform root set from it.
  for (const entry of await fs.readdir(OLD)) {
    if (entry.toLowerCase().endsWith(".png")) await fs.unlink(path.join(OLD, entry));
  }
  for (const [file, buf] of staged) await fs.writeFile(path.join(OLD, file), buf);

  const hiRes = report.filter((r) => r.reason.startsWith("archived"));
  console.log(`archived ${report.length} originals into assets/icons/old/`);
  console.log(`kept ${hiRes.length} higher-resolution matches:`);
  for (const r of hiRes) console.log(`  ${r.file.padEnd(20)} ${r.reason}`);
  const changed = report.filter((r) => !r.reason.startsWith("archived") && r.reason.includes("artwork differs"));
  console.log(`restored ${changed.length} icons whose v2 artwork had changed.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

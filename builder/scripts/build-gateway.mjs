import { build } from "esbuild";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const output = new URL("worker/gateway/dist/", root);
await mkdir(output, { recursive: true });
await build({
  entryPoints: [fileURLToPath(new URL("worker/gateway/index.js", root))],
  outfile: fileURLToPath(new URL("_worker.js", output)),
  bundle: true,
  format: "esm",
  target: "es2022",
  minify: true,
  legalComments: "none",
});
await writeFile(
  new URL("_routes.json", output),
  JSON.stringify({ version: 1, include: ["/*"], exclude: [] }),
);
console.log("Public subscription gateway built.");

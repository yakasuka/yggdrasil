import { build } from "esbuild";
import {
  mkdir,
  writeFile,
  readFile,
  readdir,
  copyFile,
  rm,
} from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const repository = new URL("../", root);
const output = new URL("worker/gateway/dist/", root);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

async function copy(source, destination) {
  await mkdir(new URL("./", destination), { recursive: true });
  await copyFile(source, destination);
}
async function images(source, destination) {
  for (const entry of await readdir(source, { withFileTypes: true })) {
    if (entry.isDirectory())
      await images(
        new URL(entry.name + "/", source),
        new URL(entry.name + "/", destination),
      );
    else if (entry.isFile() && /\.(png|ico|svg|webp)$/.test(entry.name))
      await copy(new URL(entry.name, source), new URL(entry.name, destination));
  }
}

// Publish an explicit set of browser files; never copy the repository wholesale.
for (const [source, destination] of [
  ["index.html", "index.html"],
  ["config-builder/index.html", "config-builder/index.html"],
  ["config-builder/assets/app.js", "config-builder/assets/app.js"],
  ["config-builder/assets/app.css", "config-builder/assets/app.css"],
])
  await copy(new URL(source, repository), new URL(destination, output));
for (const path of ["assets/"])
  await images(new URL(path, repository), new URL(path, output));
const notices = await Promise.all(
  [
    "yaml/LICENSE",
    "http-parser-js/LICENSE.md",
    "buffer/LICENSE",
    "base64-js/LICENSE",
    "ieee754/LICENSE",
  ].map(
    async (path) =>
      path +
      "\n" +
      (await readFile(new URL("node_modules/" + path, root), "utf8")),
  ),
);
await build({
  entryPoints: [fileURLToPath(new URL("worker/gateway/index.js", root))],
  outfile: fileURLToPath(new URL("_worker.js", output)),
  bundle: true,
  format: "esm",
  target: "es2022",
  minify: true,
  legalComments: "none",
  banner: {
    js:
      "/*! Third-party licenses\n" +
      notices.join("\n\n").replaceAll("*/", "* /") +
      "\n*/",
  },
  external: ["cloudflare:*"],
});
await writeFile(
  new URL("_routes.json", output),
  JSON.stringify({ version: 1, include: ["/*"], exclude: [] }),
);
console.log("Public site and subscription gateway built.");

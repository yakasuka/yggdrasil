import {
  mkdir,
  writeFile,
  readdir,
  copyFile,
  rm,
  stat,
} from "node:fs/promises";

const root = new URL("../", import.meta.url);
const repository = new URL("../", root);
const output = new URL("worker/gateway/dist/", root);

function serviceBaseURL() {
  const value = (process.env.SERVICE_BASE_URL || "").trim();
  if (!value) return "";
  let url;
  try {
    url = new URL(value);
  } catch {
    throw Error("SERVICE_BASE_URL 必须是完整的 http(s) 地址。");
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw Error("SERVICE_BASE_URL 只能是不含路径与参数的源地址。");
  return url.origin;
}

const service = serviceBaseURL();

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

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

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

// A single plain-URL file lets the frontend discover the backend without
// rebuilding. It contains no credential and no node data.
const descriptor = JSON.stringify({ service }, null, 2) + "\n";
await writeFile(new URL("service.json", output), descriptor);
const existing = await stat(new URL("service.json", repository)).then(
  () => true,
  () => false,
);
if (service || !existing)
  await writeFile(new URL("service.json", repository), descriptor);

// Cloudflare Pages rewrite/redirect rules for legacy builder route aliases.
await writeFile(
  new URL("_redirects", output),
  [
    "/config-builder /config-builder/ 308",
    "/builder /config-builder/ 308",
    "/builder/ /config-builder/ 308",
    "/webui /config-builder/ 308",
    "/webui/ /config-builder/ 308",
    "/Configurator /config-builder/ 308",
    "/Configurator/ /config-builder/ 308",
    "",
  ].join("\n"),
);

console.log(
  `Static frontend built for Cloudflare Pages and GitHub Pages (no _worker.js).` +
    (service ? `\nService base: ${service}` : "\nService base: set via the yggdrasil:service meta tag."),
);

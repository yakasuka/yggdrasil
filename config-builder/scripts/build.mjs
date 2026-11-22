import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

// Both static hosts share one bundle. The service address is injected here so
// the very same assets/app.js works on Cloudflare Pages and GitHub Pages.
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

// Resolve paths from this script, so builds also work outside config-builder/.
await build({
  absWorkingDir: fileURLToPath(new URL("../", import.meta.url)),
  entryPoints: ["src/app.js"],
  outfile: "assets/app.js",
  bundle: true,
  format: "esm",
  target: "es2022",
  minify: true,
  legalComments: "none",
  define: { __SERVICE_BASE_URL__: JSON.stringify(serviceBaseURL()) },
});
// HTML always points at its matching assets, including on cached repeat visits.
const root = new URL("../", import.meta.url);
const htmlFile = new URL("index.html", root);
let html = await readFile(htmlFile, "utf8");
for (const extension of ["js", "css"]) {
  const bytes = await readFile(new URL(`assets/app.${extension}`, root));
  const version = createHash("sha256").update(bytes).digest("hex").slice(0, 12);
  html = html.replace(
    new RegExp(`\\./assets/app\\.${extension}(?:\\?[^"\\s]*)?`, "g"),
    `./assets/app.${extension}?v=${version}`,
  );
}
await writeFile(htmlFile, html);
console.log("config-builder bundled for GitHub Pages.");

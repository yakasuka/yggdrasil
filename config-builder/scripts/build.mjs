import { build } from "esbuild";
import { fileURLToPath } from "node:url";

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
});
console.log("config-builder bundled for GitHub Pages.");

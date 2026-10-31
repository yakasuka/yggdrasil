import { build } from "esbuild";
import { fileURLToPath } from "node:url";

// Resolve paths from this script, so builds also work outside Configurator/.
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
console.log("Configurator bundled for GitHub Pages.");

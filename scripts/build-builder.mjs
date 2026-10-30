import { build } from "esbuild";
await build({
  entryPoints: ["web/app.js"],
  outfile: "builder/app.js",
  bundle: true,
  format: "esm",
  target: "es2022",
  minify: true,
  legalComments: "none",
});
console.log("Builder bundled for GitHub Pages.");

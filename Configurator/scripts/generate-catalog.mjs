import fs from "node:fs";
import { catalogFromTemplate } from "../shared/template.js";
const source = new URL("../../Ratatoskr-Template.yaml", import.meta.url);
const destination = new URL("../shared/catalog.json", import.meta.url);
const catalog = await catalogFromTemplate(fs.readFileSync(source, "utf8"));
fs.writeFileSync(destination, JSON.stringify(catalog, null, 2) + "\n");
console.log(
  `Catalog: ${catalog.apps.length} apps, ${catalog.regions.length} regions from ${catalog.source}; no personal subscriptions.`,
);

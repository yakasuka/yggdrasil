// Regenerate shared/catalog.json from the Ratatoskr YAML template.
// This is the single source of truth for every picker option (regions, apps,
// rule sets, icons). Run automatically before build so editing the template
// updates the static frontends and the self-hosted service together.
import { readFile, writeFile } from "node:fs/promises";
import { catalogFromYaml } from "../shared/catalog-from-yaml.js";

const templatePath = new URL("../../resources/template/ratatoskr-template.yaml", import.meta.url);
const catalogPath = new URL("../shared/catalog.json", import.meta.url);

const text = await readFile(templatePath, "utf8");
const catalog = await catalogFromYaml(text);
await writeFile(catalogPath, JSON.stringify(catalog, null, 2) + "\n");
console.log(
  `catalog.json derived from ratatoskr-template.yaml · v${catalog.version} · ` +
    `${catalog.regions.length} regions · ${catalog.apps.length} apps · ` +
    `${catalog.orderedRules.length} rules`,
);

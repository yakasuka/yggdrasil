import { readFile, writeFile } from "node:fs/promises";

const configPath = new URL("../ratatoskr.yaml", import.meta.url);
const config = await readFile(configPath, "utf8");

const regionBlock = config.match(
  /^FilterRegions: &FilterRegions\r?\n((?:[ \t]+[A-Z]{2}: &Filter[A-Za-z]+ '[^']+'\r?\n)+)/m
);

if (!regionBlock) {
  throw new Error("Could not find the FilterRegions block in ratatoskr.yaml");
}

const regionPatterns = [...regionBlock[1].matchAll(
  /^[ \t]+[A-Z]{2}: &Filter[A-Za-z]+ '([^']+)'\r?$/gm
) ].map((match) => match[1]);

if (regionPatterns.length === 0) {
  throw new Error("FilterRegions does not contain any region patterns");
}

const regionPrefix = "(?i)^(?!=>).*(?:";
const regionAlternatives = regionPatterns.map((pattern) => {
  if (!pattern.startsWith(regionPrefix) || !pattern.endsWith(")")) {
    throw new Error(`Unsupported region filter format: ${pattern}`);
  }

  const body = pattern.slice(regionPrefix.length, -1);
  return `(?i:${body})`;
});

const allFilter = config.match(/^FilterAll: &FilterAll '([^']+)'\r?$/m)?.[1];

if (!allFilter) {
  throw new Error("Could not find the FilterAll pattern in ratatoskr.yaml");
}

const cleanTerms = allFilter.match(/^\^\(\?!\.\*\(\?:\(\?i\)=>\|(.*)\)\)\.\*\$$/)?.[1];

if (!cleanTerms) {
  throw new Error("FilterAll does not use the expected clean-filter format");
}

const excludedTerms = [`(?i)=>`, ...regionAlternatives, cleanTerms].join("|");
const filterOthers = `^(?!.*(?:${excludedTerms})).*$`;
const updatedConfig = config.replace(
  /^FilterOthers: &FilterOthers '[^'\r\n]*'?\r?$/m,
  () => `FilterOthers: &FilterOthers '${filterOthers}'`
);

if (updatedConfig === config) {
  throw new Error("Could not find the FilterOthers line to update");
}

await writeFile(configPath, updatedConfig, "utf8");
console.log(`Updated FilterOthers using ${regionPatterns.length} region filters.`);

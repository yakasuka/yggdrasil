import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { catalogFromYaml } from "../shared/catalog-from-yaml.js";
import { catalog } from "../shared/compiler.js";

const template = await readFile(
  new URL("../../resources/template/ratatoskr-template.yaml", import.meta.url),
  "utf8",
);

test("the bundled catalog is derived from the current YAML template", async () => {
  const derived = await catalogFromYaml(template);
  assert.equal(catalog.version, derived.version);
  assert.deepEqual(
    catalog.regions.map((r) => r.id),
    derived.regions.map((r) => r.id),
  );
  assert.deepEqual(
    catalog.apps.map((a) => a.id),
    derived.apps.map((a) => a.id),
  );
});

test("picker regions come from the template, not a stale 24-region snapshot", async () => {
  const derived = await catalogFromYaml(template);
  // The template currently defines six region filters (HK/TW/JP/KR/SG/US).
  assert.deepEqual(
    derived.regions.map((r) => r.id),
    ["HK", "TW", "JP", "KR", "SG", "US"],
  );
  for (const r of derived.regions) assert.ok(r.icon, `${r.id} has a template icon`);
});

test("newly added template apps appear in the picker", async () => {
  const derived = await catalogFromYaml(template);
  const labels = derived.apps.map((a) => a.label);
  for (const added of ["News", "广告拦截", "Speedtest"])
    assert.ok(labels.includes(added), `${added} should be selectable`);
});

test("rule-set names in the catalog match the template rule-providers", async () => {
  const derived = await catalogFromYaml(template);
  const names = derived.providerModules.map((p) => p.name);
  assert.ok(names.includes("🪐 Astra Domain"));
  assert.ok(names.includes("❎ AdGuard"));
  assert.ok(!names.includes("↘️ 直连域名"), "old stale rule-set name must be gone");
});

test("derived catalog compiles with valid references", async () => {
  const { compile, defaults, assertReferences } = await import("../shared/compiler.js");
  const base = {
    ...defaults(catalog),
    title: "T",
    providers: [{ name: "x", url: "https://a.example/sub" }],
    countries: catalog.regions.slice(0, 2).map((r) => r.id),
  };
  const { config } = await compile(base, catalog);
  assertReferences(config);
});

test("profiles saved with retired region codes still compile after a template shrink", async () => {
  const { compile, defaults, assertReferences } = await import("../shared/compiler.js");
  const old = {
    ...defaults(catalog),
    title: "legacy",
    providers: [{ name: "x", url: "https://a.example/sub" }],
    countries: ["HK", "TH", "AU"], // TH/AU no longer in the 6-region template
  };
  const { config, profile } = await compile(old, catalog, { migrate: true });
  assert.deepEqual(profile.countries, ["HK"]);
  assertReferences(config);
});

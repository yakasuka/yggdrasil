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

test("rule-less switch groups from the YAML are shown as entry pickers (Hermes)", async () => {
  // The author's rule: everything written in the template must be selectable.
  // ✨ Hermes is a select group with no rule of its own; the old derivation
  // reserved it AND dropped every rule-less group, so it never appeared on the
  // APP page. It must be present as an entry, and its exit must reach the YAML.
  const derived = await catalogFromYaml(template);
  const hermes = derived.apps.find((a) => a.name.includes("Hermes"));
  assert.ok(hermes, "Hermes must be present in the APP picker");
  assert.equal(hermes.entry, true);
  assert.equal(hermes.rules.length, 0);

  const { compile, defaults } = await import("../shared/compiler.js");
  const base = {
    ...defaults(derived),
    title: "T",
    providers: [{ name: "x", url: "https://a.example/sub" }],
    countries: derived.regions.map((r) => r.id),
  };
  const plain = await compile(base, derived);
  const group = plain.config["proxy-groups"].find((g) => g.name === hermes.name);
  assert.ok(group, "generated config must contain exactly one Hermes group");
  assert.ok(plain.yaml.includes("name: ✨ Hermes"));

  const picked = await compile(
    { ...base, appPolicy: { ...base.appPolicy, [hermes.id]: "region:JP" } },
    derived,
  );
  const changed = picked.config["proxy-groups"].find(
    (g) => g.name === hermes.name,
  );
  assert.equal(changed.proxies[0], "⛩️", "Hermes exit must follow the picker");
  assert.equal(
    picked.config["proxy-groups"].filter((g) => g.name === hermes.name).length,
    1,
    "no duplicate Hermes group",
  );
});

test("Others is a region group, not an APP; Hermes placement is YAML-declared", async () => {
  const derived = await catalogFromYaml(template);
  // 🌌 Others selects nodes outside the six filter-defined countries. It is
  // surfaced on the regions page (core.other), never as an APP switch card.
  assert.ok(!derived.apps.some((a) => a.name.includes("Others")));
  assert.equal(derived.groups.otherGroupName, "🌌 Others");
  const hermes = derived.apps.find((a) => a.name.includes("Hermes"));
  // No name is special-cased in code: Hermes' category comes from its authored
  // `x-category: 策略入口` in the template. AI must contain only real AI apps.
  assert.equal(hermes.category, "策略入口", "Hermes follows the template's x-category");
  assert.ok(
    !derived.apps.some((a) => a.category === "AI 与开发" && a.name.includes("Hermes")),
    "no hardcoded Hermes→AI exception remains",
  );
  assert.equal(hermes.entry, true, "Hermes stays a rule-less switch entry");
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

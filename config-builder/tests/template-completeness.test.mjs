import test from "node:test";
import assert from "node:assert/strict";
import { catalog, compile, defaults } from "../shared/compiler.js";

test("defaults follow the example template with every switch enabled", () => {
  const p = defaults(catalog);
  assert.deepEqual(p.strategies, catalog.strategies.map((s) => s.id));
  assert.equal(p.other, true);
  assert.equal(p.allowLan, true);
  assert.equal(p.appsMode, "all");
  assert.equal(
    p.modules.length,
    new Set(catalog.orderedRules.filter((r) => r.module).map((r) => r.module))
      .size,
  );
});

test("partial selection still writes every template group, region option and anchor reference", async () => {
  // Regression: the old renderer dropped unselected region groups entirely and
  // pruned them from 40+ proxies[] lists, so Hermes / 节点选择 / all APP groups
  // lost Hong Kong, Taiwan, Singapore and Others. Options must never be deleted.
  const p = {
    ...defaults(catalog),
    title: "示例",
    providers: [{ name: "test", url: "https://example.com/sub" }],
    countries: ["JP", "KR", "US"],
    other: false,
    appsMode: "custom",
    apps: ["openai"],
    strategies: ["auto"],
  };
  const out = await compile(p, catalog);

  // Every template group is written to the YAML, even unselected regions.
  const { parse } = await import("yaml");
  const doc = parse(out.yaml, { merge: true, maxAliasCount: 100 });
  const names = doc["proxy-groups"].map((g) => g.name);
  for (const name of [
    "🌆 Hong Kong",
    "🧋 Taiwan",
    "🏙️ Singapore",
    "🌌 Others",
    "✨ Hermes",
    "🎚️ 节点选择",
    "🏯 China",
    "🏁 Final",
  ])
    assert.ok(names.includes(name), `generated YAML missing group ${name}`);

  // Every proxies[] list in the rendered YAML keeps all template regions.
  const allRegions = [
    "🌆 Hong Kong",
    "🧋 Taiwan",
    "⛩️ Japan",
    "🎤 South Korea",
    "🏙️ Singapore",
    "🗽 United States",
    "🌌 Others",
  ];
  const hermes = doc["proxy-groups"].find((g) => g.name === "✨ Hermes");
  for (const region of allRegions)
    assert.ok(hermes.proxies.includes(region), `Hermes missing option ${region}`);
  // The unselected-region filter anchors are still referenced in the YAML.
  for (const anchor of ["*FilterHK", "*FilterTW", "*FilterSG", "*FilterOthers"])
    assert.ok(out.yaml.includes(anchor), `missing anchor reference ${anchor}`);
});

test("full config keeps template-authored switch groups and rule providers", async () => {
  const profile = {
    ...defaults(catalog),
    title: "示例",
    providers: [{ name: "test", url: "https://example.com/sub" }],
    countries: catalog.regions.map((r) => r.id),
  };
  const out = await compile(profile, catalog);
  const names = out.config["proxy-groups"].map((g) => g.name);
  for (const name of [
    "✨ Hermes",
    "🎚️ 节点选择",
    "🔮 负载均衡",
    "📦 下载均衡",
    "🏯 China",
    "🌌",
    "🏁 Final",
  ])
    assert.ok(names.includes(name), `missing group ${name}`);
  for (const provider of ["📦 Cargo Downloads", "❎ AdGuard", "⚡ Matrix Port"])
    assert.ok(
      Object.hasOwn(out.config["rule-providers"], provider),
      `missing rule provider ${provider}`,
    );
  assert.match(out.yaml, /name: ✨ Hermes/);
  assert.match(out.yaml, /name: 🏯 China/);
  assert.match(out.yaml, /name: 🌌 Others/);
  assert.match(out.yaml, /name: 🔮 负载均衡/);
  assert.match(out.yaml, /name: 📦 下载均衡/);
  assert.match(out.yaml, /📦 Cargo Downloads:/);
  assert.match(out.yaml, /allow-lan: true/);
});

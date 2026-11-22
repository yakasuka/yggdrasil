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

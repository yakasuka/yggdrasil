import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parse } from "yaml";
import { compile, catalog, ruleModules } from "../shared/compiler.js";
import { profile } from "./helpers.mjs";

const template = await readFile(
  new URL("../../resources/template/ratatoskr-template.yaml", import.meta.url),
  "utf8",
);

// References in the rendered YAML must all resolve, using the template's own
// full group names (not the compiled config's short icon names).
function assertValidRefs(doc) {
  const names = doc["proxy-groups"].map((g) => g.name);
  assert.equal(new Set(names).size, names.length);
  const valid = new Set([...names, "DIRECT", "REJECT"]);
  for (const g of doc["proxy-groups"])
    for (const p of g.proxies || [])
      assert.ok(valid.has(p), `${g.name} -> missing ${p}`);
  const providers = new Set(Object.keys(doc["rule-providers"] || {}));
  for (const rule of doc.rules) {
    const parts = rule.split(",");
    if (parts.at(-1) === "no-resolve") parts.pop();
    assert.ok(valid.has(parts.at(-1)), `rule -> missing ${parts.at(-1)}`);
    if (parts[0] === "RULE-SET")
      assert.ok(providers.has(parts[1]), `missing provider ${parts[1]}`);
  }
  assert.ok(doc.rules.some((r) => r.startsWith("MATCH,")));
}

test("render keeps the author's comments, section banners and flow style", async () => {
  const { yaml } = await compile(profile());
  assert.ok(yaml.startsWith("# Ratatoskr · Eaibee"));
  for (const banner of [
    "1. 远程节点调用 Proxy Providers",
    "2. 基础设置 General",
    "4. 节点筛选 Node Filters",
    "6. 分流规则 Rules",
    "7. 规则源 Rule Providers",
  ])
    assert.ok(yaml.includes(banner), `missing banner: ${banner}`);
  // Inline comments and flow one-liners survive verbatim.
  assert.ok(yaml.includes("port: 7890"));
  assert.ok(yaml.includes("HTTP 代理端口"));
  assert.ok(yaml.includes("{name: ⚡ 自动选择"));
  assert.ok(yaml.includes("FilterRegions: &FilterRegions"));
  assert.ok(yaml.includes("<<: *RP-domain"));
});

test("render injects airport URLs as remote proxy-providers, never inlines nodes", async () => {
  const p = profile();
  const { yaml } = await compile(p);
  const doc = parse(yaml, { merge: true, maxAliasCount: 100 });
  assert.equal(doc.proxies, undefined);
  assert.ok(!/^proxies:/m.test(yaml));
  const providers = Object.values(doc["proxy-providers"]);
  assert.equal(providers.length, p.providers.length);
  assert.equal(providers[0].url, p.providers[0].url);
  assert.equal(providers[0].type, "http");
  assert.equal(providers[0].interval, 86400);
  assert.equal(providers[0].proxy, "DIRECT");
  assert.ok(providers[0]["health-check"].enable);
  // No node credentials from the decoded subscription leak into the config.
  assert.ok(!yaml.includes("private-node-fixture"));
});

test("render uses client-side GEOSITE/GEOIP and drops geox-url downloads", async () => {
  const { yaml } = await compile(profile());
  assert.ok(yaml.includes("GEOSITE,"));
  assert.ok(yaml.includes("GEOIP,"));
  assert.ok(!yaml.includes("geox-url"));
  assert.ok(!yaml.includes("geo-auto-update"));
  assert.ok(!yaml.includes("geodata-mode"));
});

test("render honours port, allow-lan and APP policy in place", async () => {
  const p = profile();
  p.port = 7899;
  p.allowLan = false;
  p.appPolicy = { openai: "region:US", apple: "direct", telegram: "reject" };
  const { yaml } = await compile(p);
  assert.ok(yaml.includes("port: 7899"));
  assert.ok(!/^port: 7890/m.test(yaml));
  assert.ok(yaml.includes("allow-lan: false"));
  const doc = parse(yaml, { merge: true, maxAliasCount: 100 });
  const first = (name) =>
    doc["proxy-groups"].find((g) => g.name === name).proxies[0];
  assert.equal(first("⚡ OpenAI"), "🗽 United States");
  assert.equal(first("⚪ Apple"), "DIRECT");
  assert.equal(first("🪽 Telegram"), "REJECT");
  assertValidRefs(doc);
});

test("render prunes deselected regions/strategies/modules and keeps references valid", async () => {
  const cases = [
    ["one region", { countries: ["JP"], other: false }],
    ["one strategy", { strategies: ["auto"] }],
    ["no modules", { modules: [] }],
    ["few apps", { appsMode: "custom", apps: ["openai"], appPolicy: { openai: "proxy" } }],
  ];
  for (const [label, patch] of cases) {
    const { yaml } = await compile({ ...profile(), ...patch });
    const doc = parse(yaml, { merge: true, maxAliasCount: 100 });
    assertValidRefs(doc);
    // Template shape is retained even after pruning.
    assert.ok(yaml.includes("6. 分流规则 Rules"), label);
    assert.ok(yaml.includes("proxy-providers:"), label);
  }
});

test("full modules render includes every rule module's rulesets", async () => {
  const p = profile();
  p.modules = ruleModules(catalog);
  const { yaml } = await compile(p);
  const doc = parse(yaml, { merge: true, maxAliasCount: 100 });
  for (const name of ["🪐 Astra Domain", "❎ AdGuard", "⚡ Matrix Port"])
    assert.ok(
      Object.hasOwn(doc["rule-providers"], name),
      `missing rule provider ${name}`,
    );
  assertValidRefs(doc);
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parse } from "yaml";
import { compile, catalog, ruleModules } from "../shared/compiler.js";
import { stripYamlComments } from "../shared/template-render.js";
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

test("source template keeps its comments; generated config is comment-free but keeps flow style", async () => {
  // The source YAML stays human/AI readable with section banners and comments.
  for (const banner of [
    "1 · 节点订阅 / Proxy Providers",
    "2 · 基础设置 / General",
    "6 · 分流规则 / Rules",
    "7 · 规则源 / Rule Providers",
  ])
    assert.ok(template.includes(banner), `source missing banner: ${banner}`);
  assert.ok(/^\s*#/m.test(template), "source template has comments");

  // The generated config drops every comment but keeps structure, flow-style
  // one-liners and YAML anchors (they are data, not comments).
  const { yaml } = await compile(profile());
  assert.ok(!/^\s*#/m.test(yaml), "generated config has no comment lines");
  assert.ok(!/\s+#/.test(yaml), "generated config has no inline comments");
  assert.ok(yaml.includes("port: 7890"));
  assert.ok(yaml.includes("{name: ⚡ 自动选择"), "flow one-liners survive");
  assert.ok(yaml.includes("FilterRegions: &FilterRegions"), "anchors survive");
  assert.ok(yaml.includes("<<: *RP-domain"), "merge keys survive");
});

test("stripYamlComments keeps # inside quotes and drops real comments", () => {
  const src = [
    "# a full comment",
    "port: 7890  # inline note",
    'url: "https://example.com/sub#fragment"  # keep the fragment',
    "name: 'a # b' # trailing",
    "FilterAll: &FilterAll '^(?!.*(?:(?i)=>|群)).*$'",
    "",
    "rules:",
    "  - GEOSITE,private,DIRECT",
  ].join("\n");
  const out = stripYamlComments(src);
  assert.ok(!/^\s*#/m.test(out), "no full comment lines");
  assert.ok(out.includes("port: 7890"), "inline comment removed, value kept");
  assert.ok(out.includes("https://example.com/sub#fragment"), "# in URL preserved");
  assert.ok(out.includes("name: 'a # b'"), "# in single quotes preserved");
  assert.ok(out.includes("FilterAll: &FilterAll"), "anchor kept");
  // Still parses after stripping.
  const doc = parse(out, { merge: true, maxAliasCount: 100 });
  assert.equal(doc.port, 7890);
  assert.ok(Array.isArray(doc.rules));
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

test("render keeps EVERY template group/region/rule regardless of selection", async () => {
  // Selections only decide default exits; they must never delete options from
  // the generated YAML (Hermes / 节点选择 / APP groups must keep all regions).
  const cases = [
    ["one region", { countries: ["JP"], other: false }],
    ["one strategy", { strategies: ["auto"] }],
    ["no modules", { modules: [] }],
    ["few apps", { appsMode: "custom", apps: ["openai"], appPolicy: { openai: "proxy" } }],
  ];
  const expectedGroups = parse(template, { merge: true, maxAliasCount: 100 })["proxy-groups"];
  const expectedRules = parse(template, { merge: true, maxAliasCount: 100 }).rules;
  for (const [label, patch] of cases) {
    const { yaml } = await compile({ ...profile(), ...patch });
    const doc = parse(yaml, { merge: true, maxAliasCount: 100 });
    assertValidRefs(doc);
    // The complete author template is written out verbatim.
    assert.deepEqual(
      new Set(doc["proxy-groups"].map((g) => g.name)),
      new Set(expectedGroups.map((g) => g.name)),
      `${label}: every template group must survive`,
    );
    assert.deepEqual([...doc.rules].sort(), [...expectedRules].sort(), `${label}: every template rule must survive`);
    for (const name of ["✨ Hermes", "🎚️ 节点选择", "🏯 China", "🏁 Final", "🌆 Hong Kong", "🧋 Taiwan", "🏙️ Singapore", "🌌 Others"]) {
      const group = doc["proxy-groups"].find((g) => g.name === name);
      assert.ok(group, `${label}: missing group ${name}`);
      // Switch / APP / China / Final groups list every region as an explicit
      // option; region groups themselves use include-all+filter and have no
      // proxies[] list, so only assert where the template defines one.
      if (["✨ Hermes", "🎚️ 节点选择", "🏯 China", "🏁 Final"].includes(name))
        for (const region of ["🌆 Hong Kong", "🧋 Taiwan", "⛩️ Japan", "🎤 South Korea", "🏙️ Singapore", "🗽 United States", "🌌 Others"])
          assert.ok(group.proxies.includes(region), `${label}: ${name} must keep ${region} as an option`);
    }
    assert.ok(doc.rules.some((r) => r.startsWith("MATCH,")), label);
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

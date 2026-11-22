import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { parse, stringify } from "yaml";
import {
  compile,
  normalize,
  defaults,
  catalog,
  assertReferences,
  STRATEGIES,
  RULE_MODULES,
  ruleModules,
} from "../shared/compiler.js";
import { catalogFromTemplate } from "../shared/template.js";

// The template-rendered YAML keeps the author's full group names, so validate
// references against its own group/provider names rather than the compiled
// config (which uses short icon names for regions).
function assertValidTemplateRefs(doc) {
  const names = doc["proxy-groups"].map((g) => g.name);
  assert.equal(new Set(names).size, names.length);
  const valid = new Set([...names, "DIRECT", "REJECT"]);
  for (const g of doc["proxy-groups"])
    for (const p of g.proxies || [])
      assert.ok(valid.has(p), `group ${g.name} references missing ${p}`);
  const providers = new Set(Object.keys(doc["rule-providers"] || {}));
  for (const rule of doc.rules) {
    const parts = rule.split(",");
    if (parts.at(-1) === "no-resolve") parts.pop();
    assert.ok(valid.has(parts.at(-1)), `rule targets missing ${parts.at(-1)}`);
    if (parts[0] === "RULE-SET")
      assert.ok(providers.has(parts[1]), `missing rule provider ${parts[1]}`);
  }
}
import {
  classifyNodes,
  parseNodes,
  parseUsage,
  aggregateUsage,
} from "../shared/nodes.js";
import { filename, contentDisposition } from "../shared/profile.js";
import { profile, text } from "./helpers.mjs";
test("defaults select all apps, manual routing, and expose no editable rules", () => {
  const p = defaults();
  assert.equal(p.defaultStrategy, "manual");
  assert.deepEqual(
    p.apps,
    catalog.apps.map((a) => a.id),
  );
  assert.equal(p.appsMode, "all");
  assert.deepEqual(p.modules, ruleModules(catalog));
  for (const field of ["custom", "rules", "fallback"])
    assert.equal(Object.hasOwn(p, field), false);
});

test("rule modules are the template module IDs and every one has display text", () => {
  const present = ruleModules(catalog);
  assert.ok(present.length >= 5);
  for (const id of present)
    assert.ok(RULE_MODULES.some((m) => m.id === id), `missing display for ${id}`);
  for (const m of RULE_MODULES)
    assert.ok(m.label && m.description && m.symbol);
});

test("turning a rule module off narrows the preview but keeps every template rule in the YAML", async () => {
  const base = await compile(profile());
  for (const id of ruleModules(catalog)) {
    const p = profile();
    p.modules = ruleModules(catalog).filter((m) => m !== id);
    const { config, yaml } = await compile(p);
    assertReferences(config);
    // The structured config drives the preview and reflects the user's
    // selection, so the module's rules are absent there.
    const removed = catalog.orderedRules.filter((r) => r.module === id).map((r) => r.rule);
    assert.ok(
      removed.every((rule) => !config.rules.includes(rule)),
      `rules from ${id} must be absent from the preview config`,
    );
    // The downloaded YAML, however, is the author's complete option list:
    // deselecting a module must NOT delete its rules from the file.
    const rendered = parse(yaml, { merge: true, maxAliasCount: 100 });
    assert.deepEqual([...rendered.rules].sort(), [...base.config.rules].sort());
    assertValidTemplateRefs(rendered);
    assert.ok(yaml.includes("GEOSITE,"));
    // Everything outside the disabled module is still present in the preview.
    for (const rule of base.config.rules) {
      if (removed.includes(rule)) continue;
      assert.ok(config.rules.includes(rule), `rule ${rule} should survive`);
    }
  }
});

test("an empty module selection keeps only APP rules, MATCH and valid references", async () => {
  const p = profile();
  p.modules = [];
  const { config } = await compile(p);
  assertReferences(config);
  // Module-scoped RULE-SET rules (direct-extra / proxy-extra / ports) all
  // disappear. APP-scoped RULE-SET rules stay, because an APP can itself be
  // implemented as a rule set (e.g. 广告拦截 / adguard) — APP routing is not
  // module-scoped.
  const appRuleSets = new Set(catalog.apps.map((a) => a.rules).flat().filter((r) => r.startsWith("RULE-SET,")));
  assert.ok(
    config.rules
      .filter((r) => r.startsWith("RULE-SET,"))
      .every((r) => appRuleSets.has(r)),
  );
  assert.ok(config.rules.some((r) => r.startsWith("MATCH,")));
  // APP routing rules still work because they are not module-scoped.
  assert.ok(config.rules.some((r) => r.includes("👾 Steam")));
});

test("legacy saved profiles without a modules field keep every rule", async () => {
  const legacy = profile();
  delete legacy.modules;
  const normalized = normalize(legacy);
  assert.deepEqual(normalized.modules, ruleModules(catalog));
  const withModules = await compile(profile());
  const fromLegacy = await compile(legacy);
  assert.deepEqual(fromLegacy.config.rules, withModules.config.rules);
});

test("unknown module ids in a profile are rejected", () => {
  const p = profile();
  p.modules = ["not-a-module"];
  assert.throws(() => normalize(p));
});
test("APP routing uses only chosen regional groups, follow proxy, Direct and Reject", async () => {
  const p = profile();
  p.appPolicy = { openai: "region:US", apple: "direct", telegram: "reject" };
  const { config, yaml } = await compile(p);
  const rendered = parse(yaml, { merge: true, maxAliasCount: 100 });
  assertValidTemplateRefs(rendered);
  assertReferences(config);
  // APP default routes are reflected in the rendered group's first proxy.
  const renderedGroup = (name) =>
    rendered["proxy-groups"].find((g) => g.name === name);
  assert.equal(
    renderedGroup(catalog.apps.find((a) => a.id === "openai").name).proxies[0],
    "🗽 United States",
  );
  const group = (id) =>
    config["proxy-groups"].find(
      (g) => g.name === catalog.apps.find((a) => a.id === id).name,
    );
  assert.equal(
    group("openai").proxies[0],
    catalog.regions.find((r) => r.id === "US").name,
  );
  assert.equal(group("apple").proxies[0], "DIRECT");
  assert.equal(group("telegram").proxies[0], "REJECT");
  assert.equal(group("google").proxies[0], catalog.groups.gateway);
  assert.equal(
    config["proxy-groups"].find((g) => g.name === catalog.groups.gateway)
      .proxies[0],
    catalog.groups.manual,
  );
  assert.equal(
    config["proxy-groups"].find((g) => g.name === catalog.groups.final)
      .proxies[0],
    catalog.groups.gateway,
  );
  assert.equal(
    Object.values(config["proxy-providers"])[0].override["additional-prefix"],
    "[P1] ",
  );
});
test("all strategy combinations keep references valid and retain template precedence", async () => {
  for (let i = 0; i < 16; i++) {
    const p = profile();
    p.strategies = STRATEGIES.filter((_, j) => (i >> j) & 1).map((s) => s.id);
    const { config } = await compile(p);
    assertReferences(config);
    assert.ok(
      config.rules.indexOf("GEOSITE,steam@cn,DIRECT") <
        config.rules.indexOf("GEOSITE,steam,👾 Steam"),
    );
    assert.ok(
      config.rules.indexOf("GEOSITE,openai,⚡ OpenAI") <
        config.rules.indexOf("GEOSITE,category-ai-!cn,✨ AI 服务"),
    );
  }
});
test("removing a country excludes it from every automatic/manual strategy even when Others remains", async () => {
  const p = profile();
  p.countries = ["JP"];
  p.other = true;
  const { config } = await compile(p);
  const match = new RegExp(
    config["proxy-groups"]
      .find((g) => g.name === catalog.groups.manual)
      .filter.replaceAll("(?i)", ""),
    "i",
  );
  assert.equal(match.test("[P1] 日本 JP 01"), true);
  assert.equal(match.test("[P1] 美国 US 01"), false);
  assert.equal(match.test("[P1] 未知地区 01"), true);
});
test("hidden rule mutations, invalid app regions, lifetimes and duplicate sources are rejected", () => {
  for (const change of [
    (p) => (p.rules = []),
    (p) => (p.custom = { proxy: ["a.example"] }),
    (p) => (p.fallback = "direct"),
    (p) => (p.appPolicy = { openai: "region:GB" }),
    (p) => (p.lifetime = "1d"),
    (p) => p.providers.push({ ...p.providers[0] }),
  ]) {
    const p = profile();
    change(p);
    assert.throws(() => normalize(p));
  }
  assert.equal(filename("Eaibee"), "ratatoskr · Eaibee.yaml");
  assert.equal(filename("../名字/"), "ratatoskr · 名字.yaml");
});
test("new template APP and country require no browser lists or backend code changes", async () => {
  const source = parse(
    fs.readFileSync(
      new URL("./fixtures/template-with-metadata.yaml", import.meta.url),
      "utf8",
    ),
    { merge: true },
  );
  source["proxy-groups"].push(
    { name: "🧪 New App", type: "select", proxies: ["DIRECT"] },
    {
      name: "🥝",
      type: "select",
      filter: "(?i)(?:新西兰|New Zealand|\\bNZ\\b)",
      "x-configurator": {
        kind: "region",
        id: "NZ",
        label: "新西兰",
        flag: "🇳🇿",
      },
    },
  );
  source.rules.unshift("DOMAIN-SUFFIX,new.example,🧪 New App");
  const next = await catalogFromTemplate(stringify(source));
  assert.ok(next.apps.some((a) => a.id === "new.example"));
  assert.ok(next.regions.some((r) => r.id === "NZ"));
  const p = { ...profile(), countries: ["NZ"] };
  const out = await compile(p, next);
  assert.ok(out.config["proxy-groups"].some((g) => g.name === "🧪 New App"));
  assert.ok(out.config["proxy-groups"].some((g) => g.name === "🥝"));
  assertReferences(out.config);
  assert.notEqual(next.version, catalog.version);
  assert.equal(Object.hasOwn(next, "proxy-providers"), false);
});
test("node inventory and traffic use real reported values and distinguish missing data", () => {
  const nodes = classifyNodes(parseNodes(text), catalog);
  assert.deepEqual(
    nodes.map((n) => n.region),
    ["JP", "US", "OTHER"],
  );
  const u = parseUsage("upload=10;download=20;total=100");
  assert.equal(u.remaining, 70);
  assert.equal(parseUsage("total=100"), null);
  assert.equal(aggregateUsage([{ usage: u }, { usage: null }]).total, null);
  assert.equal(aggregateUsage([{ usage: u }]).total, 100);
});

test("region classification and emitted filters agree for ambiguous and newly added names", async () => {
  const p = { ...profile(), countries: ["US"], other: false };
  const generated = await compile(p);
  const pattern = generated.config["proxy-groups"].find(
    (g) => g.name === catalog.groups.manual,
  ).filter;
  const regex = new RegExp(pattern.replaceAll("(?i)", ""), "i");
  assert.equal(
    classifyNodes(
      [{ id: "n", name: "香港 HK 到 美国 US", provider: 0 }],
      catalog,
    )[0].region,
    "HK",
  );
  assert.equal(regex.test("[P1] 香港 HK 到 美国 US"), false);
  const model = {
    ...catalog,
    regions: [
      ...catalog.regions,
      {
        id: "NZ",
        name: "🥝",
        label: "新西兰",
        filter: "(?i)(?:新西兰|New Zealand|\\bNZ\\b)",
      },
    ],
  };
  const nz = await compile({ ...p, countries: ["NZ"] }, model);
  const nzRegex = new RegExp(
    nz.config["proxy-groups"]
      .find((g) => g.name === model.groups.manual)
      .filter.replaceAll("(?i)", ""),
    "i",
  );
  assert.equal(nzRegex.test("[P1] 新西兰 NZ 01"), true);
});

test("download response preserves ASCII names and correctly encodes Unicode and apostrophes", () => {
  const cd = contentDisposition("Eaibee");
  // ASCII fallback replaces the middle dot; UTF-8 form encodes it precisely.
  assert.ok(cd.includes('filename="ratatoskr _ Eaibee.yaml"'));
  assert.ok(cd.includes("filename*=UTF-8''ratatoskr%20%C2%B7%20Eaibee.yaml"));
  const header = contentDisposition("小明\'s");
  assert.ok(header.includes("%27"));
  assert.ok(header.includes("%E5"));
  assert.ok(!/[\u0080-\uffff]/.test(header));
});

test("subscription parser does not emit source excerpts or return node secrets", () => {
  const warnings = [];
  const warn = console.warn;
  console.warn = (...v) => warnings.push(v);
  try {
    const result = parseNodes(
      "proxies:\n  - name: Japan JP\n    type: socks5\n    server: node.example.com\n    port: 443\n    password: !private sample-secret\n",
    );
    assert.equal(result.length, 1);
    assert.equal(Object.hasOwn(result[0], "password"), false);
    assert.deepEqual(warnings, []);
  } finally {
    console.warn = warn;
  }
});

test("final route is fixed to follow the global proxy selector", async () => {
  const { config } = await compile(profile());
  assert.deepEqual(
    config["proxy-groups"].find((g) => g.name === catalog.groups.final).proxies,
    [catalog.groups.gateway],
  );
});

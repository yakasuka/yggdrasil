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
} from "../shared/compiler.js";
import { catalogFromTemplate } from "../shared/template.js";
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
  for (const field of ["custom", "rules", "fallback"])
    assert.equal(Object.hasOwn(p, field), false);
});
test("APP routing uses only chosen regional groups, follow proxy, Direct and Reject", async () => {
  const p = profile();
  p.appPolicy = { openai: "region:US", apple: "direct", telegram: "reject" };
  const { config, yaml } = await compile(p);
  assert.deepEqual(parse(yaml), config);
  assertReferences(config);
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
  assert.equal(filename("Eaibee"), "Eaibee-ratatoskr.yaml");
  assert.equal(filename("../名字/"), "名字-ratatoskr.yaml");
});
test("new template APP and country require no browser lists or backend code changes", async () => {
  const source = parse(
    fs.readFileSync(
      new URL("../../Ratatoskr-Template.yaml", import.meta.url),
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
  assert.ok(
    contentDisposition("Eaibee").includes('filename="Eaibee-ratatoskr.yaml"'),
  );
  const header = contentDisposition("小明\'s");
  assert.ok(header.includes("%27"));
  assert.ok(header.includes("%E5"));
  assert.ok(!/[\u0080-\uffff]/.test(header));
});

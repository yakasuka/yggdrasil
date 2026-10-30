import test from "node:test";
import assert from "node:assert/strict";
import { parse } from "yaml";
import {
  compile,
  defaults,
  normalize,
  catalog,
  STRATEGIES,
  assertReferences,
} from "../shared/compiler.js";

const profile = () => ({
  ...defaults(),
  providers: [
    { name: "香港机场", url: "https://example.com/sub?token=private-fixture" },
  ],
});
test("generated configuration preserves precedence, source identity, and unified health checks", async () => {
  const p = profile();
  p.apps = catalog.apps.map((a) => a.id);
  const { yaml, config } = await compile(p);
  assert.deepEqual(parse(yaml), config);
  assertReferences(config);
  assert.ok(
    config.rules.indexOf("GEOSITE,steam@cn,DIRECT") <
      config.rules.indexOf("GEOSITE,steam,👾 Steam"),
  );
  assert.ok(
    config.rules.indexOf("GEOSITE,cn,DIRECT") <
      config.rules.indexOf("GEOSITE,apple,⚪ Apple"),
  );
  assert.ok(
    config.rules.indexOf("GEOSITE,openai,⚡ OpenAI") <
      config.rules.indexOf("GEOSITE,category-ai-!cn,✨ AI 服务"),
  );
  assert.equal(config["unified-delay"], true);
  const provider = Object.values(config["proxy-providers"])[0];
  assert.equal(provider.override["additional-prefix"], "[P1] ");
  assert.equal(provider["health-check"].url, catalog.testUrl);
  assert.equal(provider["health-check"]["expected-status"], 204);
});
test("selection combinations leave no dangling strategy, app, region or rule-provider references", async () => {
  for (let i = 0; i < 64; i++) {
    const p = profile();
    p.strategies = STRATEGIES.filter((_, j) => (i >> j) & 1).map((s) => s.id);
    p.defaultStrategy = p.strategies[0] || "manual";
    p.apps = i % 2 ? catalog.apps.map((a) => a.id) : [];
    p.rules = catalog.modules.filter((_, j) => (i >> j) & 1).map((m) => m.id);
    p.countries = i % 3 ? ["HK"] : [];
    p.other = !p.countries.length || i % 2 === 0;
    const { config } = await compile(p);
    assertReferences(config);
    const references = config.rules
      .filter((r) => r.startsWith("RULE-SET,"))
      .map((r) => r.split(",")[1]);
    assert.deepEqual(
      Object.keys(config["rule-providers"] || {}).sort(),
      references.sort(),
    );
    assert.equal(
      config["proxy-groups"].filter((g) =>
        catalog.apps.some((a) => a.name === g.name),
      ).length,
      p.apps.length,
    );
    assert.equal(config.rules.at(-1), "MATCH,🏁 Final");
  }
});
test("custom domains use canonical suffixes after private rules and before template rules", async () => {
  const p = profile();
  p.custom = {
    direct: ["*.例子.中国"],
    proxy: ["Example.COM"],
    reject: ["ads.example.org"],
  };
  const { config } = await compile(p);
  assert.equal(config.rules[0], "GEOSITE,private,DIRECT");
  assert.ok(
    config.rules.includes("DOMAIN-SUFFIX,xn--fsqu00a.xn--fiqs8s,DIRECT"),
  );
  assert.ok(config.rules.includes("DOMAIN-SUFFIX,example.com,🎚️ 节点选择"));
  p.custom.reject = ["example.com"];
  assert.throws(() => normalize(p), /同一域名/);
});
test("provider cache keys follow URLs, not names or their order", async () => {
  const p = profile(),
    first = Object.values((await compile(p)).config["proxy-providers"])[0];
  p.providers[0].name = "renamed";
  const second = Object.values((await compile(p)).config["proxy-providers"])[0];
  assert.equal(first.path, second.path);
  p.providers[0].url += "changed";
  const third = Object.values((await compile(p)).config["proxy-providers"])[0];
  assert.notEqual(first.path, third.path);
});
test("regional filters exclude unselected nodes when other regions are disabled", async () => {
  const p = profile();
  p.countries = ["JP"];
  p.other = false;
  const { config } = await compile(p);
  const jsRegex = (filter) => new RegExp(filter.replaceAll("(?i)", ""), "i");
  const filter = jsRegex(
    config["proxy-groups"].find((g) => g.name === "🚀 手动切换").filter,
  );
  assert.equal(filter.test("[P1] 日本 JP 01"), true);
  assert.equal(filter.test("[P1] 香港 HK 01"), false);
  p.other = true;
  const all = (await compile(p)).config["proxy-groups"];
  const others = jsRegex(all.find((g) => g.name === "🌌").filter);
  assert.equal(others.test("[P1] 日本 JP 01"), false);
  assert.equal(others.test("[P1] 香港 HK 01"), true);
});
test("malformed or ambiguous input is rejected without echoing credentials", () => {
  for (const change of [
    (p) => (p.providers = []),
    (p) => (p.providers[0].url = "javascript:alert(1)"),
    (p) => p.providers.push({ ...p.providers[0] }),
    (p) => (p.countries = ["UNKNOWN"]),
    (p) => {
      p.countries = [];
      p.other = false;
    },
    (p) => (p.custom.direct = ["example.com,REJECT"]),
    (p) => (p.custom.direct = ["https://example.com"]),
    (p) => (p.title = "name\nrule"),
    (p) => (p.port = 80),
    (p) => (p.ttlDays = 0),
  ]) {
    const p = profile();
    change(p);
    assert.throws(
      () => normalize(p),
      (error) => !error.message.includes("private-fixture"),
    );
  }
});
test("public catalog never includes source proxy providers or manual nodes", () => {
  assert.equal(Object.hasOwn(catalog, "proxy-providers"), false);
  assert.equal(Object.hasOwn(catalog, "proxies"), false);
  assert.equal(catalog.regions.length, 24);
  assert.equal(
    new Set(catalog.apps.map((a) => a.id)).size,
    catalog.apps.length,
  );
});

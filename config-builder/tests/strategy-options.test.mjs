import test from "node:test";
import assert from "node:assert/strict";
import { parse } from "yaml";
import {
  catalog,
  compile,
  defaults,
  normalize,
  CORE_STRATEGY_IDS,
} from "../shared/compiler.js";
import { STRATEGY_VIEW } from "../src/strategy-catalog.js";
import { strategiesPanel } from "../src/panels/strategies.js";

const base = () => ({
  ...defaults(catalog),
  title: "示例",
  providers: [{ name: "test", url: "https://example.com/sub" }],
  countries: ["JP"],
  other: false,
  appsMode: "custom",
  apps: ["openai"],
  strategies: ["auto"],
  defaultStrategy: "manual",
});

test("strategy display data is front-end owned and contains both select groups", () => {
  assert.equal(STRATEGY_VIEW.length, 6);
  assert.deepEqual(
    STRATEGY_VIEW.filter((s) => s.fixed).map((s) => s.id),
    CORE_STRATEGY_IDS,
  );
  const gateway = STRATEGY_VIEW.find((s) => s.id === "gateway");
  const manual = STRATEGY_VIEW.find((s) => s.id === "manual");
  assert.equal(gateway.name, "🎚️ 节点选择");
  assert.equal(manual.name, "🚀 手动切换");
  assert.ok(gateway.icon.startsWith("../assets/icons/"));
  assert.ok(manual.icon.startsWith("../assets/icons/"));
});

test("older profiles gain both select groups without a backend regeneration", () => {
  const p = normalize(base());
  assert.deepEqual(p.strategies, ["auto", ...CORE_STRATEGY_IDS]);
});

test("节点选择 cannot become the default exit because it would point to itself", () => {
  assert.throws(
    () => normalize({ ...base(), defaultStrategy: "gateway" }),
    /默认策略/,
  );
});

test("manual default maps to the template group name when compiling", async () => {
  const out = await compile(normalize(base()), catalog);
  const doc = parse(out.yaml, { merge: true, maxAliasCount: 100 });
  const gateway = doc["proxy-groups"].find(
    (g) => g.name === catalog.groups.gateway,
  );
  assert.equal(gateway.proxies[0], catalog.groups.manual);
});

test("strategy panel renders six cards and both select groups", () => {
  const html = strategiesPanel({
    profile: { strategies: ["auto", ...CORE_STRATEGY_IDS], defaultStrategy: "manual" },
  });
  assert.equal((html.match(/data-strategy=/g) || []).length, 6);
  assert.match(html, /🎚️ 节点选择/);
  assert.match(html, /🚀 手动切换/);
  assert.match(html, /data-strategy="gateway"[^>]* disabled/);
  assert.match(html, /<option value="manual"[^>]* selected>手动切换<\/option>/);
  assert.doesNotMatch(html, /<option value="gateway"/);
});

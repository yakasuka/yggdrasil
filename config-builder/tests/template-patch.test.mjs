import test from "node:test";
import assert from "node:assert/strict";
import { parse } from "yaml";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { applyTemplateOps } from "../shared/template-patch.js";
import { catalogFromYaml } from "../shared/catalog-from-yaml.js";
import { createService } from "../server/create-server.js";
import bundled from "../shared/catalog.json" with { type: "json" };
import { text } from "./helpers.mjs";

const ORIGIN = "https://yggdrasil.xyang.cyou";
const auth = "Basic " + Buffer.from("owner:s3cret").toString("base64");
const platform = {
  fetcher: async (_url, options) =>
    new Response(options?.method === "HEAD" ? null : text),
  ipFetcher: async () => new Response(text),
  resolver: async () => ["8.8.8.8"],
  probe: async () => 12,
};
async function service() {
  return createService({
    config: {
      host: "127.0.0.1", port: 8791, trustProxy: false, publicBase: ORIGIN,
      allowedOrigins: [], adminUsers: [{ user: "owner", pass: "s3cret" }],
      dataDir: await mkdtemp(join(tmpdir(), "yggdrasil-patch-")),
      templateURL: "bundled", tcpProbeEnabled: false,
    },
    platform,
  });
}
const patch = (ops) => applyTemplateOps(bundled.templateText, ops, parse);

test("meta op renames an app label and category without touching other lines", async () => {
  const out = patch([
    { kind: "meta", name: "⚡ OpenAI", fields: { label: "OpenAI 中文", category: "测试分类" } },
  ]);
  const before = bundled.templateText.split(/\r?\n/);
  const after = out.split(/\r?\n/);
  assert.equal(after.length, before.length + 1, "one @meta line inserted before the group");
  const added = after.filter((l) => l.includes("@meta") && l.includes("OpenAI 中文"));
  assert.equal(added.length, 1, "exactly one @meta line added");
  const cat = await catalogFromYaml(out);
  const app = cat.apps.find((a) => a.name === "⚡ OpenAI");
  assert.equal(app.label, "OpenAI 中文");
  assert.equal(app.category, "测试分类");
});

test("icon op replaces only the group's icon URL", async () => {
  const out = patch([{ kind: "icon", name: "⚡ OpenAI", value: "https://example.com/new.png" }]);
  const cat = await catalogFromYaml(out);
  assert.equal(cat.apps.find((a) => a.name === "⚡ OpenAI").icon, "https://example.com/new.png");
  assert.equal(cat.apps.find((a) => a.name === "🪐 Anthropic").icon, bundled.apps.find((a) => a.name === "🪐 Anthropic").icon);
});

test("exit op flips an app's first proxy between proxy and DIRECT", async () => {
  const direct = patch([{ kind: "exit", name: "⚡ OpenAI", value: "DIRECT" }]);
  const catD = await catalogFromYaml(direct);
  assert.equal(catD.apps.find((a) => a.name === "⚡ OpenAI").firstProxyDirect, true);
  const back = patch([
    { kind: "exit", name: "⚡ OpenAI", value: "DIRECT" },
    { kind: "exit", name: "⚡ OpenAI", value: "proxy" },
  ]);
  const catP = await catalogFromYaml(back);
  assert.equal(catP.apps.find((a) => a.name === "⚡ OpenAI").firstProxyDirect, false);
});

test("region meta op uses the full groupName and updates its label", async () => {
  const region = bundled.regions.find((r) => r.id === "HK");
  const out = patch([{ kind: "meta", name: region.groupName, fields: { label: "香港特别版" } }]);
  const cat = await catalogFromYaml(out);
  assert.equal(cat.regions.find((r) => r.id === "HK").label, "香港特别版");
});

test("remove op comments out the group and derives a valid smaller catalog", async () => {
  const out = patch([{ kind: "remove", name: "🪐 Anthropic" }]);
  const cat = await catalogFromYaml(out);
  assert.ok(!cat.apps.some((a) => a.name === "🪐 Anthropic"));
  assert.ok(cat.apps.some((a) => a.name === "⚡ OpenAI"), "other apps survive");
});

test("add-app op inserts a new select group and its rule", async () => {
  const out = patch([{
    kind: "add-app", name: "🧩 Notion", label: "Notion", category: "AI 与开发",
    icon: "https://example.com/notion.png", rule: "GEOSITE,notion,🧩 Notion",
  }]);
  const cat = await catalogFromYaml(out);
  const app = cat.apps.find((a) => a.name === "🧩 Notion");
  assert.ok(app, "new app present in derived catalog");
  assert.equal(app.label, "Notion");
  assert.equal(app.category, "AI 与开发");
  assert.ok(app.rules.some((r) => r.includes("GEOSITE,notion")));
});

test("general / filter / group-props ops expose every template knob", async () => {
  const out = patch([
    { kind: "general", fields: { port: 8123, "allow-lan": false, "unified-delay": false } },
    { kind: "filter", id: "all", value: "^(?!.*TEST).*$" },
    { kind: "filter", id: "HK", value: "(?i)HONGKONG" },
    { kind: "group-props", name: "⚡ 自动选择", fields: { interval: 600, tolerance: 20, url: "https://example.com/x" } },
    { kind: "group-props", name: "🎚️ 节点选择", fields: { proxies: "DIRECT, 🏁 Final" } },
  ]);
  const cat = await catalogFromYaml(out);
  assert.equal(cat.editor.general.port, 8123);
  assert.equal(cat.editor.general["allow-lan"], false);
  assert.equal(cat.editor.general["unified-delay"], false);
  assert.equal(cat.cleanFilter, "^(?!.*TEST).*$");
  assert.equal(cat.editor.filters.regions.HK, "(?i)HONGKONG");
  const auto = cat.editor.groups.find((g) => g.name === "⚡ 自动选择");
  assert.equal(auto.interval, 600);
  assert.equal(auto.tolerance, 20);
  assert.equal(auto.url, "https://example.com/x");
  assert.equal(cat.editor.groups.find((g) => g.name === "🎚️ 节点选择").proxies, "DIRECT, 🏁 Final");
});

test("rule ops edit / move / add / disable a rule in place", async () => {
  const rule = "GEOSITE,openai,⚡ OpenAI";
  const before = bundled.editor.rules.findIndex((r) => r.rule === rule);
  const edited = patch([{ kind: "rule-text", rule, value: "GEOSITE,openai,🏁 Final" }]);
  assert.ok((await catalogFromYaml(edited)).editor.rules.some((r) => r.rule === "GEOSITE,openai,🏁 Final"));
  const moved = await catalogFromYaml(patch([{ kind: "rule-move", rule, to: "down" }]));
  assert.equal(moved.editor.rules.findIndex((r) => r.rule === rule), before + 1);
  const added = await catalogFromYaml(patch([{ kind: "rule-add", rule: "GEOSITE,notion,🏁 Final" }]));
  assert.equal(added.editor.rules.filter((r) => r.rule === "GEOSITE,notion,🏁 Final").length, 1);
  const disabled = await catalogFromYaml(patch([{ kind: "rule", rule, enabled: false }]));
  assert.equal(disabled.editor.rules.find((r) => r.rule === rule).enabled, false);
});

test("provider op updates a rule-provider URL and interval", async () => {
  const out = patch([{ kind: "provider", name: "❎ AdGuard", fields: {
    url: "https://example.com/adguard.yaml", interval: 7200,
    behavior: "domain", format: "yaml", type: "http",
  } }]);
  const cat = await catalogFromYaml(out);
  const provider = cat.providerModules.find((p) => p.name === "❎ AdGuard");
  assert.equal(provider.value.url, "https://example.com/adguard.yaml");
  assert.equal(provider.value.interval, 7200);
});

test("PATCH /api/admin/frontinfo applies ops, persists and returns catalog", async () => {
  const s = await service();
  const res = await s.fetch(new Request(ORIGIN + "/api/admin/frontinfo", {
    method: "PATCH",
    headers: { Authorization: auth, "Content-Type": "application/json" },
    body: JSON.stringify({ ops: [
      { kind: "meta", name: "⚡ OpenAI", fields: { label: "图形化编辑" } },
      { kind: "icon", name: "⚡ OpenAI", value: "https://example.com/x.png" },
    ] }),
  }));
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.ok(body.text, "patched text returned");
  assert.ok(body.catalog.apps.some((a) => a.label === "图形化编辑"));

  const stored = await (await s.fetch(new Request(ORIGIN + "/api/admin/frontinfo", {
    headers: { Authorization: auth },
  }))).json();
  assert.equal(stored.source, "draft");
  assert.ok(stored.catalog.apps.some((a) => a.label === "图形化编辑"));
});

test("PATCH rejects a malformed op set without corrupting the draft", async () => {
  const s = await service();
  const res = await s.fetch(new Request(ORIGIN + "/api/admin/frontinfo", {
    method: "PATCH",
    headers: { Authorization: auth, "Content-Type": "application/json" },
    body: JSON.stringify({ ops: [{ kind: "meta", name: "不存在的组", fields: { label: "x" } }] }),
  }));
  assert.equal(res.status, 400);
  const get = await (await s.fetch(new Request(ORIGIN + "/api/admin/frontinfo", {
    headers: { Authorization: auth },
  }))).json();
  assert.equal(get.source, "repository", "no draft created on failure");
});

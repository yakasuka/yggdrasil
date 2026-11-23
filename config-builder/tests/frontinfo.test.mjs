import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createService } from "../server/create-server.js";
import { dashboardHTML } from "../server/dashboard.js";
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

async function service(extra = {}) {
  return createService({
    config: {
      host: "127.0.0.1",
      port: 8791,
      trustProxy: false,
      publicBase: ORIGIN,
      allowedOrigins: [],
      adminUsers: [{ user: "owner", pass: "s3cret" }],
      dataDir: await mkdtemp(join(tmpdir(), "yggdrasil-frontinfo-")),
      templateURL: "bundled",
      tcpProbeEnabled: false,
      ...extra,
    },
    platform,
  });
}

const req = (path, { method = "GET", body, authorization = auth } = {}) =>
  new Request(ORIGIN + path, {
    method,
    headers: {
      ...(authorization ? { Authorization: authorization } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

test("dashboard exposes the front-end editor and injects its API path", () => {
  const html = dashboardHTML({
    frontInfoPath: "/api/admin/frontinfo",
    catalogPath: "/api/catalog",
  });
  assert.match(html, /前端配置/);
  assert.match(html, /id="fi-text"/);
  assert.match(html, /CFG\.frontInfoPath/);
  assert.match(html, /method:"PUT"/);
  assert.match(html, /method:"DELETE"/);
  // A hostile path cannot break out of the boot config object.
  const hostile = dashboardHTML({ frontInfoPath: "</script><script>x" });
  assert.ok(!hostile.includes("</script><script>x"));
});

test("front-info API requires admin auth", async () => {
  const s = await service();
  assert.equal((await s.fetch(req("/api/admin/frontinfo", { authorization: "" }))).status, 401);
  assert.equal((await s.fetch(req("/api/admin/frontinfo", {
    authorization: "Basic " + Buffer.from("owner:wrong").toString("base64"),
  }))).status, 401);
});

test("front-info GET returns the repository template with a summary when no draft", async () => {
  const s = await service();
  const res = await s.fetch(req("/api/admin/frontinfo"));
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.source, "repository");
  assert.equal(data.text, bundled.templateText);
  assert.ok(data.summary.apps > 0);
  assert.ok(data.summary.version);
});

test("front-info PUT validates, saves a draft, and changes /api/catalog live", async () => {
  const s = await service();

  // A broken template is rejected and leaves no draft behind.
  const bad = await s.fetch(req("/api/admin/frontinfo", {
    method: "PUT",
    body: { text: "not: a: valid: yaml: [[" },
  }));
  assert.equal(bad.status, 400);
  assert.equal((await s.fetch(req("/api/frontinfo"))).status, 204);

  // A valid edit is saved.
  const edited = bundled.templateText.replace("⚡ OpenAI", "⚡ OpenAI 编辑版");
  assert.notEqual(edited, bundled.templateText);
  const put = await s.fetch(req("/api/admin/frontinfo", {
    method: "PUT",
    body: { text: edited },
  }));
  assert.equal(put.status, 200);
  const saved = await put.json();
  assert.equal(saved.ok, true);
  assert.ok(saved.updatedAt);
  assert.ok(saved.summary.apps > 0);

  // The editor now reports a draft.
  const get = await (await s.fetch(req("/api/admin/frontinfo"))).json();
  assert.equal(get.source, "draft");
  assert.equal(get.text, edited);

  // Public feed exposes the draft for the sync Action (no auth).
  const feed = await s.fetch(req("/api/frontinfo", { authorization: "" }));
  assert.equal(feed.status, 200);
  assert.equal((await feed.json()).text, edited);

  // /api/catalog reflects the edit immediately — no deploy or commit needed.
  const catalog = await (await s.fetch(req("/api/catalog", { authorization: "" }))).json();
  assert.notEqual(catalog.version, bundled.version);
  assert.ok(catalog.apps.some((a) => a.name.includes("编辑版")));
});

test("front-info DELETE discards the draft and restores the repository catalog", async () => {
  const s = await service();
  const edited = bundled.templateText.replace("⚡ OpenAI", "⚡ 临时改名");
  await s.fetch(req("/api/admin/frontinfo", { method: "PUT", body: { text: edited } }));
  assert.equal((await s.fetch(req("/api/frontinfo"))).status, 200);

  const del = await s.fetch(req("/api/admin/frontinfo", { method: "DELETE" }));
  assert.equal(del.status, 200);
  assert.equal((await del.json()).removed, true);

  assert.equal((await s.fetch(req("/api/frontinfo"))).status, 204);
  const get = await (await s.fetch(req("/api/admin/frontinfo"))).json();
  assert.equal(get.source, "repository");
  const catalog = await (await s.fetch(req("/api/catalog", { authorization: "" }))).json();
  assert.equal(catalog.version, bundled.version);
});

test("front-info is disabled together with the admin API when no users configured", async () => {
  const s = await service({ adminUsers: [] });
  assert.equal((await s.fetch(req("/api/admin/frontinfo"))).status, 401);
});

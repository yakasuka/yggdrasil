import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { catalog, defaults } from "../shared/compiler.js";
import {
  SHARE_CODE_RE,
  applyShare,
  newShareCode,
  parseShareCode,
  pickShareable,
} from "../shared/share.js";
import { createService } from "../server/create-server.js";
import { sourcesPanel } from "../src/panels/sources.js";
import { profile as fixture } from "./helpers.mjs";

const ORIGIN = "https://service.example";
const FRONTEND = "https://cf.example";
const platform = {
  fetcher: async () => new Response(""),
  ipFetcher: async () => new Response(""),
  resolver: async () => ["8.8.8.8"],
  probe: async () => 12,
};

async function service(extra = {}) {
  const dataDir = await mkdtemp(join(tmpdir(), "yggdrasil-share-"));
  const config = {
    host: "127.0.0.1",
    port: 8788,
    trustProxy: false,
    publicBase: ORIGIN,
    allowedOrigins: [FRONTEND],
    dataDir,
    presetTtl: 0,
    templateURL: "bundled",
    tcpProbeEnabled: false,
    ...extra,
  };
  return { ...createService({ config, platform }), dataDir };
}

const post = (body, origin = FRONTEND) =>
  new Request(ORIGIN + "/api/presets", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify(body),
  });
const get = (code, origin = FRONTEND) =>
  new Request(`${ORIGIN}/api/presets/${code}`, {
    headers: { Origin: origin },
  });

test("share controls live in a dialog available from every step", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /id="open-import"/);
  assert.match(html, /id="open-share"/);
  assert.match(html, /id="share-dialog"/);
  assert.match(html, /id="share-code-input"/);
  assert.match(html, /id="import-share"/);
  assert.match(html, /id="create-share"/);
  assert.match(html, /id="share-providers"/);
  assert.match(html, /id="share-result"/);
  assert.match(html, /id="share-error"/);
  // The two buttons open separate panes of one dialog, not one combined menu.
  // Both panes start hidden and are revealed per mode by openShareDialog().
  assert.match(html, /id="import-pane"[^>]*hidden/);
  assert.match(html, /id="export-pane"[^>]*hidden/);
  assert.match(html, /id="share-title"/);
  assert.match(html, /id="share-eyebrow"/);
  // The old per-step boxes are gone, so no duplicate IDs are rendered.
  const ctx = { profile: fixture(), inspection: null, service: "ready" };
  assert.doesNotMatch(sourcesPanel(ctx), /share-code-input|import-share/);
});

test("share codes are 36 random hex characters and parse from pasted links", () => {
  const codes = new Set();
  for (let i = 0; i < 20; i++) {
    const code = newShareCode();
    assert.match(code, SHARE_CODE_RE);
    codes.add(code);
  }
  assert.equal(codes.size, 20);
  const code = "fffa18b5ff005bba7a19928f3e8626974ebe";
  assert.equal(parseShareCode(code), code);
  assert.equal(parseShareCode("  " + code.toUpperCase() + "\n"), code);
  assert.equal(parseShareCode(`${ORIGIN}/api/presets/${code}`), code);
  assert.equal(parseShareCode(`https://host/p/${code}?from=friend`), code);
  assert.equal(parseShareCode("not-a-code"), null);
});

test("shared records omit airport URLs unless explicitly included", () => {
  const p = fixture();
  const safe = pickShareable(p);
  assert.equal(safe.providers, undefined);
  assert.equal(safe.title, "Eaibee");
  assert.deepEqual(safe.countries, ["JP", "US"]);
  assert.equal(Object.hasOwn(safe, "rules"), false);
  const full = pickShareable(p, true);
  assert.equal(full.providers[0].url, p.providers[0].url);
});

test("importing a code restores choices and drops unknown catalog IDs", () => {
  const base = { ...defaults(), title: "mine", providers: fixture().providers };
  const shared = {
    ...pickShareable(fixture()),
    countries: ["JP", "ZZZ"],
    appsMode: "custom",
    apps: ["app-does-not-exist"],
    modules: ["module-does-not-exist"],
  };
  const next = applyShare(base, shared, catalog);
  assert.equal(next.title, "Eaibee");
  assert.deepEqual(next.countries, ["JP"]);
  assert.deepEqual(next.apps, []);
  assert.deepEqual(next.modules, []);
  assert.deepEqual(next.providers, base.providers);
  assert.throws(() => applyShare(base, { version: 1 }, catalog), /版本/);
});

test("the preset API creates and reads sealed share codes", async () => {
  const svc = await service();
  const created = await svc.fetch(post({ profile: fixture() }));
  assert.equal(created.status, 200);
  const data = await created.json();
  assert.match(data.code, SHARE_CODE_RE);
  assert.equal(data.url, `${ORIGIN}/api/presets/${data.code}`);
  assert.equal(data.includeProviders, false);
  assert.equal(created.headers.get("access-control-allow-origin"), FRONTEND);

  const read = await svc.fetch(get(data.code));
  assert.equal(read.status, 200);
  const loaded = await read.json();
  assert.equal(loaded.includeProviders, false);
  assert.deepEqual(loaded.profile.countries, ["JP", "US"]);
  assert.equal(loaded.profile.providers, undefined);

  const files = (await readdir(svc.dataDir)).filter((f) => f.endsWith(".json"));
  assert.equal(files.length, 1);
  const raw = await readFile(join(svc.dataDir, files[0]), "utf8");
  assert.ok(!raw.includes("private-fixture"));
  assert.ok(!raw.includes("Eaibee"));
});

test("opt-in airport URLs are stored sealed and returned on read", async () => {
  const svc = await service();
  const created = await svc.fetch(
    post({ profile: fixture(), includeProviders: true }),
  );
  const data = await created.json();
  assert.equal(data.includeProviders, true);
  const loaded = await (await svc.fetch(get(data.code))).json();
  assert.equal(loaded.profile.providers[0].url, fixture().providers[0].url);
  const files = (await readdir(svc.dataDir)).filter((f) => f.endsWith(".json"));
  const raw = await readFile(join(svc.dataDir, files[0]), "utf8");
  assert.ok(!raw.includes("private-fixture"));
});

test("the preset API rejects bad codes, bad bodies and foreign origins", async () => {
  const svc = await service();
  assert.equal((await svc.fetch(get("a".repeat(36)))).status, 404);
  const bad = await svc.fetch(
    new Request(ORIGIN + "/api/presets", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: FRONTEND },
      body: "{not-json",
    }),
  );
  assert.equal(bad.status, 400);
  const huge = await svc.fetch(
    new Request(ORIGIN + "/api/presets", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: FRONTEND },
      body: JSON.stringify({ profile: { title: "x".repeat(70000) } }),
    }),
  );
  assert.equal(huge.status, 413);
  const foreign = await svc.fetch(post({ profile: fixture() }, "https://evil.example"));
  assert.equal(foreign.status, 403);
  const endpoints = await (
    await svc.fetch(new Request(ORIGIN + "/api/endpoints", { headers: { Origin: FRONTEND } }))
  ).json();
  assert.equal(endpoints.preset, ORIGIN + "/api/presets");
});

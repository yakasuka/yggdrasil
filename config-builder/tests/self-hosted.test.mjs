import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { catalog } from "../shared/compiler.js";
import { probeService } from "../src/service.js";
import { serviceBase, discoverService, apiFetch } from "../src/config.js";
import { fileStorage } from "../server/storage.js";
import { createService } from "../server/create-server.js";
import { createWorker } from "../worker/application.js";
import { profile, text } from "./helpers.mjs";

const ORIGIN = "https://service.example";
const FRONTEND = "https://cf.example";

function settings(extra = {}) {
  return {
    host: "127.0.0.1",
    port: 8788,
    trustProxy: false,
    publicBase: ORIGIN,
    allowedOrigins: [FRONTEND, "https://gh.example"],
    dataDir: "",
    templateURL: "bundled",
    tcpProbeEnabled: false,
    ...extra,
  };
}

const platform = {
  fetcher: async (_url, options) =>
    new Response(options?.method === "HEAD" ? null : text, {
      headers: { "Subscription-Userinfo": "upload=10; download=20; total=100" },
    }),
  ipFetcher: async () => new Response(text),
  resolver: async () => ["8.8.8.8"],
  probe: async () => 12,
};

async function service(extra = {}) {
  const config = settings({
    dataDir: await mkdtemp(join(tmpdir(), "yggdrasil-service-")),
    ...extra,
  });
  return createService({ config, platform });
}

const post = (path, body, origin = FRONTEND) =>
  new Request(ORIGIN + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify(body),
  });

test("the static frontend resolves the configured backend and omits credentials", async () => {
  const previousDocument = globalThis.document;
  const previousLocation = globalThis.location;
  const previousFetch = globalThis.fetch;
  try {
    globalThis.location = {
      origin: "https://static.example",
      href: "https://static.example/config-builder/",
    };
    globalThis.document = {
      querySelector: () => ({ content: " https://service.example/some/path " }),
    };
    assert.equal(serviceBase(), ORIGIN);
    globalThis.document = { querySelector: () => ({ content: "" }) };
    assert.equal(serviceBase(), "https://static.example");
    globalThis.document = {
      querySelector: () => ({ content: "javascript:alert(1)" }),
    };
    assert.equal(serviceBase(), "https://static.example");

    globalThis.document = {
      querySelector: () => ({ content: ORIGIN }),
    };
    const calls = [];
    globalThis.fetch = async (url, init) => {
      calls.push([url, init]);
      return new Response("ok");
    };
    await apiFetch("/api/status", { method: "GET" });
    await apiFetch("https://service.example/api/endpoints");
    assert.deepEqual(calls[0][0], ORIGIN + "/api/status");
    assert.equal(calls[0][1].credentials, "omit");
    assert.equal(calls[1][0], ORIGIN + "/api/endpoints");

    // Without a meta tag or build-time value, service.json is discovered at
    // runtime so both static hosts can switch backends without a rebuild.
    globalThis.document = { querySelector: () => ({ content: "" }) };
    globalThis.fetch = async () => Response.json({ service: ORIGIN });
    assert.equal(await discoverService(), ORIGIN);
    assert.equal(serviceBase(), ORIGIN);
  } finally {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
    if (previousLocation === undefined) delete globalThis.location;
    else globalThis.location = previousLocation;
    globalThis.fetch = previousFetch;
  }
});

test("health probes accept self-hosted storage and report the backend links", async () => {
  const result = await probeService(
    ORIGIN,
    catalog.version,
    async () =>
      Response.json({
        ready: true,
        storage: "self-hosted",
        format: "mihomo",
        version: catalog.version,
        capabilities: { tcp: false },
        service: ORIGIN,
        endpoints: ORIGIN + "/api/endpoints",
      }),
  );
  assert.equal(result.state, "ready");
  assert.equal(result.service, ORIGIN);
});

test("the backend emits only subscription links and never advertises a shared token", async () => {
  const s = await service();
  const health = await s.fetch(new Request(ORIGIN + "/api/status"));
  const healthData = await health.json();
  assert.equal(health.status, 200);
  assert.equal(healthData.storage, "self-hosted");
  assert.equal(healthData.service, ORIGIN);
  assert.equal(healthData.endpoints, ORIGIN + "/api/endpoints");

  const links = await s.fetch(
    new Request(ORIGIN + "/api/endpoints", { headers: { Origin: FRONTEND } }),
  );
  const payload = await links.text();
  assert.equal(links.status, 200);
  const data = JSON.parse(payload);
  assert.equal(data.create, ORIGIN + "/api/subscriptions");
  assert.equal(data.config, ORIGIN + "/config-builder");
  assert.equal(data.subscription, undefined);
  assert.equal(data.merge, undefined);
  assert.equal(data.sub, undefined);
  assert.equal(data.tokenHint, undefined);
  assert.ok(!payload.includes("token="));
});

test("cross-origin frontends are allowed, unknown origins are rejected, preflight works", async () => {
  const s = await service();
  const allowed = await s.fetch(
    post("/api/inspect", { providers: profile().providers }),
  );
  assert.equal(allowed.status, 200);
  assert.equal(allowed.headers.get("Access-Control-Allow-Origin"), FRONTEND);
  const denied = await s.fetch(
    post("/api/inspect", { providers: [] }, "https://evil.example"),
  );
  assert.equal(denied.status, 403);
  const preflight = await s.fetch(
    new Request(ORIGIN + "/api/subscriptions", {
      method: "OPTIONS",
      headers: { Origin: FRONTEND },
    }),
  );
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get("Access-Control-Allow-Origin"), FRONTEND);
  assert.match(
    preflight.headers.get("Access-Control-Allow-Headers"),
    /X-Config-Pwd/,
  );
});

test("subscription links point at the backend and serve YAML without any static host", async () => {
  const s = await service();
  const created = await s.fetch(post("/api/subscriptions", profile()));
  assert.equal(created.status, 201);
  const data = await created.json();
  assert.equal(data.url, ORIGIN + "/config-builder?token=eaibee");
  assert.equal(data.usageUrl, ORIGIN + "/config-builder/status?token=eaibee");
  const read = await s.fetch(new Request(data.url));
  assert.equal(read.status, 200);
  assert.equal(read.headers.get("Content-Type"), "text/plain; charset=utf-8");
  assert.equal(read.headers.get("Content-Disposition"), null);
  const yaml = await read.text();
  assert.ok(yaml.includes("proxies:"));
  assert.ok(read.headers.get("Subscription-Userinfo"));
  const usage = await s.fetch(
    new Request(data.usageUrl, { headers: { Origin: FRONTEND } }),
  );
  assert.equal(usage.status, 200);
  assert.equal((await usage.json()).usage.remaining, 70);
});

test("configuration names must be valid and unique", async () => {
  const s = await service();
  const first = await s.fetch(post("/api/subscriptions", profile()));
  assert.equal(first.status, 201);
  const duplicate = await s.fetch(post("/api/subscriptions", profile()));
  assert.equal(duplicate.status, 409);
  assert.match((await duplicate.json()).error, /已被使用/);
  const invalid = await s.fetch(
    post("/api/subscriptions", { ...profile(), title: "a&b" }),
  );
  assert.equal(invalid.status, 400);
  const missing = await s.fetch(new Request(ORIGIN + "/config-builder"));
  assert.equal(missing.status, 400);
  const unknown = await s.fetch(
    new Request(ORIGIN + "/config-builder?token=unknown-name"),
  );
  assert.equal(unknown.status, 404);
});

test("legacy random subscription links are gone; only friendly links work", async () => {
  const s = await service();
  const worker = createWorker(platform);
  const created = await worker.fetch(post("/api/profiles", profile()), s.env);
  assert.equal(created.status, 201);
  const internal = new URL((await created.json()).url);
  const legacy = internal.pathname.replace(/^\/s\//, "/subscription/");
  const read = await s.fetch(new Request(ORIGIN + legacy));
  assert.equal(read.status, 404);
});

test("legacy merge / sub routes and static relays no longer exist", async () => {
  const s = await service();
  const dist = new URL("../worker/gateway/dist/", import.meta.url);
  for (const path of ["/merge", "/sub"]) {
    const response = await s.fetch(new Request(ORIGIN + path));
    assert.equal(response.status, 404);
  }
  const files = readdirSync(dist, { recursive: true }).map(String);
  assert.ok(!files.includes("_worker.js"));
  assert.ok(!files.includes("_routes.json"));
  assert.ok(!files.some((p) => /(^|\/)(?:merge|sub)(\/|$)/.test(p)));
  for (const path of ["service.json", "_redirects"])
    assert.ok(existsSync(new URL(path, dist)), `missing ${path}`);
  const redirects = readFileSync(new URL("_redirects", dist), "utf8");
  assert.ok(!redirects.includes("/merge"));
  assert.ok(!redirects.includes("/sub "));
  const wrangler = readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8");
  assert.ok(!wrangler.includes("kv_namespaces"));
  assert.ok(!wrangler.includes("REPLACE_WITH_KV_NAMESPACE_ID"));
});

test("Docker builds never bake service credentials into the image", () => {
  const ignore = readFileSync(
    new URL("../../.dockerignore", import.meta.url),
    "utf8",
  );
  assert.ok(ignore.includes("**/.env"), "server/.env must be excluded");
  assert.ok(ignore.includes("!**/.env.example"), "keep the config template");
  assert.ok(ignore.includes("config-builder/server/data"), "records must be a volume");
  const dockerfile = readFileSync(
    new URL("../deploy/Dockerfile", import.meta.url),
    "utf8",
  );
  assert.ok(dockerfile.includes('"node", "server/index.js"'));
});

test("the on-disk store replaces Cloudflare KV and honours expiration", async () => {
  const directory = await mkdtemp(join(tmpdir(), "yggdrasil-store-"));
  const store = fileStorage(directory);
  await store.put("profile:a", JSON.stringify({ v: 3, x: 1 }));
  assert.deepEqual(await store.get("profile:a", "json"), { v: 3, x: 1 });
  assert.equal(await store.get("missing"), null);
  await store.put("profile:short", "value", { expirationTtl: 0.001 });
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(await store.get("profile:short"), null);
  assert.equal(await store.purge(), 0);
});

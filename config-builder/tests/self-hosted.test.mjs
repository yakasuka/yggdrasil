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
    token: "private-token",
    ghToken: "",
    publicConfigURL: "",
    privateRepo: "",
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

test("the backend emits every public link itself and never leaks its token", async () => {
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
  assert.ok(!payload.includes("private-token"));
  const data = JSON.parse(payload);
  assert.equal(data.merge, ORIGIN + "/merge?token=");
  assert.equal(data.sub, ORIGIN + "/sub?token=");
  assert.equal(data.create, ORIGIN + "/api/subscriptions");
  assert.equal(data.subscription, ORIGIN + "/subscription/");
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
});

test("subscription links point at the backend and serve YAML without any static host", async () => {
  const s = await service();
  const created = await s.fetch(post("/api/subscriptions", profile()));
  assert.equal(created.status, 201);
  const data = await created.json();
  assert.ok(data.url.startsWith(ORIGIN + "/subscription/"));
  assert.ok(data.usageUrl.endsWith("/status"));
  const read = await s.fetch(new Request(data.url));
  assert.equal(read.status, 200);
  const yaml = await read.text();
  assert.ok(yaml.includes("proxies:"));
  assert.ok(read.headers.get("Subscription-Userinfo"));
  const usage = await s.fetch(
    new Request(data.usageUrl, { headers: { Origin: FRONTEND } }),
  );
  assert.equal(usage.status, 200);
  assert.equal((await usage.json()).usage.remaining, 70);
});

test("/merge and /sub are served by the backend and require the service token", async () => {
  const s = await service();
  for (const path of ["/merge", "/sub"]) {
    const denied = await s.fetch(new Request(ORIGIN + path));
    assert.equal(denied.status, 401);
  }
});

test("the backend itself returns merge / sub bodies, never the static hosts", async () => {
  const previous = globalThis.fetch;
  try {
    const template =
      "# >>> AUTO-PROVIDERS-START\nold-providers\n# <<< AUTO-PROVIDERS-END\n";
    const providers = "proxy-providers:\n  private-one: {}\n";
    const nodes = "proxies:\n  - {name: private-node}\n";
    globalThis.fetch = async (input) => {
      const target = String(input);
      if (target.includes("template.yaml")) return new Response(template);
      const content = target.endsWith("providers.yaml") ? providers : nodes;
      return Response.json({
        content: Buffer.from(content, "utf8").toString("base64"),
        encoding: "base64",
      });
    };
    const s = await service({
      ghToken: "fake-gh-token",
      publicConfigURL: "https://example.com/template.yaml",
    });
    const merged = await s.fetch(
      new Request(ORIGIN + "/merge?token=private-token"),
    );
    assert.equal(merged.status, 200);
    const mergedBody = await merged.text();
    assert.ok(mergedBody.includes("private-one"));
    assert.ok(!mergedBody.includes("old-providers"));

    const sub = await s.fetch(new Request(ORIGIN + "/sub?token=private-token"));
    assert.equal(sub.status, 200);
    assert.ok((await sub.text()).includes("private-node"));
    assert.ok(sub.headers.get("Subscription-Userinfo"));
    // Private node bodies must not be readable by cross-origin browser JS.
    for (const response of [merged, sub]) {
      assert.equal(response.headers.get("Access-Control-Allow-Origin"), null);
      assert.equal(response.headers.get("Referrer-Policy"), "no-referrer");
      assert.match(response.headers.get("Cache-Control"), /no-store/);
    }
  } finally {
    globalThis.fetch = previous;
  }
});

test("static output contains no Worker, no KV binding and only link relays", () => {
  const dist = new URL("../worker/gateway/dist/", import.meta.url);
  const files = readdirSync(dist, { recursive: true }).map(String);
  assert.ok(!files.includes("_worker.js"));
  assert.ok(!files.includes("_routes.json"));
  for (const path of ["merge/index.html", "sub/index.html", "service.json", "_redirects"])
    assert.ok(existsSync(new URL(path, dist)), `missing ${path}`);
  const wrangler = readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8");
  assert.ok(!wrangler.includes("kv_namespaces"));
  assert.ok(!wrangler.includes("REPLACE_WITH_KV_NAMESPACE_ID"));
  // Cloudflare Functions must no longer read private node repositories.
  for (const name of ["merge", "sub"]) {
    const source = readFileSync(
      new URL(`../../functions/${name}.js`, import.meta.url),
      "utf8",
    );
    assert.ok(source.includes("SERVICE_BASE_URL"));
    for (const forbidden of ["GH_TOKEN", "nodes.yaml", "providers.yaml", "yggdrasil-private"])
      assert.ok(!source.includes(forbidden), `${name}.js still reads node data`);
  }
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
    new URL("../../deploy/Dockerfile", import.meta.url),
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

import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  configAliasKey,
  configQuery,
  parseConfigQuery,
} from "../shared/config-link.js";
import { subscriptionURL, usageURL } from "../src/service.js";
import { createService } from "../server/create-server.js";
import { profile, text } from "./helpers.mjs";

const ORIGIN = "https://service.example";
const FRONTEND = "https://cf.example";
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
      host: "127.0.0.1",
      port: 8789,
      trustProxy: false,
      publicBase: ORIGIN,
      allowedOrigins: [FRONTEND],
      dataDir: await mkdtemp(join(tmpdir(), "yggdrasil-pwd-")),
      templateURL: "bundled",
      tcpProbeEnabled: false,
    },
    platform,
  });
}

function create(pwd, changes = {}) {
  const headers = { "Content-Type": "application/json", Origin: FRONTEND };
  if (pwd !== undefined) headers["X-Config-Pwd"] = pwd;
  return new Request(ORIGIN + "/api/subscriptions", {
    method: "POST",
    headers,
    body: JSON.stringify({ ...profile(), ...changes }),
  });
}

test("the same name with different passwords creates separate subscriptions", async () => {
  const s = await service();
  const a = await s.fetch(create("alpha", { port: 7890 }));
  const b = await s.fetch(create("beta", { port: 7891 }));
  assert.equal(a.status, 201);
  assert.equal(b.status, 201);
  const da = await a.json();
  const db = await b.json();
  assert.equal(da.token, "eaibee");
  assert.equal(db.token, "eaibee");
  assert.equal(da.hasPwd, true);
  assert.match(da.url, /[?&]pwd=alpha$/);
  assert.match(db.url, /[?&]pwd=beta$/);
  const ya = await (await s.fetch(new Request(da.url))).text();
  const yb = await (await s.fetch(new Request(db.url))).text();
  assert.match(ya, /7890/);
  assert.match(yb, /7891/);
});

test("the same name and password still conflicts", async () => {
  const s = await service();
  assert.equal((await s.fetch(create("alpha"))).status, 201);
  const duplicate = await s.fetch(create("alpha"));
  assert.equal(duplicate.status, 409);
  assert.match((await duplicate.json()).error, /名称与口令组合/);
});

test("a passwordless name stays globally unique and coexists with passworded names", async () => {
  const s = await service();
  const plain = await s.fetch(create());
  assert.equal(plain.status, 201);
  const plainData = await plain.json();
  assert.equal(plainData.hasPwd, false);
  assert.equal(plainData.url, ORIGIN + "/config-builder?token=eaibee");
  const duplicate = await s.fetch(create());
  assert.equal(duplicate.status, 409);
  const passworded = await s.fetch(create("alpha"));
  assert.equal(passworded.status, 201);
  assert.equal(
    (await s.fetch(new Request(plainData.url))).status,
    200,
    "legacy passwordless links must keep working",
  );
  const wrong = ORIGIN + "/config-builder?token=eaibee&pwd=wrong";
  assert.equal((await s.fetch(new Request(wrong))).status, 404);
});

test("invalid passwords and malformed links are rejected", async () => {
  const s = await service();
  const invalid = await s.fetch(create("has space"));
  assert.equal(invalid.status, 400);
  assert.match((await invalid.json()).error, /访问口令/);
  const malformed = [
    ORIGIN + "/config-builder?token=eaibee&pwd=",
    ORIGIN + "/config-builder?token=eaibee&x=1",
    ORIGIN + "/config-builder?token=eaibee&pwd=abc&x=1",
  ];
  for (const url of malformed)
    assert.equal(
      (await s.fetch(new Request(url))).status,
      400,
      `unexpectedly accepted ${url}`,
    );
});

test("config links generate, parse and validate passwords consistently", () => {
  const query = configQuery("Guagua", "abc@123");
  assert.equal(query, "token=guagua&pwd=abc%40123");
  assert.deepEqual(parseConfigQuery(new URLSearchParams(query)), {
    name: "guagua",
    pwd: "abc@123",
  });
  assert.equal(configQuery("ab"), null);
  assert.equal(configQuery("guagua", "has space"), null);
  assert.equal(parseConfigQuery(new URLSearchParams("token=guagua&x=1")), null);
  const origin = ORIGIN;
  const link = origin + "/config-builder?" + query;
  assert.equal(subscriptionURL(link, origin), link);
  assert.equal(
    usageURL(origin + "/config-builder/status?" + query, origin),
    origin + "/config-builder/status?" + query,
  );
  assert.throws(() =>
    subscriptionURL(origin + "/config-builder?token=guagua&pwd=abc&x=1", origin),
  );
});

test("password hashing is stable, distinct and never stores the plaintext", async () => {
  const a = await configAliasKey("guagua", "alpha");
  assert.equal(a, await configAliasKey("guagua", "alpha"));
  assert.notEqual(a, await configAliasKey("guagua", "beta"));
  assert.notEqual(a, await configAliasKey("other", "alpha"));
  assert.equal(await configAliasKey("guagua", ""), "alias:guagua");
  assert.ok(!a.includes("alpha"));
  assert.match(a, /^alias:guagua:[0-9a-f]{32}$/);
});

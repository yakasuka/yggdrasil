import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { subscriptionURL, usageURL } from "../src/service.js";
import { publicLinkBase } from "../src/config.js";
import { createService } from "../server/create-server.js";
import { profile, text } from "./helpers.mjs";

const ORIGIN = "https://yggdrasil.xyang.cyou";
const FRONTEND = "https://yggdrasil-afx.pages.dev";
const PUBLIC = FRONTEND + "/yggdrasil/config-builder";
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
      port: 8790,
      trustProxy: false,
      publicBase: ORIGIN,
      allowedOrigins: [FRONTEND],
      adminUsers: [{ user: "owner", pass: "s3cret" }],
      dataDir: await mkdtemp(join(tmpdir(), "yggdrasil-admin-")),
      templateURL: "bundled",
      tcpProbeEnabled: false,
      ...extra,
    },
    platform,
  });
}

function create(pwd = "") {
  const headers = { "Content-Type": "application/json", Origin: FRONTEND };
  if (pwd) headers["X-Config-Pwd"] = pwd;
  return new Request(ORIGIN + "/api/subscriptions", {
    method: "POST",
    headers,
    body: JSON.stringify({ ...profile(), title: "Eaibee" }),
  });
}

const basic = (user, pass) =>
  "Basic " + Buffer.from(user + ":" + pass).toString("base64");
const adminGet = (s, auth = basic("owner", "s3cret")) =>
  s.fetch(new Request(ORIGIN + "/api/admin/configs", {
    headers: { Authorization: auth },
  }));
const adminDelete = (s, body, auth = basic("owner", "s3cret")) =>
  s.fetch(new Request(ORIGIN + "/api/admin/configs", {
    method: "DELETE",
    headers: { Authorization: auth, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }));

test("public links rewrite the backend origin to the Pages origin under a mount path", () => {
  const backend = ORIGIN + "/config-builder?token=eaibee&pwd=abc";
  assert.equal(
    subscriptionURL(backend, ORIGIN, PUBLIC),
    PUBLIC + "?token=eaibee&pwd=abc",
  );
  assert.equal(
    usageURL(ORIGIN + "/config-builder/status?token=eaibee", ORIGIN, PUBLIC),
    PUBLIC + "/status?token=eaibee",
  );
  // No public base keeps the previous backend-origin behaviour.
  assert.equal(subscriptionURL(backend, ORIGIN), backend);
  assert.throws(() => subscriptionURL(backend, "https://other.example", PUBLIC));
});

test("publicLinkBase reads the configured meta origin and mount path", () => {
  const previousDocument = globalThis.document;
  try {
    globalThis.document = {
      querySelector: () => ({ content: PUBLIC }),
    };
    assert.equal(publicLinkBase(), PUBLIC);
    globalThis.document = { querySelector: () => ({ content: "javascript:alert(1)" }) };
    assert.equal(publicLinkBase(), "");
  } finally {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  }
});

test("admin API requires Basic auth and is disabled when no users are configured", async () => {
  const s = await service();
  assert.equal((await adminGet(s, "")).status, 401);
  assert.equal((await adminGet(s, basic("owner", "wrong"))).status, 401);
  assert.equal((await adminGet(s)).status, 200);
  const off = await service({ adminUsers: [] });
  assert.equal((await adminGet(off)).status, 401);
});

test("admin API lists configs with password state and times, then deletes them", async () => {
  const s = await service();
  assert.equal((await s.fetch(create())).status, 201);
  assert.equal((await s.fetch(create("alpha"))).status, 201);

  const listed = await adminGet(s);
  assert.equal(listed.status, 200);
  const { configs } = await listed.json();
  assert.equal(configs.length, 2);
  const plain = configs.find((c) => !c.hasPwd);
  const locked = configs.find((c) => c.hasPwd);
  assert.equal(plain.token, "eaibee");
  assert.equal(locked.token, "eaibee");
  assert.ok(plain.id);
  assert.ok(plain.createdAt);

  const removed = await adminDelete(s, { token: "eaibee", pwd: "alpha" });
  assert.equal(removed.status, 200);
  assert.equal((await removed.json()).removed, true);
  // The passwordless link still works; the deleted one is gone.
  const plainUrl = ORIGIN + "/config-builder?token=eaibee";
  assert.equal((await s.fetch(new Request(plainUrl))).status, 200);
  const lockedUrl = ORIGIN + "/config-builder?token=eaibee&pwd=alpha";
  assert.equal((await s.fetch(new Request(lockedUrl))).status, 404);
  assert.equal((await adminGet(s).then((r) => r.json())).configs.length, 1);
  assert.equal((await adminDelete(s, { token: "eaibee", pwd: "alpha" })).status, 404);
});

test("admin deletion is itself protected by Basic auth", async () => {
  const s = await service();
  assert.equal((await s.fetch(create())).status, 201);
  const denied = await adminDelete(s, { token: "eaibee" }, "");
  assert.equal(denied.status, 401);
  assert.equal(
    (await s.fetch(new Request(ORIGIN + "/config-builder?token=eaibee"))).status,
    200,
  );
});

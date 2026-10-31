import test from "node:test";
import assert from "node:assert/strict";
import gateway from "../worker/gateway/index.js";
import worker from "../worker/index.js";
import { defaults, catalog } from "../shared/compiler.js";
import { serviceOrigin, subscriptionURL } from "../src/service.js";

const publicOrigin = "https://relay.example.pages.dev";
const uiOrigin = "https://yakasuka.github.io";
const profile = () => ({
  ...defaults(),
  providers: [
    { name: "Fixture", url: "https://example.com/sub?token=private-fixture" },
  ],
});
function environment() {
  const records = new Map(),
    calls = [];
  let rateChecks = 0;
  const privateEnv = {
    ALLOWED_ORIGINS: uiOrigin,
    SUBSCRIPTIONS: {
      put: async (k, v) => records.set(k, v),
      get: async (k, type) => {
        const v = records.get(k);
        return v ? (type === "json" ? JSON.parse(v) : v) : null;
      },
    },
    CREATE_LIMITER: {
      limit: async () => {
        rateChecks++;
        return { success: true };
      },
    },
  };
  return {
    records,
    calls,
    rateChecks: () => rateChecks,
    PROFILE_SERVICE: {
      fetch: async (request) => {
        calls.push(new URL(request.url).pathname);
        return worker.fetch(request, privateEnv);
      },
    },
  };
}
const create = () =>
  new Request(publicOrigin + "/api/subscriptions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: uiOrigin },
    body: JSON.stringify(profile()),
  });

test("public aliases generate and serve encrypted subscriptions without exposing private paths", async () => {
  const env = environment();
  const health = await gateway.fetch(
    new Request(publicOrigin + "/api/status", {
      headers: { Origin: uiOrigin },
    }),
    env,
  );
  assert.deepEqual(await health.json(), {
    ready: true,
    version: catalog.version,
    format: "mihomo",
  });
  const response = await gateway.fetch(create(), env);
  assert.equal(response.status, 201);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), uiOrigin);
  const created = await response.json();
  assert.equal(subscriptionURL(created.url, publicOrigin), created.url);
  assert.ok(created.url.startsWith(publicOrigin + "/subscription/"));
  assert.equal(env.rateChecks(), 1);
  const read = await gateway.fetch(new Request(created.url), env);
  assert.equal(read.status, 200);
  assert.ok(
    (await read.text()).includes(
      "https://example.com/sub?token=private-fixture",
    ),
  );
  assert.equal(
    read.headers.get("Content-Type"),
    "application/yaml; charset=utf-8",
  );
  const head = await gateway.fetch(
    new Request(created.url, { method: "HEAD" }),
    env,
  );
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");
  assert.deepEqual(env.calls.slice(0, 2), ["/api/health", "/api/profiles"]);
  assert.ok(env.calls[2].startsWith("/s/"));
  assert.ok(![...env.records.values()][0].includes("private-fixture"));
});
test("gateway forwards CORS preflight and keeps origin validation active", async () => {
  const env = environment();
  const preflight = await gateway.fetch(
    new Request(publicOrigin + "/api/subscriptions", {
      method: "OPTIONS",
      headers: { Origin: uiOrigin },
    }),
    env,
  );
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get("Access-Control-Allow-Origin"), uiOrigin);
  const request = create();
  request.headers.set("Origin", "https://untrusted.example");
  assert.equal((await gateway.fetch(request, env)).status, 403);
  assert.equal(env.records.size, 0);
});
test("private endpoints and source paths cannot be reached through the public gateway", async () => {
  const env = environment();
  for (const path of [
    "/api/health",
    "/api/profiles",
    "/worker/index.js",
    "/worker/wrangler.jsonc",
    "/s/" + "a".repeat(22) + "/" + "b".repeat(43) + ".yaml",
    "/",
  ])
    assert.equal(
      (await gateway.fetch(new Request(publicOrigin + path), env)).status,
      404,
    );
  assert.equal(env.calls.length, 0);
});
test("gateway failure responses contain no internal errors or addresses", async () => {
  const request = new Request(publicOrigin + "/api/status");
  assert.equal((await gateway.fetch(request, {})).status, 503);
  for (const fetch of [
    async () => {
      throw Error("private-service.example.workers.dev");
    },
    async () => new Response("private backend error", { status: 500 }),
  ]) {
    const response = await gateway.fetch(request, {
      PROFILE_SERVICE: { fetch },
    });
    assert.equal(response.status, 503);
    const body = await response.text();
    assert.ok(!/workers|private/i.test(body));
  }
  const response = await gateway.fetch(create(), {
    PROFILE_SERVICE: {
      fetch: async () =>
        Response.json(
          {
            url:
              "https://private.example.workers.dev/s/" +
              "a".repeat(22) +
              "/" +
              "b".repeat(43) +
              ".yaml",
          },
          { status: 201 },
        ),
    },
  });
  assert.equal(response.status, 502);
});
test("browser service configuration accepts public origins and rejects raw backend links", () => {
  assert.equal(serviceOrigin(""), null);
  assert.equal(serviceOrigin(publicOrigin), publicOrigin);
  assert.equal(serviceOrigin("http://127.0.0.1:8788"), "http://127.0.0.1:8788");
  for (const value of [
    "https://private.example.workers.dev",
    "http://relay.example.pages.dev",
    "https://user:secret@relay.example.pages.dev",
    "https://relay.example.pages.dev/worker/",
    "https://relay.example.pages.dev/?key=x",
  ])
    assert.throws(() => serviceOrigin(value));
  const suffix = "a".repeat(22) + "/" + "b".repeat(43) + ".yaml";
  assert.equal(
    subscriptionURL(publicOrigin + "/subscription/" + suffix, publicOrigin),
    publicOrigin + "/subscription/" + suffix,
  );
  for (const url of [
    publicOrigin + "/s/" + suffix,
    "https://private.example.workers.dev/subscription/" + suffix,
    publicOrigin + "/subscription/" + suffix + "?x=1",
  ])
    assert.throws(() => subscriptionURL(url, publicOrigin));
});

import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import { catalog } from "../shared/compiler.js";
import { catalogLoader } from "../worker/catalog.js";
import gateway from "../worker/gateway/index.js";
import { app, environment, post, profile } from "./helpers.mjs";
import * as production from "../worker/index.js";

test("production entrypoint exposes only the HTTP handler rather than the test factory", () => {
  assert.deepEqual(Object.keys(production), ["default"]);
  assert.equal(typeof production.default.fetch, "function");
});

test("Pages can read its own KV directly without calling a separate service", async () => {
  const env = environment();
  env.PROFILE_SERVICE = {
    fetch() {
      throw Error("Legacy service must not be invoked");
    },
  };
  const response = await gateway.fetch(
    new Request("https://configurator.example/api/status"),
    env,
  );
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.ready, true);
  assert.equal(data.storage, "kv");
});

test("bundled deployment loads its template without public GitHub access", async () => {
  const load = catalogLoader(() => {
    throw Error("Network must not be used");
  });
  assert.equal(await load({}), catalog);
  assert.equal(await load({ TEMPLATE_URL: "bundled" }), catalog);
});

test("same-origin site can create subscriptions and unconfigured cross-origin sites cannot", async () => {
  const service = app(),
    env = { ...environment(), ALLOWED_ORIGINS: "" };
  const bound = { PROFILE_SERVICE: { fetch: (r) => service.fetch(r, env) } };
  const response = await gateway.fetch(
    post("/api/subscriptions", profile(), "https://relay.example"),
    bound,
  );
  assert.equal(response.status, 201);
  assert.equal(
    response.headers.get("Access-Control-Allow-Origin"),
    "https://relay.example",
  );
  const data = await response.json();
  assert.ok(data.url.startsWith("https://relay.example/subscription/"));
  assert.equal(
    (
      await gateway.fetch(
        post("/api/subscriptions", profile(), "https://other.example"),
        bound,
      )
    ).status,
    403,
  );
});

test("public site discovers its own service and does not expose private source paths", async () => {
  const served = [],
    env = {
      ASSETS: {
        fetch: (request) => {
          served.push(new URL(request.url).pathname);
          return new Response("asset");
        },
      },
    };
  const settings = await gateway.fetch(
    new Request("https://configurator.example/config-builder/config.json"),
    env,
  );
  assert.deepEqual(await settings.json(), {
    apiBase: "https://configurator.example",
  });
  for (const path of [
    "/",
    "/config-builder/",
    "/config-builder/assets/app.js",
    "/assets/icons/macosicons/chatgpt.png",
  ])
    assert.equal(
      (
        await gateway.fetch(
          new Request("https://configurator.example" + path),
          env,
        )
      ).status,
      200,
    );
  for (const path of [
    "/.git/config",
    "/functions/sub.js",
    "/config-builder/src/app.js",
    "/config-builder/worker/wrangler.jsonc",
    "/config-builder/shared/catalog.json",
    "/Ratatoskr-Template.yaml",
    "/_worker.js",
    "/api/health",
    "/api/profiles",
  ])
    assert.equal(
      (
        await gateway.fetch(
          new Request("https://configurator.example" + path),
          env,
        )
      ).status,
      404,
    );
  assert.equal(served.length, 4);
});

test("Pages output includes the frontend and excludes source and private configuration", () => {
  const output = new URL("../worker/gateway/dist/", import.meta.url);
  assert.ok(
    existsSync(new URL("config-builder/assets/app.js", output)),
    "Run npm run build before testing deployment output",
  );
  assert.ok(existsSync(new URL("config-builder/index.html", output)));
  assert.ok(existsSync(new URL("assets/favicon.png", output)));
  assert.ok(existsSync(new URL("assets/icons/macosicons/chatgpt.png", output)));
  const files = readdirSync(output, { recursive: true });
  assert.ok(
    !files.some((p) =>
      /(^|\/)(?:src|shared|functions|tests|node_modules|\.git)(?:\/|$)/.test(p),
    ),
  );
  assert.ok(!files.some((p) => /\.(?:yaml|jsonc|env)$/.test(p)));
});

test("legacy page entrances redirect to the canonical config-builder route", async () => {
  for (const path of [
    "/Configurator/",
    "/webui/",
    "/builder/",
    "/config-builder",
  ]) {
    const response = await gateway.fetch(
      new Request("https://service.example" + path),
      {},
    );
    assert.equal(response.status, 308);
    assert.equal(
      response.headers.get("Location"),
      "https://service.example/config-builder/",
    );
  }
});

test("gateway diagnostics distinguish absent bindings, connection errors and service errors without leaking details", async () => {
  const request = () => new Request("https://configurator.example/api/status");
  const missing = await gateway.fetch(request(), {});
  assert.equal(missing.status, 503);
  assert.equal((await missing.json()).code, "SERVICE_NOT_BOUND");
  const connection = await gateway.fetch(request(), {
    PROFILE_SERVICE: {
      fetch() {
        throw Error("private-subscription-secret");
      },
    },
  });
  const disconnected = await connection.json();
  assert.equal(disconnected.code, "SERVICE_CONNECTION_ERROR");
  assert.equal(disconnected.phase, "service");
  assert.ok(
    !JSON.stringify(disconnected).includes("private-subscription-secret"),
  );
  const upstream = await gateway.fetch(request(), {
    PROFILE_SERVICE: {
      fetch: async () =>
        new Response("private-subscription-secret", { status: 500 }),
    },
  });
  const result = await upstream.json();
  assert.equal(result.code, "SERVICE_RESPONSE_ERROR");
  assert.equal(result.upstreamStatus, 500);
  assert.ok(!JSON.stringify(result).includes("private-subscription-secret"));
});

test("runtime diagnostics are limited to the fixed health probe and strip resource details", async () => {
  const env = {
    PROFILE_SERVICE: {
      fetch() {
        throw new TypeError(
          "Failed at https://private.example/token /Users/private/file.js resource-identifier-12345678901234567890",
        );
      },
    },
  };
  const status = await gateway.fetch(
    new Request("https://configurator.example/api/status"),
    env,
  );
  const data = await status.json();
  assert.equal(data.diagnostic.type, "TypeError");
  assert.ok(data.diagnostic.message.includes("[url]"));
  assert.ok(data.diagnostic.message.includes("[path]"));
  assert.ok(data.diagnostic.message.includes("[id]"));
  const inspect = await gateway.fetch(post("/api/inspect", {}), env);
  const hidden = await inspect.json();
  assert.equal(hidden.code, "SERVICE_CONNECTION_ERROR");
  assert.equal(hidden.diagnostic, undefined);
});

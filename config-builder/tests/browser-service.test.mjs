import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { probeService, serviceOrigin } from "../src/service.js";
import gateway from "../worker/gateway/index.js";
import { environment } from "./helpers.mjs";

const health = {
  ready: true,
  storage: "kv",
  format: "mihomo",
  version: "fixture-version",
  capabilities: { tcp: true },
};

test("a missing service is an offline error, never a local mode", async () => {
  const result = await probeService("", health.version, () => {
    throw Error("No network expected");
  });
  assert.equal(result.state, "offline");
  assert.ok(!result.message.includes("本地"));
});

test("service connections validate the origin before any request and omit credentials", async () => {
  for (const value of [
    "https://host.example/path",
    "https://user:password@host.example",
    "https://host.example?token=secret",
    "http://host.example",
    "https://app.workers.dev",
    42,
  ]) {
    assert.throws(() => serviceOrigin(value));
  }
  let calls = 0;
  const result = await probeService(
    "https://service.example/",
    health.version,
    async (url, options) => {
      calls++;
      assert.equal(url, "https://service.example/api/status");
      assert.equal(options.credentials, "omit");
      assert.equal(options.redirect, "error");
      return Response.json(health);
    },
  );
  assert.equal(calls, 1);
  assert.equal(result.state, "ready");
  assert.equal(result.tcp, true);
});

test("health checks distinguish static sites, missing storage and incompatible templates", async () => {
  const cases = [
    [new Response("<html>static page</html>"), "offline", "服务响应无效"],
    [
      Response.json({ code: "SERVICE_NOT_BOUND" }, { status: 503 }),
      "offline",
      "尚未连接存储",
    ],
    [Response.json({ ...health, ready: "true" }), "offline", "暂不可用"],
    [Response.json({ ...health, version: "old" }), "mismatch", "版本不一致"],
  ];
  for (const [response, state, message] of cases) {
    const result = await probeService(
      "https://service.example",
      health.version,
      async () => response,
    );
    assert.equal(result.state, state);
    assert.ok(result.message.includes(message));
  }
  const failed = await probeService(
    "https://service.example",
    health.version,
    async () => {
      throw Error("private request detail");
    },
  );
  assert.equal(failed.state, "offline");
  assert.ok(!failed.message.includes("private request detail"));
});

test("the browser entry has no local-mode fallback or manual service setup", () => {
  const app = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");
  assert.ok(app.includes("location.origin"), "frontend must use the same origin");
  for (const removed of [
    "browserRecords",
    "sourceFailureMessage",
    "config.json",
    "localStorage",
    "inlineProxies",
    "ctx.files",
    "本地配置模式",
    "unconfigured",
  ])
    assert.ok(!app.includes(removed), `local-mode code remains: ${removed}`);
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  for (const removed of [
    "service-form",
    "service-origin",
    "connect-service",
    "reset-service",
    "连接设置",
  ])
    assert.ok(!html.includes(removed), `local-mode markup remains: ${removed}`);
  assert.ok(html.includes('id="retry-service"'));
});

test("the Pages deployment serves its own origin and rejects unapproved cross-origin calls", async () => {
  const config = JSON.parse(
    readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8").replace(
      /,\s*([}\]])/g,
      "$1",
    ),
  );
  assert.equal(config.vars.ALLOWED_ORIGINS, "");
  const env = { ...environment(), ...config.vars };
  const sameOrigin = await gateway.fetch(
    new Request("https://service.example/api/status", {
      headers: { Origin: "https://service.example" },
    }),
    env,
  );
  assert.equal(sameOrigin.status, 200);
  assert.equal(
    sameOrigin.headers.get("Access-Control-Allow-Origin"),
    "https://service.example",
  );
  const denied = await gateway.fetch(
    new Request("https://service.example/api/status", {
      headers: { Origin: "https://untrusted.example" },
    }),
    env,
  );
  assert.equal(denied.status, 403);
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { probeService, serviceOrigin } from "../src/service.js";
import { browserRecords, sourceFailureMessage } from "../src/subscriptions.js";
import gateway from "../worker/gateway/index.js";
import { environment } from "./helpers.mjs";

const health = {
  ready: true,
  storage: "kv",
  format: "mihomo",
  version: "fixture-version",
  capabilities: { tcp: true },
};
const provider = {
  name: "Fixture",
  url: "https://airport.example/sub?token=fixture-secret",
};
const records = (fetcher) =>
  browserRecords([provider], new Map(), new AbortController().signal, fetcher);

test("local mode does not probe an invented subscription endpoint", async () => {
  const result = await probeService("", health.version, () => {
    throw Error("No network expected");
  });
  assert.equal(result.state, "unconfigured");
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

test("direct subscription failures retain HTTP, format and timeout distinctions without credentials", async () => {
  for (const [fetcher, code] of [
    [
      async () => new Response("fixture-secret", { status: 403 }),
      "SOURCE_HTTP",
    ],
    [async () => new Response("<html>fixture-secret</html>"), "SOURCE_FORMAT"],
    [
      async () => {
        throw new DOMException("fixture-secret", "TimeoutError");
      },
      "SOURCE_TIMEOUT",
    ],
    [
      async () => {
        throw new TypeError(provider.url);
      },
      "SOURCE_NETWORK",
    ],
  ]) {
    await assert.rejects(records(fetcher), (error) => {
      assert.equal(error.code, code);
      assert.ok(!error.message.includes("fixture-secret"));
      const message = sourceFailureMessage(error, "unconfigured");
      assert.ok(!message.includes("等待"));
      if (code === "SOURCE_HTTP" || code === "SOURCE_FORMAT")
        assert.ok(!message.includes("跨域"));
      else assert.ok(message.includes("连接订阅服务"));
      return true;
    });
  }
});

test("invalid imported files are identified without replacing them with remote sources", async () => {
  await assert.rejects(
    browserRecords(
      [provider],
      new Map([[0, { text: async () => "invalid fixture-secret" }]]),
      new AbortController().signal,
      () => {
        throw Error("No remote request expected");
      },
    ),
    (error) => {
      assert.equal(error.code, "SOURCE_FILE");
      assert.ok(!error.message.includes("fixture-secret"));
      return true;
    },
  );
});

test("the Pages deployment defaults allow the project's GitHub frontend and reject other origins", async () => {
  const config = JSON.parse(
    readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8").replace(
      /,\s*([}\]])/g,
      "$1",
    ),
  );
  const env = { ...environment(), ...config.vars };
  const allowed = await gateway.fetch(
    new Request("https://service.example/api/status", {
      headers: { Origin: "https://yakasuka.github.io" },
    }),
    env,
  );
  assert.equal(allowed.status, 200);
  assert.equal(
    allowed.headers.get("Access-Control-Allow-Origin"),
    "https://yakasuka.github.io",
  );
  const denied = await gateway.fetch(
    new Request("https://service.example/api/status", {
      headers: { Origin: "https://untrusted.example" },
    }),
    env,
  );
  assert.equal(denied.status, 403);
});

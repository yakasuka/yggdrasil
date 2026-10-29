import test from "node:test";
import assert from "node:assert/strict";
import worker from "../worker/index.js";
import { defaults, compile, catalog } from "../shared/compiler.js";
const profile = () => ({
  ...defaults(),
  providers: [
    { name: "Test", url: "https://example.com/sub?token=secret-fixture" },
  ],
});
const origin = "https://yakasuka.github.io";
function environment() {
  const records = new Map();
  return {
    records,
    ALLOWED_ORIGINS: origin,
    SUBSCRIPTIONS: {
      put: async (k, v, options) => records.set(k, { v, options }),
      get: async (k, type) => {
        const v = records.get(k)?.v;
        return !v ? null : type === "json" ? JSON.parse(v) : v;
      },
    },
  };
}
const post = (body = profile(), headers = {}) =>
  new Request("https://config.example/api/profiles", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin, ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
test("Worker stores only encrypted snapshots and serves valid YAML through the bearer link", async () => {
  const env = environment(),
    response = await worker.fetch(post(), env);
  assert.equal(response.status, 201);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), origin);
  const created = await response.json();
  assert.ok(created.url.startsWith("https://config.example/s/"));
  const stored = [...env.records.values()][0];
  assert.equal(stored.options.expirationTtl, 90 * 86400);
  assert.ok(!stored.v.includes("secret-fixture"));
  assert.ok(!stored.v.includes("https://example.com"));
  assert.ok(
    !stored.v.includes(
      new URL(created.url).pathname.split("/").at(-1).replace(".yaml", ""),
    ),
  );
  const read = await worker.fetch(new Request(created.url), env);
  assert.equal(read.status, 200);
  assert.equal(read.headers.get("Cache-Control"), "no-store");
  assert.equal(
    read.headers.get("Content-Type"),
    "application/yaml; charset=utf-8",
  );
  assert.equal(await read.text(), (await compile(profile())).yaml);
  const head = await worker.fetch(
    new Request(created.url, { method: "HEAD" }),
    env,
  );
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");
  const bad = created.url.replace(/.{6}\.yaml$/, "AAAAAA.yaml");
  assert.equal((await worker.fetch(new Request(bad), env)).status, 404);
  const [id, record] = [...env.records.entries()][0],
    expired = JSON.parse(record.v);
  expired.expiresAt = "2000-01-01T00:00:00Z";
  env.records.set(id, { ...record, v: JSON.stringify(expired) });
  assert.equal((await worker.fetch(new Request(created.url), env)).status, 404);
});
test("API enforces origins, input bounds, validation and rate limit", async () => {
  const env = environment();
  assert.equal(
    (
      await worker.fetch(
        post(profile(), { Origin: "https://untrusted.example" }),
        env,
      )
    ).status,
    403,
  );
  assert.equal((await worker.fetch(post("x".repeat(65537)), env)).status, 400);
  const p = profile();
  p.providers[0].url = "file:///etc/passwd";
  assert.equal((await worker.fetch(post(p), env)).status, 400);
  assert.equal(env.records.size, 0);
  env.CREATE_LIMITER = { limit: async () => ({ success: false }) };
  assert.equal((await worker.fetch(post(), env)).status, 429);
  const preflight = await worker.fetch(
    new Request("https://config.example/api/profiles", {
      method: "OPTIONS",
      headers: { Origin: origin },
    }),
    env,
  );
  assert.equal(preflight.status, 204);
});
test("health reports deployment readiness and catalog compatibility", async () => {
  const health = (env) =>
    worker
      .fetch(new Request("https://config.example/api/health"), env)
      .then((r) => r.json());
  assert.equal((await health({})).ready, false);
  assert.deepEqual(await health(environment()), {
    ready: true,
    version: catalog.version,
    format: "mihomo",
  });
  assert.equal((await worker.fetch(post(), {})).status, 503);
});

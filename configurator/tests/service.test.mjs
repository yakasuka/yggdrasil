import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { parse, stringify } from "yaml";
import { app, profile, environment, post, text } from "./helpers.mjs";
import { catalog } from "../shared/compiler.js";
import { catalogFromTemplate } from "../shared/template.js";
import {
  subscriptionClient,
  publicURL,
  isPublicAddress,
} from "../worker/subscriptions.js";
import gateway from "../worker/gateway/index.js";
test("all four lifetimes create unique encrypted profiles and permanent tokens omit expiration", async () => {
  for (const [id, seconds] of [
    ["3h", 10800],
    ["7d", 604800],
    ["30d", 2592000],
    ["forever", null],
  ]) {
    const env = environment(),
      service = app(),
      p = { ...profile(), lifetime: id };
    const response = await service.fetch(post("/api/profiles", p), env);
    assert.equal(response.status, 201);
    const data = await response.json(),
      record = [...env.records.values()][0];
    assert.equal(data.expiresAt === null, seconds === null);
    assert.equal(record.options?.expirationTtl, seconds ?? undefined);
    assert.ok(!record.v.includes("private-fixture"));
    const token = new URL(data.url).pathname
      .split("/")
      .at(-1)
      .replace(".yaml", "");
    assert.equal(token.length, 43);
    assert.notEqual(token, catalog.version);
    const read = await service.fetch(new Request(data.url), env);
    assert.equal(read.status, 200);
    assert.equal(
      read.headers.get("Subscription-Userinfo"),
      "upload=10; download=20; total=100" +
        (data.expiresAt
          ? "; expire=" + Math.floor(Date.parse(data.expiresAt) / 1000)
          : ""),
    );
    assert.ok(
      decodeURIComponent(read.headers.get("Content-Disposition")).includes(
        "Eaibee-ratatoskr.yaml",
      ),
    );
    assert.ok((await read.text()).includes("# Ratatoskr · Eaibee"));
  }
});
test("the same token serves a newly added template APP without regenerating the link", async () => {
  const box = { value: catalog },
    service = app({ model: () => box.value }),
    env = environment();
  const made = await service.fetch(post("/api/profiles", profile()), env);
  const data = await made.json();
  const source = parse(
    fs.readFileSync(
      new URL("../../Ratatoskr-Template.yaml", import.meta.url),
      "utf8",
    ),
    { merge: true },
  );
  source["proxy-groups"].push({
    name: "🧪 Live App",
    type: "select",
    proxies: ["DIRECT"],
  });
  source.rules.unshift("DOMAIN-SUFFIX,live.example,🧪 Live App");
  box.value = await catalogFromTemplate(stringify(source));
  const read = await service.fetch(new Request(data.url), env);
  const yaml = await read.text();
  assert.equal(read.status, 200);
  assert.ok(yaml.includes("🧪 Live App"));
  assert.ok(yaml.includes(box.value.version));
});
test("expired and invalid capability links cannot read configuration", async () => {
  const service = app(),
    env = environment(),
    made = await service.fetch(post("/api/profiles", profile()), env),
    data = await made.json();
  const bad = data.url.replace(/.{6}\.yaml$/, "AAAAAA.yaml");
  assert.equal((await service.fetch(new Request(bad), env)).status, 404);
  const [key, stored] = [...env.records][0];
  const record = JSON.parse(stored.v);
  record.expiresAt = "2000-01-01T00:00:00Z";
  env.records.set(key, { ...stored, v: JSON.stringify(record) });
  assert.equal((await service.fetch(new Request(data.url), env)).status, 404);
});
test("inspection returns only available countries and no node credentials; probes are measured separately", async () => {
  const service = app(),
    env = environment(),
    providers = profile().providers;
  const result = await service.fetch(post("/api/inspect", { providers }), env);
  const body = await result.json();
  assert.deepEqual(body.regions.map((r) => r.id).sort(), ["JP", "OTHER", "US"]);
  assert.ok(!JSON.stringify(body).includes("private-node-fixture"));
  assert.ok(!JSON.stringify(body).includes("private-fixture"));
  assert.equal(body.usage.remaining, 70);
  const probe = await service.fetch(
    post("/api/probe", { providers, nodeIds: ["P1:0"] }),
    env,
  );
  assert.deepEqual((await probe.json()).nodes, [
    { id: "P1:0", latencyMs: 12, kind: "tcp-connect" },
  ]);
  const invalid = { ...profile(), countries: ["GB"] };
  assert.equal(
    (await service.fetch(post("/api/profiles", invalid), env)).status,
    400,
  );
});
test("public gateway aliases preserve configuration, traffic, CORS and status refresh", async () => {
  const service = app(),
    env = environment(),
    bound = { PROFILE_SERVICE: { fetch: (r) => service.fetch(r, env) } };
  const make = post("/api/subscriptions", profile());
  const response = await gateway.fetch(make, bound);
  assert.equal(response.status, 201);
  const data = await response.json();
  assert.ok(data.url.startsWith("https://relay.example/subscription/"));
  assert.ok(data.usageUrl.endsWith("/status"));
  const read = await gateway.fetch(new Request(data.url), bound);
  assert.equal(read.status, 200);
  assert.ok(read.headers.get("Subscription-Userinfo"));
  const status = await gateway.fetch(new Request(data.usageUrl), bound);
  assert.equal(status.headers.get("Access-Control-Allow-Origin"), "*");
  assert.equal((await status.json()).usage.remaining, 70);
  for (const path of [
    "/worker/index.js",
    "/s/hidden",
    "/api/health",
    "/api/profiles",
  ])
    assert.equal(
      (await gateway.fetch(new Request("https://relay.example" + path), bound))
        .status,
      404,
    );
});
test("missing quota headers remain unknown rather than being reported as zero", async () => {
  const service = app({ header: "" }),
    env = environment();
  const response = await service.fetch(post("/api/profiles", profile()), env),
    data = await response.json();
  assert.equal(data.usage.total, null);
  const read = await service.fetch(new Request(data.url), env);
  assert.equal(read.headers.get("Subscription-Userinfo"), null);
});
test("private addresses, private DNS answers and redirect-to-private requests are blocked", async () => {
  for (const ip of [
    "127.0.0.1",
    "10.0.0.1",
    "169.254.169.254",
    "192.168.1.1",
    "::1",
    "::ffff:127.0.0.1",
  ])
    assert.equal(isPublicAddress(ip), false);
  assert.throws(() => publicURL("http://2130706433/sub"));
  let calls = 0;
  const client = subscriptionClient({
    resolver: async () => ["127.0.0.1"],
    fetcher: async () => {
      calls++;
      return new Response(text);
    },
  });
  const values = await client.inspect(profile().providers);
  assert.equal(values[0].nodes.length, 0);
  assert.equal(calls, 0);
  const redirect = subscriptionClient({
    resolver: async () => ["8.8.8.8"],
    fetcher: async () => {
      calls++;
      return new Response(null, {
        status: 302,
        headers: { Location: "http://127.0.0.1/private" },
      });
    },
  });
  assert.ok((await redirect.inspect(profile().providers))[0].error);
  assert.equal(calls, 1);
});
test("origin, body and limit checks remain active", async () => {
  const service = app(),
    env = environment();
  assert.equal(
    (
      await service.fetch(
        post(
          "/api/inspect",
          { providers: profile().providers },
          "https://bad.example",
        ),
        env,
      )
    ).status,
    403,
  );
  env.CREATE_LIMITER = { limit: async () => ({ success: false }) };
  assert.equal(
    (await service.fetch(post("/api/profiles", profile()), env)).status,
    429,
  );
});

test("multiple airports retain P1/P2 node identities and aggregate reported traffic", async () => {
  const service = app(),
    env = environment(),
    p = profile();
  p.providers.push({
    name: "第二机场",
    url: "https://airport.example.com/sub?token=second-fixture",
  });
  const inspection = await service.fetch(
    post("/api/inspect", { providers: p.providers }),
    env,
  );
  const info = await inspection.json();
  assert.equal(info.usage.total, 200);
  assert.equal(info.usage.remaining, 140);
  assert.ok(info.nodes.some((n) => n.id.startsWith("P2:")));
  const response = await service.fetch(post("/api/profiles", p), env);
  assert.equal(response.status, 201);
  const data = await response.json();
  const file = await service.fetch(new Request(data.url), env);
  const config = parse(await file.text());
  assert.deepEqual(
    [...new Set(config.proxies.map((p) => p.name.match(/^\[P\d+\]/)[0]))],
    ["[P1]", "[P2]"],
  );
  assert.ok(
    file.headers
      .get("Subscription-Userinfo")
      .startsWith("upload=20; download=40; total=200"),
  );
});

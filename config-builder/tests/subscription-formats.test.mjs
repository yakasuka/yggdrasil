import test from "node:test";
import assert from "node:assert/strict";
import { parse } from "yaml";
import { parseSubscription, nodeInventory } from "../shared/subscription.js";
import { publicInspection, parseUsage } from "../shared/nodes.js";
import { compile, catalog } from "../shared/compiler.js";
import { createWorker } from "../worker/application.js";
import { open, seal, secret } from "../worker/crypto.js";
import { profile, environment, post } from "./helpers.mjs";

const b64 = (text) => Buffer.from(text).toString("base64");
const uuid = "11111111-1111-4111-8111-111111111111";
const vmess = (name = "日本 JP 01") =>
  "vmess://" +
  b64(
    JSON.stringify({
      v: "2",
      ps: name,
      add: "node.example.com",
      port: "443",
      id: uuid,
      aid: "0",
      scy: "auto",
      net: "ws",
      host: "edge.example.com",
      path: "/connect",
      tls: "tls",
      sni: "edge.example.com",
    }),
  );
const ss = (name = "美国 US 01") =>
  "ss://" +
  b64("aes-128-gcm:fixture-password") +
  "@node.example.com:443#" +
  encodeURIComponent(name);

test("Base64 decoding preserves UTF-8 names, URL-safe encoding, VMess TLS and WebSocket settings", () => {
  const encoded = b64(vmess("🇯🇵 日本 JP · 东京"))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
  const result = parseSubscription(encoded);
  assert.equal(result.format, "base64-uri");
  const [node] = result.proxies;
  assert.equal(node.name, "🇯🇵 日本 JP · 东京");
  assert.equal(node.uuid, uuid);
  assert.equal(node.servername, "edge.example.com");
  assert.deepEqual(node["ws-opts"], {
    path: "/connect",
    headers: { Host: "edge.example.com" },
  });
});

test("common URI formats convert to Mihomo nodes and unsupported entries are counted", () => {
  const ssr =
    "ssr://" +
    b64(
      "node.example.com:443:origin:aes-128-cfb:plain:" +
        b64("fixture-password") +
        "/?remarks=" +
        b64("德国 DE 01"),
    );
  const text = [
    ss(),
    ssr,
    "trojan://fixture-password@node.example.com:443?sni=edge.example.com#香港%20HK",
    `vless://${uuid}@node.example.com:443?security=reality&pbk=fixture-key&sid=abcd&fp=chrome&sni=edge.example.com#日本%20JP`,
    "hy2://fixture-password@node.example.com:443?obfs=salamander&obfs-password=fixture-obfs#美国%20US",
    `tuic://${uuid}:fixture-password@node.example.com:443?congestion_control=bbr#英国%20UK`,
    "unsupported://fixture",
  ].join("\n");
  const result = parseSubscription(text);
  assert.deepEqual(
    result.proxies.map((p) => p.type),
    ["ss", "ssr", "trojan", "vless", "hysteria2", "tuic"],
  );
  assert.equal(result.proxies[2].sni, "edge.example.com");
  assert.equal(result.proxies[3]["reality-opts"]["short-id"], "abcd");
  assert.equal(result.skipped, 1);
  assert.throws(
    () => parseSubscription("invalid-private-source-token"),
    /没有识别到|格式无法识别/,
  );
});

test("decoded sources expose only the inventory, never node credentials", () => {
  const parsed = parseSubscription(b64(vmess()));
  const records = [
    {
      name: "Fixture",
      nodes: nodeInventory(parsed.proxies, 0),
      proxies: parsed.proxies,
      usage: parseUsage("upload=1; download=2; total=10"),
    },
  ];
  const visible = publicInspection(records, catalog);
  assert.equal(visible.regions[0].id, "JP");
  assert.equal(visible.usage.remaining, 7);
  assert.ok(!JSON.stringify(visible).includes(uuid));
  assert.ok(!JSON.stringify(visible).includes("node.example.com"));
});

test("inline YAML contains selected countries only and retains distinct P1/P2 names", async () => {
  const proxies = parseSubscription(
    [vmess(), ss(), "trojan://pass@node.example.com:443#香港%20HK"].join("\n"),
  ).proxies;
  const result = await compile(
    { ...profile(), countries: ["JP"], other: false },
    catalog,
    { inlineProxies: [proxies, proxies] },
  );
  assert.equal(result.config["proxy-providers"], undefined);
  assert.deepEqual(
    result.config.proxies.map((p) => p.name),
    ["[P1] 日本 JP 01", "[P2] 日本 JP 01"],
  );
  assert.equal(result.config.proxies[0].uuid, uuid);
});

test("KV stores an encrypted YAML snapshot and the same token refreshes current nodes and traffic", async () => {
  let source = b64([vmess(), ss()].join("\n"));
  let traffic = "upload=1; download=2; total=100";
  const service = createWorker({
    loadCatalog: async () => catalog,
    resolver: async () => ["8.8.8.8"],
    fetcher: async () =>
      new Response(source, { headers: { "Subscription-Userinfo": traffic } }),
  });
  const env = environment();
  const p = { ...profile(), other: false };
  const preview = await service.fetch(post("/api/preview", p), env);
  assert.equal(preview.status, 200);
  assert.equal(env.records.size, 0);
  const made = await service.fetch(post("/api/profiles", p), env);
  assert.equal(made.status, 201);
  const data = await made.json(),
    url = new URL(data.url);
  const parts = url.pathname.split("/");
  const record = JSON.parse([...env.records.values()][0].v);
  assert.equal(record.v, 3);
  assert.ok(!JSON.stringify(record).includes(uuid));
  const saved = await open(record, parts[2], parts[3].replace(".yaml", ""));
  assert.ok(saved.yaml.includes(uuid));
  assert.equal(saved.profile.title, "Eaibee");
  source = b64([vmess("日本 JP 02"), ss("美国 US 02")].join("\n"));
  traffic = "upload=5; download=20; total=100";
  const response = await service.fetch(new Request(data.url), env);
  assert.equal(response.status, 200);
  assert.equal(
    response.headers.get("Subscription-Userinfo"),
    "upload=5; download=20; total=100; expire=" +
      Math.floor(Date.parse(data.expiresAt) / 1000),
  );
  const output = parse(await response.text());
  assert.ok(output.proxies.some((node) => node.name.includes("日本 JP 02")));
  assert.equal(output["proxy-providers"], undefined);
});

test("existing v2 capability links remain usable after the snapshot upgrade", async () => {
  const { app } = await import("./helpers.mjs");
  const env = environment(),
    id = secret(16),
    token = secret(32);
  await env.SUBSCRIPTIONS.put(
    "profile:" + id,
    JSON.stringify({
      v: 2,
      ...(await seal(profile(), id, token)),
      createdAt: new Date().toISOString(),
      expiresAt: null,
    }),
  );
  const response = await app().fetch(
    new Request(`https://relay.example/s/${id}/${token}.yaml`),
    env,
  );
  assert.equal(response.status, 200);
  assert.ok(parse(await response.text()).proxies.length > 0);
});

test("Pages uses a bounded per-IP request budget when native rate bindings are absent", async () => {
  const { app } = await import("./helpers.mjs");
  const service = app(),
    env = environment();
  for (let i = 0; i < 10; i++)
    assert.equal(
      (await service.fetch(post("/api/profiles", profile()), env)).status,
      201,
    );
  assert.equal(
    (await service.fetch(post("/api/profiles", profile()), env)).status,
    429,
  );
  const other = post("/api/profiles", profile());
  other.headers.set("CF-Connecting-IP", "203.0.113.77");
  assert.equal((await service.fetch(other, env)).status, 201);
});

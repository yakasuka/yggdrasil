import test from "node:test";
import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import { fetchIP } from "../worker/ip-fetch.js";
import { subscriptionClient } from "../worker/subscriptions.js";
import { createWorker } from "../worker/application.js";
import { catalog } from "../shared/compiler.js";
import { parse } from "yaml";
import { profile, environment, post } from "./helpers.mjs";

const endpoint = "https://8.8.8.8:5000/subscribe?token=fixture-only";
const source = Buffer.from(
  "vmess://" +
    Buffer.from(
      JSON.stringify({
        v: "2",
        ps: "🇯🇵 日本 JP 01",
        add: "node.example.com",
        port: "443",
        id: "11111111-1111-4111-8111-111111111111",
        aid: "0",
        net: "ws",
        path: "/connect",
        tls: "",
      }),
    ).toString("base64"),
).toString("base64");

function connector(wire, { fragment = 17, opened = Promise.resolve() } = {}) {
  const state = { closed: 0, request: "" };
  const bytes = Buffer.from(wire);
  const connect = (address, options) => {
    state.address = address;
    state.options = options;
    return {
      opened,
      closed: Promise.resolve(),
      close: async () => {
        state.closed++;
      },
      writable: new WritableStream({
        write(b) {
          state.request += new TextDecoder().decode(b);
        },
      }),
      readable: new ReadableStream({
        start(controller) {
          for (let i = 0; i < bytes.length; i += fragment)
            controller.enqueue(bytes.subarray(i, i + fragment));
          controller.close();
        },
      }),
    };
  };
  return { connect, state };
}

test("IP subscriptions preserve TLS, custom port, query and Base64 despite HTML content type", async () => {
  const fixture = connector(
    `HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nContent-Length: ${Buffer.byteLength(source)}\r\n\r\n${source}`,
  );
  const client = subscriptionClient({
    ipFetcher: (u, o) => fetchIP(u, o, fixture.connect),
  });
  const [record] = await client.inspect([{ name: "Fixture", url: endpoint }]);
  assert.equal(record.format, "base64-uri");
  assert.equal(record.proxies.length, 1);
  assert.equal(record.proxies[0].type, "vmess");
  assert.equal(record.usage, null);
  assert.deepEqual(fixture.state.address, { hostname: "8.8.8.8", port: 5000 });
  assert.equal(fixture.state.options.secureTransport, "on");
  assert.match(
    fixture.state.request,
    /^GET \/subscribe\?token=fixture-only HTTP\/1\.1\r\nHost: 8\.8\.8\.8:5000\r\n/,
  );
  assert.match(fixture.state.request, /Accept-Encoding: identity/);
  assert.equal(fixture.state.closed, 1);
});

test("IP responses handle fragmented chunked gzip, informational headers and traffic", async () => {
  const zipped = gzipSync(source);
  const wire = Buffer.concat([
    Buffer.from(
      "HTTP/1.1 103 Early Hints\r\nLink: </asset>\r\n\r\nHTTP/1.1 200 OK\r\nTransfer-Encoding: chunked\r\nContent-Encoding: gzip\r\nSubscription-Userinfo: upload=1; download=2; total=100\r\n\r\n",
    ),
    Buffer.from(zipped.length.toString(16) + "\r\n"),
    zipped,
    Buffer.from("\r\n0\r\nX-Trailer: ignored\r\n\r\n"),
  ]);
  const fixture = connector(wire, { fragment: 3 });
  const response = await fetchIP(endpoint, {}, fixture.connect);
  assert.equal(await response.text(), source);
  assert.equal(response.headers.get("Transfer-Encoding"), null);
  assert.equal(response.headers.get("Content-Encoding"), null);
  assert.equal(
    response.headers.get("Subscription-Userinfo"),
    "upload=1; download=2; total=100",
  );
});

test("HEAD returns headers without waiting for the advertised body", async () => {
  const fixture = connector(
    "HTTP/1.1 200 OK\r\nContent-Length: 10000000\r\nSubscription-Userinfo: upload=0; download=0; total=100\r\n\r\n",
  );
  const response = await fetchIP(
    "http://8.8.8.8:5000/sub",
    { method: "HEAD" },
    fixture.connect,
  );
  assert.equal(await response.text(), "");
  assert.equal(fixture.state.options.secureTransport, "off");
});

test("IP fetch rejects private destinations and unsupported methods before connecting", async () => {
  let calls = 0;
  const connect = () => {
    calls++;
    throw Error("must not connect");
  };
  for (const address of [
    "https://127.0.0.1/sub",
    "https://10.0.0.1/sub",
    "https://[::1]/sub",
    "https://2130706433/sub",
  ])
    await assert.rejects(fetchIP(address, {}, connect));
  await assert.rejects(fetchIP(endpoint, { method: "POST" }, connect));
  assert.equal(calls, 0);
});

test("truncated, ambiguous, oversized and decompression-bomb responses fail closed", async () => {
  for (const wire of [
    "HTTP/1.1 200 OK\r\nContent-Length: 10\r\n\r\nshort",
    "HTTP/1.1 200 OK\r\nContent-Length: 1\r\nTransfer-Encoding: chunked\r\n\r\n0\r\n\r\n",
    "HTTP/1.1 200 OK\r\nContent-Length: 3000000\r\n\r\n",
    "HTTP/1.1 200 OK\r\nX-Huge: " + "x".repeat(40000) + "\r\n\r\n",
  ]) {
    const fixture = connector(wire);
    await assert.rejects(fetchIP(endpoint, {}, fixture.connect));
    assert.equal(fixture.state.closed, 1);
  }
  const zipped = gzipSync("x".repeat(2 * 1024 * 1024 + 1));
  const fixture = connector(
    Buffer.concat([
      Buffer.from(
        `HTTP/1.1 200 OK\r\nContent-Encoding: gzip\r\nContent-Length: ${zipped.length}\r\n\r\n`,
      ),
      zipped,
    ]),
  );
  await assert.rejects(fetchIP(endpoint, {}, fixture.connect), /过大/);
});

test("TLS failure and cancellation close the socket without retrying plaintext", async () => {
  const failure = connector("", {
    opened: Promise.reject(Error("TLS validation failed")),
  });
  await assert.rejects(
    fetchIP(endpoint, {}, failure.connect),
    /TLS validation failed/,
  );
  assert.equal(failure.state.options.secureTransport, "on");
  assert.equal(failure.state.closed, 1);
  const waiting = connector("", { opened: new Promise(() => {}) });
  const controller = new AbortController();
  const request = fetchIP(
    endpoint,
    { signal: controller.signal },
    waiting.connect,
  );
  controller.abort();
  await assert.rejects(request, { name: "AbortError" });
  assert.ok(waiting.state.closed > 0);
});

test("IP redirects are checked before reaching another destination", async () => {
  let calls = 0;
  const client = subscriptionClient({
    ipFetcher: async () => {
      calls++;
      return new Response(null, {
        status: 302,
        headers: { Location: "http://127.0.0.1/private" },
      });
    },
  });
  const [result] = await client.inspect([{ name: "Fixture", url: endpoint }]);
  assert.ok(result.error);
  assert.equal(calls, 1);
});

test("Base64 IP subscriptions produce inline Mihomo YAML and survive encrypted KV reads", async () => {
  const wire = `HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nContent-Length: ${source.length}\r\n\r\n${source}`;
  const service = createWorker({
    loadCatalog: async () => catalog,
    ipFetcher: (u, o) => fetchIP(u, o, connector(wire).connect),
  });
  const env = environment();
  const p = {
    ...profile(),
    providers: [{ name: "Fixture", url: endpoint }],
    countries: ["JP"],
    other: false,
  };
  const response = await service.fetch(post("/api/profiles", p), env);
  assert.equal(response.status, 201);
  const made = await response.json();
  const read = await service.fetch(new Request(made.url), env);
  assert.equal(read.status, 200);
  const yaml = await read.text(),
    config = parse(yaml);
  assert.equal(config.proxies.length, 1);
  assert.equal(config.proxies[0].type, "vmess");
  assert.equal(config["proxy-providers"], undefined);
  assert.ok(!yaml.includes("fixture-only"));
});

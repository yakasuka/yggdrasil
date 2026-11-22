import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_SERVICE,
  CONFIG_PATH,
  STATUS_PATH,
  isSubscription,
  upstreamURL,
  proxySubscription,
  proxyAdmin,
} from "../shared/pages-proxy.js";

const req = (href, headers = {}, method = "GET") =>
  new Request(href, { method, headers });

test("only token-bearing links are treated as subscriptions", () => {
  assert.equal(isSubscription(new URL("https://pages.dev/config-builder?token=ee1&pwd=111")), true);
  assert.equal(isSubscription(new URL("https://pages.dev/config-builder?token=ee1")), true);
  assert.equal(isSubscription(new URL("https://pages.dev/config-builder/")), false);
  assert.equal(isSubscription(new URL("https://pages.dev/config-builder")), false);
  assert.equal(isSubscription(new URL("https://pages.dev/config-builder/?pwd=111")), false);
});

test("upstreamURL maps both public paths to the backend and preserves the full query", () => {
  const link = new URL("https://yggdrasil-afx.pages.dev/config-builder?token=ee1&pwd=111");
  const target = upstreamURL(link, DEFAULT_SERVICE);
  assert.equal(target.origin, "https://yggdrasil.xyang.cyou");
  assert.equal(target.pathname, CONFIG_PATH);
  assert.equal(target.searchParams.get("token"), "ee1");
  assert.equal(target.searchParams.get("pwd"), "111");

  const status = new URL("https://yggdrasil-afx.pages.dev/config-builder/status?token=ee1&pwd=111");
  const statusTarget = upstreamURL(status, DEFAULT_SERVICE);
  assert.equal(statusTarget.pathname, STATUS_PATH);
  assert.equal(statusTarget.search, "?token=ee1&pwd=111");
});

test("proxy relays YAML verbatim with no redirect and keeps traffic headers", async () => {
  const seen = [];
  const fetcher = async (url, init) => {
    seen.push({ url: url.href, method: init.method, headers: init.headers });
    return new Response("proxies:\n  - name: node\n", {
      status: 200,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "subscription-userinfo": "upload=1; download=2; total=3; expire=4",
        "content-disposition": 'attachment; filename="x.yaml"',
      },
    });
  };

  const response = await proxySubscription(
    req(
      "https://yggdrasil-afx.pages.dev/config-builder?token=ee1&pwd=111",
      { accept: "*/*", "user-agent": "mihomo", "x-config-pwd": "111" },
    ),
    DEFAULT_SERVICE,
    fetcher,
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("location"), null, "must not redirect");
  assert.equal(response.headers.get("content-type"), "text/plain; charset=utf-8");
  assert.equal(
    response.headers.get("subscription-userinfo"),
    "upload=1; download=2; total=3; expire=4",
  );
  assert.equal(await response.text(), "proxies:\n  - name: node\n");
  assert.equal(seen.length, 1);
  assert.equal(
    seen[0].url,
    "https://yggdrasil.xyang.cyou/config-builder?token=ee1&pwd=111",
  );
  assert.equal(seen[0].headers.get("x-config-pwd"), "111");
});

test("proxy forwards non-2xx status codes without rewriting them", async () => {
  const response = await proxySubscription(
    req("https://pages.dev/config-builder?token=missing"),
    DEFAULT_SERVICE,
    async () => new Response("not found", { status: 404, headers: { "content-type": "text/plain" } }),
  );
  assert.equal(response.status, 404);
  assert.equal(await response.text(), "not found");
});

test("proxy uses GET for HEAD so the backend still generates a body it can drop", async () => {
  let method;
  await proxySubscription(
    req("https://pages.dev/config-builder?token=ee1", {}, "HEAD"),
    DEFAULT_SERVICE,
    async (_url, init) => {
      method = init.method;
      return new Response(null, { status: 200 });
    },
  );
  assert.equal(method, "GET");
});

test("no extra path layer: upstream is /config-builder, not /yggdrasil/...", async () => {
  let called = "";
  await proxySubscription(
    req("https://yggdrasil-afx.pages.dev/config-builder?token=ee1"),
    DEFAULT_SERVICE,
    async (url) => {
      called = url.pathname;
      return new Response("ok");
    },
  );
  assert.equal(called, "/config-builder");
  assert.ok(!called.includes("yggdrasil/"));
});

test("admin proxy relays Basic credentials and the 401 challenge", async () => {
  const BASIC = "Basic " + Buffer.from("admin:yakasuka").toString("base64");
  const seen = [];
  const fetcher = async (url, init) => {
    seen.push({ path: url.pathname, auth: init.headers.get("authorization") });
    if (!init.headers.get("authorization"))
      return new Response("no", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="yggdrasil-admin"' },
      });
    return new Response('{"configs":[]}', {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  const challenge = await proxyAdmin(
    req("https://pages.dev/config-builder/dashboard"),
    DEFAULT_SERVICE,
    fetcher,
  );
  assert.equal(challenge.status, 401);
  assert.match(challenge.headers.get("www-authenticate") || "", /Basic/);

  const ok = await proxyAdmin(
    req("https://pages.dev/config-builder/dashboard", { authorization: BASIC }),
    DEFAULT_SERVICE,
    fetcher,
  );
  assert.equal(ok.status, 200);
  assert.equal(seen[0].path, "/config-builder/dashboard");
  assert.equal(seen[1].auth, BASIC);

  const viaCookie = await proxyAdmin(
    req("https://pages.dev/config-builder/dashboard", {
      cookie: "other=1; ygg_admin=" + encodeURIComponent(BASIC.slice(6)),
    }),
    DEFAULT_SERVICE,
    fetcher,
  );
  assert.equal(viaCookie.status, 200);
  assert.equal(seen[2].auth, BASIC);
});

test("admin proxy forwards the admin API path and DELETE body", async () => {
  let seen;
  const fetcher = async (url, init) => {
    const raw = init.body ? await new Response(init.body).text() : "";
    seen = { href: url.href, method: init.method, body: raw };
    return new Response('{"removed":true}', {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
  const body = JSON.stringify({ id: "AAAAAAAAAAAAAAAAAAAAAA" });
  const response = await proxyAdmin(
    new Request("https://pages.dev/api/admin/configs", {
      method: "DELETE",
      headers: {
        authorization: "Basic abc",
        "content-type": "application/json",
      },
      body,
    }),
    DEFAULT_SERVICE,
    fetcher,
  );
  assert.equal(response.status, 200);
  assert.equal(seen.href, "https://yggdrasil.xyang.cyou/api/admin/configs");
  assert.equal(seen.method, "DELETE");
  assert.equal(seen.body, body);
});

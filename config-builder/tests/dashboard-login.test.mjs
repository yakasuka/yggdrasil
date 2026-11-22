import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_SERVICE } from "../shared/pages-proxy.js";
import { dashboardHTML } from "../server/dashboard.js";

const realFetch = globalThis.fetch;

async function postLogin(username, password, upstreamStatus = 200) {
  const seen = [];
  globalThis.fetch = async (url, init) => {
    seen.push({ href: url.href, headers: init.headers });
    return new Response('{"configs":[]}', {
      status: upstreamStatus,
      headers: { "content-type": "application/json" },
    });
  };
  const { onRequest } = await import(
    "../../functions/config-builder/dashboard/login.js"
  );
  const response = await onRequest({
    request: new Request("https://pages.dev/config-builder/dashboard/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, password }),
    }),
    env: {},
  });
  return { response, seen };
}

test("dashboard login validates credentials and sets an HttpOnly cookie", async () => {
  try {
    const { response, seen } = await postLogin("admin", "yakasuka");
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
    const cookie = response.headers.get("set-cookie") || "";
    assert.match(cookie, /ygg_admin=/);
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /Secure/);
    assert.match(cookie, /SameSite=Lax/);
    assert.equal(seen.length, 1);
    assert.equal(seen[0].href, DEFAULT_SERVICE + "/api/admin/configs");
    const auth = seen[0].headers.authorization;
    assert.equal(auth, "Basic " + btoa("admin:yakasuka"));

    const denied = await postLogin("admin", "wrong", 401);
    assert.equal(denied.response.status, 401);
    assert.equal(denied.response.headers.get("www-authenticate"), null);
    assert.match((await denied.response.json()).error, /账号或密码/);
  } finally {
    globalThis.fetch = realFetch;
  }
});

test("dashboard route renders a sign-in page without a session", async () => {
  const { onRequest } = await import(
    "../../functions/config-builder/dashboard.js"
  );
  const response = await onRequest({
    request: new Request("https://pages.dev/config-builder/dashboard"),
    env: {},
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("www-authenticate"), null);
  const html = await response.text();
  assert.match(html, /配置管理登录/);
  assert.match(html, /id="username"/);
  assert.match(html, /id="password"/);
});

test("dashboard page shows generation, expiry and validity columns", () => {
  const html = dashboardHTML({
    linkBase: "https://pages.dev/config-builder",
  });
  assert.match(html, /生成时间/);
  assert.match(html, /到期时间/);
  assert.match(html, /有效期/);
  assert.match(html, /"3h":"3 小时"/);
  assert.match(html, /"forever":"永久"/);
  assert.match(html, /退出登录/);
  assert.match(html, /data-theme|prefers-color-scheme/);
  assert.doesNotMatch(html, /#06100c|--accent:#4ade80/);
});

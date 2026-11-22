import test from "node:test";
import assert from "node:assert/strict";
import { subResponse } from "../../functions/sub.js";

const req = (href) => new Request(href);
const env = { TOKEN: "yggdrasil2026", GH_TOKEN: "ghp_test" };
const SUB = "https://yggdrasil-afx.pages.dev/sub";

const githubOk = (text) => async () =>
  new Response(
    JSON.stringify({
      encoding: "base64",
      content: Buffer.from(text, "utf-8").toString("base64"),
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );

test("/sub rejects a missing or wrong token with 401", async () => {
  for (const href of [SUB, `${SUB}?token=wrong`, `${SUB}?token=`]) {
    const res = await subResponse(
      { request: req(href), env },
      async () => { throw Error("fetch should not be called"); },
    );
    assert.equal(res.status, 401);
  }
});

test("/sub requires TOKEN to be configured", async () => {
  const res = await subResponse(
    { request: req(`${SUB}?token=yggdrasil2026`), env: { GH_TOKEN: "ghp_test" } },
    async () => { throw Error("fetch should not be called"); },
  );
  assert.equal(res.status, 401);
});

test("/sub returns 500 when GH_TOKEN is missing", async () => {
  const res = await subResponse(
    { request: req(`${SUB}?token=yggdrasil2026`), env: { TOKEN: "yggdrasil2026" } },
    async () => { throw Error("fetch should not be called"); },
  );
  assert.equal(res.status, 500);
  assert.match(await res.text(), /GH_TOKEN/);
});

test("/sub reads nodes.yaml from GitHub and returns YAML verbatim", async () => {
  const yaml = "proxies:\n- name: 🇯🇵 千叶|Oracle\n  type: hysteria2\n";
  let seen = null;
  const fetcher = async (url, init) => {
    seen = { url, headers: init.headers };
    return githubOk(yaml)();
  };
  const res = await subResponse(
    { request: req(`${SUB}?token=yggdrasil2026`), env },
    fetcher,
  );
  assert.equal(res.status, 200);
  assert.equal(await res.text(), yaml);
  assert.match(seen.url, /yggdrasil-private\/contents\/nodes\.yaml$/);
  assert.equal(seen.headers.Authorization, "Bearer ghp_test");
  assert.equal(res.headers.get("content-disposition"), "inline");
  assert.match(res.headers.get("subscription-userinfo"), /total=/);
  assert.equal(res.headers.get("cache-control"), "no-store");
});

test("/sub supports a custom NODES_API endpoint", async () => {
  const custom = "https://api.github.com/repos/acme/private/contents/nodes.yaml";
  let seen = "";
  const res = await subResponse(
    {
      request: req(`${SUB}?token=yggdrasil2026`),
      env: { ...env, NODES_API: custom },
    },
    async (url) => { seen = url; return githubOk("proxies: []\n")(); },
  );
  assert.equal(res.status, 200);
  assert.equal(seen, custom);
});

test("/sub maps GitHub errors and malformed responses to 502", async () => {
  const badStatus = await subResponse(
    { request: req(`${SUB}?token=yggdrasil2026`), env },
    async () => new Response("nope", { status: 404 }),
  );
  assert.equal(badStatus.status, 502);

  const badShape = await subResponse(
    { request: req(`${SUB}?token=yggdrasil2026`), env },
    async () => new Response(JSON.stringify({ content: "x", encoding: "utf-8" }), { status: 200 }),
  );
  assert.equal(badShape.status, 502);

  const thrown = await subResponse(
    { request: req(`${SUB}?token=yggdrasil2026`), env },
    async () => { throw Error("network down"); },
  );
  assert.equal(thrown.status, 502);
});

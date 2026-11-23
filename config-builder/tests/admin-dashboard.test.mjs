import test from "node:test";
import assert from "node:assert/strict";
import { Script } from "node:vm";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createService } from "../server/create-server.js";
import { dashboardHTML } from "../server/dashboard.js";
import { profile, text } from "./helpers.mjs";

const ORIGIN = "https://yggdrasil.xyang.cyou";
const FRONTEND = "https://yggdrasil-afx.pages.dev";
const platform = {
  fetcher: async (_url, options) =>
    new Response(options?.method === "HEAD" ? null : text),
  ipFetcher: async () => new Response(text),
  resolver: async () => ["8.8.8.8"],
  probe: async () => 12,
};

async function service(extra = {}) {
  return createService({
    config: {
      host: "127.0.0.1",
      port: 8791,
      trustProxy: false,
      publicBase: ORIGIN,
      allowedOrigins: [FRONTEND],
      adminUsers: [{ user: "owner", pass: "s3cret" }],
      dataDir: await mkdtemp(join(tmpdir(), "yggdrasil-dash-")),
      templateURL: "bundled",
      tcpProbeEnabled: false,
      ...extra,
    },
    platform,
  });
}

const basic = (user, pass) =>
  "Basic " + Buffer.from(user + ":" + pass).toString("base64");
const auth = basic("owner", "s3cret");
const dash = (s, a = auth, method = "GET") =>
  s.fetch(new Request(ORIGIN + "/config-builder/dashboard", {
    method,
    headers: a ? { Authorization: a } : {},
  }));
const adminGet = (s) =>
  s.fetch(new Request(ORIGIN + "/api/admin/configs", {
    headers: { Authorization: auth },
  }));
const create = (pwd, title = "Eaibee") => {
  const headers = { "Content-Type": "application/json", Origin: FRONTEND };
  if (pwd) headers["X-Config-Pwd"] = pwd;
  return new Request(ORIGIN + "/api/subscriptions", {
    method: "POST",
    headers,
    body: JSON.stringify({ ...profile(), title }),
  });
};
const deleteById = (s, id, a = auth) =>
  s.fetch(new Request(ORIGIN + "/api/admin/configs", {
    method: "DELETE",
    headers: { Authorization: a, "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  }));

test("dashboard HTML is self-contained and escapes its boot config", () => {
  const html = dashboardHTML({ linkBase: "https://x/y", adminPath: "/api/admin/configs" });
  assert.match(html, /<!DOCTYPE html>/);
  assert.match(html, /配置管理/);
  assert.match(html, /fetch\(CFG\.adminPath/);
  assert.match(html, /textContent/);
  // A quote in the link base cannot break out of the JSON config object.
  const hostile = dashboardHTML({ linkBase: "</script><script>alert(1)" });
  assert.ok(!hostile.includes("</script><script>alert(1)"));
  assert.ok(hostile.includes("\\u003c/script\\u003e\\u003cscript\\u003e"));
});

test("dashboard inline script compiles (escapes survive the template literal)", () => {
  // dashboardHTML returns a template literal. Backslash escapes such as the
  // CRLF normaliser must be double-escaped in the source, otherwise the
  // generated inline script contains a broken regex and every click handler
  // silently fails to bind. Compiling the script catches that regression.
  const html = dashboardHTML({ linkBase: "https://x/y" });
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  assert.ok(scripts.length > 0, "inline scripts present");
  scripts.forEach((match, i) =>
    assert.doesNotThrow(() => new Script(match[1]), `inline script ${i} must parse`),
  );
  // The CRLF normaliser must ship as literal backslashes, not real newlines.
  const main = scripts.map((m) => m[1]).find((s) => s.includes("fiText"));
  assert.ok(main, "main dashboard script present");
  assert.match(main, /replace\(\/\\r\\n\/g,"\\n"\)/);
});

test("dashboard uses the builder stylesheet and renders stats as styled chips", () => {
  const html = dashboardHTML({ linkBase: "https://x/y" });
  // The dashboard shares the configurator's design tokens verbatim.
  assert.match(html, /--glass:/);
  assert.match(html, /class="caustic-hero"/);
  // Every editable part of the template has its own graphical section.
  ["fi-general", "fi-apps", "fi-regions", "fi-strategies", "fi-core",
   "fi-filters", "fi-rules", "fi-rule-list", "fi-providers"].forEach((id) =>
    assert.ok(html.includes('id="' + id + '"'), "dashboard section " + id));
  assert.match(html, /function buildOps/);
  assert.match(html, /kind:"group-props"/);
  assert.match(html, /kind:"provider"/);
  assert.match(html, /class="site-header"/);
  // Stats must be real elements with a class, not stray "stat" text nodes —
  // the old el("div","stat") bug rendered "stat地区 6 stat应用 39..." as text.
  assert.match(html, /box\.className="dash-stat"/);
  assert.ok(!html.includes('el("div","stat")'), "no stray stat text nodes");
});

test("dashboard groups editable sections into builder-style steps", () => {
  const html = dashboardHTML({ linkBase: "https://x/y" });
  ["general", "apps", "regions", "strategy", "rules", "configs"].forEach((step) => {
    assert.ok(html.includes('data-step="' + step + '"'), "step rail: " + step);
    assert.ok(html.includes('data-panel="' + step + '"'), "step panel: " + step);
  });
  assert.match(html, /STEP 01 \/ 06/);
  const main = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
    .map((m) => m[1]).find((s) => s.includes("fiText"));
  assert.match(main, /var STEP_ORDER=\["general","apps","regions","strategy","rules","configs"\]/);
  // Only the active category is on screen, instead of one endless flat list.
  assert.match(main, /p\.hidden=p\.dataset\.panel!==which/);
  assert.match(main, /showStep\("general"\)/);
});

test("dashboard edit fields expose controls, not wrappers, to patch handlers", () => {
  const html = dashboardHTML({ linkBase: "https://x/y" });
  const main = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
    .map((m) => m[1]).find((s) => s.includes("fiText"));
  assert.ok(main, "main dashboard script present");
  // field() must return the input/select so f.<name>.value works when the
  // apply button builds PATCH ops; returning the div silently broke saving.
  assert.match(main, /control\._wrapper=w;return control/);
  assert.ok(!main.includes("modalBody.appendChild(f."), "no wrapper fields");
  assert.match(main, /f\.label\.value\.trim\(\)/);
});

test("dashboard offers one-click copy for links and guards drafts", () => {
  const html = dashboardHTML({ linkBase: "https://x/y" });
  const main = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
    .map((m) => m[1]).find((s) => s.includes("fiText"));
  assert.ok(main, "main dashboard script present");
  // Every real link is directly clickable (new tab) and keeps a copy button;
  // legacy passwordless records degrade to plain text.
  assert.match(main, /main\.appendChild\(copyButton\(url\)\)/);
  assert.match(main, /a\.target="_blank"/);
  assert.match(main, /a\.rel="noopener noreferrer"/);
  assert.match(main, /if\(row\.hasPwd&&!row\.pwd\)/);
  assert.match(main, /function copyButton/);
  assert.match(main, /navigator\.clipboard\.writeText/);
  // A non-secure-context fallback must exist, and no markup may be injected.
  assert.match(main, /function fallbackCopy/);
  assert.match(main, /document\.execCommand\("copy"\)/);
  assert.match(main, /notify\(/);
  assert.ok(html.includes('id="toast"'), "toast feedback region present");
  // Unsaved template edits must be warned about on unload and tab switch.
  assert.match(main, /addEventListener\("beforeunload"/);
  assert.match(main, /if\(fiDirty&&!window\.confirm\(/);
  // Empty state points back to the builder.
  assert.match(main, /打开配置工坊/);
});

test("dashboard requires Basic auth, supports HEAD, and hides API from discovery", async () => {
  const s = await service();
  const denied = await dash(s, "");
  assert.equal(denied.status, 401);
  assert.match(denied.headers.get("WWW-Authenticate") || "", /Basic/);
  assert.equal((await dash(s, basic("owner", "wrong"))).status, 401);

  const ok = await dash(s);
  assert.equal(ok.status, 200);
  assert.match(ok.headers.get("Content-Type") || "", /text\/html/);
  assert.match(ok.headers.get("Content-Security-Policy") || "", /default-src 'none'/);
  assert.match(await ok.text(), /配置管理/);

  const head = await dash(s, auth, "HEAD");
  assert.equal(head.status, 200);

  const endpoints = await s.fetch(new Request(ORIGIN + "/api/endpoints"));
  const links = await endpoints.json();
  assert.ok(!JSON.stringify(links).includes("dashboard"));
  assert.ok(!JSON.stringify(links).includes("admin"));
});

test("dashboard is disabled together with the admin API when no users configured", async () => {
  const s = await service({ adminUsers: [] });
  assert.equal((await dash(s)).status, 401);
});

test("dashboard link base uses PUBLIC_LINK_BASE when configured", async () => {
  const s = await service({
    publicLinkBase: FRONTEND + "/config-builder",
  });
  const res = await s.fetch(new Request(ORIGIN + "/api/endpoints"));
  assert.equal(res.status, 200);
  const html = await (await dash(s)).text();
  assert.ok(html.includes("yggdrasil-afx.pages.dev/config-builder"));
  assert.ok(!html.includes("yggdrasil-afx.pages.dev/yggdrasil/config-builder"));
});

test("a password-protected config can be deleted by its id", async () => {
  const s = await service();
  assert.equal((await s.fetch(create("alpha"))).status, 201);
  assert.equal((await s.fetch(create("", "PublicOne"))).status, 201);

  const { configs } = await (await adminGet(s)).json();
  assert.equal(configs.length, 2);
  const locked = configs.find((c) => c.hasPwd);
  const plain = configs.find((c) => !c.hasPwd);
  assert.ok(locked.id);
  assert.ok(plain.id);

  // Deleting the protected one by id works without ever knowing its password.
  const removed = await deleteById(s, locked.id);
  assert.equal(removed.status, 200);
  assert.equal((await removed.json()).removed, true);
  assert.equal(
    (await s.fetch(new Request(ORIGIN + "/config-builder?token=eaibee&pwd=alpha"))).status,
    404,
  );
  assert.equal(
    (await s.fetch(new Request(ORIGIN + "/config-builder?token=publicone"))).status,
    200,
  );

  // Repeating deletion returns 404, and unauthorised deletion is still blocked.
  assert.equal((await deleteById(s, locked.id)).status, 404);
  assert.equal((await deleteById(s, plain.id, "")).status, 401);
  assert.equal((await deleteById(s, plain.id)).status, 200);
  assert.equal((await (await adminGet(s)).json()).configs.length, 0);
});

test("admin API returns the real plaintext password for debugging", async () => {
  const s = await service();
  assert.equal((await s.fetch(create("alpha"))).status, 201);
  assert.equal((await s.fetch(create("", "PublicOne"))).status, 201);

  const { configs } = await (await adminGet(s)).json();
  const locked = configs.find((c) => c.hasPwd);
  const plain = configs.find((c) => !c.hasPwd);
  assert.equal(locked.pwd, "alpha", "plaintext password must be exposed to the owner");
  assert.equal(plain.pwd, "", "passwordless configs expose an empty string");
});

test("dashboard builds links from the real password, not a placeholder", () => {
  const html = dashboardHTML({ linkBase: FRONTEND + "/config-builder" });
  // The old placeholder encoded to %3C%E5%9C%A8... and must be gone.
  assert.ok(!html.includes("在生成时设置的口令"));
  assert.ok(html.includes("encodeURIComponent(row.pwd)"));
  // Legacy protected records without a stored password get an honest note,
  // never an empty pwd= link that would 404.
  assert.ok(html.includes("旧配置：当时未记录口令"));
  assert.ok(!html.includes("row.pwd ||"));
});

test("legacy name+password deletion still works alongside id deletion", async () => {
  const s = await service();
  assert.equal((await s.fetch(create("alpha"))).status, 201);
  const legacy = await s.fetch(new Request(ORIGIN + "/api/admin/configs", {
    method: "DELETE",
    headers: { Authorization: auth, "Content-Type": "application/json" },
    body: JSON.stringify({ token: "eaibee", pwd: "alpha" }),
  }));
  assert.equal(legacy.status, 200);
  assert.equal((await (await adminGet(s)).json()).configs.length, 0);
});

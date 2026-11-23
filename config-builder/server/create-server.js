import { timingSafeEqual } from "node:crypto";
import { SERVICE_ROUTES } from "../shared/service-routes.js";
import { SHARE_CODE_RE, shareIncludesProviders } from "../shared/share.js";
import {
  CONFIG_NAME_RE,
  CONFIG_PWD_RE,
  configAliasKey,
  configQuery,
  parseConfigQuery,
} from "../shared/config-link.js";
import { createWorker } from "../worker/application.js";
import { catalogLoader } from "../worker/catalog.js";
import { dashboardHTML } from "./dashboard.js";
import { loadConfig, serviceEnv } from "./config.js";
import { fileStorage } from "./storage.js";
import {
  FRONTINFO_KEY,
  clearFrontInfo,
  draftAwareLoader,
  editFrontInfo,
  readFrontInfo,
  saveFrontInfo,
} from "./frontinfo.js";
import { createPresetStore } from "./presets.js";
import { fetcher, ipFetcher, probe, resolver } from "./node-platform.js";
import { createUrlProbe } from "./url-probe.js";

const INTERNAL_SUBSCRIPTION =
  /^\/s\/([A-Za-z0-9_-]{22})\/([A-Za-z0-9_-]{43})\.yaml$/;
const PRESET_READ = /^\/api\/presets\/([0-9a-f]{36})$/i;
const MAX_PRESET_BODY = 64 * 1024;
// Friendly config links use the configuration name as their token; the random
// id/key stay internal. The legacy /subscription/<id>/<key>.yaml alias has
// been removed.
const CONFIG_PATH = SERVICE_ROUTES.config;
const INTERNAL_PARTS = /^([A-Za-z0-9_-]{22})\/([A-Za-z0-9_-]{43})$/;
const ID_RE = /^[A-Za-z0-9_-]{22}$/;
const KEY_RE = /^[A-Za-z0-9_-]{43}$/;
const ADMIN_PATH = "/api/admin/configs";
const FRONTINFO_PATH = "/api/admin/frontinfo";
const DASHBOARD_PATH = CONFIG_PATH + "/dashboard";

function aliasFromFilename(filename) {
  // New format: "ratatoskr · <name>.yaml"; legacy: "<name>-ratatoskr.yaml".
  // Strip either wrapper to recover the configuration name the user typed.
  const raw = String(filename || "")
    .replace(/^ratatoskr\s*·\s*/i, "")
    .replace(/-ratatoskr\.yaml$/i, "")
    .replace(/\.yaml$/i, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
  return CONFIG_NAME_RE.test(raw) ? raw : null;
}

const json = (data, status = 200, headers = {}) =>
  Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });

const unauthorized = () =>
  json(
    { error: "需要管理员凭据。" },
    401,
    { "WWW-Authenticate": 'Basic realm="yggdrasil-admin", charset="UTF-8"' },
  );

// Constant-time comparison avoids leaking credentials through response timing.
function equal(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  if (x.length !== y.length) return false;
  return timingSafeEqual(x, y);
}

function adminAuthorized(request, config) {
  if (!config.adminUsers.length) return false;
  const header = request.headers.get("Authorization") || "";
  const match = /^Basic\s+([A-Za-z0-9+/=]+)$/i.exec(header);
  if (!match) return false;
  let decoded;
  try {
    decoded = Buffer.from(match[1], "base64").toString("utf8");
  } catch {
    return false;
  }
  const at = decoded.indexOf(":");
  if (at < 0) return false;
  const user = decoded.slice(0, at);
  const pass = decoded.slice(at + 1);
  return config.adminUsers.some(
    (entry) => equal(entry.user, user) && equal(entry.pass, pass),
  );
}

const REWRITES = [
  [SERVICE_ROUTES.status, ["GET"], "/api/health"],
  [SERVICE_ROUTES.catalog, ["GET"], "/api/catalog"],
  [SERVICE_ROUTES.inspect, ["POST"], "/api/inspect"],
  [SERVICE_ROUTES.preview, ["POST"], "/api/preview"],
  [SERVICE_ROUTES.probe, ["POST"], "/api/probe"],
  [SERVICE_ROUTES.create, ["POST"], "/api/profiles"],
];

function publicBase(request, config) {
  if (config.publicBase) return config.publicBase;
  if (config.trustProxy) {
    const protocol = request.headers
      .get("X-Forwarded-Proto")
      ?.split(",")[0]
      ?.trim();
    const host = request.headers.get("X-Forwarded-Host")?.split(",")[0]?.trim();
    if (protocol && host) {
      try {
        const url = new URL(`${protocol}://${host}`);
        if (
          ["http:", "https:"].includes(url.protocol) &&
          url.pathname === "/" &&
          !url.username &&
          !url.password
        )
          return url.origin;
      } catch {}
    }
  }
  return new URL(request.url).origin;
}

function originAllowed(request, config) {
  const origin = request.headers.get("Origin");
  if (!origin) return true;
  if (origin === new URL(request.url).origin) return true;
  if (!config.allowedOrigins.length) return true;
  return config.allowedOrigins.includes(origin);
}

function corsHeaders(request, config) {
  const headers = {
    Vary: "Origin",
    "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Config-Pwd",
  };
  const origin = request.headers.get("Origin");
  headers["Access-Control-Allow-Origin"] = origin || "*";
  return headers;
}

function withCors(request, response, config) {
  if (!response.headers.has("Access-Control-Allow-Origin"))
    return new Response(response.body, {
      status: response.status,
      headers: { ...corsHeaders(request, config), ...Object.fromEntries(response.headers) },
    });
  const headers = new Headers(response.headers);
  const origin = request.headers.get("Origin");
  if (origin) headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Vary", "Origin");
  return new Response(response.body, { status: response.status, headers });
}

// Strip the browser Origin before handing the request to worker/application.js:
// this server owns the CORS decision, and the worker would otherwise reject a
// cross-origin call using its own ALLOWED_ORIGINS list.
function forward(request, target, clientIP) {
  const headers = new Headers(request.headers);
  headers.delete("Origin");
  headers.delete("CF-Connecting-IP");
  if (clientIP) headers.set("CF-Connecting-IP", clientIP);
  const init = { method: request.method, headers, redirect: "manual" };
  if (!["GET", "HEAD"].includes(request.method) && request.body) {
    init.body = request.body;
    init.duplex = "half";
  }
  return new Request(target, init);
}

export function createService({
  config = loadConfig(),
  storage = fileStorage(config.dataDir),
  platform = { fetcher, ipFetcher, resolver, probe },
} = {}) {
  // Real url-test probing is opt-in via MIHOMO_BIN. Auto-attach it to the
  // default platform so the self-hosted service measures UDP nodes the same
  // way the client does; an explicitly injected platform (tests) keeps its own
  // probe behaviour.
  let effectivePlatform = platform;
  if (config.mihomoBin && !("urlProbe" in platform)) {
    const urlProbe = createUrlProbe({
      mihomoBin: config.mihomoBin,
      testURL: config.urlTestURL,
      timeoutMs: config.urlTestTimeout,
    });
    if (urlProbe) effectivePlatform = { ...platform, urlProbe };
  }
  // A saved front-end draft must change what the public /api/catalog serves
  // immediately, before any Action commits it. Wrap the normal loader so the
  // draft wins while one exists; the template text is public, non-secret data.
  const loadCatalog = draftAwareLoader(
    storage,
    catalogLoader(effectivePlatform.fetcher),
  );
  const application = createWorker({ ...effectivePlatform, loadCatalog });
  const env = serviceEnv(config, storage);
  const presets = createPresetStore(storage, { ttl: config.presetTtl });

  function links(request) {
    const base = publicBase(request, config);
    return {
      service: base,
      status: base + SERVICE_ROUTES.status,
      inspect: base + SERVICE_ROUTES.inspect,
      preview: base + SERVICE_ROUTES.preview,
      create: base + SERVICE_ROUTES.create,
      latency: base + SERVICE_ROUTES.probe,
      preset: base + SERVICE_ROUTES.preset,
      config: base + CONFIG_PATH,
      frontends: config.allowedOrigins,
    };
  }

  async function handle(request, context = {}) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const base = publicBase(request, config);

    if (!originAllowed(request, config))
      return json(
        { error: "此网页来源尚未获准访问订阅服务。" },
        403,
        { "Access-Control-Allow-Origin": "*", Vary: "Origin" },
      );
    if (method === "OPTIONS")
      return new Response(null, {
        status: 204,
        headers: {
          ...corsHeaders(request, config),
          "Cache-Control": "no-store",
          "Access-Control-Max-Age": "600",
        },
      });

    try {
      // Owner-only web dashboard. Same Basic credential as the management API;
      // it is a static shell that fetches data from the admin API itself.
      if (path === DASHBOARD_PATH && ["GET", "HEAD"].includes(method)) {
        if (!adminAuthorized(request, config))
          return withCors(request, unauthorized(), config);
        const html = dashboardHTML({
          linkBase: config.publicLinkBase || base + CONFIG_PATH,
          adminPath: ADMIN_PATH,
          frontInfoPath: FRONTINFO_PATH,
          catalogPath: SERVICE_ROUTES.catalog,
        });
        return withCors(
          request,
          new Response(method === "HEAD" ? null : html, {
            status: 200,
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "Cache-Control": "no-store, private",
              "X-Content-Type-Options": "nosniff",
              "X-Frame-Options": "DENY",
              "Content-Security-Policy":
                "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'",
            },
          }),
          config,
        );
      }

      // Owner-only management API. Not linked from any frontend or endpoint
      // discovery response; requires HTTP Basic credentials from ADMIN_USERS.
      if (
        (path === ADMIN_PATH || path === FRONTINFO_PATH) &&
        !adminAuthorized(request, config)
      )
        return withCors(request, unauthorized(), config);
      if (path === ADMIN_PATH && method === "GET") {
        const records = await storage.list();
        const configs = [];
        for (const record of records) {
          if (!record.key.startsWith("alias:")) continue;
          const alias = record.key.slice("alias:".length);
          let mapping;
          try {
            mapping = JSON.parse(record.value);
          } catch {
            continue;
          }
          if (!ID_RE.test(mapping?.id) || !KEY_RE.test(mapping?.key)) continue;
          const profile = await storage.get("profile:" + mapping.id, "json");
          const pwdParts = alias.split(":");
          configs.push({
            token: pwdParts[0],
            hasPwd: pwdParts.length > 1,
            // Plaintext password is kept on the owner's server purely so the
            // admin dashboard can display the real subscription link for
            // debugging. It is never returned by any public endpoint.
            pwd: typeof mapping.pwd === "string" ? mapping.pwd : "",
            id: mapping.id,
            createdAt: profile?.createdAt || null,
            expiresAt: profile?.expiresAt || null,
            lifetime: profile?.lifetime || null,
          });
        }
        configs.sort((a, b) =>
          String(b.createdAt || "").localeCompare(String(a.createdAt || "")),
        );
        return withCors(request, json({ configs }), config);
      }
      if (path === ADMIN_PATH && method === "DELETE") {
        const raw = await request.text();
        let payload;
        try {
          payload = JSON.parse(raw);
        } catch {
          return withCors(request, json({ error: "请求内容无效。" }, 400), config);
        }
        const id = String(payload?.id || "");
        let key = "";
        let mapping = null;
        if (ID_RE.test(id)) {
          // Preferred path: locate the alias record by its internal id. This
          // works for password-protected configs too, whose plaintext password
          // is deliberately never stored and cannot be re-derived here.
          for (const record of await storage.list()) {
            if (!record.key.startsWith("alias:")) continue;
            let candidate;
            try {
              candidate = JSON.parse(record.value);
            } catch {
              continue;
            }
            if (candidate?.id === id && KEY_RE.test(candidate.key)) {
              key = record.key;
              mapping = candidate;
              break;
            }
          }
        } else {
          // Legacy path kept for API compatibility: name + plaintext password.
          const token = String(payload?.token || "").toLowerCase();
          const pwd = String(payload?.pwd || "");
          if (!CONFIG_NAME_RE.test(token) || (pwd && !(CONFIG_PWD_RE.test(pwd))))
            return withCors(request, json({ error: "标识无效。" }, 400), config);
          key = await configAliasKey(token, pwd);
          mapping = await storage.get(key, "json");
        }
        if (!key || !mapping || !ID_RE.test(mapping.id))
          return withCors(request, json({ error: "配置不存在。" }, 404), config);
        await storage.delete(key);
        await storage.delete("profile:" + mapping.id);
        return withCors(request, json({ removed: true }), config);
      }

      // Owner-editable front-end information (the Ratatoskr YAML template).
      // GET loads the current draft, PUT validates + saves an edit, DELETE
      // discards the draft and falls back to the committed repository version.
      if (path === FRONTINFO_PATH && method === "GET")
        return withCors(request, json(await readFrontInfo(storage)), config);
      if (path === FRONTINFO_PATH && method === "DELETE") {
        await clearFrontInfo(storage);
        return withCors(request, json({ removed: true }), config);
      }
      if (path === FRONTINFO_PATH && method === "PUT") {
        const raw = await request.text();
        let payload;
        try {
          payload = JSON.parse(raw);
        } catch {
          return withCors(request, json({ error: "请求内容无效。" }, 400), config);
        }
        let saved;
        try {
          saved = await saveFrontInfo(storage, payload?.text);
        } catch (error) {
          return withCors(
            request,
            json({ error: error.message || "模板校验失败。" }, 400),
            config,
          );
        }
        return withCors(
          request,
          json({ ok: true, updatedAt: saved.updatedAt, summary: saved.summary }),
          config,
        );
      }
      // Graphical edits: apply surgical operations to the template and return
      // the freshly derived catalog so cards can re-render in place.
      if (path === FRONTINFO_PATH && method === "PATCH") {
        const raw = await request.text();
        let payload;
        try {
          payload = JSON.parse(raw);
        } catch {
          return withCors(request, json({ error: "请求内容无效。" }, 400), config);
        }
        let result;
        try {
          result = await editFrontInfo(storage, payload?.ops);
        } catch (error) {
          return withCors(
            request,
            json({ error: error.message || "编辑失败。" }, 400),
            config,
          );
        }
        return withCors(
          request,
          json({
            ok: true,
            text: result.record.text,
            updatedAt: result.record.updatedAt,
            summary: result.record.summary,
            catalog: result.catalog,
          }),
          config,
        );
      }

      // Public, read-only draft feed for the sync Action. The template is
      // non-secret (it is already published in the repository), so exposing
      // the current draft here lets GitHub Actions pull it with plain HTTPS —
      // no PAT or backend-held GitHub credential required. Returns 204 when
      // there is no pending draft.
      if (path === "/api/frontinfo" && method === "GET") {
        const draft = await storage.get(FRONTINFO_KEY, "json");
        if (!draft || typeof draft.text !== "string")
          return withCors(request, new Response(null, { status: 204 }), config);
        return withCors(
          request,
          json({ text: draft.text, updatedAt: draft.updatedAt || null }),
          config,
        );
      }

      // The backend is the only place that emits real links. The only
      // credential is the random id/key carried in each subscription URL itself.
      if (path === "/api/endpoints" && ["GET", "HEAD"].includes(method))
        return withCors(request, json(links(request)), config);

      // Share codes need no shared secret: the 144-bit random code is the
      // bearer token. Airport URLs are only stored on explicit opt-in.
      if (path === SERVICE_ROUTES.preset && method === "POST") {
        const raw = await request.text();
        if (raw.length > MAX_PRESET_BODY)
          return withCors(request, json({ error: "配置内容过大。" }, 413), config);
        let payload;
        try {
          payload = JSON.parse(raw);
        } catch {
          return withCors(request, json({ error: "请求内容无效。" }, 400), config);
        }
        const includeProviders = payload?.includeProviders === true;
        let code;
        try {
          code = await presets.create(payload?.profile, includeProviders);
        } catch {
          return withCors(request, json({ error: "配置内容无效。" }, 400), config);
        }
        return withCors(
          request,
          json({
            code,
            url: base + SERVICE_ROUTES.preset + "/" + code,
            includeProviders,
          }),
          config,
        );
      }
      const presetRead = path.match(PRESET_READ);
      if (presetRead && ["GET", "HEAD"].includes(method)) {
        const shared = await presets.read(presetRead[1]);
        if (!shared)
          return withCors(
            request,
            json({ error: "分享码不存在或已失效。" }, 404),
            config,
          );
        return withCors(
          request,
          json({
            profile: shared,
            includeProviders: shareIncludesProviders(shared),
          }),
          config,
        );
      }

      let target = null;
      let create = false;
      const friendlyYaml =
        path === CONFIG_PATH && ["GET", "HEAD"].includes(method);
      const friendlyStatus =
        path === CONFIG_PATH + "/status" && ["GET", "HEAD"].includes(method);
      if (friendlyYaml || friendlyStatus) {
        const link = parseConfigQuery(url.searchParams);
        if (!link)
          return withCors(request, json({ error: "订阅标识无效。" }, 400), config);
        const mapping = await storage.get(
          await configAliasKey(link.name, link.pwd),
          "json",
        );
        if (!mapping || !ID_RE.test(mapping.id) || !KEY_RE.test(mapping.key))
          return withCors(
            request,
            json({ error: "订阅链接不存在或已失效。" }, 404),
            config,
          );
        target = new URL(
          `/s/${mapping.id}/${mapping.key}${friendlyStatus ? "/status" : ".yaml"}`,
          url,
        );
      }
      for (const [publicPath, methods, internalPath] of REWRITES) {
        if (path === publicPath && methods.includes(method)) {
          target = new URL(internalPath, url);
          create = publicPath === SERVICE_ROUTES.create;
          break;
        }
      }
      if (!target) return withCors(request, json({ error: "链接不存在。" }, 404), config);

      const response = await application.fetch(
        forward(request, target, context.clientIP),
        env,
      );

      if (create && response.ok) {
        const pwd = (request.headers.get("X-Config-Pwd") || "").trim();
        if (pwd && !CONFIG_PWD_RE.test(pwd))
          return withCors(
            request,
            json({ error: "访问口令需为 1–64 个非空白字符。" }, 400),
            config,
          );
        const data = await response.json();
        const internal = new URL(data.url);
        if (
          internal.username ||
          internal.password ||
          internal.search ||
          internal.hash ||
          !INTERNAL_SUBSCRIPTION.test(internal.pathname)
        )
          return withCors(request, json({ error: "服务返回的订阅地址无效。" }, 502), config);
        // The friendly link uses the configuration name the user typed; the
        // random id/key stay server-side.
        const parts = internal.pathname
          .slice("/s/".length)
          .replace(/\.yaml$/, "")
          .match(INTERNAL_PARTS);
        if (!parts)
          return withCors(request, json({ error: "服务返回的订阅地址无效。" }, 502), config);
        const alias = aliasFromFilename(data.filename);
        if (!alias)
          return withCors(
            request,
            json(
              { error: "配置名称需为 3–60 位字母、数字、下划线或短横线，请修改后重试。" },
              400,
            ),
            config,
          );
        const storageKey = await configAliasKey(alias, pwd);
        if (await storage.get(storageKey, "json"))
          return withCors(
            request,
            json(
              {
                error: pwd
                  ? "该配置名称与口令组合已被使用，请修改名称或口令后重试。"
                  : "该配置名称已被使用，请改名后重试。",
              },
              409,
            ),
            config,
          );
        // Keep the plaintext password alongside the mapping. The owner needs
        // it to reconstruct/debug the real link in the dashboard; it never
        // leaves the Basic-auth-protected admin API. The storage key itself is
        // still derived from a SHA-256 digest, so collisions stay isolated.
        await storage.put(
          storageKey,
          JSON.stringify({ id: parts[1], key: parts[2], pwd }),
        );
        data.token = alias;
        data.hasPwd = !!pwd;
        const query = configQuery(alias, pwd);
        data.url = base + CONFIG_PATH + "?" + query;
        data.usageUrl = base + CONFIG_PATH + "/status?" + query;
        const headers = new Headers(response.headers);
        headers.delete("Content-Length");
        return withCors(
          request,
          Response.json(data, { status: response.status, headers }),
          config,
        );
      }

      // Friendly links are meant to be opened in a browser: show the YAML as
      // plain text instead of forcing a download. Keep the backend's filename
      // (ratatoskr · <name>.yaml) but switch attachment -> inline, so saving
      // the page uses that name instead of the URL path (config-builder.txt).
      if (friendlyYaml && response.ok) {
        const headers = new Headers(response.headers);
        const disposition = headers.get("Content-Disposition");
        if (disposition)
          headers.set(
            "Content-Disposition",
            disposition.replace(/^attachment\b/i, "inline"),
          );
        headers.delete("Content-Length");
        headers.set("Content-Type", "text/plain; charset=utf-8");
        headers.set("X-Content-Type-Options", "nosniff");
        headers.set("Cache-Control", "no-store, private");
        return withCors(
          request,
          new Response(response.body, { status: response.status, headers }),
          config,
        );
      }

      if (path === SERVICE_ROUTES.status && response.ok) {
        const data = await response.json();
        const headers = new Headers(response.headers);
        headers.delete("Content-Length");
        return withCors(
          request,
          Response.json(
            {
              ...data,
              storage: "self-hosted",
              service: base,
              endpoints: base + "/api/endpoints",
              cors: config.allowedOrigins.length ? "restricted" : "open",
            },
            { status: response.status, headers },
          ),
          config,
        );
      }

      return withCors(request, response, config);
    } catch (error) {
      return withCors(
        request,
        json(
          {
            error: "配置服务暂时不可用，请稍后重试。",
            code: "SERVICE_CONNECTION_ERROR",
          },
          503,
        ),
        config,
      );
    }
  }

  return { config, storage, env, links, fetch: handle };
}

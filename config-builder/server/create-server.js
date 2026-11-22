import { SERVICE_ROUTES } from "../shared/service-routes.js";
import { SHARE_CODE_RE, shareIncludesProviders } from "../shared/share.js";
import { createWorker } from "../worker/application.js";
import { loadConfig, serviceEnv } from "./config.js";
import { fileStorage } from "./storage.js";
import { createPresetStore } from "./presets.js";
import { fetcher, ipFetcher, probe, resolver } from "./node-platform.js";

const INTERNAL_SUBSCRIPTION =
  /^\/s\/([A-Za-z0-9_-]{22})\/([A-Za-z0-9_-]{43})\.yaml$/;
const PRESET_READ = /^\/api\/presets\/([0-9a-f]{36})$/i;
const MAX_PRESET_BODY = 64 * 1024;
// Friendly config links use the configuration name as their token; the random
// id/key stay internal. The legacy /subscription/<id>/<key>.yaml alias has
// been removed.
const CONFIG_PATH = SERVICE_ROUTES.config;
const ALIAS_RE = /^[\p{L}\p{N}_-]{3,60}$/u;
const INTERNAL_PARTS = /^([A-Za-z0-9_-]{22})\/([A-Za-z0-9_-]{43})$/;
const ID_RE = /^[A-Za-z0-9_-]{22}$/;
const KEY_RE = /^[A-Za-z0-9_-]{43}$/;
const aliasKey = (alias) => "alias:" + alias;

function aliasFromFilename(filename) {
  const raw = String(filename || "")
    .replace(/-ratatoskr\.yaml$/i, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
  return ALIAS_RE.test(raw) ? raw : null;
}

function aliasFromQuery(url) {
  const token = url.searchParams.get("token");
  if (url.searchParams.size !== 1 || !ALIAS_RE.test(token || "")) return null;
  return token.toLowerCase();
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

const REWRITES = [
  [SERVICE_ROUTES.status, ["GET"], "/api/health"],
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
    "Access-Control-Allow-Headers": "Content-Type",
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
  const application = createWorker({ ...platform });
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
        const alias = aliasFromQuery(url);
        if (!alias)
          return withCors(request, json({ error: "订阅标识无效。" }, 400), config);
        const mapping = await storage.get(aliasKey(alias), "json");
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
        if (await storage.get(aliasKey(alias), "json"))
          return withCors(
            request,
            json({ error: "该配置名称已被使用，请改名后重试。" }, 409),
            config,
          );
        await storage.put(
          aliasKey(alias),
          JSON.stringify({ id: parts[1], key: parts[2] }),
        );
        data.token = alias;
        data.url = base + CONFIG_PATH + "?token=" + encodeURIComponent(alias);
        data.usageUrl =
          base + CONFIG_PATH + "/status?token=" + encodeURIComponent(alias);
        const headers = new Headers(response.headers);
        headers.delete("Content-Length");
        return withCors(
          request,
          Response.json(data, { status: response.status, headers }),
          config,
        );
      }

      // Friendly links are meant to be opened in a browser: show the YAML as
      // plain text instead of forcing a download.
      if (friendlyYaml && response.ok) {
        const headers = new Headers(response.headers);
        headers.delete("Content-Disposition");
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

import { SERVICE_ROUTES } from "../shared/service-routes.js";
import { createWorker } from "../worker/application.js";
import { onRequestGet as mergeRequest } from "../../scripts/endpoints/merge.js";
import { onRequestGet as subRequest } from "../../scripts/endpoints/sub.js";
import { loadConfig, serviceEnv } from "./config.js";
import { fileStorage } from "./storage.js";
import { fetcher, ipFetcher, probe, resolver } from "./node-platform.js";

const SUBSCRIPTION_PATH =
  /^\/subscription\/([A-Za-z0-9_-]{22})\/([A-Za-z0-9_-]{43})(\.yaml|\/status)$/;
const INTERNAL_SUBSCRIPTION =
  /^\/s\/([A-Za-z0-9_-]{22})\/([A-Za-z0-9_-]{43})\.yaml$/;

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

// /merge and /sub return private node data. Proxy clients consume them, not
// browser JavaScript, so they must not be readable cross-origin and must not
// leak through a referrer. The token lives in the URL, so no CORS header and
// a strict referrer policy are the safest defaults for these two routes.
function privateBody(response) {
  const headers = new Headers(response.headers);
  for (const name of [
    "Access-Control-Allow-Origin",
    "Access-Control-Allow-Methods",
    "Access-Control-Allow-Headers",
    "Access-Control-Max-Age",
  ])
    headers.delete(name);
  headers.set("Cache-Control", "no-store, private");
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(response.body, { status: response.status, headers });
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

  function links(request) {
    const base = publicBase(request, config);
    return {
      service: base,
      status: base + SERVICE_ROUTES.status,
      inspect: base + SERVICE_ROUTES.inspect,
      preview: base + SERVICE_ROUTES.preview,
      create: base + SERVICE_ROUTES.create,
      latency: base + SERVICE_ROUTES.probe,
      subscription: base + SERVICE_ROUTES.subscription,
      merge: base + "/merge?token=",
      sub: base + "/sub?token=",
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
      // The backend is the only place that emits real links. No credential is
      // ever included: callers append their own token to merge / sub.
      if (path === "/api/endpoints" && ["GET", "HEAD"].includes(method))
        return withCors(
          request,
          json({ ...links(request), tokenHint: "在 merge / sub 链接后追加你的 TOKEN" }),
          config,
        );

      if (
        (path === "/merge" || path === "/merge/" || path === "/sub" || path === "/sub/") &&
        ["GET", "HEAD"].includes(method)
      ) {
        const endpoint = path.startsWith("/merge") ? mergeRequest : subRequest;
        return privateBody(await endpoint({ request, env }));
      }

      let target = null;
      let create = false;
      for (const [publicPath, methods, internalPath] of REWRITES) {
        if (path === publicPath && methods.includes(method)) {
          target = new URL(internalPath, url);
          create = publicPath === SERVICE_ROUTES.create;
          break;
        }
      }
      const read = path.match(SUBSCRIPTION_PATH);
      if (!target && read && ["GET", "HEAD"].includes(method))
        target = new URL(`/s/${read[1]}/${read[2]}${read[3]}`, url);
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
        // Rewrite the /s/ link into a public /subscription/ link served by
        // this backend only. Cloudflare / GitHub Pages never see node data.
        const suffix = internal.pathname.slice("/s/".length);
        data.url = base + SERVICE_ROUTES.subscription + suffix;
        data.usageUrl = data.url.replace(/\.yaml$/, "/status");
        const headers = new Headers(response.headers);
        headers.delete("Content-Length");
        return withCors(
          request,
          Response.json(data, { status: response.status, headers }),
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

import { SERVICE_ROUTES } from "../../shared/service-routes.js";
import { createWorker } from "../application.js";
const application = createWorker();
// Only the files copied by build-gateway.mjs may be served as public assets.
const publicAsset = (path) =>
  /^\/(?:index\.html|favicon\.(?:png|ico))?$/.test(path) ||
  /^\/(?:assets|icons)\/[A-Za-z0-9_./-]+\.(?:png|ico|svg|webp)$/.test(path) ||
  /^\/(?:Configurator|webui|builder)(?:\/|\/index\.html)?$/.test(path) ||
  /^\/Configurator\/assets\/app\.(?:js|css)$/.test(path);
// The fixed health probe never processes subscription data. Keep its runtime
// diagnostics bounded and strip URLs, resource identifiers and local paths.
const probeError = (error) => {
  const type = ["Error", "TypeError", "RangeError", "AbortError"].includes(
    error?.name,
  )
    ? error.name
    : "Error";
  const message = String(error?.message || "Service invocation failed")
    .replace(/https?:\/\/\S+/gi, "[url]")
    .replace(/\/(?:Users|home|private|var|tmp)\/\S+/g, "[path]")
    .replace(/\b[A-Za-z0-9_-]{24,}\b/g, "[id]")
    .slice(0, 200);
  return { type, message };
};
const failure = (status = 404, code, details = {}) =>
  Response.json(
    {
      error:
        status === 404 ? "链接不存在。" : "配置服务暂时不可用，请稍后重试。",
      ...(code ? { code, ...details } : {}),
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
export default {
  async fetch(request, env) {
    const publicURL = new URL(request.url),
      target = new URL(publicURL);
    if (["GET", "HEAD"].includes(request.method)) {
      if (publicURL.pathname === "/Configurator/config.json") {
        const headers = {
          "Cache-Control": "no-store",
          "Content-Type": "application/json",
          "X-Content-Type-Options": "nosniff",
        };
        return new Response(
          request.method === "HEAD"
            ? null
            : JSON.stringify({ apiBase: publicURL.origin }),
          { headers },
        );
      }
      if (publicAsset(publicURL.pathname))
        return env.ASSETS ? env.ASSETS.fetch(request) : failure();
    }
    const create = publicURL.pathname === SERVICE_ROUTES.create;
    const read = publicURL.pathname.match(
      /^\/subscription\/([A-Za-z0-9_-]{22})\/([A-Za-z0-9_-]{43})(\.yaml|\/status)$/,
    );
    if (
      publicURL.pathname === SERVICE_ROUTES.status &&
      ["GET", "OPTIONS"].includes(request.method)
    )
      target.pathname = "/api/health";
    else if (create && ["POST", "OPTIONS"].includes(request.method))
      target.pathname = "/api/profiles";
    else if (
      publicURL.pathname === SERVICE_ROUTES.preview &&
      ["POST", "OPTIONS"].includes(request.method)
    )
      target.pathname = "/api/preview";
    else if (
      publicURL.pathname === SERVICE_ROUTES.inspect &&
      ["POST", "OPTIONS"].includes(request.method)
    )
      target.pathname = "/api/inspect";
    else if (
      publicURL.pathname === SERVICE_ROUTES.probe &&
      ["POST", "OPTIONS"].includes(request.method)
    )
      target.pathname = "/api/probe";
    else if (read && ["GET", "HEAD"].includes(request.method))
      target.pathname = "/s/" + read[1] + "/" + read[2] + read[3];
    else return failure();
    const service = env.SUBSCRIPTIONS
      ? {
          fetch: (forwarded) =>
            application.fetch(forwarded, {
              ...env,
              TEMPLATE_URL: "bundled",
              TCP_PROBE_ENABLED: env.TCP_PROBE_ENABLED || "true",
            }),
        }
      : env.PROFILE_SERVICE;
    if (!service || typeof service.fetch !== "function")
      return failure(503, "SERVICE_NOT_BOUND");
    let phase = "request";
    try {
      const forwarded = new Request(target, request);
      phase = "service";
      const response = await service.fetch(forwarded);
      phase = "response";
      if (response.status >= 500)
        return failure(503, "SERVICE_RESPONSE_ERROR", {
          upstreamStatus: response.status,
        });
      if (create && request.method === "POST" && response.ok) {
        const data = await response.json();
        const internal = new URL(data.url);
        if (
          internal.origin !== publicURL.origin ||
          internal.username ||
          internal.password ||
          internal.search ||
          internal.hash ||
          !/^\/s\/[A-Za-z0-9_-]{22}\/[A-Za-z0-9_-]{43}\.yaml$/.test(
            internal.pathname,
          )
        )
          return failure(502);
        data.url =
          publicURL.origin +
          SERVICE_ROUTES.subscription +
          internal.pathname.slice(3);
        data.usageUrl = data.url.replace(/\.yaml$/, "/status");
        const headers = new Headers(response.headers);
        headers.delete("Content-Length");
        return Response.json(data, { status: response.status, headers });
      }
      return response;
    } catch (error) {
      return failure(
        503,
        "SERVICE_CONNECTION_ERROR",
        publicURL.pathname === SERVICE_ROUTES.status && request.method === "GET"
          ? { phase, diagnostic: probeError(error) }
          : {},
      );
    }
  },
};

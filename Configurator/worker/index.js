import {
  compile,
  normalize,
  normalizeProviders,
  ConfigError,
} from "../shared/compiler.js";
import { lifetime } from "../shared/profile.js";
import {
  publicInspection,
  aggregateUsage,
  usageHeader,
} from "../shared/nodes.js";
import { subscriptionClient } from "./subscriptions.js";
import { catalogLoader } from "./catalog.js";
import { secret, seal, open } from "./crypto.js";
const json = (data, status = 200) =>
  Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
const notFound = () => json({ error: "链接不存在或已过期。" }, 404);
async function body(request) {
  if (!request.headers.get("Content-Type")?.startsWith("application/json"))
    throw new ConfigError("请求需要 JSON 格式。");
  const { readLimited } = await import("./subscriptions.js");
  try {
    return JSON.parse(await readLimited(request, 65536));
  } catch {
    throw new ConfigError("请求内容无法解析或过大。");
  }
}
function reply(response, origin) {
  const headers = new Headers(response.headers);
  if (origin) headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Vary", "Origin");
  headers.set("Access-Control-Allow-Methods", "GET, HEAD, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  return new Response(response.body, { status: response.status, headers });
}
export function createWorker(options = {}) {
  const client = subscriptionClient(options),
    loadCatalog = options.loadCatalog || catalogLoader(options.templateFetcher);
  return {
    async fetch(request, env) {
      const url = new URL(request.url),
        origin = request.headers.get("Origin"),
        api = url.pathname.startsWith("/api/");
      if (
        api &&
        origin &&
        !(env.ALLOWED_ORIGINS || "https://yakasuka.github.io")
          .split(",")
          .map((s) => s.trim())
          .includes(origin)
      )
        return json({ error: "此网页来源尚未获准访问。" }, 403);
      const out = (response) => (api ? reply(response, origin) : response);
      if (api && request.method === "OPTIONS")
        return out(new Response(null, { status: 204 }));
      try {
        if (url.pathname === "/api/health" && request.method === "GET") {
          const model = await loadCatalog(env);
          return out(
            json({
              ready: !!env.SUBSCRIPTIONS,
              version: model.version,
              format: "mihomo",
              capabilities: {
                inspect: true,
                tcp: env.TCP_PROBE_ENABLED === "true",
              },
            }),
          );
        }
        if (
          ["/api/inspect", "/api/probe", "/api/profiles"].includes(
            url.pathname,
          ) &&
          request.method === "POST"
        ) {
          const limiter =
            url.pathname === "/api/profiles"
              ? env.CREATE_LIMITER
              : url.pathname === "/api/probe"
                ? env.PROBE_LIMITER
                : env.INSPECT_LIMITER;
          if (
            limiter &&
            !(
              await limiter.limit({
                key: request.headers.get("CF-Connecting-IP") || "local",
              })
            ).success
          )
            return out(json({ error: "操作过于频繁，请稍后重试。" }, 429));
          const input = await body(request),
            model = await loadCatalog(env);
          if (url.pathname === "/api/inspect") {
            const providers = normalizeProviders(input.providers);
            return out(
              json(
                publicInspection(await client.inspect(providers), model, {
                  tcp: env.TCP_PROBE_ENABLED === "true",
                }),
              ),
            );
          }
          if (url.pathname === "/api/probe") {
            if (env.TCP_PROBE_ENABLED !== "true")
              return out(json({ error: "当前服务未开启连接检测。" }, 503));
            const providers = normalizeProviders(input.providers);
            if (
              !Array.isArray(input.nodeIds) ||
              input.nodeIds.length > 10 ||
              input.nodeIds.some(
                (x) => typeof x !== "string" || !/^P\d+:\d+$/.test(x),
              )
            )
              throw new ConfigError("检测节点列表无效。");
            return out(
              json({
                nodes: await client.probeNodes(providers, input.nodeIds),
              }),
            );
          }
          if (!env.SUBSCRIPTIONS)
            return out(json({ error: "配置服务暂时不可用。" }, 503));
          const profile = normalize(input, model),
            records = await client.inspect(profile.providers),
            inspection = publicInspection(records, model);
          if (records.some((r) => r.error))
            throw new ConfigError(
              "机场订阅解析失败，请重新检查订阅。",
              "providers",
            );
          const available = new Set(inspection.regions.map((r) => r.id));
          if (
            profile.countries.some((c) => !available.has(c)) ||
            (profile.other && !available.has("OTHER"))
          )
            throw new ConfigError(
              "部分所选地区当前没有节点，请重新解析。",
              "countries",
            );
          const generated = await compile(profile, model),
            id = secret(16),
            token = secret(32),
            createdAt = new Date().toISOString(),
            ttl = lifetime(profile.lifetime),
            expiresAt = ttl
              ? new Date(Date.now() + ttl * 1000).toISOString()
              : null;
          await env.SUBSCRIPTIONS.put(
            "profile:" + id,
            JSON.stringify({
              v: 2,
              ...(await seal(generated.profile, id, token)),
              createdAt,
              expiresAt,
            }),
            ttl ? { expirationTtl: ttl } : undefined,
          );
          return out(
            json(
              {
                url: url.origin + "/s/" + id + "/" + token + ".yaml",
                usageUrl: url.origin + "/s/" + id + "/" + token + "/status",
                createdAt,
                expiresAt,
                filename: generated.filename,
                summary: generated.summary,
                usage: inspection.usage,
                providers: inspection.providers,
              },
              201,
            ),
          );
        }
        const match = url.pathname.match(
          /^\/s\/([A-Za-z0-9_-]{22})\/([A-Za-z0-9_-]{43})(\.yaml|\/status)$/,
        );
        if (match && ["GET", "HEAD"].includes(request.method)) {
          if (!env.SUBSCRIPTIONS) return notFound();
          const record = await env.SUBSCRIPTIONS.get(
            "profile:" + match[1],
            "json",
          );
          if (
            !record ||
            record.v !== 2 ||
            (record.expiresAt && Date.parse(record.expiresAt) <= Date.now())
          )
            return notFound();
          let profile;
          try {
            profile = await open(record, match[1], match[2]);
          } catch {
            return notFound();
          }
          const providers = await client.usage(profile.providers),
            usage = aggregateUsage(providers);
          if (match[3] === "/status") {
            const response = json({
              title: profile.title,
              expiresAt: record.expiresAt,
              usage,
              providers,
            });
            response.headers.set("Access-Control-Allow-Origin", "*");
            return response;
          }
          const model = await loadCatalog(env),
            generated = await compile(profile, model, { migrate: true });
          const headers = {
            "Content-Type": "application/yaml; charset=utf-8",
            "Content-Disposition": `attachment; filename="${generated.filename.replace(/[^\x20-\x7e]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(generated.filename)}`,
            "Cache-Control": "no-store",
            "Referrer-Policy": "no-referrer",
            "X-Content-Type-Options": "nosniff",
            "Profile-Update-Interval": "1",
            "Access-Control-Allow-Origin": "*",
          };
          const traffic = usageHeader(usage, record.expiresAt);
          if (traffic) headers["Subscription-Userinfo"] = traffic;
          return new Response(
            request.method === "HEAD" ? null : generated.yaml,
            { headers },
          );
        }
        return out(notFound());
      } catch (error) {
        if (error instanceof ConfigError)
          return out(json({ error: error.message, field: error.field }, 400));
        return out(json({ error: "配置服务暂时不可用，请稍后重试。" }, 500));
      }
    },
  };
}
export default createWorker();

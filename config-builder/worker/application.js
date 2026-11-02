import {
  compile,
  normalize,
  normalizeProviders,
  ConfigError,
} from "../shared/compiler.js";
import { lifetime, contentDisposition } from "../shared/profile.js";
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
  const budgets = new Map();
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
        origin !== url.origin &&
        !(env.ALLOWED_ORIGINS || "")
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
          if (env.SUBSCRIPTIONS) await env.SUBSCRIPTIONS.get("__health__");
          return out(
            json({
              ready: !!env.SUBSCRIPTIONS,
              storage: env.SUBSCRIPTIONS ? "kv" : "unavailable",
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
          [
            "/api/inspect",
            "/api/probe",
            "/api/profiles",
            "/api/preview",
          ].includes(url.pathname) &&
          request.method === "POST"
        ) {
          const limiter = ["/api/profiles", "/api/preview"].includes(
            url.pathname,
          )
            ? env.CREATE_LIMITER
            : url.pathname === "/api/probe"
              ? env.PROBE_LIMITER
              : env.INSPECT_LIMITER;
          const key = request.headers.get("CF-Connecting-IP") || "local";
          const budgetKey = url.pathname + ":" + key;
          const now = Date.now();
          const budget = budgets.get(budgetKey);
          const limit =
            url.pathname === "/api/probe"
              ? 240
              : url.pathname === "/api/inspect"
                ? 20
                : 10;
          const next =
            budget && budget.until > now
              ? budget
              : { count: 0, until: now + 60000 };
          if (!limiter) {
            next.count++;
            if (budgets.size >= 5000)
              budgets.delete(budgets.keys().next().value);
            budgets.set(budgetKey, next);
          }
          if (
            (limiter &&
              !(
                await limiter.limit({
                  key,
                })
              ).success) ||
            (!limiter && next.count > limit)
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
          if (url.pathname === "/api/profiles" && !env.SUBSCRIPTIONS)
            return out(json({ error: "配置服务暂时不可用。" }, 503));
          const profile = normalize(input, model),
            records = await client.inspect(profile.providers, { fresh: true }),
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
          const generated = await compile(profile, model, {
            inlineProxies: records.map((r) => r.proxies),
          });
          if (new TextEncoder().encode(generated.yaml).length > 8 * 1024 * 1024)
            throw new ConfigError("生成配置超过 8 MiB，请减少机场或节点数量。");
          if (url.pathname === "/api/preview")
            return out(
              json({
                yaml: generated.yaml,
                filename: generated.filename,
                summary: generated.summary,
              }),
            );
          const id = secret(16),
            token = secret(32),
            createdAt = new Date().toISOString(),
            ttl = lifetime(profile.lifetime),
            expiresAt = ttl
              ? new Date(Date.now() + ttl * 1000).toISOString()
              : null;
          await env.SUBSCRIPTIONS.put(
            "profile:" + id,
            JSON.stringify({
              v: 3,
              ...(await seal(
                { profile: generated.profile, yaml: generated.yaml },
                id,
                token,
              )),
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
            ![2, 3].includes(record.v) ||
            (record.expiresAt && Date.parse(record.expiresAt) <= Date.now())
          )
            return notFound();
          let profile;
          try {
            const saved = await open(record, match[1], match[2]);
            profile = record.v === 3 ? saved.profile : saved;
          } catch {
            return notFound();
          }
          const records = await client.inspect(profile.providers, {
            fresh: true,
          });
          if (records.some((r) => r.error))
            return json({ error: "机场订阅暂时无法更新，请稍后重试。" }, 502);
          const providers = records.map(({ name, usage }) => ({ name, usage })),
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
            generated = await compile(profile, model, {
              migrate: true,
              inlineProxies: records.map((r) => r.proxies),
            });
          const headers = {
            "Content-Type": "application/yaml; charset=utf-8",
            "Content-Disposition": contentDisposition(generated.profile.title),
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

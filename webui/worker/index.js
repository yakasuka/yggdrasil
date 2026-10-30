import { compile, catalog, ConfigError } from "../shared/compiler.js";

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const MAX_BODY = 64 * 1024;
const b64 = (bytes) => {
  const data = new Uint8Array(bytes);
  let binary = "";
  for (let i = 0; i < data.length; i += 8192)
    binary += String.fromCharCode(...data.subarray(i, i + 8192));
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
};
const unb64 = (value) =>
  Uint8Array.from(atob(value.replaceAll("-", "+").replaceAll("_", "/")), (c) =>
    c.charCodeAt(0),
  );
const random = (length) => crypto.getRandomValues(new Uint8Array(length));
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
const notFound = () => json({ error: "链接不存在或已过期。" }, 404);
function allowed(origin, env) {
  return (env.ALLOWED_ORIGINS || "https://yakasuka.github.io")
    .split(",")
    .map((s) => s.trim())
    .includes(origin);
}
function cors(response, origin) {
  const headers = new Headers(response.headers);
  if (origin) headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Vary", "Origin");
  headers.set("Access-Control-Allow-Methods", "GET, HEAD, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  return new Response(response.body, { status: response.status, headers });
}
async function readBody(request) {
  if (!request.headers.get("Content-Type")?.startsWith("application/json"))
    throw new ConfigError("请求需要 JSON 格式。");
  if (Number(request.headers.get("Content-Length")) > MAX_BODY)
    throw new ConfigError("配置内容过大。");
  const reader = request.body?.getReader();
  if (!reader) throw new ConfigError("请求内容为空。");
  let size = 0;
  const chunks = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY) {
      await reader.cancel();
      throw new ConfigError("配置内容过大。");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const c of chunks) {
    bytes.set(c, offset);
    offset += c.byteLength;
  }
  try {
    return JSON.parse(decoder.decode(bytes));
  } catch {
    throw new ConfigError("请求内容无法解析。");
  }
}
async function key(token, usage) {
  return crypto.subtle.importKey(
    "raw",
    unb64(token),
    { name: "AES-GCM" },
    false,
    [usage],
  );
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url),
      origin = request.headers.get("Origin");
    const isApi = url.pathname.startsWith("/api/");
    if (isApi && origin && !allowed(origin, env))
      return json({ error: "此网页来源尚未获准访问。" }, 403);
    const reply = (response) => (isApi ? cors(response, origin) : response);
    if (request.method === "OPTIONS" && isApi)
      return reply(new Response(null, { status: 204 }));
    if (url.pathname === "/api/health" && request.method === "GET")
      return reply(
        json({
          ready: !!env.SUBSCRIPTIONS,
          version: catalog.version,
          format: "mihomo",
        }),
      );
    if (url.pathname === "/api/profiles" && request.method === "POST") {
      if (!env.SUBSCRIPTIONS)
        return reply(json({ error: "配置服务尚未完成 KV 绑定。" }, 503));
      if (env.CREATE_LIMITER) {
        const { success } = await env.CREATE_LIMITER.limit({
          key: request.headers.get("CF-Connecting-IP") || "local",
        });
        if (!success)
          return reply(json({ error: "生成过于频繁，请稍后再试。" }, 429));
      }
      try {
        const generated = await compile(await readBody(request));
        const id = b64(random(16)),
          token = b64(random(32)),
          iv = random(12);
        const createdAt = new Date().toISOString();
        const ttl = generated.profile.ttlDays * 86400;
        const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();
        // The bearer secret is the encryption key; KV never stores the key or plaintext subscriptions.
        const cipher = await crypto.subtle.encrypt(
          { name: "AES-GCM", iv, additionalData: encoder.encode(id) },
          await key(token, "encrypt"),
          encoder.encode(generated.yaml),
        );
        await env.SUBSCRIPTIONS.put(
          "profile:" + id,
          JSON.stringify({
            v: 1,
            iv: b64(iv),
            cipher: b64(cipher),
            createdAt,
            expiresAt,
          }),
          { expirationTtl: ttl },
        );
        return reply(
          json(
            {
              url: url.origin + "/s/" + id + "/" + token + ".yaml",
              createdAt,
              expiresAt,
              summary: generated.summary,
            },
            201,
          ),
        );
      } catch (error) {
        if (error instanceof ConfigError)
          return reply(json({ error: error.message, field: error.field }, 400));
        // Do not log a request, URL, generated configuration, or secret-bearing error object.
        return reply(json({ error: "配置暂时无法保存，请稍后重试。" }, 500));
      }
    }
    const match = url.pathname.match(
      /^\/s\/([A-Za-z0-9_-]{22})\/([A-Za-z0-9_-]{43})\.yaml$/,
    );
    if (match && ["GET", "HEAD"].includes(request.method)) {
      if (!env.SUBSCRIPTIONS) return notFound();
      try {
        const value = await env.SUBSCRIPTIONS.get(
          "profile:" + match[1],
          "json",
        );
        if (
          !value ||
          value.v !== 1 ||
          Date.parse(value.expiresAt) <= Date.now()
        )
          return notFound();
        const plaintext = await crypto.subtle.decrypt(
          {
            name: "AES-GCM",
            iv: unb64(value.iv),
            additionalData: encoder.encode(match[1]),
          },
          await key(match[2], "decrypt"),
          unb64(value.cipher),
        );
        return new Response(request.method === "HEAD" ? null : plaintext, {
          headers: {
            "Content-Type": "application/yaml; charset=utf-8",
            "Content-Disposition": 'attachment; filename="ratatoskr.yaml"',
            "Cache-Control": "no-store",
            "Referrer-Policy": "no-referrer",
            "X-Content-Type-Options": "nosniff",
            "Profile-Update-Interval": "24",
            "Access-Control-Allow-Origin": "*",
          },
        });
      } catch {
        return notFound();
      }
    }
    return reply(notFound());
  },
};

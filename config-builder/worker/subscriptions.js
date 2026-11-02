import { parseUsage, MAX_SUBSCRIPTION_BYTES } from "../shared/nodes.js";
import { parseSubscription, nodeInventory } from "../shared/subscription.js";
import { fetchIP } from "./ip-fetch.js";
import { isPublicAddress, publicURL, literalIP } from "./public-url.js";
export { isPublicAddress, publicURL } from "./public-url.js";
export async function readLimited(response, max = MAX_SUBSCRIPTION_BYTES) {
  if (Number(response.headers.get("Content-Length")) > max) {
    await response.body?.cancel();
    throw Error("订阅内容过大。");
  }
  const reader = response.body?.getReader();
  if (!reader) return "";
  let size = 0;
  const chunks = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > max) {
      await reader.cancel();
      throw Error("订阅内容过大。");
    }
    chunks.push(value);
  }
  const data = new Uint8Array(size);
  let pos = 0;
  for (const c of chunks) {
    data.set(c, pos);
    pos += c.length;
  }
  return new TextDecoder().decode(data);
}
export async function mapLimit(values, limit, fn) {
  const results = new Array(values.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, values.length) }, async () => {
      while (next < values.length) {
        const i = next++;
        results[i] = await fn(values[i], i);
      }
    }),
  );
  return results;
}
export function subscriptionClient({
  fetcher = fetch,
  resolver,
  probe,
  ipFetcher,
} = {}) {
  const cache = new Map();
  const requestIP = ipFetcher || (fetcher === fetch ? fetchIP : fetcher);
  async function resolve(host) {
    if (resolver) return resolver(host);
    let result = [];
    for (const type of ["A", "AAAA"]) {
      const url = new URL("https://cloudflare-dns.com/dns-query");
      url.searchParams.set("name", host);
      url.searchParams.set("type", type);
      const response = await fetcher(url, {
        headers: { accept: "application/dns-json" },
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) throw Error("DNS 查询失败。");
      const body = await response.json();
      result = (body.Answer || [])
        .filter((r) => r.type === 1 || r.type === 28)
        .map((r) => r.data);
      if (result.length) break;
    }
    return result;
  }
  async function guard(value) {
    const url = publicURL(value),
      host = url.hostname.replace(/^\[|\]$/g, "");
    if (!/^\d+\.\d+\.\d+\.\d+$/.test(host) && !host.includes(":")) {
      const ips = await resolve(host);
      if (!ips.length || ips.some((ip) => !isPublicAddress(ip)))
        throw Error("目标域名无法安全解析。");
    }
    return url;
  }
  async function request(value, method = "GET") {
    let url = value;
    for (let redirects = 0; redirects < 3; redirects++) {
      const safe = await guard(url);
      const response = await (literalIP(safe.hostname) ? requestIP : fetcher)(
        safe,
        {
          method,
          redirect: "manual",
          headers: {
            "User-Agent": "mihomo/Configurator",
            Accept: "application/yaml,text/yaml,text/plain;q=0.9,*/*;q=0.5",
          },
          signal: AbortSignal.timeout(12000),
        },
      );
      if (response.status >= 300 && response.status < 400) {
        await response.body?.cancel();
        if (redirects === 2 || !response.headers.get("Location"))
          throw Error("订阅重定向不可用。");
        url = new URL(response.headers.get("Location"), safe).href;
        continue;
      }
      if (!response.ok) {
        await response.body?.cancel();
        throw Error("订阅服务器未返回可用内容。");
      }
      return response;
    }
  }
  async function inspect(providers, { fresh = false } = {}) {
    return mapLimit(providers, 3, async (p, i) => {
      try {
        let record = cache.get(p.url);
        if (fresh || !record || record.until < Date.now()) {
          const response = await request(p.url);
          const usage = parseUsage(
            response.headers.get("Subscription-Userinfo"),
          );
          const parsed = parseSubscription(await readLimited(response));
          const nodes = nodeInventory(parsed.proxies, i);
          if (!nodes.length) throw Error("订阅中没有可用节点。");
          record = {
            proxies: parsed.proxies,
            format: parsed.format,
            skipped: parsed.skipped,
            nodes: nodes.map((n) => ({
              ...n,
              provider: 0,
              id: n.id.split(":")[1],
            })),
            usage,
            until: Date.now() + 60000,
          };
          if (cache.size >= 20) cache.delete(cache.keys().next().value);
          cache.set(p.url, record);
        }
        return {
          name: p.name,
          proxies: record.proxies,
          format: record.format,
          skipped: record.skipped,
          nodes: record.nodes.map((n) => ({
            ...n,
            provider: i,
            id: `P${i + 1}:${n.id}`,
          })),
          usage: record.usage,
        };
      } catch {
        return {
          name: p.name,
          nodes: [],
          usage: null,
          error:
            "解析失败，请确认订阅链接有效，并提供 YAML、Base64 或支持的节点链接。",
        };
      }
    });
  }
  async function usage(providers) {
    return mapLimit(providers, 3, async (p) => {
      try {
        let response;
        try {
          response = await request(p.url, "HEAD");
        } catch {}
        let value = parseUsage(response?.headers.get("Subscription-Userinfo"));
        await response?.body?.cancel();
        if (!value) {
          response = await request(p.url);
          value = parseUsage(response.headers.get("Subscription-Userinfo"));
          await response.body?.cancel();
        }
        return { name: p.name, usage: value };
      } catch {
        return { name: p.name, usage: null };
      }
    });
  }
  async function probeNodes(providers, ids) {
    const records = await inspect(providers);
    const nodes = records
      .flatMap((p) => p.nodes)
      .filter((n) => ids.includes(n.id));
    return mapLimit(nodes, 4, async (n) => {
      try {
        await guard(
          "https://" +
            (n.server.includes(":") ? "[" + n.server + "]" : n.server) +
            ":" +
            n.port,
        );
        let ms;
        if (probe) ms = await probe(n);
        else {
          const { connect } = await import("cloudflare:sockets");
          const start = performance.now();
          const socket = connect({ hostname: n.server, port: n.port });
          let timer;
          try {
            await Promise.race([
              socket.opened,
              new Promise((_, reject) => {
                timer = setTimeout(() => reject(Error("timeout")), 3000);
              }),
            ]);
            ms = performance.now() - start;
          } finally {
            clearTimeout(timer);
            await socket.close().catch(() => {});
          }
        }
        return {
          id: n.id,
          latencyMs: Number.isFinite(ms) && ms >= 0 ? Math.round(ms) : null,
          kind: "tcp-connect",
        };
      } catch {
        return {
          id: n.id,
          latencyMs: null,
          kind: "tcp-connect",
          error: "连接未成功或目标不支持检测。",
        };
      }
    });
  }
  return { inspect, usage, probeNodes };
}

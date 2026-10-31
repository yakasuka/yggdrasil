import { parse } from "yaml";
export const MAX_SUBSCRIPTION_BYTES = 2 * 1024 * 1024;
export function parseNodes(text, providerIndex = 0) {
  if (new TextEncoder().encode(text).length > MAX_SUBSCRIPTION_BYTES)
    throw Error("节点订阅超过 2 MiB。");
  let data;
  try {
    data = parse(text, {
      merge: true,
      maxAliasCount: 100,
      logLevel: "silent",
      prettyErrors: false,
    });
  } catch {
    throw Error("订阅需要是有效的 Mihomo / Clash YAML。");
  }
  const source = Array.isArray(data?.proxies)
    ? data.proxies
    : Array.isArray(data?.payload)
      ? data.payload
      : null;
  if (!source || !source.length || source.length > 2000)
    throw Error("订阅需包含 1–2000 个 Mihomo 节点。");
  return source
    .filter(
      (n) =>
        n &&
        typeof n.name === "string" &&
        n.name.length <= 300 &&
        typeof n.server === "string" &&
        Number.isInteger(Number(n.port)) &&
        Number(n.port) > 0 &&
        Number(n.port) <= 65535,
    )
    .map((n, i) => ({
      id: `P${providerIndex + 1}:${i}`,
      provider: providerIndex,
      name: n.name,
      server: n.server,
      port: Number(n.port),
      latencyMs: null,
    }));
}
export function classifyNodes(nodes, model) {
  const regex = (p) =>
    new RegExp(p.replaceAll("(?i)", "").replaceAll("(?i:", "(?:"), "i");
  const clean = regex(model.cleanFilter),
    regions = model.regions.map((r) => ({ ...r, regex: regex(r.filter) }));
  return nodes
    .filter((n) => clean.test(n.name))
    .map((n) => ({
      ...n,
      region: regions.find((r) => r.regex.test(n.name))?.id || "OTHER",
    }));
}
export function regionInventory(nodes, model) {
  return [
    ...model.regions,
    { id: "OTHER", label: "其他地区", flag: "🌐", name: model.groups.other },
  ]
    .map((r) => ({
      id: r.id,
      label: r.label,
      flag: r.flag,
      count: nodes.filter((n) => n.region === r.id).length,
    }))
    .filter((r) => r.count > 0);
}
export function parseUsage(header) {
  if (!header) return null;
  const parts = {};
  for (const item of header.split(";")) {
    const [key, raw] = item.trim().split("=");
    if (
      ["upload", "download", "total", "expire"].includes(key) &&
      raw !== undefined &&
      /^\d+(?:\.\d+)?$/.test(raw.trim())
    )
      parts[key] = Number(raw);
  }
  if (
    !["upload", "download", "total"].every(
      (k) => Number.isSafeInteger(parts[k]) && parts[k] >= 0,
    )
  )
    return null;
  return {
    ...parts,
    used: parts.upload + parts.download,
    remaining: Math.max(0, parts.total - parts.upload - parts.download),
    updatedAt: new Date().toISOString(),
  };
}
export function aggregateUsage(providers) {
  const known = providers.map((p) => p.usage).filter(Boolean),
    complete = known.length === providers.length && providers.length > 0;
  const sum = (k) => known.reduce((s, u) => s + u[k], 0);
  return {
    complete,
    known: known.length,
    unknown: providers.length - known.length,
    upload: complete ? sum("upload") : null,
    download: complete ? sum("download") : null,
    total: complete ? sum("total") : null,
    used: complete ? sum("used") : null,
    remaining: complete ? sum("remaining") : null,
    updatedAt: new Date().toISOString(),
  };
}
export function usageHeader(usage, expiresAt) {
  if (!usage.complete) return null;
  return (
    `upload=${usage.upload}; download=${usage.download}; total=${usage.total}` +
    (expiresAt ? `; expire=${Math.floor(Date.parse(expiresAt) / 1000)}` : "")
  );
}
export function publicInspection(
  providers,
  model,
  capabilities = { tcp: false },
) {
  const nodes = classifyNodes(
    providers.flatMap((p) => p.nodes || []),
    model,
  );
  return {
    providers: providers.map(({ name, usage, error }, i) => ({
      id: "P" + (i + 1),
      name,
      usage: usage || null,
      error: error || null,
      nodeCount: nodes.filter((n) => n.provider === i).length,
    })),
    nodes: nodes.map(({ server, port, ...n }) => n),
    regions: regionInventory(nodes, model),
    usage: aggregateUsage(providers),
    capabilities,
  };
}

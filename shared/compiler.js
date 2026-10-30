import { stringify } from "yaml";
import catalog from "./catalog.json" with { type: "json" };

export { catalog };
export const STRATEGIES = [
  {
    id: "auto",
    name: "♻️ 自动选择",
    label: "自动选择",
    description: "根据统一延迟选择节点",
    type: "url-test",
  },
  {
    id: "fallback",
    name: "🔯 故障转移",
    label: "故障转移",
    description: "按顺序使用可用节点",
    type: "fallback",
  },
  {
    id: "balanced",
    name: "🔮 负载均衡",
    label: "一致性哈希",
    description: "同一目标尽量保持相同出口",
    type: "load-balance",
    strategy: "consistent-hashing",
  },
  {
    id: "download",
    name: "⚖️ 下载均衡",
    label: "轮询分配",
    description: "将不同连接分散到不同节点",
    type: "load-balance",
    strategy: "round-robin",
  },
];
const DEFAULT_APPS = [
  "openai",
  "anthropic",
  "category-ai-!cn",
  "telegram",
  "youtube",
  "netflix",
  "google",
  "github",
  "apple",
  "microsoft",
];
export function defaults() {
  return {
    version: 1,
    title: "我的 Ratatoskr",
    providers: [{ name: "", url: "" }],
    strategies: ["auto", "fallback"],
    defaultStrategy: "auto",
    apps: DEFAULT_APPS.filter((id) => catalog.apps.some((a) => a.id === id)),
    appPolicy: {},
    rules: catalog.modules.filter((m) => m.default).map((m) => m.id),
    countries: ["HK", "TW", "JP", "KR", "SG", "US"],
    other: true,
    custom: { direct: [], proxy: [], reject: [] },
    fallback: "proxy",
    port: 7890,
    allowLan: false,
    ttlDays: 90,
  };
}
export class ConfigError extends Error {
  constructor(message, field = "") {
    super(message);
    this.name = "ConfigError";
    this.field = field;
  }
}
const fail = (message, field) => {
  throw new ConfigError(message, field);
};
function selected(input, allowed, field, max = 100) {
  if (
    !Array.isArray(input) ||
    input.length > max ||
    input.some((x) => typeof x !== "string" || !allowed.includes(x))
  )
    fail("存在无效的选择项，请刷新页面重试。", field);
  return [...new Set(input)];
}
function domains(input) {
  if (!Array.isArray(input) || input.length > 100)
    fail("每类最多添加 100 个自定义域名。", "custom");
  return [
    ...new Set(
      input.map((value) => {
        if (typeof value !== "string") fail("自定义规则需要纯域名。", "custom");
        const raw = value.trim().replace(/^\*\./, "").replace(/\.$/, "");
        if (!raw || /[\s/:?#@,]/.test(raw) || raw.length > 253)
          fail("自定义规则请填写纯域名，例如 example.com。", "custom");
        let host;
        try {
          host = new URL("https://" + raw).hostname;
        } catch {
          fail("存在无效的自定义域名。", "custom");
        }
        if (
          !host.includes(".") ||
          !host
            .split(".")
            .every((p) => /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(p))
        )
          fail("存在无效的自定义域名。", "custom");
        return host.toLowerCase();
      }),
    ),
  ];
}
export function normalize(input) {
  if (!input || input.version !== 1) fail("配置版本不受支持，请刷新页面。");
  const p = { ...defaults() };
  p.title =
    typeof input.title === "string" ? input.title.trim() : "我的 Ratatoskr";
  if (!p.title || p.title.length > 60 || /[\r\n\x00-\x1f]/.test(p.title))
    fail("配置名称请控制在 1–60 个字符。", "title");
  if (
    !Array.isArray(input.providers) ||
    !input.providers.length ||
    input.providers.length > 10
  )
    fail("请添加 1–10 个机场订阅。", "providers");
  const names = new Set(),
    urls = new Set();
  p.providers = input.providers.map((v, i) => {
    if (!v || typeof v.name !== "string" || typeof v.url !== "string")
      fail("请填写机场名称和订阅链接。", "providers");
    const name = v.name.trim(),
      raw = v.url.trim();
    if (!name || name.length > 40 || /[\r\n\x00-\x1f]/.test(name))
      fail("第 " + (i + 1) + " 个机场名称需要 1–40 个字符。", "providers");
    if (names.has(name.toLowerCase())) fail("机场名称不能重复。", "providers");
    let url;
    try {
      url = new URL(raw);
    } catch {
      fail("第 " + (i + 1) + " 个订阅地址格式不正确。", "providers");
    }
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      raw.length > 4096
    )
      fail("订阅地址需要有效的 HTTP / HTTPS 链接。", "providers");
    url.hash = "";
    if (urls.has(url.href))
      fail("同一个订阅链接已添加，请检查重复项。", "providers");
    names.add(name.toLowerCase());
    urls.add(url.href);
    return { name, url: url.href };
  });
  p.strategies = selected(
    input.strategies,
    STRATEGIES.map((x) => x.id),
    "strategies",
    4,
  );
  p.defaultStrategy = input.defaultStrategy;
  if (
    p.defaultStrategy !== "manual" &&
    !p.strategies.includes(p.defaultStrategy)
  )
    fail("请选择已启用的默认代理策略。", "strategies");
  p.apps = selected(
    input.apps,
    catalog.apps.map((x) => x.id),
    "apps",
  );
  p.appPolicy = Object.fromEntries(
    p.apps.map((id) => {
      const value =
        input.appPolicy?.[id] ||
        (catalog.apps.find((a) => a.id === id).direct ? "direct" : "proxy");
      if (!["proxy", "direct", "reject"].includes(value))
        fail("应用出口选择无效。", "apps");
      return [id, value];
    }),
  );
  p.rules = selected(
    input.rules,
    catalog.modules.map((x) => x.id),
    "rules",
  );
  p.countries = selected(
    input.countries,
    catalog.regions.map((x) => x.id),
    "countries",
    24,
  );
  p.other = input.other === true;
  if (!p.other && !p.countries.length)
    fail("至少选择一个地区，或启用其他地区。", "countries");
  p.custom = Object.fromEntries(
    ["direct", "proxy", "reject"].map((k) => [
      k,
      domains(input.custom?.[k] || []),
    ]),
  );
  const uniqueDomains = Object.values(p.custom).flat();
  if (new Set(uniqueDomains).size !== uniqueDomains.length)
    fail("同一域名不能同时设置为不同出口。", "custom");
  p.fallback = input.fallback === "direct" ? "direct" : "proxy";
  p.port = Number(input.port);
  if (!Number.isInteger(p.port) || p.port < 1024 || p.port > 65535)
    fail("代理端口应为 1024–65535。", "port");
  p.allowLan = input.allowLan === true;
  p.ttlDays = Number(input.ttlDays);
  if (![30, 90, 365].includes(p.ttlDays))
    fail("请选择有效的订阅有效期。", "ttlDays");
  return p;
}
const strip = (p) => p.replaceAll("(?i)", "");
const clean = strip(catalog.cleanFilter);
function geoFilter(regions, other = false) {
  const union = regions.map((r) => "(?:" + strip(r.filter) + ")").join("|");
  if (other)
    return union
      ? "(?i)^(?=" + clean + ")(?!" + union + ").*$"
      : catalog.cleanFilter;
  return "(?i)^(?=" + clean + ")(?=" + union + ").*$";
}
const unique = (a) => [...new Set(a)];
const hash = async (text) =>
  Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)),
    ),
  )
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
export async function compile(input) {
  const p = normalize(input),
    regions = catalog.regions.filter((r) => p.countries.includes(r.id));
  const filter = p.other ? catalog.cleanFilter : geoFilter(regions);
  const active = STRATEGIES.filter((s) => p.strategies.includes(s.id));
  const defaultName =
    active.find((s) => s.id === p.defaultStrategy)?.name || "🚀 手动切换";
  const outputs = unique([
    defaultName,
    ...active.map((s) => s.name),
    ...regions.map((r) => r.name),
    ...(p.other ? ["🌌"] : []),
    "🚀 手动切换",
    "DIRECT",
  ]);
  const groups = [
    { name: "🎚️ 节点选择", type: "select", proxies: outputs },
    { name: "🚀 手动切换", type: "select", "include-all": true, filter },
  ];
  for (const s of active) {
    const group = {
      name: s.name,
      type: s.type,
      "include-all": true,
      filter,
      url: catalog.testUrl,
      interval: 300,
      timeout: 5000,
      lazy: true,
    };
    if (s.id === "auto") group.tolerance = 50;
    if (s.strategy) group.strategy = s.strategy;
    groups.push(group);
  }
  for (const r of regions)
    groups.push({
      name: r.name,
      type: "select",
      "include-all": true,
      filter: geoFilter([r]),
      icon: "https://raw.githubusercontent.com/yakasuka/yggdrasil/main/icons/macosicons/maps.png",
    });
  if (p.other)
    groups.push({
      name: "🌌",
      type: "select",
      "include-all": true,
      filter: geoFilter(regions, true),
    });
  const options = ["🎚️ 节点选择", ...outputs, "REJECT"];
  const apps = catalog.apps.filter((a) => p.apps.includes(a.id));
  for (const app of apps) {
    const preferred =
      p.appPolicy[app.id] === "direct"
        ? "DIRECT"
        : p.appPolicy[app.id] === "reject"
          ? "REJECT"
          : "🎚️ 节点选择";
    groups.push({
      name: app.name,
      type: "select",
      proxies: unique([preferred, ...options]),
      ...(app.icon ? { icon: app.icon } : {}),
    });
  }
  if (p.rules.includes("ports"))
    groups.push({
      name: "🔌 特殊端口",
      type: "select",
      proxies: unique(options),
    });
  groups.push({
    name: "🏁 Final",
    type: "select",
    proxies: unique([
      p.fallback === "direct" ? "DIRECT" : "🎚️ 节点选择",
      ...options,
    ]),
  });
  const providerEntries = await Promise.all(
    p.providers.map(async (v, i) => {
      const id = await hash(v.url);
      return [
        "P" + (i + 1) + " " + v.name,
        {
          type: "http",
          url: v.url,
          path: "./providers/yggdrasil-" + id + ".yaml",
          interval: 86400,
          proxy: "DIRECT",
          override: { "additional-prefix": "[P" + (i + 1) + "] " },
          "health-check": {
            enable: true,
            url: catalog.testUrl,
            interval: 300,
            lazy: true,
            timeout: 5000,
            "expected-status": 204,
          },
        },
      ];
    }),
  );
  const selectedRules = catalog.orderedRules.filter((r) =>
    r.app
      ? p.apps.includes(r.app)
      : r.module === "private" || p.rules.includes(r.module),
  );
  const custom = Object.entries(p.custom).flatMap(([action, list]) =>
    list.map(
      (d) =>
        "DOMAIN-SUFFIX," +
        d +
        "," +
        { direct: "DIRECT", proxy: "🎚️ 节点选择", reject: "REJECT" }[action],
    ),
  );
  const privateRules = selectedRules
    .filter((r) => r.module === "private")
    .map((r) => r.rule);
  const extraRules = selectedRules
    .filter((r) => r.module !== "private")
    .map((r) => r.rule);
  // Preserve template precedence: China/download exceptions stay ahead of broad service categories.
  const rules = unique([
    ...privateRules,
    ...custom,
    ...extraRules,
    "MATCH,🏁 Final",
  ]);
  const usedProviders = new Set(
    rules.filter((r) => r.startsWith("RULE-SET,")).map((r) => r.split(",")[1]),
  );
  const config = {
    "mixed-port": p.port,
    "allow-lan": p.allowLan,
    mode: "rule",
    "log-level": "info",
    "unified-delay": true,
    "geodata-mode": true,
    "geo-auto-update": true,
    "geo-update-interval": 24,
    "geox-url": {
      geoip:
        "https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geoip.dat",
      geosite:
        "https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geosite.dat",
    },
    profile: { "store-selected": true },
    "proxy-providers": Object.fromEntries(providerEntries),
    "proxy-groups": groups,
    ...(usedProviders.size
      ? {
          "rule-providers": Object.fromEntries(
            catalog.providerModules
              .filter((r) => usedProviders.has(r.name))
              .map((r) => [r.name, r.value]),
          ),
        }
      : {}),
    rules,
  };
  assertReferences(config);
  const yaml =
    "# Ratatoskr · " +
    p.title +
    "\n# Yggdrasil catalog " +
    catalog.version +
    " | Mihomo / Clash Meta\n" +
    stringify(config, { lineWidth: 0, aliasDuplicateObjects: false });
  return {
    yaml,
    config,
    profile: p,
    summary: {
      providers: p.providers.length,
      apps: apps.length,
      regions: regions.length,
      groups: groups.length,
      rules: rules.length,
      bytes: new TextEncoder().encode(yaml).length,
    },
  };
}
export function assertReferences(config) {
  const names = config["proxy-groups"].map((g) => g.name);
  if (new Set(names).size !== names.length)
    throw Error("Duplicate group names");
  const valid = new Set([...names, "DIRECT", "REJECT"]);
  for (const group of config["proxy-groups"])
    for (const value of group.proxies || [])
      if (!valid.has(value) || value === group.name)
        throw Error("Invalid group reference: " + value);
  for (const rule of config.rules) {
    const parts = rule.split(",");
    if (parts.at(-1) === "no-resolve") parts.pop();
    if (!valid.has(parts.at(-1))) throw Error("Invalid rule target");
    if (
      parts[0] === "RULE-SET" &&
      !Object.hasOwn(config["rule-providers"] || {}, parts[1])
    )
      throw Error("Missing rule provider");
  }
}

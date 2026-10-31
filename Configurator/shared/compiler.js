import { stringify } from "yaml";
import catalog from "./catalog.json" with { type: "json" };
import { filename, lifetime } from "./profile.js";
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
export class ConfigError extends Error {
  constructor(message, field = "") {
    super(message);
    this.name = "ConfigError";
    this.field = field;
  }
}
const fail = (m, f) => {
  throw new ConfigError(m, f);
};
const unique = (a) => [...new Set(a)];
export function defaults(model = catalog) {
  return {
    version: 2,
    title: "",
    providers: [{ name: "", url: "" }],
    countries: [],
    other: false,
    strategies: ["auto", "fallback"],
    defaultStrategy: "manual",
    appsMode: "all",
    apps: model.apps.map((a) => a.id),
    appPolicy: {},
    port: 7890,
    allowLan: false,
    lifetime: "30d",
  };
}
export function normalizeProviders(input) {
  if (!Array.isArray(input) || !input.length || input.length > 10)
    fail("请添加 1–10 个机场订阅。", "providers");
  const names = new Set(),
    urls = new Set();
  return input.map((v, i) => {
    const name = typeof v?.name === "string" ? v.name.trim() : "",
      raw = typeof v?.url === "string" ? v.url.trim() : "";
    if (!name || name.length > 40 || /[\x00-\x1f]/.test(name))
      fail(`第 ${i + 1} 个机场名称需要 1–40 个字符。`, "providers");
    let url;
    try {
      url = new URL(raw);
    } catch {
      fail(`第 ${i + 1} 个订阅地址格式不正确。`, "providers");
    }
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      raw.length > 4096
    )
      fail("订阅地址需要有效的 HTTP / HTTPS 链接。", "providers");
    url.hash = "";
    if (names.has(name.toLowerCase()) || urls.has(url.href))
      fail("机场名称或订阅链接重复。", "providers");
    names.add(name.toLowerCase());
    urls.add(url.href);
    return { name, url: url.href };
  });
}
function selection(value, allowed, field, max = 1000) {
  if (
    !Array.isArray(value) ||
    value.length > max ||
    value.some((id) => !allowed.includes(id))
  )
    fail("存在无效的选择项，请刷新页面。", field);
  return unique(value);
}
export function normalize(input, model = catalog, { migrate = false } = {}) {
  if (!input || input.version !== 2) fail("配置版本不受支持，请刷新页面。");
  for (const field of ["rules", "custom", "fallback"])
    if (Object.hasOwn(input, field))
      fail("规则和最终出口由模板统一维护。", "rules");
  const p = defaults(model);
  p.title = typeof input.title === "string" ? input.title.trim() : "";
  if (!p.title || p.title.length > 60 || /[\x00-\x1f]/.test(p.title))
    fail("请填写 1–60 个字符的配置名称。", "title");
  p.providers = normalizeProviders(input.providers);
  p.strategies = selection(
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
    fail("请选择已启用的默认策略。", "strategies");
  const knownCountries = model.regions.map((r) => r.id);
  const countries = migrate
    ? (input.countries || []).filter((x) => knownCountries.includes(x))
    : input.countries;
  p.countries = selection(countries, knownCountries, "countries");
  p.other = input.other === true;
  if (migrate && !p.countries.length && !p.other) p.other = true;
  if (!p.countries.length && !p.other)
    fail("至少保留一个有节点的地区。", "countries");
  p.appsMode = input.appsMode === "all" ? "all" : "custom";
  const knownApps = model.apps.map((a) => a.id);
  p.apps =
    p.appsMode === "all"
      ? knownApps
      : selection(
          migrate
            ? (input.apps || []).filter((x) => knownApps.includes(x))
            : input.apps,
          knownApps,
          "apps",
        );
  p.appPolicy = Object.fromEntries(
    p.apps.map((id) => {
      let value = Object.hasOwn(input.appPolicy || {}, id)
        ? input.appPolicy[id]
        : "proxy";
      if (
        migrate &&
        typeof value === "string" &&
        value.startsWith("region:") &&
        !p.countries.includes(value.slice(7))
      )
        value = "proxy";
      if (
        ![
          "proxy",
          "direct",
          "reject",
          ...(p.other ? ["region:OTHER"] : []),
          ...p.countries.map((x) => "region:" + x),
        ].includes(value)
      )
        fail("APP 默认地区不在已保留的地区中。", "apps");
      return [id, value];
    }),
  );
  p.port = Number(input.port);
  if (!Number.isInteger(p.port) || p.port < 1024 || p.port > 65535)
    fail("代理端口应为 1024–65535。", "port");
  p.allowLan = input.allowLan === true;
  p.lifetime = input.lifetime;
  try {
    lifetime(p.lifetime);
  } catch {
    fail("请选择有效的 Token 持续时间。", "lifetime");
  }
  return p;
}
const strip = (p) => p.replaceAll("(?i)", "");
export function regionFilter(regions, model = catalog, { other = false } = {}) {
  const clean = strip(model.cleanFilter);
  const expression = (r) => "(?:" + strip(r.filter) + ")";
  if (other)
    return (
      "(?i)^(?=" +
      clean +
      ")(?!.*(?:" +
      model.regions.map(expression).join("|") +
      ")).*$"
    );
  const clauses = regions.map((r) => {
    const index = model.regions.findIndex((item) => item.id === r.id);
    const earlier = model.regions.slice(0, index).map(expression).join("|");
    return (
      "^(?=" +
      clean +
      ")(?=.*" +
      expression(r) +
      ")" +
      (earlier ? "(?!.*(?:" + earlier + "))" : "") +
      ".*$"
    );
  });
  return "(?i)(?:" + clauses.join("|") + ")";
}

const hash = async (text) =>
  Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)),
    ),
  )
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
export async function compile(input, model = catalog, options = {}) {
  const p = normalize(input, model, options),
    g = model.groups,
    regions = model.regions.filter((r) => p.countries.includes(r.id));
  const allFilter =
    "(?i)(?:" +
    [
      ...(regions.length ? [strip(regionFilter(regions, model))] : []),
      ...(p.other ? [strip(regionFilter([], model, { other: true }))] : []),
    ].join("|") +
    ")";
  const active = STRATEGIES.filter((s) => p.strategies.includes(s.id)).map(
    (s) => ({ ...s, ...(model.strategies.find((x) => x.id === s.id) || {}) }),
  );
  const preferred =
    active.find((s) => s.id === p.defaultStrategy)?.name || g.manual;
  const exits = unique([
    preferred,
    g.manual,
    ...active.map((s) => s.name),
    ...regions.map((r) => r.name),
    ...(p.other ? [g.other] : []),
    "DIRECT",
    "REJECT",
  ]);
  const groups = [
    { name: g.gateway, type: "select", proxies: exits },
    { name: g.manual, type: "select", "include-all": true, filter: allFilter },
  ];
  for (const s of active)
    groups.push({
      name: s.name,
      type: s.type,
      "include-all": true,
      filter: allFilter,
      url: model.testUrl,
      interval: 300,
      timeout: 5000,
      lazy: true,
      ...(s.id === "auto" ? { tolerance: 50 } : {}),
      ...(s.strategy ? { strategy: s.strategy } : {}),
    });
  for (const r of regions)
    groups.push({
      name: r.name,
      type: "select",
      "include-all": true,
      filter: regionFilter([r], model),
      ...(r.icon ? { icon: r.icon } : {}),
    });
  if (p.other)
    groups.push({
      name: g.other,
      type: "select",
      "include-all": true,
      filter: regionFilter([], model, { other: true }),
    });
  const optionsList = unique([
    g.gateway,
    ...regions.map((r) => r.name),
    ...(p.other ? [g.other] : []),
    "REJECT",
    "DIRECT",
  ]);
  const apps = model.apps.filter((a) => p.apps.includes(a.id));
  for (const app of apps) {
    const policy = p.appPolicy[app.id];
    const target =
      policy === "direct"
        ? "DIRECT"
        : policy === "reject"
          ? "REJECT"
          : policy === "region:OTHER"
            ? g.other
            : policy.startsWith("region:")
              ? regions.find((r) => r.id === policy.slice(7)).name
              : g.gateway;
    groups.push({
      name: app.name,
      type: "select",
      proxies: unique([target, ...optionsList]),
      ...(app.icon ? { icon: app.icon } : {}),
    });
  }
  const selected = model.orderedRules.filter(
    (r) => !r.app || p.apps.includes(r.app),
  );
  const rules = unique(
    [
      ...selected.filter((r) => r.module === "private"),
      ...selected.filter((r) => r.module !== "private"),
    ]
      .map((r) => r.rule)
      .concat("MATCH," + g.final),
  );
  if (selected.some((r) => r.rule.split(",")[2] === g.ports))
    groups.push({ name: g.ports, type: "select", proxies: optionsList });
  groups.push({
    name: g.final,
    type: "select",
    proxies: [g.gateway],
  });
  const entries = await Promise.all(
    p.providers.map(async (v, i) => [
      "P" + (i + 1) + " " + v.name,
      {
        type: "http",
        url: v.url,
        path: "./providers/yggdrasil-" + (await hash(v.url)) + ".yaml",
        interval: 86400,
        proxy: "DIRECT",
        override: { "additional-prefix": "[P" + (i + 1) + "] " },
        "health-check": {
          enable: true,
          url: model.testUrl,
          interval: 300,
          lazy: true,
          timeout: 5000,
          "expected-status": 204,
        },
      },
    ]),
  );
  const providers = new Set(
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
    "proxy-providers": Object.fromEntries(entries),
    "proxy-groups": groups,
    ...(providers.size
      ? {
          "rule-providers": Object.fromEntries(
            model.providerModules
              .filter((x) => providers.has(x.name))
              .map((x) => [x.name, x.value]),
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
    model.version +
    " | Mihomo / Clash Meta\n" +
    stringify(config, { lineWidth: 0, aliasDuplicateObjects: false });
  return {
    yaml,
    config,
    profile: p,
    filename: filename(p.title),
    summary: {
      providers: p.providers.length,
      apps: apps.length,
      regions: regions.length + (p.other ? 1 : 0),
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
  for (const g of config["proxy-groups"])
    for (const p of g.proxies || [])
      if (!valid.has(p) || p === g.name) throw Error("Invalid group reference");
  for (const rule of config.rules) {
    const p = rule.split(",");
    if (p.at(-1) === "no-resolve") p.pop();
    if (!valid.has(p.at(-1))) throw Error("Invalid rule target");
    if (
      p[0] === "RULE-SET" &&
      !Object.hasOwn(config["rule-providers"] || {}, p[1])
    )
      throw Error("Missing rule provider");
  }
}
